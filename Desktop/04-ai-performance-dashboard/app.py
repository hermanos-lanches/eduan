import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="Claude Code Analytics",
    page_icon="⬛",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Palette ────────────────────────────────────────────────────────────────────
ACCENT   = "#D4572A"
BG_PAGE  = "#111111"
BG_CARD  = "#1A1A1A"
BG_NAV   = "#222222"
TEXT_PRI = "#E5E5E5"
TEXT_SEC = "#888888"
BORDER   = "#2A2A2A"

MODEL_COLORS = ["#4A8FD4", "#3D7A6C", "#C4A560"]

USE_MOCK_DATA     = os.getenv("USE_MOCK_DATA", "true").lower() == "true"
REFRESH_INTERVAL  = int(os.getenv("REFRESH_INTERVAL", "300"))

# ── Global CSS ─────────────────────────────────────────────────────────────────
st.markdown(f"""
<style>
/* ── Strip default Streamlit chrome ── */
#MainMenu, header, footer {{ visibility: hidden; height: 0; overflow: hidden; }}
.stDeployButton {{ display: none !important; }}
[data-testid="stToolbar"] {{ display: none !important; }}

/* ── Page background ── */
.stApp {{ background-color: {BG_PAGE} !important; }}

/* ── Remove top padding in main area ── */
.main .block-container {{
    padding-top: 1.4rem;
    padding-left: 2rem;
    padding-right: 2rem;
    padding-bottom: 1rem;
    max-width: 100%;
}}

/* ── Sidebar ── */
section[data-testid="stSidebar"] > div:first-child {{
    background-color: {BG_CARD} !important;
    border-right: 1px solid {BORDER};
    padding: 0 !important;
}}
section[data-testid="stSidebar"] .block-container {{
    padding: 0 !important;
}}

/* ── Typography ── */
body, .stApp, p, span, li, div {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}}

/* ── KPI Metric cards ── */
div[data-testid="metric-container"] {{
    background-color: {BG_CARD} !important;
    border: 1px solid {BORDER} !important;
    border-radius: 10px !important;
    padding: 18px 20px !important;
}}
div[data-testid="stMetricValue"] > div {{
    font-size: 1.85rem !important;
    font-weight: 700 !important;
    color: {TEXT_PRI} !important;
    line-height: 1.15 !important;
}}
div[data-testid="stMetricLabel"] > div {{
    font-size: 0.75rem !important;
    color: {TEXT_SEC} !important;
    font-weight: 400 !important;
    letter-spacing: 0.02em !important;
}}
div[data-testid="stMetricDelta"] > div {{
    font-size: 0.74rem !important;
    color: {TEXT_SEC} !important;
}}

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {{
    background-color: transparent !important;
    border-bottom: none !important;
    gap: 4px;
}}
.stTabs [data-baseweb="tab"] {{
    background-color: {BG_NAV} !important;
    border: 1px solid {BORDER} !important;
    border-radius: 5px !important;
    color: {TEXT_SEC} !important;
    font-size: 0.75rem !important;
    padding: 3px 11px !important;
    height: auto !important;
    min-height: 0 !important;
}}
.stTabs [aria-selected="true"] {{
    background-color: {ACCENT} !important;
    border-color: {ACCENT} !important;
    color: white !important;
}}
.stTabs [data-baseweb="tab-highlight"] {{ display: none !important; }}
.stTabs [data-baseweb="tab-panel"] {{ padding: 0 !important; }}

/* ── Chart cards ── */
.chart-card {{
    background-color: {BG_CARD};
    border: 1px solid {BORDER};
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 12px;
}}
.chart-title {{
    font-size: 0.88rem;
    font-weight: 600;
    color: {TEXT_PRI};
    margin-bottom: 2px;
}}

/* ── Scrollbar ── */
::-webkit-scrollbar {{ width: 5px; height: 5px; }}
::-webkit-scrollbar-track {{ background: {BG_PAGE}; }}
::-webkit-scrollbar-thumb {{ background: #333; border-radius: 3px; }}
::-webkit-scrollbar-thumb:hover {{ background: #444; }}

/* ── Sidebar HTML elements ── */
.sb-header {{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 14px 14px;
    border-bottom: 1px solid {BORDER};
    margin-bottom: 6px;
}}
.sb-logo {{
    width: 34px; height: 34px;
    background-color: {ACCENT};
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 800; color: white;
    flex-shrink: 0;
}}
.sb-title {{ font-size: 0.88rem; font-weight: 700; color: {TEXT_PRI}; line-height: 1.2; }}
.sb-sub   {{ font-size: 0.68rem; color: {TEXT_SEC}; }}
.nav-item {{
    display: flex; align-items: center; gap: 9px;
    padding: 8px 14px; border-radius: 7px; margin: 1px 6px;
    font-size: 0.83rem; color: {TEXT_SEC}; cursor: pointer;
}}
.nav-item:hover {{ background: {BG_NAV}; color: {TEXT_PRI}; }}
.nav-item.active {{
    background: rgba(212,87,42,0.22);
    color: {ACCENT}; font-weight: 600;
}}
.sb-footer {{
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    border-top: 1px solid {BORDER};
    font-size: 0.72rem; color: {TEXT_SEC};
}}
.sb-avatar {{
    width: 26px; height: 26px;
    background: #333; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 700; color: {TEXT_PRI};
    flex-shrink: 0;
}}
</style>
""", unsafe_allow_html=True)


