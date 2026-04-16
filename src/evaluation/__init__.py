"""Evaluation sub-package — metrics, red-teaming, and guardrails."""

from src.evaluation.metrics import hit_rate_at_k, mean_reciprocal_rank
from src.evaluation.guardrails import check_casualty_risk, ConstitutionalGuardrail
from src.evaluation.red_team import RedTeamSuite

__all__ = [
    "hit_rate_at_k",
    "mean_reciprocal_rank",
    "check_casualty_risk",
    "ConstitutionalGuardrail",
    "RedTeamSuite",
]
