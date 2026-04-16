"""ChromaDB vector store for RAG knowledge hub.

Stores document chunk embeddings and supports similarity search
using sentence-transformers.
"""

from __future__ import annotations

from pathlib import Path

import chromadb
from chromadb.config import Settings

from src.config import PATHS, EMBEDDING_MODEL, RAG_TOP_K


def _get_embedding_function():
    """Get the sentence-transformers embedding function for ChromaDB.

    Returns:
        ChromaDB-compatible embedding function.
    """
    from chromadb.utils import embedding_functions
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL
    )


def build_vectorstore(chunks: list[dict], collection_name: str = "cislunar_kb") -> None:
    """Build (or rebuild) the ChromaDB vector store from document chunks.

    Args:
        chunks: List of dicts with 'text', 'source', 'chunk_id'.
        collection_name: Name of the ChromaDB collection.
    """
    persist_dir = str(PATHS["vectorstore"])
    Path(persist_dir).mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )

    # Delete existing collection if it exists
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.create_collection(
        name=collection_name,
        embedding_function=_get_embedding_function(),
        metadata={"hnsw:space": "cosine"},
    )

    # Add chunks in batches of 100
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i: i + batch_size]
        collection.add(
            ids=[c["chunk_id"] for c in batch],
            documents=[c["text"] for c in batch],
            metadatas=[{"source": c["source"]} for c in batch],
        )


def query_vectorstore(
    query: str,
    collection_name: str = "cislunar_kb",
    top_k: int = RAG_TOP_K,
    source_filter: str | None = None,
) -> list[dict]:
    """Query the vector store for relevant chunks.

    Args:
        query: Natural language query.
        collection_name: ChromaDB collection name.
        top_k: Number of results to retrieve.
        source_filter: Optional: filter by source filename.

    Returns:
        List of dicts with 'text', 'source', 'distance', 'chunk_id'.
    """
    persist_dir = str(PATHS["vectorstore"])
    client = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )
    collection = client.get_collection(
        name=collection_name,
        embedding_function=_get_embedding_function(),
    )

    where_filter = {"source": source_filter} if source_filter else None

    results = collection.query(
        query_texts=[query],
        n_results=top_k,
        where=where_filter,
    )

    output = []
    for i in range(len(results["ids"][0])):
        output.append({
            "chunk_id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "source": results["metadatas"][0][i]["source"],
            "distance": results["distances"][0][i] if results["distances"] else None,
        })
    return output
