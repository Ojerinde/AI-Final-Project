"""Trajectory viability metrics: Hit Rate @k and Mean Reciprocal Rank."""

from __future__ import annotations

import numpy as np


def hit_rate_at_k(
    ranked_results: list[dict],
    relevant_ids: set[str],
    k: int = 5,
) -> float:
    """Compute Hit Rate @k — fraction of queries with ≥1 relevant result in top-k.

    Args:
        ranked_results: List of result dicts (must have 'id' key).
        relevant_ids: Set of IDs considered relevant / viable.
        k: Cutoff rank.

    Returns:
        Hit rate in [0, 1].
    """
    top_k = ranked_results[:k]
    hits = sum(1 for r in top_k if r.get("id") in relevant_ids)
    return 1.0 if hits > 0 else 0.0


def mean_reciprocal_rank(
    ranked_results_list: list[list[dict]],
    relevant_ids_list: list[set[str]],
) -> float:
    """Compute Mean Reciprocal Rank across multiple queries.

    Args:
        ranked_results_list: List of ranked result lists (one per query).
        relevant_ids_list: List of relevant-ID sets (one per query).

    Returns:
        MRR score in [0, 1].
    """
    rr_scores = []
    for ranked, relevant in zip(ranked_results_list, relevant_ids_list):
        rr = 0.0
        for i, r in enumerate(ranked, start=1):
            if r.get("id") in relevant:
                rr = 1.0 / i
                break
        rr_scores.append(rr)
    return float(np.mean(rr_scores)) if rr_scores else 0.0


def trajectory_viability_score(
    delta_v: float,
    jacobi_drift: float,
    max_delta_v: float = 4.0,
    max_jacobi_drift: float = 1e-6,
) -> float:
    """Score a trajectory's viability on [0, 1].

    Args:
        delta_v: Total Δv of the trajectory.
        jacobi_drift: Maximum Jacobi constant drift.
        max_delta_v: Budget limit.
        max_jacobi_drift: Tolerance.

    Returns:
        Viability score. 1.0 = perfectly viable.
    """
    dv_score = max(0, 1 - delta_v / max_delta_v)
    jc_score = max(0, 1 - jacobi_drift /
                   max_jacobi_drift) if max_jacobi_drift > 0 else 1.0
    return (dv_score + jc_score) / 2
