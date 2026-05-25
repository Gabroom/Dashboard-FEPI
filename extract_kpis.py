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

worst_mode = sorted(mode_risk, key=lambda x: x['pct'], reverse=True)[0]

mode_breakdown = "\n".join([f"  - {m['mode']}: {m['pct']}% de envíos tardíos (Volumen total: {m['total']:,})" for m in mode_risk])

out = f"""# Prompt de Contexto para Análisis de IA (DataCo Supply Chain)

Actúa como un experto en logística y cadena de suministro. A continuación, te proporciono los resultados exactos calculados a partir de la base de datos completa de DataCo (180,519 transacciones). No necesitas la base de datos cruda, confía en estos KPIs calculados. 

Tu tarea es analizar estos números, sacar conclusiones sobre el estado operativo de la empresa e identificar los principales cuellos de botella y posibles soluciones estratégicas.

**Filtros de los datos:** Muestra global (Todas las regiones, modos de envío y categorías).

## 1. Métricas de Volumen y Flujo
- **Total de pedidos:** {total:,}
- **Pedidos en tránsito:** {shipping:,} ({shipping_pct}% del volumen activo)
- **Pedidos cancelados:** {canceled:,} ({canceled_pct}% del volumen total)

## 2. Métricas de Calidad de Servicio (SLA)
- **Nivel de servicio (Entregas a tiempo o adelantadas):** {sla_pct}%
- **Envíos adelantados:** {advance_pct}% de los pedidos entregados
- **Envíos tardíos globales:** {late_pct}% de los pedidos entregados

## 3. Métricas de Desviación y Riesgo
- **Retraso promedio global:** +{dev_days} días (Es la diferencia promedio entre días reales de envío y los días prometidos al cliente)
- **Riesgo de retraso (Predictivo histórico):** {risk_pct}% de las órdenes mostraron banderas de riesgo logístico en el sistema.

## 4. Desempeño por Modo de Envío
{mode_breakdown}

**Modo más problemático:** {worst_mode['mode']} es el canal con mayor porcentaje de fallos.
"""

with open('dashboard_results_for_ai.md', 'w', encoding='utf-8') as f:
    f.write(out)
