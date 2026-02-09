# Reporte de Evolución: Triathlon Dashboard Hamburg 2026

## [2026-02-09] Evolución: Integración de Nutrición (Fueling)
Se ha implementado una nueva métrica crítica para el rendimiento en triatlón: el seguimiento nutricional diario.

- **Panel de Fueling:** Añadida una nueva tarjeta en la cuadrícula principal que muestra el consumo energético diario (kcal).
- **Desglose de Macronutrientes:** Implementada una barra de visualización proporcional para Carbohidratos (Azul), Proteínas (Rosa) y Grasas (Amarillo).
- **Consumo Real:** El dashboard ahora consume dinámicamente los datos de `load_stats.json` (provenientes de Cronometer) para mostrar los gramos exactos de cada macro.
- **UI Adaptativa:** La cuadrícula principal se ha expandido a 5 columnas en desktop para integrar esta nueva dimensión de datos sin sacrificar la legibilidad.

---
## Evoluciones Previas
