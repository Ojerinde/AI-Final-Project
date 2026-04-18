"""Cross-encoder reranker to mitigate the 'lost-in-the-middle' problem.

After initial vector-search retrieval, the reranker rescores each result
using a cross-encoder model for more accurate relevance ranking.
"""

from __future__ import annotations

from functools import lru_cache

from src.config import RAG_RERANK_K


@lru_cache(maxsize=4)
def _get_reranker(model_name: str):
    """Get or cache a CrossEncoder model instance by name."""
    from sentence_transformers import CrossEncoder

    return CrossEncoder(model_name)


def rerank_results(
    query: str,
    results: list[dict],
    top_k: int = RAG_RERANK_K,
    model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
) -> list[dict]:
    """Rerank retrieval results using a cross-encoder.

    Args:
        query: Original query string.
        results: List of dicts from query_vectorstore (must have 'text' key).
        top_k: Number of results to keep after reranking.
        model_name: HuggingFace cross-encoder model name.

    Returns:
        Top-k results sorted by cross-encoder score (descending).
    """
    if not results:
        return []

    model = _get_reranker(model_name)
    pairs = [(query, r["text"]) for r in results]
    scores = model.predict(pairs)

    for r, s in zip(results, scores):
        r["rerank_score"] = float(s)

    ranked = sorted(results, key=lambda x: x["rerank_score"], reverse=True)
    return ranked[:top_k]