# ── Mock data ──────────────────────────────────────────────────────────────────
@st.cache_data(ttl=REFRESH_INTERVAL)
def load_data():
    np.random.seed(42)

    # 44 days: Jan 12 → Feb 24
    start  = datetime(2024, 1, 12)
    dates  = [start + timedelta(days=i) for i in range(44)]
    noise  = np.random.normal(0, 8, 44)
    msgs   = np.clip(
        np.linspace(120, 40, 44) + noise + np.random.randint(-15, 20, 44),
        5, 140
    ).astype(int)

    usage_df = pd.DataFrame({
        "date":       dates,
        "messages":   msgs,
        "sessions":   np.clip((msgs * np.random.uniform(0.03, 0.06, 44)).astype(int), 1, 12),
        "tool_calls": np.clip((msgs * np.random.uniform(2.0, 4.0, 44)).astype(int), 5, 450),
    })

    model_df = pd.DataFrame({
        "model":  ["Sonnet", "Opus", "Haiku"],
        "cost":   [842.30, 624.50, 84.75],
        "tokens": [10_400_000, 6_900_000, 2_700_000],
        "pct":    [52, 35, 13],
    })

    # Activity: Mon / Wed / Fri × 24 hours
    rows = []
    for day, y in [("Mon", 2), ("Wed", 1), ("Fri", 0)]:
        for h in range(24):
            active = (9 <= h <= 18)
            val = np.random.uniform(0.4, 1.0) if active else np.random.uniform(0.0, 0.25)
            rows.append({"day": day, "y": y, "hour": h, "v": val})
    act_df = pd.DataFrame(rows)

    # Peak hours
    counts = np.zeros(24, dtype=int)
    counts[0:6]   = np.random.randint(0, 150, 6)
    counts[6:9]   = np.random.randint(200, 700, 3)
    counts[9:18]  = np.random.randint(700, 2000, 9)
    counts[18:22] = np.random.randint(300, 1100, 4)
    counts[22:24] = np.random.randint(30, 250, 2)
    peak_df = pd.DataFrame({"hour": list(range(24)), "count": counts})

    return {"usage": usage_df, "models": model_df, "activity": act_df, "peak": peak_df}


data     = load_data()
usage_df = data["usage"]
model_df = data["models"]
act_df   = data["activity"]
peak_df  = data["peak"]

