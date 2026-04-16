"""PDF chunking using Recursive Character Text Splitting.

Chunks NASA/AIAA documents into 500-token blocks with 10% overlap
for vector-store ingestion.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # pymupdf
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config import RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP


def extract_pdf_text(pdf_path: str | Path) -> str:
    """Extract all text from a PDF file.

    Args:
        pdf_path: Path to the PDF.

    Returns:
        Full text content.
    """
    doc = fitz.open(str(pdf_path))
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def chunk_documents(
    pdf_paths: list[str | Path],
    chunk_size: int = RAG_CHUNK_SIZE,
    chunk_overlap: int = RAG_CHUNK_OVERLAP,
) -> list[dict]:
    """Chunk multiple PDF documents into text blocks with metadata.

    Args:
        pdf_paths: List of paths to PDF files.
        chunk_size: Target tokens per chunk (~4 chars per token → chars = chunk_size * 4).
        chunk_overlap: Overlap in tokens.

    Returns:
        List of dicts with 'text', 'source', 'chunk_id' keys.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size * 4,  # approximate chars
        chunk_overlap=chunk_overlap * 4,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    all_chunks: list[dict] = []
    for path in pdf_paths:
        path = Path(path)
        text = extract_pdf_text(path)
        splits = splitter.split_text(text)
        for i, chunk_text in enumerate(splits):
            all_chunks.append({
                "text": chunk_text,
                "source": path.name,
                "chunk_id": f"{path.stem}_{i:04d}",
            })

    return all_chunks
