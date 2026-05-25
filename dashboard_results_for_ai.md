# Prompt Avanzado de Contexto Logístico para Análisis de IA (DataCo)

Actúa como un Consultor Senior en Inteligencia de Negocios y Logística (Supply Chain). A continuación, tienes un vaciado de datos de un Dashboard Ejecutivo alimentado por 180,519 transacciones.

Tu tarea es encontrar patrones, explicar los cuellos de botella y hacer recomendaciones estratégicas accionables.

## 0. Contexto del Dataset
- **Fuente:** DataCo Supply Chain Dataset (dataset público académico)
- **Período cubierto:** Enero 2015 – Enero 2018 (37 meses)
- **Alcance:** Operaciones globales de e-commerce y distribución
- **Universo total:** 180,519 transacciones de pedidos
- **Pedidos activos (excluye cancelados):** 172,765
- **Definición de SLA:** Se considera cumplida si la entrega es a tiempo (0 días de diferencia) o adelantada (negativa). Late = días reales > días prometidos.
- **Definición de Retraso Promedio:** Promedio de (días reales − días prometidos) sobre pedidos no cancelados y no en tránsito (WIP).

## 1. KPIs Globales
- **Total de pedidos:** 180,519
- **Pedidos cancelados:** 7,754 (4.3% del volumen total)
- **Pedidos activos:** 172,765
- **Pedidos en tránsito / WIP:** 39,989 (23.1% del activo)
- **Nivel de servicio (SLA - Entregas a tiempo + adelantadas):** 19.6%
  - Entregas **a tiempo (on-time):** 14,854 (8.6% del activo)
  - Entregas **adelantadas:** 18,945 (11.0% del activo)
- **Envíos tardíos:** 57.3% de los pedidos entregados (98,977 pedidos)
- **Pedidos con bandera de riesgo logístico (late_risk):** 98,977 (54.8% del total) — coincide exactamente con los tardíos, lo que confirma que el campo es un indicador de tardanza histórica.
- **Retraso promedio:** +0.77 días sobre la promesa al cliente (calculado sobre pedidos entregados, excluye WIP y cancelados).

## 2. Análisis por Modo de Envío (Causa Raíz de Retrasos)

| Modo de Envío | Volumen Total | Cancelados | WIP (En Tránsito) | % Tardíos | SLA (A tiempo+Adelantados) |
|---|---|---|---|---|---|
| Standard Class | 107,752 | 4,599 | 33,714 | 39.8% | 27.5% |
| Second Class | 35,216 | 1,410 | 3,656 | 79.8% | 9.4% |
| First Class | 27,814 | 1,301 | 0 | **100.0%** | **0.0%** |
| Same Day | 9,737 | 444 | 2,619 | 47.9% | 23.9% |

**Hallazgo crítico:** First Class tiene el 100% de sus pedidos entregados con retraso y 0% de SLA. Paradójicamente, es el modo más caro y el que peor desempeño tiene — evidencia de una promesa de servicio que el sistema operativo no puede cumplir estructuralmente. Second Class es el segundo peor canal con un 79.8% de tardíos.

## 3. Matriz de Distribución Geográfica del Riesgo (Heatmap Completo)
Esta matriz cruza las regiones con los modos de envío. Los porcentajes indican la proporción de envíos que sufrieron retrasos.

