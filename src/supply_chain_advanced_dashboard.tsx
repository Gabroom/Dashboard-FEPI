import React, { useState, useMemo } from "react";
import { AlertTriangle, TrendingUp, Package, Clock, ShieldAlert, Activity, XCircle, Truck, FastForward, AlertOctagon } from "lucide-react";
import dataset from "./aggregated_dataset.json";

interface AggregatedRow {
  reg: string;
  mode: string;
  cat: string;
  month: number;
  month_label: string;
  count: number;
  canceled: number;
  late: number;
  on_time: number;
  advance: number;
  shipping: number;
  late_risk: number;
  sum_real: number;
  sum_sched: number;
}

const PALETTE = {
  bg: "#0f172a", surface: "#1e293b", border: "#334155",
  accent: "#38bdf8", danger: "#f97316", dangerHi: "#ef4444",
  success: "#34d399", muted: "#94a3b8", text: "#e2e8f0", dim: "#64748b",
  purple: "#a78bfa",
};

const DS: AggregatedRow[] = dataset.data as AggregatedRow[];
const REGIONS: string[] = dataset.regions;
const MODES: string[] = ["Standard Class", "Second Class", "First Class", "Same Day"];
const CATS: string[] = dataset.categories;

const REGION_ES: Record<string, string> = {
  "Western Europe": "Europa Occidental",
  "Central America": "América Central",
  "North America": "América del Norte",
  "South America": "América del Sur",
  "Southeast Asia": "Asia Sudoriental",
  "Eastern Asia": "Asia Oriental",
  "West Africa": "África Occidental",
  "Southern Europe": "Europa del Sur",
  "South Asia": "Asia del Sur",
  "Central Asia": "Asia Central",
  "West Asia": "Asia Occidental",
  "Northern Europe": "Europa del Norte",
  "Eastern Europe": "Europa Oriental",
  "North Africa": "África del Norte",
  "Southern Africa": "África del Sur",
  "East Africa": "África Oriental",
  "Central Africa": "África Central",
  "Canada": "Canadá",
  "Caribbean": "Caribe",
  "East of USA": "Este de EE. UU.",
  "West of USA ": "Oeste de EE. UU.",
  "US Center ": "Centro de EE. UU.",
  "South of  USA ": "Sur de EE. UU.",
  "Oceania": "Oceanía"
};

const MODE_ES: Record<string, string> = {
  "Standard Class": "Estándar",
  "Second Class": "Segunda clase",
  "First Class": "Primera clase",
  "Same Day": "Mismo día",
};

function pct(a: number, b: number): number { return b === 0 ? 0 : Math.round((a / b) * 1000) / 10; }

function filterDS(data: AggregatedRow[], region: string, mode: string, cat: string) {
  return data.filter(r => (region === "all" || r.reg === region) && (mode === "all" || r.mode === mode) && (cat === "all" || r.cat === cat));
}

