import abc
from typing import Dict, Type, Any

class Registry:
    """Registry to keep track of available agents."""
    _agents: Dict[str, Type['BaseAgent']] = {}

    @classmethod
    def register(cls, name: str):
        def wrapper(agent_cls: Type['BaseAgent']):
            cls._agents[name] = agent_cls
            return agent_cls
        return wrapper

    @classmethod
    def get_agent(cls, name: str) -> Type['BaseAgent']:
        if name not in cls._agents:
            raise ValueError(f"Agent '{name}' not found in registry.")
        return cls._agents[name]

class BaseAgent(abc.ABC):
    """Abstract base class for all AI agents."""
    
    def __init__(self, model_client: Any):
        self.model_client = model_client

    @abc.abstractmethod
    async def run(self, context: Any) -> Any:
        """Execute the agent's primary logic."""
        pass

    def log(self, message: str):
        print(f"[{self.__class__.__name__}] {message}")