| Región | Estándar | Segunda Clase | Primera Clase | Mismo Día |
|---|---|---|---|---|
| Canada | 30.0% | 81.2% | 100.0% | 24.1% |
| Caribbean | 36.8% | 82.5% | 100.0% | 52.3% |
| Central Africa | 44.3% | 82.8% | 100.0% | 30.4% |
| Central America | 40.1% | 78.3% | 100.0% | 48.0% |
| Central Asia | 42.6% | 90.2% | 100.0% | 20.3% |
| East Africa | 41.6% | 79.0% | 100.0% | 43.2% |
| East of USA | 41.6% | 78.2% | 100.0% | 50.4% |
| Eastern Asia | 39.0% | 83.2% | 100.0% | 49.4% |
| Eastern Europe | 40.9% | 76.6% | 100.0% | 36.4% |
| North Africa | 38.0% | 81.9% | 100.0% | 58.4% |
| Northern Europe | 39.5% | 79.2% | 100.0% | 41.0% |
| Oceania | 40.5% | 79.5% | 100.0% | 43.0% |
| South America | 40.0% | 78.6% | 100.0% | 53.6% |
| South Asia | 39.7% | 79.8% | 100.0% | 51.2% |
| South of  USA  | 40.5% | 82.6% | 100.0% | 46.1% |
| Southeast Asia | 40.8% | 79.6% | 100.0% | 43.4% |
| Southern Africa | 39.5% | 73.4% | 100.0% | 66.7% |
| Southern Europe | 38.3% | 79.3% | 100.0% | 56.6% |
| US Center  | 39.5% | 77.8% | 100.0% | 39.3% |
| West Africa | 38.9% | 79.4% | 100.0% | 37.3% |
| West Asia | 39.4% | 79.6% | 100.0% | 46.0% |
| West of USA  | 39.2% | 80.2% | 100.0% | 49.9% |
| Western Europe | 40.2% | 81.4% | 100.0% | 50.2% |

## 4. Análisis Geográfico: Ranking de Retraso por Región
**Nota importante:** Ninguna región individual supera el umbral de +1 día de retraso promedio. El problema de retrasos es **sistémico y transversal** a toda la red global, no está concentrado en zonas aisladas.

**Ranking completo de regiones por retraso promedio (de mayor a menor):**
  - Central Asia: +0.87 días ⚠️ (zona de mayor retraso relativo)
  - Central Africa: +0.82 días
  - South Asia: +0.81 días
  - Western Europe: +0.81 días
  - South of USA: +0.81 días
  - US Center: +0.79 días
  - Eastern Asia: +0.79 días
  - West Asia: +0.78 días
  - East Africa: +0.78 días
  - Eastern Europe: +0.78 días
  - East of USA: +0.78 días
  - West of USA: +0.76 días
  - Southeast Asia: +0.76 días
  - South America: +0.76 días
  - North Africa: +0.76 días
  - Central America: +0.76 días
  - Oceania: +0.75 días
  - Caribbean: +0.75 días
  - West Africa: +0.75 días
  - Northern Europe: +0.75 días
  - Southern Europe: +0.70 días
  - Southern Africa: +0.65 días
  - Canada: +0.59 días ✅ (mejor desempeño relativo)

**Interpretación clave:** El rango de variación entre la peor región (Central Asia, +0.87d) y la mejor (Canada, +0.59d) es de solo 0.28 días. Esto confirma que el problema **no es geográfico sino estructural del modelo de promesas de entrega**.


## 5. Análisis de Complejidad de Producto (Diagnóstico de Brechas)
**Las 10 Peores Categorías (Mayor retraso frente a la promesa):**
  - Soccer: +1.00 días de retraso (Real: 4.87d vs Promesa: 3.87d)
  - Tennis & Racquet: +0.95 días de retraso (Real: 4.33d vs Promesa: 3.38d)
  - Boxing & MMA: +0.94 días de retraso (Real: 4.37d vs Promesa: 3.42d)
  - As Seen on  TV!: +0.94 días de retraso (Real: 4.53d vs Promesa: 3.59d)
  - Golf Bags & Carts: +0.92 días de retraso (Real: 3.87d vs Promesa: 2.94d)
  - Pet Supplies: +0.92 días de retraso (Real: 4.40d vs Promesa: 3.48d)
  - Women's Clothing: +0.89 días de retraso (Real: 4.84d vs Promesa: 3.95d)
  - Trade-In: +0.88 días de retraso (Real: 4.69d vs Promesa: 3.81d)
  - Lacrosse: +0.87 días de retraso (Real: 4.36d vs Promesa: 3.49d)
  - Fitness Accessories: +0.86 días de retraso (Real: 4.52d vs Promesa: 3.66d)

