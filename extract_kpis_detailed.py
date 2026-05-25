import json

with open('src/aggregated_dataset.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

data = d['data']

total = 0
canceled = 0
late = 0
on_time = 0
advance = 0
shipping = 0
late_risk = 0
sum_real = 0
sum_sched = 0
active_non_shipping_count = 0

for r in data:
    total += r['count']
    canceled += r['canceled']
    late += r['late']
    on_time += r['on_time']
    advance += r['advance']
    shipping += r['shipping']
    late_risk += r['late_risk']
    
    active_ns = r['count'] - r['canceled'] - r['shipping']
    if active_ns > 0:
        sum_real += r['sum_real']
        sum_sched += r['sum_sched']
        active_non_shipping_count += active_ns

active_count = total - canceled

sla_pct = round(((on_time + advance) / active_count) * 100, 1) if active_count > 0 else 0
dev_days = round((sum_real - sum_sched) / active_non_shipping_count, 2) if active_non_shipping_count > 0 else 0
risk_pct = round((late_risk / total) * 100, 1) if total > 0 else 0
canceled_pct = round((canceled / total) * 100, 1) if total > 0 else 0
advance_pct = round((advance / active_count) * 100, 1) if active_count > 0 else 0
shipping_pct = round((shipping / active_count) * 100, 1) if active_count > 0 else 0
late_pct = round((late / active_count) * 100, 1) if active_count > 0 else 0

modes = ['Standard Class', 'Second Class', 'First Class', 'Same Day']
mode_risk = []
for m in modes:
    m_total = sum(r['count'] for r in data if r['mode'] == m)
    m_late = sum(r['late'] for r in data if r['mode'] == m)
    m_canceled = sum(r['canceled'] for r in data if r['mode'] == m)
    m_active = m_total - m_canceled
    m_pct = round((m_late / m_active) * 100, 1) if m_active > 0 else 0
    mode_risk.append({"mode": m, "pct": m_pct, "total": m_total})

mode_breakdown = "\n".join([f"  - {m['mode']}: {m['pct']}% de envíos tardíos (Volumen total: {m['total']:,})" for m in mode_risk])

# --- Gráfico 1: Tendencia Temporal ---
monthly_data = {}
for r in data:
    m = r['month']
    if m not in monthly_data:
        monthly_data[m] = {'label': r['month_label'], 'total': 0, 'late': 0}
    monthly_data[m]['total'] += r['count']
    monthly_data[m]['late'] += r['late']

trend_lines = []
for m in sorted(monthly_data.keys()):
    dm = monthly_data[m]
    t_late_pct = round((dm['late']/dm['total'])*100,1) if dm['total']>0 else 0
    trend_lines.append(f"  - {dm['label']}: {dm['total']:,} pedidos | {dm['late']:,} tardíos ({t_late_pct}%)")
trend_breakdown = "\n".join(trend_lines)

# --- Gráfico 2: Brechas por Categoría ---
cats_data = {}
for r in data:
    cat = r['cat']
    if cat not in cats_data:
        cats_data[cat] = {'real': 0, 'sched': 0, 'active': 0}
    active_ns = r['count'] - r['canceled'] - r['shipping']
    if active_ns > 0:
        cats_data[cat]['real'] += r['sum_real']
        cats_data[cat]['sched'] += r['sum_sched']
        cats_data[cat]['active'] += active_ns

cats_list = []
for cat, vals in cats_data.items():
    if vals['active'] > 0:
        real = vals['real'] / vals['active']
        sched = vals['sched'] / vals['active']
        dev = real - sched
        cats_list.append({'cat': cat, 'real': real, 'sched': sched, 'dev': dev})

cats_list.sort(key=lambda x: x['dev'], reverse=True)
top_10_worst_cats = "\n".join([f"  - {c['cat']}: +{c['dev']:.2f} días de retraso (Real: {c['real']:.2f}d vs Promesa: {c['sched']:.2f}d)" for c in cats_list[:10]])
top_10_best_cats = "\n".join([f"  - {c['cat']}: {c['dev']:.2f} días (Real: {c['real']:.2f}d vs Promesa: {c['sched']:.2f}d)" for c in reversed(cats_list[-10:])])

# --- Alertas de Crisis ---
regions_data = {}
for r in data:
    reg = r['reg']
    if reg not in regions_data:
        regions_data[reg] = {'real': 0, 'sched': 0, 'active_ns': 0}
    active_ns = r['count'] - r['canceled'] - r['shipping']
    if active_ns > 0:
        regions_data[reg]['real'] += r['sum_real']
        regions_data[reg]['sched'] += r['sum_sched']
        regions_data[reg]['active_ns'] += active_ns

crisis_regions = []
for reg, vals in regions_data.items():
    if vals['active_ns'] > 0:
        dev = (vals['real'] - vals['sched']) / vals['active_ns']
        if dev > 1.0:
            crisis_regions.append({'reg': reg, 'dev': dev})
crisis_regions.sort(key=lambda x: x['dev'], reverse=True)
crisis_breakdown = "\n".join([f"  - {c['reg']}: +{c['dev']:.2f} días de retraso promedio" for c in crisis_regions])

# --- Gráfico 3: Distribución Geográfica del Riesgo (Heatmap) ---
regions = sorted(list(set(r['reg'] for r in data)))
heatmap_lines = ["| Región | Estándar | Segunda Clase | Primera Clase | Mismo Día |"]
heatmap_lines.append("|---|---|---|---|---|")

for reg in regions:
    row_strs = [reg]
    for mode in modes:
        sub = [r for r in data if r['reg'] == reg and r['mode'] == mode]
        m_total = sum(r['count'] for r in sub)
        m_late = sum(r['late'] for r in sub)
        m_canceled = sum(r['canceled'] for r in sub)
        m_active = m_total - m_canceled
        if m_active > 0:
            m_pct = round((m_late / m_active) * 100, 1)
            row_strs.append(f"{m_pct}%")
        else:
            row_strs.append("—")
    heatmap_lines.append("| " + " | ".join(row_strs) + " |")

heatmap_breakdown = "\n".join(heatmap_lines)

out = f"""# Prompt Avanzado de Contexto Logístico para Análisis de IA (DataCo)

Actúa como un Consultor Senior en Inteligencia de Negocios y Logística (Supply Chain). A continuación, tienes un vaciado de datos de un Dashboard Ejecutivo alimentado por 180,519 transacciones. 

Tu tarea es encontrar patrones, explicar los cuellos de botella y hacer recomendaciones estratégicas accionables.

## 1. KPIs Globales
- **Total de pedidos:** {total:,}
- **Pedidos cancelados:** {canceled:,} ({canceled_pct}% del volumen total)
- **Pedidos en tránsito (WIP):** {shipping:,} ({shipping_pct}%)
- **Nivel de servicio (SLA - Entregas a tiempo/adelantadas):** {sla_pct}%
- **Envíos tardíos:** {late_pct}% de los pedidos entregados
- **Retraso promedio:** +{dev_days} días sobre la promesa al cliente.

## 2. Análisis por Modo de Envío (Causa Raíz de Retrasos)
{mode_breakdown}

## 3. Matriz de Distribución Geográfica del Riesgo (Heatmap Completo)
Esta matriz cruza las regiones con los modos de envío. Los porcentajes indican la proporción de envíos que sufrieron retrasos.

{heatmap_breakdown}

## 4. Análisis Geográfico: Zonas de Alerta Crítica (Panel Inferior)
Las siguientes regiones promedian MÁS DE 1 DÍA de retraso estructural constante:
{crisis_breakdown}

## 5. Análisis de Complejidad de Producto (Diagnóstico de Brechas)
**Las 10 Peores Categorías (Mayor retraso frente a la promesa):**
{top_10_worst_cats}

**Las 10 Categorías Más Eficientes:**
{top_10_best_cats}

## 6. Evolución Longitudinal (Tendencia de 37 Meses)
A continuación, el volumen total mensual frente a la cantidad de pedidos que llegaron tarde:
{trend_breakdown}
"""

with open('dashboard_results_for_ai.md', 'w', encoding='utf-8') as f:
    f.write(out)
