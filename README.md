# VixunoTV

**Entrega vigente de reproducción:** [Big Buck Bunny completa, pruebas y estado por fases](./FASES-REPRODUCTOR-ENTREGA.md). Revisión local: http://localhost:8089/ · TV de prueba: http://localhost:8089/?tv=1. Big Buck Bunny: archivo oficial íntegro verificado en esta computadora; Sprite Fright y el resto del catálogo siguen pendientes. El vídeo local no se incluye en Git. Las secciones siguientes son entregas históricas.

**Catálogo abierto:** [Big Buck Bunny y Sprite Fright: fuentes, licencias y cambios](./PELICULAS-ABIERTAS.md). Revisión local: http://localhost:8086/#peliculas. 174 comprobaciones aprobadas. Ambas fichas son Gratis y su reproducción está pendiente de configurar una URL oficial verificada; no se han incorporado vídeos al repositorio.

**Entrega vigente:** [identidad VixunoTV, precios y suscripciones mensuales/anuales](./VIXUNOTV-ENTREGA.md). Vista local: http://localhost:8085/ · Panel privado: http://localhost:8085/admin. Marca provisional pendiente de comprobación legal. 166 comprobaciones aprobadas; únicamente desarrollo y datos ficticios. Los apartados siguientes describen versiones históricas; sus precios y direcciones no sustituyen la entrega vigente.

**Versión actual multilingüe:** [guía de idiomas](./MULTILINGUE.md). Plataforma: http://localhost:8084/ · Panel: http://localhost:8084/admin. Selector English / Español en la cabecera. Suite completa: .\tests\run-all.ps1 (135 comprobaciones). Las direcciones de versiones anteriores se conservan como historial.

**Versión actual:** [actualización general de planes, dispositivos, calidad y países](./ACTUALIZACION-GENERAL.md). Vista local: http://localhost:8083/ · Panel: http://localhost:8083/admin. Suite completa: .\tests\run-all.ps1. Los apartados de etapas anteriores se conservan como historial del desarrollo.

La versión local actual es la **Etapa 3**: [guía de administración y pruebas](./ETAPA-3.md). Ejecuta .\Start-CinevoTV.ps1 -Port 8082. Plataforma: http://localhost:8082/ · Panel: http://localhost:8082/admin. El servidor local usa sesiones y datos ficticios en memoria; no conecta con producción.

Plataforma de streaming de películas y series. Prototipo estático con Firebase Authentication y Firestore.

Para abrir la versión local aislada y seguir las comprobaciones, consulta [PRUEBAS-LOCALES.md](./PRUEBAS-LOCALES.md). Ejecuta .\Start-CinevoTV.ps1 y abre http://localhost:8080/. Este servidor sustituye Firebase por un simulador y nunca sirve la configuración de producción.

## Etapa 2: perfil, Mi Lista, planes y diseño

La Etapa 2 está implementada en la rama de desarrollo. Consulta [ETAPA-2.md](./ETAPA-2.md) para ver cambios, pruebas y limitaciones. La vista de esta entrega usa http://localhost:8082/ con el simulador. styles.css contiene el diseño adaptable.

## Base conservada de la Etapa 1

Se mantiene el catálogo de demostración y sus funciones; el diseño se renovó en la Etapa 2. index.html contiene la presentación y un formulario único por operación; app.js gestiona catálogo, reproducción, búsqueda y sesión; firebase.js integra el mismo proyecto Firebase y la misma versión del SDK.

La aplicación debe servirse por HTTP/HTTPS desde la raíz del proyecto. Abrir index.html directamente con file:// puede bloquear los módulos JavaScript. No se ha publicado esta versión.

## Datos y compatibilidad

Los favoritos mantienen la ruta usuarios/{uid} y el campo favoritos con títulos, sin migración de datos. Se escuchan exclusivamente los favoritos del usuario activo y se descartan respuestas de sesiones anteriores. Los guardados usan transacciones con merge: true para conservar otros campos y evitar perder cambios simultáneos. Las listas con formato inesperado se muestran como error y no se sobrescriben.

La antigua clave compartida cinevoFavoritos de localStorage ya no se utiliza ni se importa porque no identifica a su propietario. Se conserva intacta; los favoritos que ya estaban en Firestore siguen siendo la fuente de verdad. No se modificaron reglas de seguridad ni datos reales durante el desarrollo.

La configuración pública de Firebase en el cliente no sustituye las reglas de autorización del servidor. Queda pendiente verificar las reglas desplegadas y el aislamiento de cuentas con un entorno de pruebas autorizado.

## Pruebas locales

En PowerShell, desde la raíz del repositorio, ejecutar:

    .\tests\run.ps1

El ejecutor utiliza Microsoft Edge en modo headless y bloquea la resolución de nombres de red. Se puede indicar otra instalación compatible con -BrowserPath. No instala dependencias ni inicia servicios de pago.

Las pruebas generan una copia temporal del HTML real y ejecutan el código de aplicación real sustituyendo únicamente la carga del adaptador Firebase por un simulador. También prueban el adaptador real con funciones del SDK simuladas. Los resultados y el perfil temporal de Edge se guardan en tests/.generated/, excluido de Git.

Cobertura: los ocho títulos, selección de video, controles y errores de reproducción, búsqueda y filtros combinados, validación de formularios, doble envío, errores de autenticación, cambio de cuenta, cierre de sesión, respuestas tardías, fallos de lectura/escritura, duplicados, datos malformados y preservación de campos ajenos a favoritos. También se comprueba que el catálogo y la búsqueda funcionen si falla la carga de Firebase.

Limitaciones: la suite aislada no certifica el servicio real de Authentication, las reglas desplegadas, la contención real de transacciones entre dispositivos ni la compatibilidad en celulares o televisores. No crean cuentas reales ni leen o escriben datos de usuarios. La prueba separada tests/verify-video.ps1 confirmó descarga y reproducción del MP4 existente en Edge. La comprobación HTTP de la URL pública de firebase-app.js devolvió 200 durante esta revisión.

## Revisión manual pendiente

Con un entorno de pruebas autorizado, verificar registro e inicio de sesión, guardar favoritos con dos cuentas de prueba y dos pestañas, cerrar y reabrir la sesión, confirmar rechazo de accesos a otro UID y comprobar reproducción real en los navegadores objetivo. No ejecutar estas comprobaciones con cuentas o datos reales sin autorización.

El catálogo sigue siendo de demostración: todos los títulos apuntan al video de flores que ya existía. No se han añadido películas ni series comerciales. Antes de incorporar contenido real se deberá verificar y documentar la autorización de reproducción.

Se implementaron las funciones descritas en ETAPA-2.md. Los planes son una simulación temporal: no hay anuncios, suscripciones activas ni pagos reales.
