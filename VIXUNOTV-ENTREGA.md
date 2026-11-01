# VixunoTV: entrega local

Marca provisional pendiente de comprobación legal. Se continúa el proyecto existente en `codex/cinevotv-mejoras`. No se publica, fusiona ni envía al remoto. Firebase de producción, reglas y datos reales permanecen fuera de esta entrega.

## Revisión

Abre http://localhost:8085/ y entra en Planes. Cambia país, idioma y modalidad Mensual/Anual. El cambio de precio es inmediato y no contrata nada. Crea una cuenta ficticia y selecciona un plan para probar perfil, Mi Lista y reproducción. No uses contraseñas reales.

Panel: http://localhost:8085/admin. Cuenta autorizada de prueba: `admin@cinevo.test`. La contraseña temporal está únicamente en `.local/admin-acceso.txt`, excluido de Git y bloqueado por HTTP. No compartir ese archivo. Se conserva una copia local del acceso de la instancia anterior.

Si se apaga el servidor: ` .\Start-CinevoTV.ps1 -Port 8085 -AdminEmail admin@cinevo.test `. Los datos del simulador viven en memoria y se reinician al detenerlo. Las instancias anteriores no se han detenido ni se han migrado sus datos de memoria.

## Identidad y precios

Nombre visible VixunoTV, símbolo SVG original provisional, fondo #09090F, paneles #171225 y detalles morados #8B5CF6, #6D28D9 y #A78BFA. Texto blanco y secundario #B8B4C7. Diseño adaptable y preferencias de movimiento reducido conservadas.

Configuración única de precios: `dev/policies.mjs`. Importes sin conversión de divisas:

| País | Moneda | Premium mensual | Familiar mensual | Premium anual | Familiar anual |
| --- | --- | --- | --- | --- | --- |
| Canadá | CAD | 6.99 | 9.99 | 69.90 | 99.90 |
| Estados Unidos | USD | 5.99 | 8.99 | 59.90 | 89.90 |
| México | USD | 5.99 | 8.99 | 59.90 | 89.90 |
| España | EUR | 4.99 | 7.99 | 49.90 | 79.90 |
| Irlanda | EUR | 4.99 | 7.99 | 49.90 | 79.90 |

Gratis: 0.00 al mes en la moneda correspondiente, sin versión anual. Cada anualidad cubre 12 meses mediante un único pago simulado equivalente a 10 mensualidades; ahorro aproximado 16.67 %. Se muestra el importe completo, ahorro y aviso de pago por adelantado, sin cobros automáticos reales.

El idioma es independiente del país de precios. Canadá, Estados Unidos e Irlanda: inglés; España y México: español. Se conserva la preferencia manual. La detección aproximada usa navegador/zona horaria, sin geolocalización externa. El selector comercial nunca cambia la región de licencias validada por el servidor; esta demostración mantiene CA como región de reproducción.

## Planes y administración

La contradicción con la versión anterior de Premium quedó documentada antes del cambio en `DECISIONES-VIXUNOTV.md`: ahora Premium y Familiar permiten hasta dos reproducciones simultáneas, validadas por el servidor local. Familiar mantiene tres dispositivos registrados y gestión/revocación. No se inventa un máximo de dispositivos registrados para Premium.

Se mantienen catálogo, búsqueda, registro, sesión, perfil, favoritos privados, historial y reproductor. Gratis conserva sus restricciones existentes y espacios de publicidad; no hay integración publicitaria ni ingresos publicitarios reales.

El panel privado muestra país, idioma, moneda, plan, modalidad, importe, inicio, renovación simulada y estado. Los ingresos simulados se agrupan por CAD, USD y EUR; nunca se suman monedas distintas. Cambiar un contrato simulado cancela el registro anterior y crea otro, sin prorrateos ni reembolsos inventados. La renovación manual conserva el período anual o mensual.

## Verificación

Suite ejecutada: `.\tests\run-all.ps1`.

**166 comprobaciones aprobadas, sin fallos:** 104 de regresión, 12 de idioma/aislamiento, 28 de navegador multilingüe e identidad y 22 de precios/anualidades.

Registro completo: `tests/.generated/run-all-vixuno-latest.txt`. Capturas: `tests/.generated/i18n-app.png`, `i18n-frame.png` e `i18n-admin.png`.

Las pruebas incluyen autenticación local, aislamiento de favoritos y permisos, idiomas y persistencia de preferencia, precios de los cinco países, anualidades, fechas límite/año bisiesto, límites de reproducción, rutas protegidas, administración y adaptación a 1440/390 px. Los ensayos de interfaz multilingüe sustituyen las llamadas multimedia; las pruebas separadas de medios sí decodifican los archivos locales 360p y 540p mediante la ruta protegida. Se rechaza 1080p inexistente. No se da por verificada una integración de producción.

## Qué funciona y qué es simulado

Funcionan realmente en localhost el servidor HTTP, sesiones con cookies, permisos de administrador, validación de precios, cuotas de reproducción, archivos de vídeo autorizados de demostración, búsqueda, formularios, favoritos/historial privados, diseño y traducción. Los identificadores internos, claves de preferencias y rutas compatibles se conservan.

Son ficticios los clientes iniciales, suscripciones, pagos, ingresos, fechas de renovación y los contratos de demostración. No hay Stripe, tarjetas, bancos ni pagos. No se añade contenido audiovisual nuevo ni se alteran licencias.

Pendiente: comprobación legal de marca, almacenamiento persistente y despliegue autorizado, integración de autenticación de producción sin tocarla durante estas pruebas, verificación territorial fiable y del país de facturación, condiciones de renovación y pagos, activos 1080p con derechos, y pruebas en teléfonos/televisores físicos. No hay DRM. La adaptación móvil se ha probado en navegador a 390 px, no en todos los dispositivos reales. Las condiciones de impuestos, cobros, cancelaciones comerciales y prorrateos requieren definición antes de producción.

## Archivos de esta actualización

- Interfaz: `index.html`, `styles.css`, `app.js`, `brand-mark.svg`.
- Administración: `admin.html`, `admin.css`, `admin.js`.
- Traducción: `i18n.mjs`.
- Servidor y simulador: `dev/policies.mjs`, `dev/simulation.mjs`, `dev/server.mjs`, `dev/firebase-local.js`.
- Inicio local: `Start-CinevoTV.ps1` (nombre conservado por compatibilidad).
- Pruebas nuevas: `tests/vixuno.test.mjs`.
- Pruebas/fixtures actualizados: `tests/policies.test.mjs`, `tests/stage3-app-checks.js`, `tests/i18n-app-checks.js`, `tests/i18n-admin-checks.js`, `tests/i18n-browser.mjs`, `tests/run-all.ps1`, `tests/run.ps1`, `tests/visual.ps1`.
- Archivos de pruebas revisados al actualizar expectativas de marca: `tests/stage3.test.mjs`, `tests/stage3-browser-common.js`, `tests/stage3-admin-checks.js`, `tests/stage2-checks.js`, `tests/setup.js`, `tests/media-policies.mjs`, `tests/media-policies-checks.js`, `tests/local-checks.js`, `tests/i18n.test.mjs`, `tests/checks.js`, `tests/capture-admin.mjs`, `tests/browser-stage3.mjs`, `tests/adapter-checks.js`.
- Documentación: `DECISIONES-VIXUNOTV.md`, `VIXUNOTV-ENTREGA.md`, `README.md`.

El árbol de trabajo ya contenía archivos sin seguimiento de etapas anteriores. Se conservan; no debe confundirse ese estado con una eliminación o con una modificación del adaptador Firebase de producción.
