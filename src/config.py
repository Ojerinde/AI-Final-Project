"""Central configuration: paths, constants, column definitions, and physics parameters."""

from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# ── Project root ────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent

# ── Directory paths ─────────────────────────────────────────────────────────
PATHS = {
    "data_raw": ROOT / "data" / "raw",
    "data_processed": ROOT / "data" / "processed",
    "knowledge_papers": ROOT / "knowledge_base" / "papers",
    "knowledge_standards": ROOT / "knowledge_base" / "standards",
    "knowledge_theory": ROOT / "knowledge_base" / "theory",
    "vectorstore": ROOT / "knowledge_base" / "vectorstore",
    "models_dir": ROOT / "models_checkpoints",
    "agent_state": ROOT / "data" / "processed" / "agent_state",
}

# ── Dataset column definitions ──────────────────────────────────────────────
COLUMN_NAMES: list[str] = [
    "orb_id",          # unique orbit identifier
    "ejection",        # ejection class / trajectory type (0–4)
    "lifetime",        # orbital lifetime (years)
    "period",          # orbital period (days)
    "perigee",         # perigee radius (m)
    "apogee",          # apogee radius (m)
    "r0",              # initial position vector [x, y, z] (m)
    "v0",              # initial velocity vector [x, y, z] (m/s)
    "pm_ra_min",       # min proper-motion in RA (rad/s)
    "pm_dec_min",      # min proper-motion in Dec (rad/s)
    "pm_ra_max",       # max proper-motion in RA (rad/s)
    "pm_dec_max",      # max proper-motion in Dec (rad/s)
    "M_v_min",         # min visual magnitude
    "M_v_max",         # max visual magnitude
    "a",               # semi-major axis (m)
    "e",               # eccentricity
    "i",               # inclination (rad)
    "tl",              # time of launch / true longitude (rad)
    "pa",              # argument of perigee (rad)
    "raan",            # right ascension of ascending node (rad)
    "ta",              # true anomaly (rad)
    "vmin",            # minimum velocity (m/s)
    "vmax",            # maximum velocity (m/s)
    "r_vmin",          # position vector at vmin [x, y, z] (m)
    "r_vmax",          # position vector at vmax [x, y, z] (m)
    "std_divergence",          # std of 2-body divergence (m)
    "median_divergence",       # median 2-body divergence (m)
    "mean_divergence",         # mean 2-body divergence (m)
    "max_divergence",          # max 2-body divergence (m)
    "threebody_std_divergence",    # std of 3-body divergence (m)
    "threebody_median_divergence",  # median 3-body divergence (m)
    "threebody_mean_divergence",   # mean 3-body divergence (m)
    "threebody_max_divergence",    # max 3-body divergence (m)
]

VECTOR_COLUMNS: list[str] = ["r0", "v0", "r_vmin", "r_vmax"]
SCALAR_COLUMNS: list[str] = [
    c for c in COLUMN_NAMES if c not in VECTOR_COLUMNS]
TARGET_COLUMN: str = "ejection"

# ── Physics constants (SI) ──────────────────────────────────────────────────
MU_EARTH = 3.986004418e14        # m³/s²  — Earth gravitational parameter
MU_MOON = 4.9048695e12           # m³/s²  — Moon gravitational parameter
MU_SUN = 1.32712440018e20        # m³/s²  — Sun gravitational parameter
R_EARTH = 6.371e6                # m      — Earth mean radius
R_MOON = 1.7374e6                # m      — Moon mean radius
EARTH_MOON_DIST = 3.844e8        # m      — mean Earth–Moon distance
LEO_ALTITUDE = 167e3             # m      — LEO parking orbit altitude
LMO_ALTITUDE = 100e3             # m      — Lunar orbit altitude

# CR3BP mass ratio (Earth–Moon)
MU_CR3BP = MU_MOON / (MU_EARTH + MU_MOON)  # ≈ 0.01215

# ── LLM provider defaults ──────────────────────────────────────────────────
DEFAULT_LLM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "groq")
DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "llama-3.3-70b-versatile")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# ── RAG parameters ──────────────────────────────────────────────────────────
RAG_CHUNK_SIZE = 500       # tokens per chunk
RAG_CHUNK_OVERLAP = 50     # 10 % overlap
RAG_TOP_K = 10             # initial retrieval count
RAG_RERANK_K = 5           # after cross-encoder reranking

# ── Safety thresholds ──────────────────────────────────────────────────────
MAX_CASUALTY_RISK = 1e-4   # 1:10 000 — NASA-STD-8719.14A
MAX_DEBRIS_LIFETIME_YEARS = 25