**Las 10 Categorías Más Eficientes:**
  - Men's Golf Clubs: 0.49 días (Real: 4.94d vs Promesa: 4.45d)
  - Computers: 0.63 días (Real: 4.98d vs Promesa: 4.35d)
  - CDs : 0.64 días (Real: 4.82d vs Promesa: 4.18d)
  - Baby : 0.65 días (Real: 4.61d vs Promesa: 3.96d)
  - Hockey: 0.65 días (Real: 4.48d vs Promesa: 3.83d)
  - Basketball: 0.66 días (Real: 4.89d vs Promesa: 4.23d)
  - DVDs: 0.72 días (Real: 4.94d vs Promesa: 4.22d)
  - Men's Clothing: 0.72 días (Real: 4.62d vs Promesa: 3.90d)
  - Health and Beauty: 0.72 días (Real: 4.67d vs Promesa: 3.95d)
  - Books : 0.73 días (Real: 4.62d vs Promesa: 3.90d)

## 6. Evolución Longitudinal (Tendencia de 37 Meses)
A continuación, el volumen total mensual frente a la cantidad de pedidos que llegaron tarde:
  - Ene '15: 5,322 pedidos | 2,880 tardíos (54.1%)
  - Feb '15: 4,729 pedidos | 2,594 tardíos (54.9%)
  - Mar '15: 5,362 pedidos | 2,936 tardíos (54.8%)
  - Abr '15: 5,126 pedidos | 2,760 tardíos (53.8%)
  - May '15: 5,357 pedidos | 2,951 tardíos (55.1%)
  - Jun '15: 5,134 pedidos | 2,778 tardíos (54.1%)
  - Jul '15: 5,299 pedidos | 2,939 tardíos (55.5%)
  - Ago '15: 5,273 pedidos | 2,936 tardíos (55.7%)
  - Sep '15: 5,140 pedidos | 2,914 tardíos (56.7%)
  - Oct '15: 5,302 pedidos | 2,906 tardíos (54.8%)
  - Nov '15: 5,235 pedidos | 2,841 tardíos (54.3%)
  - Dic '15: 5,371 pedidos | 2,937 tardíos (54.7%)
  - Ene '16: 5,317 pedidos | 2,955 tardíos (55.6%)
  - Feb '16: 4,894 pedidos | 2,650 tardíos (54.1%)
  - Mar '16: 5,210 pedidos | 2,905 tardíos (55.8%)
  - Abr '16: 5,097 pedidos | 2,815 tardíos (55.2%)
  - May '16: 5,302 pedidos | 2,951 tardíos (55.7%)
  - Jun '16: 5,054 pedidos | 2,873 tardíos (56.8%)
  - Jul '16: 5,305 pedidos | 2,755 tardíos (51.9%)
  - Ago '16: 5,334 pedidos | 2,948 tardíos (55.3%)
  - Sep '16: 5,160 pedidos | 2,837 tardíos (55.0%)
  - Oct '16: 5,398 pedidos | 2,957 tardíos (54.8%)
  - Nov '16: 5,210 pedidos | 2,846 tardíos (54.6%)
  - Dic '16: 5,269 pedidos | 2,954 tardíos (56.1%)
  - Ene '17: 5,217 pedidos | 2,797 tardíos (53.6%)
  - Feb '17: 4,906 pedidos | 2,682 tardíos (54.7%)
  - Mar '17: 5,347 pedidos | 2,955 tardíos (55.3%)
  - Abr '17: 5,212 pedidos | 2,803 tardíos (53.8%)
  - May '17: 5,317 pedidos | 2,843 tardíos (53.5%)
  - Jun '17: 4,951 pedidos | 2,649 tardíos (53.5%)
  - Jul '17: 5,318 pedidos | 2,913 tardíos (54.8%)
  - Ago '17: 5,305 pedidos | 2,994 tardíos (56.4%)
  - Sep '17: 5,189 pedidos | 2,814 tardíos (54.2%)
  - Oct '17: 2,255 pedidos | 1,210 tardíos (53.7%)
  - Nov '17: 2,055 pedidos | 1,132 tardíos (55.1%)
  - Dic '17: 2,124 pedidos | 1,172 tardíos (55.2%)
  - Ene '18: 2,123 pedidos | 1,195 tardíos (56.3%)
