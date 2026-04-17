"""Ingest knowledge base PDFs into ChromaDB vector store."""

import sys  # noqa: E402
from pathlib import Path  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # noqa: E402

from src.config import PATHS  # noqa: E402
from src.rag.chunker import chunk_documents  # noqa: E402
from src.rag.vectorstore import build_vectorstore  # noqa: E402


def main():
    """Ingest all knowledge base PDFs into the vector store."""
    pdf_dirs = [
        PATHS["knowledge_papers"],
        PATHS["knowledge_standards"],
        PATHS["knowledge_theory"],
    ]

    pdf_paths = []
    for d in pdf_dirs:
        if d.exists():
            pdf_paths.extend(d.glob("*.pdf"))

    print(f"Found {len(pdf_paths)} PDFs:")
    for p in pdf_paths:
        print(f"  - {p.name}")

    print("\nChunking documents...")
    chunks = chunk_documents(pdf_paths)
    print(f"Created {len(chunks)} chunks")

    print("Building vector store...")
    build_vectorstore(chunks)
    print(f"Vector store saved to {PATHS['vectorstore']}")
    print("Done!")


if __name__ == "__main__":
    main()
