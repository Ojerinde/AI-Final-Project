"""Agent state persistence for human-in-the-loop review.

Saves and loads agent mission state as JSON checkpoints so a mission
can be paused and resumed after human review.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.config import PATHS


class AgentState:
    """Persistent state for a ReAct agent mission.

    Attributes:
        mission_id: Unique mission identifier.
        status: Current status (pending, running, paused, completed, failed).
        history: List of (thought, action, observation) tuples.
        context: Arbitrary mission context dict.
    """

    def __init__(self, mission_id: str):
        """Initialise agent state.

        Args:
            mission_id: Unique identifier for this mission.
        """
        self.mission_id = mission_id
        self.status: str = "pending"
        self.history: list[dict[str, str]] = []
        self.context: dict[str, Any] = {}
        self.created_at: str = datetime.now(timezone.utc).isoformat()
        self.updated_at: str = self.created_at

    def add_step(self, thought: str, action: str, observation: str) -> None:
        """Record a Thought → Action → Observation step.

        Args:
            thought: Agent's reasoning.
            action: Action taken (tool call description).
            observation: Result of the action.
        """
        self.history.append({
            "step": len(self.history) + 1,
            "thought": thought,
            "action": action,
            "observation": observation,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def save(self) -> Path:
        """Save state to a JSON checkpoint.

        Returns:
            Path to the saved checkpoint file.
        """
        state_dir = PATHS["agent_state"]
        state_dir.mkdir(parents=True, exist_ok=True)
        path = state_dir / f"{self.mission_id}.json"
        path.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")
        return path

    @classmethod
    def load(cls, mission_id: str) -> "AgentState":
        """Load state from a JSON checkpoint.

        Args:
            mission_id: Mission ID to load.

        Returns:
            Restored AgentState instance.

        Raises:
            FileNotFoundError: If no checkpoint exists for this mission.
        """
        path = PATHS["agent_state"] / f"{mission_id}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        state = cls(data["mission_id"])
        state.status = data["status"]
        state.history = data["history"]
        state.context = data["context"]
        state.created_at = data["created_at"]
        state.updated_at = data["updated_at"]
        return state

    def to_dict(self) -> dict:
        """Serialise to dict.

        Returns:
            Dict representation of the state.
        """
        return {
            "mission_id": self.mission_id,
            "status": self.status,
            "history": self.history,
            "context": self.context,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
