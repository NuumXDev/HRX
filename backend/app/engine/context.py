from typing import Dict, Any, Optional

class WorkflowContext:
    """
    Unified context object for sharing state between agents 
    during a workflow or pipeline execution.
    """
    def __init__(self, initial_data: Optional[Dict[str, Any]] = None):
        self._store: Dict[str, Any] = initial_data or {}
        self.metadata: Dict[str, Any] = {}

    def set(self, key: str, value: Any):
        """Set a value in the context."""
        self._store[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Get a value from the context."""
        return self._store.get(key, default)

    def has(self, key: str) -> bool:
        """Check if a key exists in the context."""
        return key in self._store

    def __repr__(self):
        return f"WorkflowContext(keys={list(self._store.keys())})"
