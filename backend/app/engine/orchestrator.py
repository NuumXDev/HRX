import os
import importlib
from typing import List, Optional, Any
from .base import Registry, BaseAgent
from .context import WorkflowContext
from .models import ModelClient

class AIEngine:
    """
    The central orchestrator for all AI operations.
    Manages agent registration, discovery, and pipeline execution.
    """
    def __init__(self):
        self.model_client = ModelClient()
        self._discover_agents()

    def _discover_agents(self):
        """Automatically import all agents to trigger registration."""
        agents_dir = os.path.dirname(os.path.abspath(__file__)) + "/agents"
        for filename in os.listdir(agents_dir):
            if filename.endswith(".py") and filename != "__init__.py":
                module_name = f".agents.{filename[:-3]}"
                importlib.import_module(module_name, package="app.engine")
        print(f"AI Engine: Discovered {len(Registry._agents)} agents.")

    async def run_agent(self, agent_name: str, context: WorkflowContext) -> Any:
        """Run a single agent from the registry."""
        agent_cls = Registry.get_agent(agent_name)
        agent = agent_cls(self.model_client)
        return await agent.run(context)

    async def run_pipeline(self, pipeline_name: str, context: WorkflowContext) -> WorkflowContext:
        """
        Execute a predefined sequence of agents.
        (Pipelines will be defined here as we grow).
        """
        import asyncio
        
        if pipeline_name == "candidate_ingestion":
            # Example Pipeline: Ingestion -> Analysis
            await self.run_agent("ingestion", context)
            if context.has("parsed_data"):
                await self.run_agent("analysis", context)
                
        elif pipeline_name == "deep_candidate_analysis":
            # Multi-agent Deep Analysis Orchestration
            print("Triggering Deep Candidate Analysis Pipeline")
            
            # 1. Sequential Start: Extraction is required for all others
            extracted_data = await self.run_agent("data_extraction", context)
            
            if context.has("extracted_data"):
                # 2. Parallel Execution: independent deep evaluations
                # These can run concurrently to maximize performance
                await asyncio.gather(
                    self.run_agent("analysis", context),
                    self.run_agent("social_verification", context),
                    self.run_agent("skill_match", context)
                )
                
                # 3. Final Synthesis: Needs all previous data
                await self.run_agent("verdict_engine", context)
                
                # 4. Consolidated Persistence
                self._consolidate_results(context)
        
        return context

    def _consolidate_results(self, context: WorkflowContext):
        """Merges all agent findings into a single cohesive parsed structure."""
        extracted = context.get("extracted_data", {})
        analysis = context.get("match_analysis", {})
        verification = context.get("social_verification", {})
        scored_skills = context.get("scored_skills", [])
        verdict = context.get("verdict", "REJECT")
        rationale = context.get("rationale", "")
        
        # Build the final comprehensive dossier JSON
        final_payload = {
            **extracted,
            "comparison_matrix": analysis.get("comparison_matrix", []),
            "reasoning": analysis.get("reasoning", ""),
            "social_verification": verification,
            "scored_skills": scored_skills,
            "verdict": verdict,
            "rationale": rationale,
            "match_score": context.get("match_score", analysis.get("score", 0))
        }
        
        # If verification found extra projects, merge them into extraction projects
        if verification.get("notable_projects"):
            existing_projects = final_payload.get("projects", [])
            for np in verification["notable_projects"]:
                # Simple deduplication by title
                matching_project = next((p for p in existing_projects if p.get("title", "").lower() == np.get("name", "").lower()), None)
                if not matching_project:
                    existing_projects.append({
                        "title": np.get("name"),
                        "description": np.get("description"),
                        "technologies": np.get("technologies", [])
                    })
                else:
                    if not matching_project.get("technologies") and np.get("technologies"):
                        matching_project["technologies"] = np.get("technologies")
            final_payload["projects"] = existing_projects

        context.set("final_parsed_json", final_payload)

# Singleton instance for easy access
engine = AIEngine()

