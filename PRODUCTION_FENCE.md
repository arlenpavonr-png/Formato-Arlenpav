# Production Fence — Formato-Arlenpav

Script: `scripts/check-production-fence.mjs`  
Uso: `node scripts/check-production-fence.mjs`  
Exit `0` = PASS · Exit `1` = FAIL  

Este Fence vive **en este repo** (producción). No se diseña ni se prueba dentro de ARPASuite-LAB; la lógica de capas A/B/C está inspirada en LAB.

## Archivos protegidos (Capa A)

- `index.html`
- `service-worker.js`
- `manifest.json`
- `arpa-licencias-apps-script.gs`
- `.github/workflows/pages.yml`
- `js/arpa-brand.js`
- `js/arpa-cloud-sync.js`
- `js/arpa-trial-capture.js`
- `js/arpa-cotizacion.js`

## Capas

| Capa | Qué detecta |
|------|-------------|
| A | Modificación o alta de archivo protegido |
| B | En líneas añadidas de archivos no protegidos: `LICENSE_API`, `COT_SHEETS_URL`, `/exec`, IDs de producción, keys, etc. |
| C | Si existe y se toca `js/arpa-ia/cotizador-config.js`: debe permanecer `mode: 'local'` y `endpoint: ''` (hoy el archivo no existe en Formato) |

## Prueba controlada (2026-09-06)

Rama: `merge-historia-lab` (aislada de `main`).  
Base: `e913d4e`.

| # | Simulación | Resultado | Exit |
|---|------------|-----------|------|
| 0 | Solo el script nuevo untracked | PASS | 0 |
| 1 | Comentario temporal en `index.html` (protegido) | FAIL Capa A — `archivo protegido modificado` | 1 |
| 2 | Comentario temporal en `js/arpa-views.js` (normal) | PASS (no bloquea) | 0 |
| 3 | Resta de simulaciones; tip limpio + script | PASS | 0 |

Tras las pruebas 1 y 2 se restauró el working tree con `git checkout -- <archivo>`. No quedó basura en archivos protegidos ni en `arpa-views.js`.

## Conclusión

- Detecta correctamente cambios a Capa A.
- No bloquea cambios inocuos a archivos no protegidos.
- Listo para usarse en la rama `merge-historia-lab` antes de cualquier promoción cuidadosa.

## No hacer

- No merge a `main` sin autorización humana.
- No push a `main` sin autorización humana.
- No desplegar producción desde este Fence.
