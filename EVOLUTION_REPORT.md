# Reporte de Evolución: Triathlon Dashboard Hamburg 2026

## [2026-02-10] Evolución: Monitor de Estado de Equipamiento (Tech Stack)
Se ha implementado un panel de monitorización de hardware deportivo para centralizar el estado de los dispositivos críticos.

- **Panel de Equipamiento:** Añadida una nueva sección "Equipment Status" que lista los dispositivos clave (Wahoo, Garmin, Coros, Form).
- **Detección de Actividad:** El sistema analiza ahora el timestamp de la última actividad de Strava para marcar dispositivos como "Live / Sync" si han estado activos en las últimas 3 horas.
- **UI Contextual:** Implementados estados visuales diferenciados (tag-active vs tag-inactive) con efectos de resplandor sutiles para identificar rápidamente qué hardware está sincronizando datos.
- **Optimización de Layout:** Se ha reestructurado la sección inferior en una cuadrícula de 3 columnas para equilibrar la densidad de información entre Hardware, Strava y Hevy.

---
## [2026-02-09] Evolución: Integración de Nutrición (Fueling)
Se ha implementado una nueva métrica crítica para el rendimiento en triatlón: el seguimiento nutricional diario.

- **Panel de Fueling:** Añadida una nueva tarjeta en la cuadrícula principal que muestra el consumo energético diario (kcal).
- **Desglose de Macronutrientes:** Implementada una barra de visualización proporcional para Carbohidratos (Azul), Proteínas (Rosa) y Grasas (Amarillo).
- **Consumo Real:** El dashboard ahora consume dinámicamente los datos de `load_stats.json` (provenientes de Cronometer) para mostrar los gramos exactos de cada macro.
- **UI Adaptativa:** La cuadrícula principal se ha expandido a 5 columnas en desktop para integrar esta nueva dimensión de datos sin sacrificar la legibilidad.

---
## Evoluciones Previas
