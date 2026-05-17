import os
import json
from fpdf import FPDF

class ReportGenerationService:
    @staticmethod
    def _safe_text(text: str) -> str:
        """Normalizes and encodes text for Latin-1 PDF compatibility."""
        if not text:
            return ""
        # Common Unicode mappings to Latin-1/ASCII
        replacements = {
            "\u2013": "-", # en-dash
            "\u2014": "--", # em-dash
            "\u2018": "'", # smart left single quote
            "\u2019": "'", # smart right single quote
            "\u201c": '"', # smart left double quote
            "\u201d": '"', # smart right double quote
            "\u2022": "*", # bullet point
            "\u2026": "...", # ellipsis
        }
        for char, rep in replacements.items():
            text = text.replace(char, rep)
            
        try:
            return str(text).encode('latin-1', 'replace').decode('latin-1')
        except:
            return "???"

    @classmethod
    def generate_candidate_report(cls, candidate) -> str:
        """
        Generates a professionally branded PDF for a candidate using fpdf2.
        Returns the absolute file path of the generated PDF.
        """
        parsed_data = {}
        try:
            if candidate.parsed_json:
                parsed_data = json.loads(candidate.parsed_json)
        except Exception:
            pass
            
        pdf = FPDF(orientation="P", unit="mm", format="A4")
        pdf.add_page()
        
        # Banner Header
        pdf.set_fill_color(30, 30, 36) # Dark background
        pdf.rect(0, 0, 210, 25, style="F")
        
        pdf.set_font("helvetica", "B", 18)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(10, 8)
        pdf.cell(0, 10, "HRX AI EVALUATION REPORT", align="L")
        
        pdf.set_font("helvetica", "I", 10)
        pdf.set_text_color(180, 180, 180)
        pdf.set_xy(150, 8)
        pdf.cell(50, 10, "Deep Candidate Analysis", align="R")
        
        pdf.set_xy(10, 35) # Move below banner
        
        # Profile Details Head
        pdf.set_font("helvetica", "B", 16)
        pdf.set_text_color(30, 30, 40)
        pdf.cell(0, 8, cls._safe_text(candidate.full_name), new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "", 12)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(0, 6, cls._safe_text(candidate.headline or "Candidate"), new_x="LMARGIN", new_y="NEXT")
        
        # Contact Strip with Social Links
        pdf.set_font("helvetica", "", 10)
        contact_txt = f"Email: {candidate.email} | Phone: {candidate.phone or 'N/A'}"
        pdf.cell(0, 6, cls._safe_text(contact_txt), new_x="LMARGIN", new_y="NEXT")
        
        social_links = parsed_data.get("social_links", [])
        if social_links:
            pdf.set_text_color(139, 92, 246) # Purple for links
            links_txt = " | ".join(social_links)
            pdf.cell(0, 6, cls._safe_text(links_txt), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(80, 80, 80)
            
        pdf.cell(0, 6, f"AI Match Score: {round(candidate.match_score or 0, 1)}%", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        
        # Line break
        pdf.set_draw_color(139, 92, 246)
        pdf.set_line_width(0.5)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.set_line_width(0.2)
        pdf.ln(6)

        # Executive Summary / Bio
        summary = parsed_data.get("summary")
        if summary:
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(139, 92, 246)
            pdf.cell(0, 6, "EXECUTIVE SUMMARY", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(0, 5, cls._safe_text(summary))
            pdf.ln(6)
        
        # Final Verdict Block
        verdict = parsed_data.get("verdict", "PENDING")
        rationale = parsed_data.get("rationale", "No rationale available.")
        
        pdf.set_font("helvetica", "B", 11)
        pdf.set_text_color(139, 92, 246)
        pdf.cell(0, 6, "AI EVALUATION VERDICT", new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "B", 13)
        if verdict == "ACCEPT":
            pdf.set_text_color(16, 185, 129)
        elif verdict == "REJECT":
            pdf.set_text_color(244, 63, 94)
        else:
            pdf.set_text_color(100, 100, 100)
            
        pdf.cell(0, 8, cls._safe_text(str(verdict)), new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "I", 10)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 5, cls._safe_text(rationale))
        pdf.ln(6)

        # Comparative Requirements Analysis (Matrix) - Moved Up as it's critical
        matrix = parsed_data.get("comparison_matrix", [])
        if matrix:
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(139, 92, 246)
            pdf.cell(0, 8, "STRATEGIC ALIGNMENT MATRIX", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            
            for row in matrix:
                align = str(row.get("alignment", "Unknown")).upper()
                req = row.get("requirement", "")
                qual = row.get("candidate_qualification", "")
                
                pdf.set_font("helvetica", "B", 9)
                if align == "MET":
                    pdf.set_text_color(16, 185, 129)
                elif align == "PARTIAL":
                    pdf.set_text_color(245, 158, 11)
                else:
                    pdf.set_text_color(244, 63, 94)
                    
                pdf.cell(0, 5, cls._safe_text(f"[{align}] {req}"), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_font("helvetica", "", 9)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(0, 4, cls._safe_text(f"Qualification: {qual}"))
                pdf.ln(3)
            pdf.ln(2)
        
        # Skill Metrics Grid
        pdf.set_font("helvetica", "B", 11)
        pdf.set_text_color(139, 92, 246)
        pdf.cell(0, 8, "CORE COMPETENCY METRICS", new_x="LMARGIN", new_y="NEXT")
        
        scored_skills = parsed_data.get("scored_skills", [])
        if scored_skills:
            pdf.set_font("helvetica", "", 9)
            pdf.set_text_color(30, 30, 30)
            
            # Simple list for metrics
            for item in sorted(scored_skills, key=lambda x: x.get('score', 0), reverse=True)[:15]:
                skill_name = item.get("skill", "Unknown")
                score = item.get('score', 0.0)
                # Visual Bar Representation (very simple)
                pdf.set_draw_color(200, 200, 200)
                pdf.set_fill_color(220, 220, 230)
                pdf.rect(140, pdf.get_y() + 1, 50, 4, style="F")
                pdf.set_fill_color(139, 92, 246)
                pdf.rect(140, pdf.get_y() + 1, (score/5.0)*50, 4, style="F")
                
                pdf.cell(130, 6, cls._safe_text(skill_name))
                pdf.cell(0, 6, f"{score:.1f}/5.0", align="R", new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.cell(0, 6, "No skill metrics available.", new_x="LMARGIN", new_y="NEXT")
            
        pdf.ln(6)
        
        # New Page for Resume Components
        pdf.add_page()
        
        # Work Experience Section
        experience = parsed_data.get("experience", [])
        if experience:
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(139, 92, 246)
            pdf.cell(0, 8, "PROFESSIONAL EXPERIENCE TIMELINE", new_x="LMARGIN", new_y="NEXT")
            
            for exp in experience:
                title = exp.get("job_title", "Role")
                company = exp.get("company", "Company")
                duration = exp.get("duration", "")
                desc = exp.get("description", "")
                
                pdf.set_font("helvetica", "B", 10)
                pdf.set_text_color(30, 30, 30)
                pdf.cell(0, 6, cls._safe_text(f"{title} @ {company}"), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_font("helvetica", "I", 9)
                pdf.set_text_color(100, 100, 100)
                pdf.cell(0, 5, cls._safe_text(duration), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_font("helvetica", "", 10)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(0, 5, cls._safe_text(desc))
                pdf.ln(3)

        # Comprehensive Projects Portfolio
        all_projects = parsed_data.get("projects", [])
        if all_projects:
            pdf.ln(4)
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(139, 92, 246)
            pdf.cell(0, 8, "KEY PROJECTS & INNOVATION PORTFOLIO", new_x="LMARGIN", new_y="NEXT")
            
            for proj in all_projects:
                p_title = proj.get("title", "Project")
                p_desc = proj.get("description", "")
                p_tech = ", ".join(proj.get("technologies", []))
                
                pdf.set_font("helvetica", "B", 10)
                pdf.set_text_color(30, 30, 30)
                pdf.cell(0, 6, cls._safe_text(p_title), new_x="LMARGIN", new_y="NEXT")
                
                if p_tech:
                    pdf.set_font("helvetica", "I", 8)
                    pdf.set_text_color(139, 92, 246)
                    pdf.cell(0, 5, cls._safe_text(f"Tech: {p_tech}"), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_font("helvetica", "", 10)
                pdf.set_text_color(60, 60, 60)
                pdf.multi_cell(0, 5, cls._safe_text(p_desc))
                pdf.ln(3)

        # Academic & Credentials Footer
        education = parsed_data.get("education", [])
        certs = parsed_data.get("certifications", [])
        
        if education or certs:
            pdf.ln(4)
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(139, 92, 246)
            pdf.cell(0, 8, "ACADEMIC & PROFESSIONAL CREDENTIALS", new_x="LMARGIN", new_y="NEXT")
            
            if education:
                pdf.set_font("helvetica", "B", 9)
                pdf.set_text_color(30, 30, 30)
                pdf.cell(0, 6, "Education:", new_x="LMARGIN", new_y="NEXT")
                for edu in education:
                    deg = edu.get("degree", "Degree")
                    inst = edu.get("institution", "Institution")
                    year = edu.get("year", "")
                    pdf.set_font("helvetica", "", 9)
                    pdf.cell(0, 5, cls._safe_text(f"{deg} - {inst} ({year})"), new_x="LMARGIN", new_y="NEXT")
                pdf.ln(2)

            if certs:
                pdf.set_font("helvetica", "B", 9)
                pdf.set_text_color(30, 30, 30)
                pdf.cell(0, 6, "Certifications:", new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("helvetica", "", 9)
                pdf.multi_cell(0, 5, cls._safe_text(", ".join(certs)))

        output_dir = "uploads/reports"
        os.makedirs(output_dir, exist_ok=True)
        file_path = f"{output_dir}/report_{candidate.id}.pdf"
        
        if os.path.exists(file_path):
            os.remove(file_path)
            
        pdf.output(file_path)
        return os.path.abspath(file_path)

    @classmethod
    def generate_assessment_report(cls, candidate, assessment_session) -> str:
        """
        Generates a PDF report focused strictly on the AI Technical Assessment results.
        """
        report_data = {}
        syllabus_details = []
        try:
            if assessment_session.report_json:
                report_data = json.loads(assessment_session.report_json)
            if assessment_session.memory_json:
                mem = json.loads(assessment_session.memory_json)
                syllabus_details = mem.get("syllabus", [])
        except Exception:
            pass
            
        pdf = FPDF(orientation="P", unit="mm", format="A4")
        pdf.add_page()
        
        # Banner Header (Specific to Assessment)
        pdf.set_fill_color(16, 185, 129) # Emerald banner for assessment
        pdf.rect(0, 0, 210, 25, style="F")
        
        pdf.set_font("helvetica", "B", 18)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(10, 8)
        pdf.cell(0, 10, "TECHNICAL ASSESSMENT REPORT", align="L")
        
        pdf.set_font("helvetica", "I", 10)
        pdf.set_text_color(220, 255, 240)
        pdf.set_xy(150, 8)
        pdf.cell(50, 10, "Smart AI Evaluation", align="R")
        
        pdf.set_xy(10, 35)
        
        # Candidate Info
        pdf.set_font("helvetica", "B", 16)
        pdf.set_text_color(30, 30, 40)
        pdf.cell(0, 8, cls._safe_text(candidate.full_name), new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "", 12)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(0, 6, cls._safe_text(f"Job: {assessment_session.job.title if assessment_session.job else 'Candidate'}"), new_x="LMARGIN", new_y="NEXT")
        
        duration = report_data.get("session_duration_minutes", 0)
        pdf.set_font("helvetica", "", 10)
        pdf.cell(0, 6, f"Session Duration: {duration:.1f} minutes | Score: {round(assessment_session.overall_score or 0, 1)}/100", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)
        
        # Line break
        pdf.set_draw_color(16, 185, 129)
        pdf.set_line_width(0.5)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(6)

        # 1. Assessment Verdict
        verdict = report_data.get("final_verdict", "BORDERLINE")
        pdf.set_font("helvetica", "B", 11)
        pdf.set_text_color(16, 185, 129)
        pdf.cell(0, 6, "INTELLIGENCE VERDICT", new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "B", 14)
        if "STRONG_HIRE" in verdict: pdf.set_text_color(16, 185, 129)
        elif "NO_HIRE" in verdict: pdf.set_text_color(244, 63, 94)
        else: pdf.set_text_color(245, 158, 11)
        
        pdf.cell(0, 8, cls._safe_text(verdict.replace("_", " ")), new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("helvetica", "I", 10)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 5, cls._safe_text(report_data.get("verdict_justification", "")))
        pdf.ln(6)

        # 2. Performance Summary
        pdf.set_font("helvetica", "B", 11)
        pdf.set_text_color(16, 185, 129)
        pdf.cell(0, 6, "CANDIDATE PERFORMANCE SUMMARY", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("helvetica", "", 10)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 5, cls._safe_text(report_data.get("candidate_summary", "")))
        pdf.ln(8)

        # 3. Dimension Breakdown
        pdf.set_font("helvetica", "B", 11)
        pdf.set_text_color(16, 185, 129)
        pdf.cell(0, 8, "DIMENSIONAL SCORING", new_x="LMARGIN", new_y="NEXT")
        
        for ds in report_data.get("dimension_scores", []):
            pdf.set_font("helvetica", "B", 9)
            pdf.set_text_color(30, 30, 30)
            score = ds.get("score", 0)
            
            # Progress Bar
            pdf.set_draw_color(230, 230, 230)
            pdf.set_fill_color(240, 240, 240)
            pdf.rect(140, pdf.get_y() + 1, 50, 4, style="F")
            pdf.set_fill_color(16, 185, 129)
            pdf.rect(140, pdf.get_y() + 1, (score/100.0)*50, 4, style="F")
            
            pdf.cell(130, 6, cls._safe_text(ds.get("dimension", "Unknown")))
            pdf.cell(0, 6, f"{score}%", align="R", new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font("helvetica", "", 8)
            pdf.set_text_color(100, 100, 100)
            pdf.multi_cell(0, 4, cls._safe_text(ds.get("rationale", "")))
            pdf.ln(2)
        
        pdf.ln(6)

        # 4. Syllabus Evaluation Log
        pdf.add_page()
        pdf.set_font("helvetica", "B", 11)
        pdf.set_text_color(16, 185, 129)
        pdf.cell(0, 8, "PERSONALIZED SYLLABUS EVALUATION LOG", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        for topic in syllabus_details:
            topic_name = topic.get("topic", "Unknown")
            modality = topic.get("modality", "TEXT")
            evals = topic.get("evaluations", [])
            score = evals[-1].get("score", 0) if evals else 0
            reasoning = evals[-1].get("reasoning", "") if evals else "No reasoning available."
            
            pdf.set_font("helvetica", "B", 10)
            pdf.set_text_color(30, 30, 30)
            pdf.cell(150, 6, cls._safe_text(topic_name))
            
            if score >= 7: pdf.set_text_color(16, 185, 129)
            elif score >= 4: pdf.set_text_color(139, 92, 246)
            else: pdf.set_text_color(244, 63, 94)
            
            pdf.cell(0, 6, f"Score: {score}/10", align="R", new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font("helvetica", "I", 8)
            pdf.set_text_color(120, 120, 120)
            pdf.cell(0, 4, cls._safe_text(f"Modality: {modality}"), new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font("helvetica", "", 9)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 4, cls._safe_text(reasoning))
            pdf.ln(4)

        output_dir = "uploads/reports"
        os.makedirs(output_dir, exist_ok=True)
        file_path = f"{output_dir}/assessment_{candidate.id}.pdf"
        
        if os.path.exists(file_path):
            os.remove(file_path)
            
        pdf.output(file_path)
        return os.path.abspath(file_path)