// ── MiniBar ────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 3, height: 6, flex: 1 }}>
      <div style={{ width: `${Math.max(2, (value / max) * 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
    </div>
  );
}

// ── Heatmap con tooltips ───────────────────────────────────────────────────
function Heatmap({ data, regions, modes }: { data: AggregatedRow[]; regions: string[]; modes: string[] }) {
  const [tooltip, setTooltip] = useState<{ reg: string; mode: string; pct: number; late: number; total: number; x: number; y: number } | null>(null);
  
  const matrix = useMemo(() => regions.map(reg => modes.map(mode => {
    const sub = data.filter(r => r.reg === reg && r.mode === mode);
    let total = 0;
    let late = 0;
    let canceled = 0;
    
    sub.forEach(r => {
      total += r.count;
      late += r.late;
      canceled += r.canceled;
    });
    
    const active = total - canceled;
    if (active === 0) return null;
    return { pct: pct(late, active), late, total: active };
  })), [data, regions, modes]);

  function cellColor(v: number | null) {
    if (v === null) return "#0f172a";
    const t = v / 100;
    if (t < 0.33) return `rgba(52,211,153,${0.3 + t * 0.4})`;
    if (t < 0.66) return `rgba(249,115,22,${0.3 + t * 0.5})`;
    return `rgba(239,68,68,${0.4 + t * 0.5})`;
  }

  return (
    <div style={{ overflowX: "auto", position: "relative" }}>
      {tooltip && (
        <div style={{ position: "fixed", background: "#1e293b", border: `0.5px solid #334155`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: PALETTE.text, zIndex: 999, pointerEvents: "none", maxWidth: 220, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", top: tooltip.y, left: tooltip.x }}>
          <div style={{ fontWeight: 500, marginBottom: 4, color: PALETTE.accent }}>{REGION_ES[tooltip.reg] || tooltip.reg} · {MODE_ES[tooltip.mode] || tooltip.mode}</div>
          <div style={{ color: "#fca5a5" }}>⚠ {tooltip.pct.toFixed(0)}% de los envíos llegaron tarde</div>
          <div style={{ color: PALETTE.muted, marginTop: 2 }}>{tooltip.late} de {tooltip.total} pedidos con retraso</div>
        </div>
      )}
      <table style={{ borderCollapse: "separate", borderSpacing: 4, width: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: 130, fontSize: 10, color: PALETTE.dim, fontWeight: 400, textAlign: "left", paddingBottom: 4 }}>Región \\ Modo</th>
            {modes.map(m => <th key={m} style={{ fontSize: 9, color: PALETTE.muted, fontWeight: 500, textAlign: "center", paddingBottom: 4 }}>{MODE_ES[m] || m}</th>)}
          </tr>
        </thead>
        <tbody>
          {regions.map((reg, ri) => (
            <tr key={reg}>
              <td style={{ fontSize: 10, color: PALETTE.muted, paddingRight: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{REGION_ES[reg] || reg}</td>
              {modes.map((mode, mi) => {
                const cell = matrix[ri][mi];
                const v = cell?.pct ?? null;
                return (
                  <td key={mode}
                    onMouseEnter={e => { if (cell) setTooltip({ reg, mode, pct: cell.pct, late: cell.late, total: cell.total, x: e.clientX + 12, y: e.clientY - 10 }); }}
                    onMouseMove={e => { if (cell) setTooltip(t => t ? { ...t, x: e.clientX + 12, y: e.clientY - 10 } : t); }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ background: cellColor(v), borderRadius: 4, textAlign: "center", padding: "6px 2px", fontSize: 10, color: "#fff", fontWeight: 500, cursor: cell ? "crosshair" : "default", transition: "opacity .15s" }}
                  >
                    {v !== null ? `${v.toFixed(0)}%` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10, color: PALETTE.dim }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(52,211,153,0.6)", display: "inline-block" }} /> Bajo (&lt;33%)</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(249,115,22,0.7)", display: "inline-block" }} /> Medio (33–66%)</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(239,68,68,0.85)", display: "inline-block" }} /> Crítico (&gt;66%)</span>
      </div>
      <div style={{ fontSize: 10, color: PALETTE.dim, marginTop: 6, fontStyle: "italic" }}>Pasa el cursor sobre una celda para ver el detalle</div>
    </div>
  );
}

// ── Trend chart con etiqueta eje Y ─────────────────────────────────────────
function TrendChart({ data }: { data: AggregatedRow[] }) {
  const W = 560, H = 130, PL = 52, PR = 16, PT = 8, PB = 24;
  
  const months = useMemo(() => {
    if (!data.length) return Array.from({ length: 24 }, (_, i) => i + 1);
    const allMonths = data.map(r => r.month);
    const minM = Math.min(...allMonths);
    const maxM = Math.max(...allMonths);
    const len = maxM - minM + 1;
    return Array.from({ length: len }, (_, i) => minM + i);
  }, [data]);

  const points = useMemo(() => months.map(m => {
    const sub = data.filter(r => r.month === m);
    let total = 0;
    let late = 0;
    let canceled = 0;
    sub.forEach(r => {
      total += r.count;
      late += r.late;
      canceled += r.canceled;
    });
    const active = total - canceled;
    return { m, total: active, late };
  }), [data, months]);

  const maxTotal = Math.max(...points.map(p => p.total), 1);
  function xp(i: number) { return PL + (i / (months.length - 1)) * (W - PL - PR); }
  function yp(v: number, max: number) { return PT + H - PB - (v / max) * (H - PT - PB); }
  
  const totalPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xp(i).toFixed(1)},${yp(p.total, maxTotal).toFixed(1)}`).join(" ");
  const latePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xp(i).toFixed(1)},${yp(p.late, maxTotal).toFixed(1)}`).join(" ");
  const areaTotal = `${totalPath} L${xp(months.length - 1)},${H - PB} L${xp(0)},${H - PB} Z`;
  const areaLate = `${latePath} L${xp(months.length - 1)},${H - PB} L${xp(0)},${H - PB} Z`;
  
  const MONTH_LABELS = useMemo(() => {
    const mapping: Record<number, string> = {};
    data.forEach(r => {
      mapping[r.month] = r.month_label;
    });
    return mapping;
  }, [data]);

  const labelIndices = useMemo(() => {
    const indices: number[] = [];
    const step = 6;
    for (let i = 0; i < months.length; i += step) {
      indices.push(i);
    }
    const lastIdx = months.length - 1;
    if (indices.length > 0 && indices[indices.length - 1] !== lastIdx) {
      const secondToLast = indices[indices.length - 1];
      if (lastIdx - secondToLast >= step / 2) {
        indices.push(lastIdx);
      } else {
        indices[indices.length - 1] = lastIdx;
      }
    }
    return indices;
  }, [months]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" /><stop offset="100%" stopColor="#38bdf8" stopOpacity="0" /></linearGradient>
        <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity="0.35" /><stop offset="100%" stopColor="#f97316" stopOpacity="0" /></linearGradient>
      </defs>
      {/* Eje Y label */}
      <text x={10} y={H / 2} textAnchor="middle" fontSize="9" fill="#64748b" transform={`rotate(-90,10,${H / 2})`}>Número de pedidos</text>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => <line key={t} x1={PL} x2={W - PR} y1={yp(maxTotal * t, maxTotal)} y2={yp(maxTotal * t, maxTotal)} stroke="#334155" strokeWidth="0.5" />)}
      <path d={areaTotal} fill="url(#gTotal)" />
      <path d={areaLate} fill="url(#gLate)" />
      <path d={totalPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
      <path d={latePath} fill="none" stroke="#f97316" strokeWidth="1.5" />
      {labelIndices.map(i => {
        const m = months[i];
        const label = MONTH_LABELS[m] || "";
        return <text key={m} x={xp(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748b">{label}</text>;
      })}
      {[0, 0.5, 1].map(t => <text key={t} x={PL - 4} y={yp(maxTotal * t, maxTotal) + 3} textAnchor="end" fontSize="8" fill="#64748b">{Math.round(maxTotal * t)}</text>)}
    </svg>
  );
}

// ── Gráfico de brechas — "Prog." → "Prometido" ─────────────────────────────
function DevBars({ data, cats }: { data: AggregatedRow[]; cats: string[] }) {
  const [viewMode, setViewMode] = useState<"worst" | "best" | "all">("worst");

  const allRows = useMemo(() => cats.map(cat => {
    const sub = data.filter(r => r.cat === cat);
    let sumReal = 0;
    let sumSched = 0;
    let activeNonShipping = 0;
    
    sub.forEach(r => {
      const active = r.count - r.canceled - r.shipping;
      if (active > 0) {
        sumReal += r.sum_real;
        sumSched += r.sum_sched;
        activeNonShipping += active;
      }
    });
    
    if (activeNonShipping === 0) return { cat, real: 0, sched: 0, dev: 0 };
    const avgReal = sumReal / activeNonShipping;
    const avgSched = sumSched / activeNonShipping;
    return {
      cat,
      real: +avgReal.toFixed(2),
      sched: +avgSched.toFixed(2),
      dev: +(avgReal - avgSched).toFixed(2)
    };
  }), [data, cats]);

  const displayedRows = useMemo(() => {
    if (viewMode === "worst") {
      return [...allRows].sort((a, b) => b.dev - a.dev).slice(0, 10);
    } else if (viewMode === "best") {
      return [...allRows].sort((a, b) => a.dev - b.dev).slice(0, 10);
    } else {
      return [...allRows].sort((a, b) => b.dev - a.dev);
    }
  }, [allRows, viewMode]);
  
  const maxVal = Math.max(...allRows.map(r => Math.max(r.real, r.sched)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Segmented Control */}
      <div style={{ display: "flex", background: "#0f172a", borderRadius: 6, padding: 2, marginBottom: 12, border: `0.5px solid ${PALETTE.border}`, alignSelf: "flex-start" }}>
        {(["worst", "best", "all"] as const).map(mode => {
          const active = viewMode === mode;
          const labels = { worst: "Mayores retrasos", best: "Más eficientes", all: "Ver todas" };
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                background: active ? PALETTE.surface : "transparent",
                color: active ? PALETTE.accent : PALETTE.muted,
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {labels[mode]}
            </button>
          );
        })}
      </div>

      {/* List of Bars */}
      <div style={viewMode === "all" ? { maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 6 } : { display: "flex", flexDirection: "column", gap: 10 }}>
        {displayedRows.map(r => (
          <div key={r.cat}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
              <span style={{ color: PALETTE.muted, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.cat}</span>
              <span style={{ color: r.dev > 0 ? PALETTE.danger : PALETTE.success, fontWeight: 500, fontSize: 11 }}>
                {r.dev > 0 ? `+${r.dev}d de retraso` : `${r.dev}d adelantado`}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: PALETTE.dim, width: 52, textAlign: "right" }}>Real</span>
                <MiniBar value={r.real} max={maxVal} color={r.dev > 0 ? PALETTE.danger : PALETTE.accent} />
                <span style={{ fontSize: 10, color: PALETTE.text, width: 32 }}>{r.real}d</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: PALETTE.dim, width: 52, textAlign: "right" }}>Prometido</span>
                <MiniBar value={r.sched} max={maxVal} color="#334155" />
                <span style={{ fontSize: 10, color: PALETTE.muted, width: 32 }}>{r.sched}d</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, color: PALETTE.dim }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: PALETTE.surface, color: PALETTE.text, border: `0.5px solid ${PALETTE.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ── KPI numérico con interpretación dinámica ───────────────────────────────
function KPI({ icon: Icon, label, value, sub, color, badge, benchmark }: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  badge?: string;
  benchmark?: string;
}) {
  return (
    <div style={{ background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 10, padding: "10px 12px", flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Icon size={12} color={color || PALETTE.accent} />
          <span style={{ fontSize: 10, color: PALETTE.dim }}>{label}</span>
        </div>
        {badge && <span style={{ fontSize: 9, background: `${color}22`, color: color, borderRadius: 4, padding: "1px 5px", border: `0.5px solid ${color}44` }}>{badge}</span>}
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color: color || PALETTE.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: PALETTE.muted, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
      {benchmark && (
        <div style={{ marginTop: 5, paddingTop: 5, borderTop: `0.5px solid ${PALETTE.border}`, fontSize: 9 }}>
          <span style={{ color: "#475569" }}>Meta: </span><span style={{ color: PALETTE.dim }}>{benchmark}</span>
        </div>
      )}
    </div>
  );
}

// ── KPI de texto con interpretación dinámica ───────────────────────────────
function KPIText({ icon: Icon, label, value, valueSub, sub, color, benchmark }: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  valueSub?: string;
  sub?: string;
  color?: string;
  benchmark?: string;
}) {
  return (
    <div style={{ background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 10, padding: "10px 12px", flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <Icon size={12} color={color || PALETTE.accent} />
        <span style={{ fontSize: 10, color: PALETTE.dim }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: color || PALETTE.text, lineHeight: 1.3 }}>{value}</div>
      {valueSub && <div style={{ fontSize: 10, color: color, marginTop: 2, fontWeight: 500 }}>{valueSub}</div>}
      {sub && <div style={{ fontSize: 10, color: PALETTE.muted, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
      {benchmark && (
        <div style={{ marginTop: 5, paddingTop: 5, borderTop: `0.5px solid ${PALETTE.border}`, fontSize: 9 }}>
          <span style={{ color: "#475569" }}>Referencia: </span><span style={{ color: PALETTE.dim }}>{benchmark}</span>
        </div>
      )}
    </div>
  );
}

// ── Cinta de Resumen (Métricas Secundarias) ────────────────────────────────
function KPIMini({ metrics }: { metrics: { icon: any; label: string; value: string; sub: string; color?: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 12, background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 10, padding: "8px 12px", flexWrap: "wrap" }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 160, borderRight: i < metrics.length - 1 ? `1px solid ${PALETTE.border}` : "none" }}>
          <div style={{ background: `${m.color || PALETTE.accent}15`, padding: 6, borderRadius: 6 }}>
            <m.icon size={14} color={m.color || PALETTE.accent} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: PALETTE.dim, marginBottom: 2 }}>{m.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: PALETTE.text, lineHeight: 1 }}>{m.value}</span>
              <span style={{ fontSize: 9, color: m.color || PALETTE.muted }}>{m.sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── App principal ──────────────────────────────────────────────────────────
export default function App() {
  const [region, setRegion] = useState("all");
  const [mode, setMode] = useState("all");
  const [cat, setCat] = useState("all");

  const filtered = useMemo(() => filterDS(DS, region, mode, cat), [region, mode, cat]);

  const kpis = useMemo(() => {
    let total = 0;
    let canceled = 0;
    let late = 0;
    let onTime = 0;
    let advance = 0;
    let shipping = 0;
    let lateRisk = 0;
    let sumReal = 0;
    let sumSched = 0;
    let activeNonShippingCount = 0;

    filtered.forEach(r => {
      total += r.count;
      canceled += r.canceled;
      late += r.late;
      onTime += r.on_time;
      advance += r.advance;
      shipping += r.shipping;
      lateRisk += r.late_risk;
      
      const activeNonShipping = r.count - r.canceled - r.shipping;
      if (activeNonShipping > 0) {
        sumReal += r.sum_real;
        sumSched += r.sum_sched;
        activeNonShippingCount += activeNonShipping;
      }
    });

    const activeCount = total - canceled;
    const slaNum = activeCount === 0 ? 0 : pct(onTime + advance, activeCount);
    const devNum = activeNonShippingCount === 0 ? 0 : (sumReal - sumSched) / activeNonShippingCount;
    const riskNum = total === 0 ? 0 : pct(lateRisk, total);
    const canceledPct = total === 0 ? 0 : pct(canceled, total);
    const advancePct = activeCount === 0 ? 0 : pct(advance, activeCount);
    const shippingPct = activeCount === 0 ? 0 : pct(shipping, activeCount);

    const modeRisk = MODES.map(m => {
      const modeRows = filtered.filter(r => r.mode === m);
      let mTotal = 0;
      let mLate = 0;
      let mCanceled = 0;
      modeRows.forEach(r => {
        mTotal += r.count;
        mLate += r.late;
        mCanceled += r.canceled;
      });
      const mActive = mTotal - mCanceled;
      return { m, p: mActive === 0 ? 0 : pct(mLate, mActive) };
    }).sort((a, b) => b.p - a.p)[0] || { m: "N/A", p: 0 };

    return {
      total: total.toLocaleString("es"),
      sla: slaNum.toFixed(1) + "%",
      slaNum,
      dev: devNum.toFixed(2) + " días",
      devNum,
      risk: riskNum.toFixed(1) + "%",
      riskNum,
      canceled: canceledPct.toFixed(1) + "%",
      canceledNum: canceledPct,
      advance: advancePct.toFixed(1) + "%",
      advanceNum: advancePct,
      shipping: shipping.toLocaleString("es"),
      shippingPct: shippingPct.toFixed(1) + "%",
      modeRisk: MODE_ES[modeRisk.m] || modeRisk.m,
      modeRiskPct: modeRisk.p.toFixed(1) + "%",
    };
  }, [filtered]);

  const crisisRegions = useMemo(() => {
    return REGIONS.map(reg => {
      const regionRows = filtered.filter(r => r.reg === reg);
      let sumReal = 0;
      let sumSched = 0;
      let activeNonShipping = 0;
      
      regionRows.forEach(r => {
        const count = r.count - r.canceled - r.shipping;
        if (count > 0) {
          sumReal += r.sum_real;
          sumSched += r.sum_sched;
          activeNonShipping += count;
        }
      });
      
      if (activeNonShipping === 0) return null;
      const dev = (sumReal - sumSched) / activeNonShipping;
      return { r: reg, dev: +dev.toFixed(2) };
    }).filter((x): x is { r: string; dev: number } => x !== null && x.dev > 1.0).sort((a, b) => b.dev - a.dev);
  }, [filtered]);

  const visRegions = region === "all" ? REGIONS : [region];
  const visModes = mode === "all" ? MODES : [mode];
  const visCats = cat === "all" ? CATS : [cat];

  return (
    <div className="dashboard-container" style={{ background: PALETTE.bg, minHeight: "100vh", padding: "14px 16px", fontFamily: "var(--font-sans)", color: PALETTE.text, boxSizing: "border-box" }}>
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${PALETTE.bg};
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.6);
        }
        html {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, 0.3) ${PALETTE.bg};
        }
      `}</style>
      
      {/* Header + Filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Activity size={18} color={PALETTE.accent} />
            <span style={{ fontSize: 18, fontWeight: 500 }}>DataCo Supply Chain Intelligence</span>
            <span style={{ fontSize: 9, color: PALETTE.dim, marginLeft: 8, background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 4, padding: "2px 7px" }}>UABC · BI 2024</span>
          </div>
          <div style={{ fontSize: 11, color: PALETTE.dim }}>Plataforma de diagnóstico logístico y toma de decisiones proactiva</div>
        </div>
        
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 8, padding: "6px 12px" }}>
          <Sel label="Región" value={region} onChange={setRegion} options={[{ v: "all", l: "Todas las regiones" }, ...REGIONS.map(r => ({ v: r, l: REGION_ES[r] || r }))]} />
          <Sel label="Modo de envío" value={mode} onChange={setMode} options={[{ v: "all", l: "Todos los modos" }, ...MODES.map(m => ({ v: m, l: MODE_ES[m] || m }))]} />
          <Sel label="Categoría de producto" value={cat} onChange={setCat} options={[{ v: "all", l: "Todas las categorías" }, ...CATS.map(c => ({ v: c, l: c }))]} />
          {(region !== "all" || mode !== "all" || cat !== "all") && (
            <button onClick={() => { setRegion("all"); setMode("all"); setCat("all"); }} style={{ marginBottom: 2, background: "transparent", border: `0.5px solid ${PALETTE.border}`, borderRadius: 6, padding: "5px 10px", color: PALETTE.dim, fontSize: 10, cursor: "pointer" }}>✕ Limpiar</button>
          )}
        </div>
      </div>

      {/* KPIs Nivel 1 (Principales) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <KPI icon={TrendingUp} label="Nivel de servicio (SLA)"
          value={kpis.sla} sub="Pedidos a tiempo o adelantados"
          color={kpis.slaNum > 65 ? PALETTE.success : PALETTE.dangerHi}
          badge={kpis.slaNum > 65 ? "✓ Aceptable" : "⚠ Por debajo"}
          benchmark="Meta mínima: 70%" />
        <KPI icon={Clock} label="Retraso promedio"
          value={kpis.dev} sub="Diferencia entre tiempo real y prometido"
          color={kpis.devNum > 1.0 ? PALETTE.danger : PALETTE.accent}
          badge={kpis.devNum <= 0.5 ? "✓ Normal" : kpis.devNum <= 1.0 ? "⚠ Moderado" : "🔴 Alto"}
          benchmark="Meta: ≤ 0.5 días" />
        <KPI icon={ShieldAlert} label="Riesgo de retraso global"
          value={kpis.risk} sub="Pedidos con alta probabilidad de llegar tarde"
          color={kpis.riskNum > 40 ? PALETTE.dangerHi : PALETTE.danger}
          badge={kpis.riskNum > 40 ? "🔴 Crítico" : "⚠ Alerta"}
          benchmark="Meta: menos del 30%" />
        <KPI icon={AlertOctagon} label="Modo más problemático"
          value={kpis.modeRisk} sub="Canal con mayor porcentaje de retrasos"
          color={PALETTE.dangerHi}
          badge={`${kpis.modeRiskPct} tardíos`}
          benchmark="Requiere revisión de contrato" />
      </div>

      {/* Alerta de Crisis Integrada */}
      {crisisRegions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.08)", border: `0.5px solid rgba(239,68,68,0.35)`, borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: "max-content" }}>
            <AlertTriangle size={14} color={PALETTE.dangerHi} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#fca5a5" }}>Regiones en alerta crítica:</span>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
            {crisisRegions.map(x => (
              <button key={x.r} onClick={() => setRegion(x.r)} style={{ background: "rgba(239,68,68,0.12)", border: `0.5px solid rgba(239,68,68,0.4)`, borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#fca5a5", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <span>{REGION_ES[x.r] || x.r}</span>
                <span style={{ fontWeight: 500, color: PALETTE.dangerHi }}>+{x.dev}d</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Nivel 2 (Cinta de Volumen Operativo) */}
      <div style={{ marginBottom: 12 }}>
        <KPIMini metrics={[
          { icon: Package, label: "Volumen Total", value: kpis.total, sub: "pedidos analizados" },
          { icon: Truck, label: "En Tránsito", value: kpis.shipping, sub: kpis.shippingPct, color: PALETTE.purple },
          { icon: FastForward, label: "Envíos Adelantados", value: kpis.advance, sub: kpis.advanceNum > 20 ? "Buena capacidad" : "Capacidad ajustada", color: kpis.advanceNum > 20 ? PALETTE.success : PALETTE.accent },
          { icon: XCircle, label: "Pedidos Cancelados", value: kpis.canceled, sub: kpis.canceledNum <= 4 ? "Nivel normal" : "Revisar motivos", color: kpis.canceledNum > 7 ? PALETTE.dangerHi : kpis.canceledNum > 4 ? PALETTE.danger : PALETTE.muted }
        ]} />
      </div>

      {/* Gráficos con Control de Altura */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>

        {/* Tendencia */}
        <div style={{ background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 10, padding: "12px", gridColumn: "1/-1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Tendencia de Incumplimiento Logístico</div>
              <div style={{ fontSize: 10, color: PALETTE.dim }}>Evolución mensual del volumen total vs. pedidos tardíos — 37 meses (2015-2018)</div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 10, color: PALETTE.dim }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 3, background: PALETTE.accent, display: "inline-block", borderRadius: 2 }} /> Total de pedidos</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 3, background: PALETTE.danger, display: "inline-block", borderRadius: 2 }} /> Pedidos tardíos</span>
            </div>
          </div>
          <TrendChart data={filtered} />
        </div>

        {/* Brechas */}
        <div style={{ background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 10, padding: "12px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Diagnóstico de Brechas en Tiempos de Entrega</div>
          <div style={{ fontSize: 10, color: PALETTE.dim, marginBottom: 10 }}>Días reales vs. prometidos por categoría</div>
          {/* Contenedor con altura fija y scroll interno */}
          <div style={{ height: 350, overflowY: "auto", paddingRight: 4 }}>
            <DevBars data={filtered} cats={visCats} />
          </div>
        </div>

        {/* Matriz de calor */}
        <div style={{ background: PALETTE.surface, border: `0.5px solid ${PALETTE.border}`, borderRadius: 10, padding: "12px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Distribución Geográfica del Riesgo Logístico</div>
          <div style={{ fontSize: 10, color: PALETTE.dim, marginBottom: 10 }}>Entregas tardías cruzando región y modo de envío</div>
          {/* Contenedor con altura fija y scroll interno */}
          <div style={{ height: 350, overflowY: "auto", paddingRight: 4 }}>
            <Heatmap data={filtered} regions={visRegions} modes={visModes} />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ fontSize: 9, color: PALETTE.dim, textAlign: "center", paddingTop: 6, borderTop: `0.5px solid ${PALETTE.border}` }}>
        DataCo Supply Chain Dataset · Proyecto de Titulación — Inteligencia de Negocios · UABC 2024
      </div>
    </div>
  );
}
