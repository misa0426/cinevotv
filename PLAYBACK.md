# Reproducción de VixunoTV

La selección usaba `card.textContent`, que incluye el texto del botón de favoritos. Por ejemplo, `Movie 1❤️ Guardar` no coincide con la clave `Movie 1`; la URL quedaba vacía. Ahora la tarjeta conserva el título en `data-title`, independiente del botón y su estado. La búsqueda usa ese mismo título.

Play abre el reproductor con controles y muestra fallos de red/formato o bloqueo del navegador. Cerrar pausa y descarga la fuente; las respuestas pendientes de reproducción se ignoran al cambiar/cerrar el título. Se puede abrir con Enter/Espacio y cerrar con Escape, con retorno y contención del foco. Las funciones de autenticación de Firebase no se modificaron; ambos botones de favoritos conservan su guardado y `stopPropagation`.

## Verificación

Ejecutar `node tests/playback.cjs` (solo requiere Node.js). Comprueba las ocho selecciones de películas/series, fuente, Play, cierre, foco, fallos de reproducción y ausencia de fuente mediante dobles de DOM/media. También comprueba que los handlers de favoritos conserven el título y stopPropagation. Los cuatro scripts clásicos pasan análisis sintáctico.

No se pudo ejecutar Chromium: no estaba instalado y la descarga devolvió un archivo inválido. No se verificaron reproducción audiovisual real, disponibilidad del servidor de video, persistencia real en Firestore ni inicio de sesión con una cuenta. Antes de integrar/publicar: abrir cada tarjeta en navegador, Play, controles, cerrar/reabrir, guardar favorito con sesión activa, cerrar sesión e iniciar de nuevo; revisar consola y Network.

## Componentes faltantes y dependencias

- El repositorio original solo contiene index.html, README.md y .nojekyll. No incluye las películas/series del trabajo local, archivos audiovisuales, catálogo real, temporadas ni episodios. Todos los títulos son placeholders y apuntan al mismo clip de flores de demostración CC0 de MDN, ahora indicado en pantalla. No se presentan como películas completas.
- Para títulos reales faltan URLs de medios autorizados y un catálogo con metadatos y episodios individuales. No sustituirlos por fuentes sin permiso. Cada episodio necesita su propia fuente y selección; el prototipo actual solo demuestra tarjetas de series.
- Firebase depende de imports externos de firebase-app, firebase-auth y firebase-firestore versión 13.0.0 en gstatic. No se confirmó su disponibilidad en este entorno. No se incluyen reglas de Firestore, configuración de despliegue ni pruebas de autorización del servidor. Comprobar que cada usuario solo pueda leer/escribir su propio documento usuarios/{uid} y que el dominio esté autorizado para Auth.
- La reproducción depende de disponibilidad, formato compatible y política CORS del servidor autorizado; no se añadió soporte HLS/DASH ni DRM. El cliente estático no aplica por sí solo derechos por país, suscripciones ni límites simultáneos.
- No hay package.json, dependencias npm de aplicación ni pipeline de pruebas. La corrección conserva la página estática sin nuevas dependencias de producción.
