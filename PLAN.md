# Evolution Plan - Feb 2, 2026

## Objective
Enhance the Dashboard UI by adding a "Weekly Training Load" visualization using a CSS-only chart or a simple SVG, and integrate dynamic daily highlights based on the training plan.

## Proposed Changes
1. **Dynamic Training Schedule**: Update the "Plan de Entrenamiento Semanal" to automatically highlight the current day and show more relevant details.
2. **Visual Progress Chart**: Add a small SVG sparkline or bar chart to the "Carga Semanal" card to represent training volume over the last 7 days.
3. **Responsive Layout Refinement**: Improve spacing and readability for mobile viewing.
4. **Data Placeholder Sync**: Create a dummy `api/hevy.json` to verify the front-end fetching logic works.

## Technical Details
- **index.html**: Inject Tailwind-based dynamic class for "today" highlighting.
- **index.html**: Insert SVG component for training load.
- **server.js**: Ensure it serves the new `api/` data correctly.
- **Verification**: Run `node server.js` in background, test with `curl`.

## Deployment
- Git commit and push to `origin`.
- Status report via WhatsApp.
