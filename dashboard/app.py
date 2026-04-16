"""Cislunar Trajectory Generation — Streamlit Dashboard.

NASA-grade dark-themed interface with:
- 3D cislunar manifold visualization (Plotly)
- Multimodal mission uploader
- Real-time token economic analysis
- Agent interaction panel
"""

from src.config import (
    AVAILABLE_EMBEDDING_MODELS, EMBEDDING_MODEL_DESCRIPTIONS,
    EMBEDDING_MODEL, AVAILABLE_RERANKER_MODELS, DEFAULT_RERANKER_MODEL,
)
from src.llm.provider import PROVIDERS
import streamlit as st
import sys
from pathlib import Path

# Ensure project root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


st.set_page_config(
    page_title="Cislunar Trajectory Generator",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Dark NASA theme ─────────────────────────────────────────────────────────
st.markdown("""
<style>
    .stApp { background-color: #0a0a1a; }
    .stSidebar { background-color: #0d1117; }
    h1, h2, h3, h4 { color: #58a6ff; }
    .metric-card {
        background: linear-gradient(135deg, #161b22, #0d1117);
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
    }
    .status-pass { color: #3fb950; font-weight: bold; }
    .status-fail { color: #f85149; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

# ── Sidebar: Provider config ───────────────────────────────────────────────
st.sidebar.title("⚙️ Configuration")


st.sidebar.subheader("🤖 LLM Provider")
provider = st.sidebar.selectbox(
    "Provider",
    options=list(PROVIDERS.keys()),
    format_func=lambda x: f"{PROVIDERS[x]['name']} {'✅ Free' if PROVIDERS[x]['free_tier'] else '💳 Paid'}",
)

model_descs = PROVIDERS[provider].get("model_descriptions", {})
model = st.sidebar.selectbox(
    "Model",
    options=PROVIDERS[provider]["models"],
    format_func=lambda m: f"{m}  —  {model_descs.get(m, '')}" if model_descs.get(
        m) else m,
)

st.sidebar.subheader("🧬 Embedding Model")
embedding_model = st.sidebar.selectbox(
    "Embedding",
    options=AVAILABLE_EMBEDDING_MODELS,
    index=AVAILABLE_EMBEDDING_MODELS.index(EMBEDDING_MODEL),
    format_func=lambda m: f"{m}  {EMBEDDING_MODEL_DESCRIPTIONS.get(m, '')}",
)

st.sidebar.subheader("🔀 Reranker")
reranker_model = st.sidebar.selectbox(
    "Cross-encoder",
    options=AVAILABLE_RERANKER_MODELS,
    index=AVAILABLE_RERANKER_MODELS.index(DEFAULT_RERANKER_MODEL),
)

api_key = ""
if not PROVIDERS[provider]["free_tier"]:
    api_key = st.sidebar.text_input(
        f"{PROVIDERS[provider]['name']} API Key",
        type="password",
        help="Required for paid providers. Your key is not stored.",
    )
else:
    import os
    env_key = PROVIDERS[provider]["env_key"]
    if not os.getenv(env_key):
        api_key = st.sidebar.text_input(
            f"{PROVIDERS[provider]['name']} API Key",
            type="password",
            help="Set in .env or enter here for this session.",
        )
        if api_key:
            os.environ[env_key] = api_key

# ── Main navigation ────────────────────────────────────────────────────────
st.title("🌙 Cislunar Trajectory Generator")
st.caption("AI-Based Fast Trajectory Generation · LEO (167 km) → LMO (100 km)")

tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "🚀 Mission Planner",
    "🌐 3D Visualization",
    "📊 Data Quality",
    "🛡️ Safety & Red-Team",
    "💰 Token Economics",
])

# ── Tab 1: Mission Planner (Agent) ─────────────────────────────────────────
with tab1:
    st.header("Mission Planner — ReAct Agent")
    mission = st.text_area(
        "Describe your mission",
        placeholder="e.g., Find the most fuel-efficient path from LEO to LMO avoiding charging hazards",
        height=100,
    )
    col1, col2 = st.columns(2)
    with col1:
        run_btn = st.button("🚀 Plan Mission", type="primary",
                            use_container_width=True)
    with col2:
        resume_id = st.text_input("Resume mission ID (optional)")

    if run_btn and mission:
        import asyncio
        from src.agents.react_agent import ReActAgent

        agent = ReActAgent(llm_provider=provider,
                           llm_model=model, api_key=api_key or None)
        with st.spinner("Agent reasoning..."):
            try:
                state = asyncio.run(
                    agent.run(mission, resume_id=resume_id or None))
                st.success(
                    f"Mission {state.mission_id} — Status: {state.status}")
                for step in state.history:
                    with st.expander(f"Step {step['step']}: {step['action'][:50]}"):
                        st.write(f"**Thought:** {step['thought']}")
                        st.write(f"**Action:** {step['action']}")
                        st.write(f"**Observation:** {step['observation']}")
            except Exception as e:
                st.error(f"Agent error: {e}")

# ── Tab 2: 3D Visualization ────────────────────────────────────────────────
with tab2:
    st.header("Cislunar Manifold Visualization")

    import numpy as np
    import plotly.graph_objects as go
    from src.physics.cr3bp import lagrange_points
    from src.config import MU_CR3BP

    mu = MU_CR3BP
    lps = lagrange_points(mu)

    # Generate sample trajectories for visualization
    theta = np.linspace(0, 2 * np.pi, 500)

    fig = go.Figure()

    # Earth
    fig.add_trace(go.Scatter3d(
        x=[-mu], y=[0], z=[0], mode="markers+text",
        marker=dict(size=10, color="#4da6ff"), text=["Earth"],
        textposition="top center", name="Earth",
    ))
    # Moon
    fig.add_trace(go.Scatter3d(
        x=[1 - mu], y=[0], z=[0], mode="markers+text",
        marker=dict(size=6, color="#c0c0c0"), text=["Moon"],
        textposition="top center", name="Moon",
    ))

    # Lagrange points
    for label, pos in lps.items():
        fig.add_trace(go.Scatter3d(
            x=[pos[0]], y=[pos[1]], z=[pos[2]], mode="markers+text",
            marker=dict(size=4, color="#ffd700", symbol="diamond"),
            text=[label], textposition="top center", name=label,
        ))

    # Sample circular orbit around Earth (LEO)
    r_leo = 0.01  # non-dimensional ~LEO
    fig.add_trace(go.Scatter3d(
        x=-mu + r_leo * np.cos(theta),
        y=r_leo * np.sin(theta),
        z=np.zeros_like(theta),
        mode="lines", line=dict(color="#3fb950", width=2), name="LEO",
    ))

    # Sample orbit around Moon (LMO)
    r_lmo = 0.005
    fig.add_trace(go.Scatter3d(
        x=(1 - mu) + r_lmo * np.cos(theta),
        y=r_lmo * np.sin(theta),
        z=np.zeros_like(theta),
        mode="lines", line=dict(color="#f0883e", width=2), name="LMO",
    ))

    # Sample transfer arc
    t_transfer = np.linspace(0, np.pi, 300)
    x_trans = -mu + (1.0) * (1 - np.cos(t_transfer)) / 2
    y_trans = 0.3 * np.sin(t_transfer) * np.sin(t_transfer * 0.5)
    z_trans = 0.05 * np.sin(2 * t_transfer)
    fig.add_trace(go.Scatter3d(
        x=x_trans, y=y_trans, z=z_trans,
        mode="lines", line=dict(color="#f85149", width=3), name="Transfer Arc",
    ))

    fig.update_layout(
        scene=dict(
            xaxis=dict(title="X (synodic)",
                       gridcolor="#30363d", color="#8b949e"),
            yaxis=dict(title="Y (synodic)",
                       gridcolor="#30363d", color="#8b949e"),
            zaxis=dict(title="Z (synodic)",
                       gridcolor="#30363d", color="#8b949e"),
            bgcolor="#0a0a1a",
        ),
        paper_bgcolor="#0a0a1a",
        plot_bgcolor="#0a0a1a",
        font=dict(color="#c9d1d9"),
        legend=dict(bgcolor="#161b22", bordercolor="#30363d"),
        height=600,
        margin=dict(l=0, r=0, t=30, b=0),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Multimodal uploader
    st.subheader("📎 Mission Diagram Upload")
    uploaded = st.file_uploader(
        "Upload a mission diagram or coordinate table",
        type=["png", "jpg", "jpeg", "csv", "json"],
    )
    if uploaded:
        if uploaded.type.startswith("image"):
            st.image(uploaded, caption="Uploaded mission diagram",
                     use_container_width=True)
            st.info(
                "VLM coordinate extraction would process this image to extract target coordinates.")
        else:
            st.write("File received:", uploaded.name)

# ── Tab 3: Data Quality ────────────────────────────────────────────────────
with tab3:
    st.header("📊 Data Quality Audit")

    if st.button("Run 5-Dimension Audit", type="primary"):
        with st.spinner("Auditing dataset..."):
            try:
                from src.data import load_raw_data, parse_vector_columns
                from src.data.quality_audit import run_full_audit

                df = load_raw_data()
                df = parse_vector_columns(df)
                results = run_full_audit(df)

                st.metric("Q_total (Geometric Mean)",
                          f"{results['Q_total']:.4f}")

                cols = st.columns(5)
                for i, dim in enumerate(["completeness", "consistency", "accuracy", "timeliness", "relevance"]):
                    with cols[i]:
                        score = results[dim]["score"]
                        st.metric(dim.title(), f"{score:.3f}")

                if "relevance" in results and "top_5" in results["relevance"]:
                    st.subheader("Top-5 Features by Mutual Information")
                    for feat in results["relevance"]["top_5"]:
                        mi_val = results["relevance"]["rankings"].get(feat, 0)
                        st.write(f"- **{feat}**: MI = {mi_val:.4f}")

                st.success("Data card saved to data/processed/data_card.md")
            except Exception as e:
                st.error(f"Audit error: {e}")

# ── Tab 4: Safety & Red-Team ──────────────────────────────────────────────
with tab4:
    st.header("🛡️ Safety Dashboard & Red-Teaming")

    if st.button("Run Red-Team Suite", type="primary"):
        from src.evaluation.red_team import RedTeamSuite

        suite = RedTeamSuite()
        summary = suite.summary()

        col1, col2, col3 = st.columns(3)
        col1.metric("Total Tests", summary["total"])
        col2.metric("Passed", summary["passed"])
        col3.metric("Pass Rate", f"{summary['pass_rate']:.0%}")

        for r in summary["details"]:
            icon = "✅" if r["passed"] else "❌"
            with st.expander(f"{icon} {r['id']}: {r['name']}"):
                st.write(f"**Expected reject:** {r['expected_reject']}")
                st.write(f"**Was rejected:** {r['was_rejected']}")
                if r["violations"]:
                    for v in r["violations"]:
                        st.warning(v)

    st.subheader("Manual Safety Check")
    risk_input = st.number_input(
        "Estimated casualty risk", value=1e-5, format="%.2e")
    if st.button("Check Compliance"):
        from src.evaluation.guardrails import check_casualty_risk
        result = check_casualty_risk(risk_input)
        if result["compliant"]:
            st.success(result["message"])
        else:
            st.error(result["message"])

# ── Tab 5: Token Economics ─────────────────────────────────────────────────
with tab5:
    st.header("💰 Token Economic Analysis")

    st.markdown("""
    | Provider | Model | Input ($/1M tokens) | Output ($/1M tokens) | Free Tier |
    |----------|-------|---------------------|----------------------|-----------|
    | Groq | Llama 3.3 70B | $0.59 | $0.79 | ✅ (limited) |
    | Gemini | Gemini 2.0 Flash | Free | Free | ✅ |
    | Gemini | Gemini 1.5 Pro | $1.25 | $5.00 | ✅ (limited) |
    | OpenAI | GPT-4o | $2.50 | $10.00 | ❌ |
    | Anthropic | Claude Sonnet 4 | $3.00 | $15.00 | ❌ |
    """)

    st.subheader("Cost Estimator")
    n_missions = st.slider("Number of missions", 1, 100, 10)
    tokens_per_mission = st.slider("Avg tokens per mission", 500, 10000, 3000)

    total_tokens = n_missions * tokens_per_mission
    costs = {
        "Groq (Llama 3.3)": total_tokens * 0.79 / 1e6,
        "Gemini Flash": 0.0,
        "OpenAI GPT-4o": total_tokens * 10.0 / 1e6,
        "Anthropic Sonnet": total_tokens * 15.0 / 1e6,
    }
    for name, cost in costs.items():
        st.write(f"**{name}:** ${cost:.4f}")