# ── Sidebar ────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(f"""
    <div class="sb-header">
        <div class="sb-logo">CC</div>
        <div>
            <div class="sb-title">Claude Code</div>
            <div class="sb-sub">Analytics Dashboard</div>
        </div>
    </div>
    <nav>
        <div class="nav-item active">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Overview
        </div>
        <div class="nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            Projects
        </div>
        <div class="nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Sessions
        </div>
        <div class="nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Costs
        </div>
        <div class="nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Data
        </div>
    </nav>
    <div style="height: 220px;"></div>
    <div class="sb-footer">
        <div class="sb-avatar">N</div>
        <div>Resuming from ~/.claude</div>
    </div>
    """, unsafe_allow_html=True)


# ── Page header ────────────────────────────────────────────────────────────────
st.markdown(f"""
<div style="margin-bottom:18px;">
    <div style="font-size:1.5rem;font-weight:700;color:{TEXT_PRI};line-height:1.2;">Overview</div>
    <div style="font-size:0.8rem;color:{TEXT_SEC};margin-top:2px;">
        Your Claude Code usage at a glance
    </div>
</div>
""", unsafe_allow_html=True)


# ── KPI Row ────────────────────────────────────────────────────────────────────
k1, k2, k3, k4 = st.columns(4)
with k1:
    st.metric("Total Sessions",   "197",    delta="across 12 projects",   delta_color="off")
with k2:
    st.metric("Total Messages",   "31,840")
with k3:
    st.metric("Total Tokens",     "674.2M")
with k4:
    st.metric("Estimated Cost",   "$1.8K",  delta="based on API pricing", delta_color="off")

st.markdown("<div style='height:14px;'></div>", unsafe_allow_html=True)


# ── Helper: empty plotly layout ────────────────────────────────────────────────
def base_layout(**kwargs):
    return dict(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color=TEXT_SEC, size=10),
        margin=dict(l=0, r=0, t=8, b=0),
        **kwargs,
    )


# ── Charts row 1 ───────────────────────────────────────────────────────────────
col_left, col_right = st.columns([3, 2], gap="medium")

# --- Usage Over Time ---
with col_left:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Usage Over Time</div>', unsafe_allow_html=True)

    tab_msgs, tab_sess, tab_tools = st.tabs(["Messages", "Sessions", "Tool Calls"])

    def usage_fig(col):
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=usage_df["date"],
            y=usage_df[col],
            mode="lines",
            line=dict(color=ACCENT, width=2, shape="spline", smoothing=1.3),
            fill="tozeroy",
            fillcolor="rgba(212,87,42,0.07)",
            hovertemplate="%{x|%b %d}: %{y}<extra></extra>",
        ))
        fig.update_layout(
            **base_layout(height=230, showlegend=False, hovermode="x unified"),
            xaxis=dict(
                showgrid=False, zeroline=False,
                tickformat="%b %d", dtick="P7D",
                tickfont=dict(size=9, color=TEXT_SEC),
                tickvals=[usage_df["date"].iloc[i] for i in range(0, 44, 7)],
            ),
            yaxis=dict(showgrid=False, zeroline=False, tickfont=dict(size=9, color=TEXT_SEC)),
        )
        return fig

    with tab_msgs:
        st.plotly_chart(usage_fig("messages"),   use_container_width=True, config={"displayModeBar": False})
    with tab_sess:
        st.plotly_chart(usage_fig("sessions"),   use_container_width=True, config={"displayModeBar": False})
    with tab_tools:
        st.plotly_chart(usage_fig("tool_calls"), use_container_width=True, config={"displayModeBar": False})

    st.markdown('</div>', unsafe_allow_html=True)

# --- Model Usage donut ---
with col_right:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Model Usage</div>', unsafe_allow_html=True)

    fig_donut = go.Figure(data=[go.Pie(
        labels=model_df["model"].tolist(),
        values=model_df["tokens"].tolist(),
        hole=0.68,
        textinfo="none",
        sort=False,
        marker=dict(
            colors=MODEL_COLORS,
            line=dict(color=BG_CARD, width=3),
        ),
        showlegend=False,
        hovertemplate="%{label}: %{percent}<extra></extra>",
    )])
    fig_donut.update_layout(
        **base_layout(height=165, margin=dict(l=0, r=0, t=4, b=4)),
    )
    st.plotly_chart(fig_donut, use_container_width=True, config={"displayModeBar": False})

    # Legend rows
    for i, row in model_df.iterrows():
        tok_m = row["tokens"] / 1_000_000
        st.markdown(f"""
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:4px 0;font-size:0.78rem;border-bottom:1px solid {BORDER};">
            <div style="display:flex;align-items:center;gap:7px;">
                <span style="width:9px;height:9px;border-radius:50%;
                             background:{MODEL_COLORS[i]};display:inline-block;"></span>
                <span style="color:{TEXT_PRI};font-weight:500;">{row['model']}</span>
                <span style="color:{ACCENT};font-weight:600;">${row['cost']:.2f}</span>
            </div>
            <div style="display:flex;gap:10px;color:{TEXT_SEC};">
                <span>{tok_m:.1f}M tokens</span>
                <span style="color:{TEXT_PRI};font-weight:600;min-width:26px;text-align:right;">
                    {row['pct']}%
                </span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)


