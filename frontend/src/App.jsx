import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import "./App.css";

const API = "http://127.0.0.1:8000/api";

const cardStyle = {
  background: "rgba(17, 24, 39, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 20,
  boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
  backdropFilter: "blur(12px)",
};

const labelStyle = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

function getBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "1"].includes(value.toLowerCase());
  if (typeof value === "number") return value !== 0;
  return false;
}

function pickField(row, keys, fallback = "N/A") {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return fallback;
}

function MetricCard({ title, value, icon: Icon, hint, tone = "slate" }) {
  const tones = {
    slate: { glow: "rgba(148,163,184,0.15)", accent: "#e2e8f0" },
    red: { glow: "rgba(248,113,113,0.18)", accent: "#fca5a5" },
    amber: { glow: "rgba(251,191,36,0.18)", accent: "#fcd34d" },
    green: { glow: "rgba(74,222,128,0.18)", accent: "#86efac" },
    blue: { glow: "rgba(96,165,250,0.18)", accent: "#93c5fd" },
  };
  const t = tones[tone] || tones.slate;

  return (
    <div style={{ ...cardStyle, padding: 18, position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at top right, ${t.glow}, transparent 45%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={labelStyle}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "white", marginTop: 6 }}>{value}</div>
          <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 6 }}>{hint}</div>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Icon size={20} color={t.accent} />
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const map = {
    slate: { bg: "rgba(148,163,184,0.12)", fg: "#e2e8f0" },
    red: { bg: "rgba(239,68,68,0.14)", fg: "#fecaca" },
    amber: { bg: "rgba(245,158,11,0.16)", fg: "#fde68a" },
    green: { bg: "rgba(34,197,94,0.16)", fg: "#bbf7d0" },
    blue: { bg: "rgba(59,130,246,0.16)", fg: "#bfdbfe" },
  };
  const c = map[tone] || map.slate;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function App() {
  const [status, setStatus] = useState({ running: false });
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const [s, r, l] = await Promise.all([
        axios.get(`${API}/status`),
        axios.get(`${API}/results`),
        axios.get(`${API}/logs`),
      ]);
      setStatus(s.data || {});
      setResults(r.data?.results || []);
      setLogs(l.data?.log || "");
      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load dashboard data.");
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, []);

  const startRun = async () => {
    try {
      setBusy(true);
      await axios.post(`${API}/run`);
      await refresh();
    } catch (e) {
      setError(e?.message || "Failed to start test.");
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(() => {
    const rows = results || [];
    const total = rows.length;
    let hallucinations = 0;
    let inconsistencies = 0;
    let evasions = 0;

    for (const row of rows) {
      const h = getBool(pickField(row, ["is_hallucination", "hallucination", "H"]));

      const isConsistent = pickField(row, ["is_consistent"]);
      const i =
        isConsistent !== "N/A"
          ? !getBool(isConsistent)
          : getBool(pickField(row, ["is_inconsistent", "inconsistency", "I"]));

      const e = getBool(pickField(row, ["is_evasion", "is_evasive", "evasion", "E"]));

      if (h) hallucinations += 1;
      if (i) inconsistencies += 1;
      if (e) evasions += 1;
    }

    return {
      total,
      hallucinations,
      inconsistencies,
      evasions,
      hallRate: total ? Math.round((hallucinations / total) * 100) : 0,
      inconsRate: total ? Math.round((inconsistencies / total) * 100) : 0,
      evasRate: total ? Math.round((evasions / total) * 100) : 0,
    };
  }, [results]);

  const recent = results.slice().reverse();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "radial-gradient(circle at top, #1e293b 0%, #0f172a 50%, #020617 100%)",
        color: "white",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "min(1280px, calc(100vw - 48px))",
          margin: "0 auto",
          padding: "24px 0",
          boxSizing: "border-box",
        }}
      >
        <div
          className="dashboard-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.8fr)",
            gap: 20,
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <div style={{ ...cardStyle, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Sparkles size={18} color="#93c5fd" />
              <Badge tone="blue">LLM Stress Tester</Badge>
            </div>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>LLM Stress Tester</h1>
            <p style={{ marginTop: 14, maxWidth: 760, color: "#cbd5e1", fontSize: 15, lineHeight: 1.7 }}>
              A live view of hallucination, inconsistency, and evasion behavior while the bandit explores weak areas in your finance domain.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              <Badge tone={status.running ? "amber" : "green"}>{status.running ? "RUNNING" : "IDLE"}</Badge>
              <Badge tone="slate">Domain: finance</Badge>
              <Badge tone="slate">Dataset: finance_contexts.jsonl</Badge>
              <Badge tone="slate">Model: llama3.1</Badge>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
              <button
                onClick={startRun}
                disabled={busy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white",
                  fontWeight: 800,
                  cursor: busy ? "not-allowed" : "pointer",
                  boxShadow: "0 14px 30px rgba(59, 130, 246, 0.28)",
                }}
              >
                <Activity size={18} />
                {busy ? "Starting..." : "Run Stress Test"}
              </button>

              <button
                onClick={refresh}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#e2e8f0",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(239,68,68,0.12)",
                  color: "#fecaca",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              ...cardStyle,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={labelStyle}>Current state</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
                {status.running ? "Test running" : "Ready to run"}
              </div>
              <div style={{ color: "#cbd5e1", marginTop: 10, lineHeight: 1.6 }}>
                Exit code: {status.exit_code ?? "-"}
                <br />
                Error: {status.error ?? "-"}
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldAlert size={18} color="#fbbf24" />
                <strong>Failure snapshot</strong>
              </div>
              <div style={{ marginTop: 10, color: "#cbd5e1", fontSize: 14, lineHeight: 1.7 }}>
                H = hallucination
                <br />
                I = inconsistency
                <br />
                E = evasion
              </div>
            </div>
          </div>
        </div>

        <div
          className="stats-grid"
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            width: "100%",
          }}
        >
          <MetricCard title="Recent Cases" value={stats.total} icon={CheckCircle2} hint="Shown in the dashboard feed" tone="blue" />
          <MetricCard title="Hallucinations" value={stats.hallucinations} icon={AlertTriangle} hint={`${stats.hallRate}% of recent cases`} tone="red" />
          <MetricCard title="Inconsistencies" value={stats.inconsistencies} icon={Activity} hint={`${stats.inconsRate}% of recent cases`} tone="amber" />
          <MetricCard title="Evasions" value={stats.evasions} icon={ShieldAlert} hint={`${stats.evasRate}% of recent cases`} tone="green" />
        </div>

        <div style={{ marginTop: 20, ...cardStyle, padding: 20, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={labelStyle}>Behavior breakdown</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 22 }}>H / I / E on recent samples</h2>
            </div>
            <Badge tone="slate">Updated every 2.5s</Badge>
          </div>

          <div className="metric-row" style={{ display: "grid", gap: 12 }}>
            {[
              { label: "Hallucination", value: stats.hallRate, count: stats.hallucinations, tone: "red" },
              { label: "Inconsistency", value: stats.inconsRate, count: stats.inconsistencies, tone: "amber" },
              { label: "Evasion", value: stats.evasRate, count: stats.evasions, tone: "green" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr 70px",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ fontWeight: 700 }}>{item.label}</div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: `${item.value}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        item.tone === "red"
                          ? "linear-gradient(90deg, #ef4444, #fb7185)"
                          : item.tone === "amber"
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #22c55e, #34d399)",
                    }}
                  />
                </div>
                <div style={{ textAlign: "right", fontWeight: 800 }}>{item.value}%</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="recent-grid"
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.75fr)",
            gap: 16,
            width: "100%",
          }}
        >
          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={labelStyle}>Recent evaluations</div>
                <h2 style={{ margin: "6px 0 0", fontSize: 22 }}>Question / answer / flags</h2>
              </div>
              <Badge tone="slate">Latest {recent.length}</Badge>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {recent.length === 0 ? (
                <div style={{ color: "#94a3b8", padding: 12 }}>No results yet.</div>
              ) : (
                recent.map((r, idx) => {
                  const question = pickField(r, ["question", "q", "prompt"]);
                  const answer = pickField(r, ["answer", "response", "model_answer"]);
                  const h = getBool(pickField(r, ["is_hallucination", "hallucination", "H"]));

                  const isConsistent = pickField(r, ["is_consistent"]);
                  const i =
                    isConsistent !== "N/A"
                      ? !getBool(isConsistent)
                      : getBool(pickField(r, ["is_inconsistent", "inconsistency", "I"]));

                  const e = getBool(pickField(r, ["is_evasion", "is_evasive", "evasion", "E"]));

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 8 }}>Q: {String(question)}</div>
                      <div style={{ color: "#cbd5e1", marginBottom: 10 }}>A: {String(answer)}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <Badge tone={h ? "red" : "green"}>H={String(h)}</Badge>
                        <Badge tone={i ? "amber" : "green"}>I={String(i)}</Badge>
                        <Badge tone={e ? "red" : "green"}>E={String(e)}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={labelStyle}>Quick legend</div>
              <div style={{ marginTop: 10, display: "grid", gap: 10, color: "#cbd5e1" }}>
                <div><Badge tone="red">H</Badge> hallucination</div>
                <div><Badge tone="amber">I</Badge> inconsistency</div>
                <div><Badge tone="green">E</Badge> evasion</div>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 20, minHeight: 260 }}>
              <div style={labelStyle}>Live log</div>
              <pre
                style={{
                  marginTop: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#e2e8f0",
                  fontSize: 12,
                  lineHeight: 1.6,
                  maxHeight: 400,
                  overflow: "auto",
                }}
              >
                {logs || "No logs yet."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;