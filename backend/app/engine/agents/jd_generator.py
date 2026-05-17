import json
from ..base import BaseAgent, Registry
from ..context import WorkflowContext

@Registry.register("jd_generator")
class JDAgent(BaseAgent):
    async def run(self, context: WorkflowContext) -> str:
        self.log("Generating Job Description...")
        
        # Extract inputs from context
        title = context.get("title")
        department = context.get("department", "General")
        seniority = context.get("seniority", "Not specified")
        raw_context = context.get("raw_context", "")
        org_name = context.get("org_name", "Our Company")
        org_description = context.get("org_description", "")
        org_mission = context.get("org_mission", "")
        org_culture = context.get("org_culture", "")
        tone = context.get("tone", "professional")
        
        prompt = f"""
        You are an expert HR strategist and executive recruiter. Your task is to generate a comprehensive, high-fidelity, and engaging Job Description for the following role.
        
        ### Organization Context:
        - **Company Name**: {org_name}
        - **About Us**: {org_description}
        - **Mission**: {org_mission}
        - **Culture**: {org_culture}
        
        ### Role Identity:
        - **Job Title**: {title}
        - **Department**: {department}
        - **Seniority**: {seniority}
        
        ### Role Context (User Inputs):
        {raw_context}
        
        ### Desired Tone:
        {tone}
        
        ### Formatting Instructions:
        - Use Markdown for structure.
        - Include the following sections: 
            1. Title & Department
            2. About {org_name} (weaving in mission and culture)
            3. The Role
            4. Key Responsibilities
            5. Requirements & Qualifications
            6. Why Join Us? (mentioning specific cultural elements)
        - Ensure the JD sounds authentic to {org_name}'s culture and mission.
        - Output ONLY the JD content in markdown format.
        """
        
        response = await self.model_client.async_generate(
            model_name="gemini-flash-latest",
            contents=prompt
        )
        
        if not response or not response.text:
            raise Exception("Failed to generate content from Gemini.")
            
        result = response.text.strip()
        context.set("jd_content", result)
        return result
