from ..base import BaseAgent, Registry

@Registry.register("test_agent")
class TestAgent(BaseAgent):
    def run(self, context):
        self.log("Test agent running!")
        context.set("test_data", "Engine is live!")
        return "Success"