st.markdown("<div style='height:4px;'></div>", unsafe_allow_html=True)

# ── Charts row 2 ───────────────────────────────────────────────────────────────
col_act, col_peak = st.columns([3, 2], gap="medium")

# --- Activity heatmap ---
with col_act:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Activity</div>', unsafe_allow_html=True)

    fig_act = go.Figure()
    for y_val in [0, 1, 2]:
        subset = act_df[act_df["y"] == y_val]
        colors  = [ACCENT if v > 0.3 else "#2C2C2C" for v in subset["v"]]
        sizes   = [8 + v * 7 for v in subset["v"]]
        fig_act.add_trace(go.Scatter(
            x=subset["hour"].tolist(),
            y=subset["y"].tolist(),
            mode="markers",
            marker=dict(color=colors, size=sizes, symbol="circle"),
            showlegend=False,
            hovertemplate="%{text}<extra></extra>",
            text=[f"{subset['day'].iloc[0]} {h:02d}:00" for h in subset["hour"]],
        ))

    fig_act.update_layout(
        **base_layout(height=140),
        xaxis=dict(
            showgrid=False, zeroline=False, range=[-0.5, 23.5],
            tickvals=[0, 6, 12, 18], ticktext=["12am", "6am", "12pm", "6pm"],
            tickfont=dict(size=9, color=TEXT_SEC),
        ),
        yaxis=dict(
            showgrid=False, zeroline=False,
            tickvals=[0, 1, 2], ticktext=["Fri", "Wed", "Mon"],
            tickfont=dict(size=9, color=TEXT_SEC),
        ),
    )
    st.plotly_chart(fig_act, use_container_width=True, config={"displayModeBar": False})
    st.markdown('</div>', unsafe_allow_html=True)

# --- Peak Hours bar ---
with col_peak:
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">Peak Hours</div>', unsafe_allow_html=True)

    fig_peak = go.Figure()
    fig_peak.add_trace(go.Bar(
        x=peak_df["hour"],
        y=peak_df["count"],
        marker=dict(color=ACCENT, opacity=0.85),
        hovertemplate="%{x}:00 — %{y:,}<extra></extra>",
    ))
    fig_peak.update_layout(
        **base_layout(height=140, showlegend=False, bargap=0.15),
        xaxis=dict(
            showgrid=False, zeroline=False,
            tickvals=[0, 4, 8, 12, 16, 20],
            tickfont=dict(size=9, color=TEXT_SEC),
        ),
        yaxis=dict(
            showgrid=False, zeroline=False,
            tickformat=".0s",
            tickfont=dict(size=9, color=TEXT_SEC),
        ),
    )
    st.plotly_chart(fig_peak, use_container_width=True, config={"displayModeBar": False})
    st.markdown('</div>', unsafe_allow_html=True)
