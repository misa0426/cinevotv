# VixunoTV: reproducción real y preparación SEO/TV

## Resultado principal

**Big Buck Bunny (2008) se reproduce completa desde el servidor local**, usando exclusivamente su archivo por ID, nunca el vídeo de flores. Revisión: http://localhost:8089/#peliculas . Se conserva la identidad VixunoTV y los controles nativos de vídeo, incluida pausa voluntaria. Sprite Fright sigue pendiente: no se descargó su archivo ni se declara reproducible. No se oculta ese pendiente ni se inventa una autorización.

Rama: codex/cinevotv-mejoras. Main se conserva en 20401cff7fdcd42fe45ce48e0225fe87155f31ce. Se revisaron ramas locales/remotas y la PR #2, aún abierta en borrador: https://github.com/misa0426/cinevotv/pull/2 . Esa PR corrige el título contaminado por botones, pero conserva flores para todos los títulos. Esta rama ya usa objetos/IDs y ahora añade asignación de archivos por título. No se fusionó ni se duplicó la corrección antigua.

## Evidencia de Big Buck Bunny

- Fuente oficial del proyecto: https://peach.blender.org/download/ y https://peach.blender.org/about/ . Se volvieron a consultar las condiciones, incluida distribución comercial con atribución y conservación del rollo de créditos.
- Copia oficial de Blender Video: https://video.blender.org/object-storage/web_videos/bf1f3fb5-b119-4f9f-9930-8e20e892b898-360.mp4 . Metadatos: https://video.blender.org/api/v1/videos/bf1f3fb5-b119-4f9f-9930-8e20e892b898 . No se tomó un archivo de un agregador ni se extrajo de YouTube.
- Descarga expresamente autorizada por el propietario: 65.868.249 bytes. Archivo solo en .local/media, excluido de Git. SHA-256: 1baf06cb883b9d3a0ace0bf027fe74c968a73769b7a2e0c324aea80d42f3ca7c.
- Licencia CC BY 3.0. Titular y atribución: © 2008 Blender Foundation / www.bigbuckbunny.org; Blender Foundation | www.blender.org. Póster original ya verificado en PELICULAS-ABIERTAS.md. No se incorporaron logos como marca de VixunoTV; se conserva íntegra la obra, incluidos sus créditos originales.
- Duración real decodificada: **596,566 segundos (9:56)**. Resolución 640×360. No se anuncia una calidad 1080p inexistente.
- Reproducción desde 0 hasta ended a velocidad normal: **597,507 segundos de reloj real**, **14.684 fotogramas**, sin saltos inesperados detectados (mayor intervalo de observación: 1,027 s). Contador de audio decodificado: **29.369.492 bytes**.
- Se probaron pausa, reanudación, avance a 120 s y retroceso a 10 s; después se inició la prueba continua desde cero. Se capturaron fotogramas de 545, 565, 580 y 590 s; se inspeccionaron visualmente los créditos y el epílogo. El archivo no se editó ni se truncó.
- La salida de altavoces estuvo silenciada durante automatización. Esto acredita decodificación de la pista de audio, **no una comprobación auditiva humana en altavoces o televisor**.

Se sirve la copia local mediante streaming por rangos desde disco, sin cargar el vídeo completo en memoria por cada petición. No se depende del ancho de banda del alojamiento de Blender para reproducir en esta revisión. No se da por autorizado alojar una plataforma pública sobre sus servidores. No se contrató CDN ni alojamiento.

## Estado por fases

1. **Inspección y reproductor:** IDs estables conservados y expuestos en data-content-id; asignación de variantes por obra; se elimina cualquier fallback a flores para títulos reales. Pausa mantiene la autorización/URL, libera el cupo simultáneo y reanudar vuelve a validarlo. Los controles no se eliminan. Los errores siguen visibles.
2. **Big Buck Bunny:** reproducción local completa verificada. Pantalla completa probada en navegador automatizado con gesto CDP; falta verificación física con sonido audible y dispositivos reales.
3. **Catálogo legal:** research/catalog-verification.json clasifica 1 APROBADO, 29 PENDIENTES y una exclusión adicional NO AUTORIZADO (¡Copiad, malditos!, por NC). Las A del informe anterior eran permisos localizados, no aprobaciones de explotación completas. No se activaron las otras obras ni ninguna serie. En el servidor de revisión se ocultan las ocho demostraciones; se conservan aisladas para regresión. No se borraron favoritos ni fichas existentes.
4. **Identidad:** nombre público local VixunoTV; identificadores Firebase, rutas, colecciones y claves internas conservados. El sitio público anterior no se ha renombrado ni modificado.
5. **Portada y catálogo:** diseño negro/morado conservado, CTA de película destacada, pósteres autorizados y estado pendiente explícito. La sección Series indica que está en revisión; no se simula una temporada disponible.
6. **Google:** metadatos y sitemap preparados para la URL pública observada, sin publicar ni solicitar indexación. Ver SEO-Y-PUBLICACION.md. La versión local lleva noindex y robots Disallow. La versión pública aún responde como CinevoTV; no se afirma que esté indexada.
7. **Android TV/Google TV:** proyecto fuente android-tv y navegación espacial de prueba /?tv=1. Es un contenedor WebView con fullscreen nativo, no un reproductor nativo Media3 terminado. No se ha compilado ni generado APK: faltan SDK/JDK/Gradle/adb. No se descargaron herramientas grandes sin autorización. Ver ANDROID-TV-Y-OTRAS-TV.md.
8. **Firebase:** adaptador y bloqueo de producción conservados. Registro, login, logout y aislamiento local se verifican por regresión; **Firebase/Firestore reales no se probaron ni modificaron**. No se cambiaron reglas ni datos reales. El simulador conserva datos solo durante la vida del proceso.
9. **Planes:** permanecen los planes y precios existentes, incluido Premium 6.99 CAD mensual. No se eliminó Familiar ni la configuración internacional/anual. Sin pasarela, cobros ni publicidad real.
10. **Pruebas y revisión:** ver resultados y límites abajo. Ninguna prueba geométrica o sintética demuestra funcionamiento en un mando físico.

## Pruebas ejecutadas

- Regresión previa completa: **174 comprobaciones aprobadas**. Registro tests/.generated/run-all-player-final.txt. Incluye pruebas simuladas y otras HTTP/decodificación reales locales; no son 174 pruebas de producción.
- tests/player-stabilization.test.mjs: **8 aprobadas**. Modelo de asignación por ID, pausa/URL, cupos de reanudación, rechazo de calidades ajenas, catálogo público, geometría TV e inspecciones estáticas SEO/Android. La variante BBB de esas pruebas de modelo es un fixture, no evidencia audiovisual.
- tests/bbb-app.mjs: **3 aprobadas** sobre la interfaz con el archivo real: identidad de título tras cambiar texto de favoritos; reproducción/pausa/reanudación/seek con misma URL y audio decodificado; navegación TV mediante eventos sintéticos. Fullscreen del navegador: **aprobado** mediante gesto CDP.
- tests/bbb-full.mjs: **ensayo completo real aprobado** desde inicio a fin, descrito arriba. Evidencia JSON y fotogramas en tests/.generated; la aprobación vinculada al hash está en .local/media/big-buck-bunny-verified.json.
- El primer intento con reloj virtual terminó sin evidencia y se descartó. Un ensayo HTTP restringido recibió EACCES por el sandbox y se repitió con acceso local autorizado. No se cuentan esos intentos como aprobados.
- Pendientes: escucha humana, teléfonos físicos, televisores/mando, emulador Android, compilación APK, integración Firebase de pruebas real, backend/almacenamiento de producción y rendimiento del despliegue público.

## Cómo probar esta computadora

1. Abrir http://localhost:8089/ y seleccionar Big Buck Bunny o la película destacada. Pulsar Reproducir: deben verse la película y su duración; el audio del navegador no se fuerza a silencio en la aplicación normal.
2. Pausar, esperar y continuar. Avanzar/retroceder con los controles. Probar pantalla completa. La prueba automática silencia su propio elemento de vídeo, no la configuración normal de la plataforma.
3. Buscar Bunny y filtrar Animación. Abrir Sprite Fright y comprobar su estado pendiente: no debe cargar flores ni anunciarse como aprobada.
4. Registrar una cuenta **ficticia**, elegir Premium simulado, guardar/quitar Big Buck Bunny en Mi Lista. Recargar para comprobar la sesión local; cerrar sesión y entrar con otra cuenta ficticia para comprobar separación. No usar contraseñas reales. No se afirma aquí una prueba de Firebase de producción.
5. Para foco de TV en navegador, abrir http://localhost:8089/?tv=1 y usar flechas/Enter/Escape. Esto no instala una aplicación en un televisor.
6. Para reiniciar, ejecutar .\Start-CinevoTV.ps1 -Port 8089. Las instancias anteriores no se detuvieron para conservar sus datos en memoria. La contraseña del admin ficticio está solo en .local/admin-acceso.txt y se guardó una copia del acceso anterior.

## Reproducibilidad y autorizaciones

La película y las pruebas completas **no se descargan automáticamente al clonar ni al ejecutar la suite base**. En otra computadora se requiere autorización para la copia de aproximadamente 66 MB. Después: `node dev/prepare-bbb.mjs --download-authorized`; `node tests/bbb-full.mjs`; revisar los fotogramas de créditos; solo entonces `node dev/prepare-bbb.mjs --record-approval --credits-reviewed`. El registro falla cerrado si el hash no coincide o falta evidencia. El script no sobrescribe una copia existente.

Ejecutar .\tests\run-all.ps1 para la regresión base; `node --test tests/player-stabilization.test.mjs` para las ocho nuevas; `node tests/bbb-app.mjs` únicamente después de aprobar la copia local. El ensayo completo tarda aproximadamente diez minutos y no sustituye la comprobación auditiva física.

Coste de servicios contratados en esta entrega: **0 CAD**. No se usan tarjetas, anuncios reales ni servicios facturables. El presupuesto previsto de 5.000 CAD no se ha gastado. La copia 360p implica aproximadamente 66 GB por cada mil reproducciones completas si se alojara remotamente; no incluye repeticiones, otras calidades ni sobrecarga. Un futuro alojamiento debe presupuestarse según tráfico y región, con tarifas verificadas antes de aprobación. Tener una licencia audiovisual abierta no implica ancho de banda gratuito ni capacidad ilimitada del servidor fuente.

Requieren autorización adicional: nuevas descargas grandes, SDK/emuladores, contratación de hosting/CDN, nuevas licencias, producción Firebase, publicación de la web, app stores y pagos. La preparación de una PR en borrador no autoriza su fusión ni despliegue.

## Archivos de esta fase

- app.js, index.html, styles.css, i18n.mjs: reproductor, estados, metadatos, foco/portada y traducciones.
- dev/approved-media.mjs, dev/prepare-bbb.mjs: registro por hash/evidencia y preparación local autorizada.
- dev/server.mjs, dev/simulation.mjs: streaming por rangos, variantes por contenido, pausa/cupos, catálogo público y noindex local.
- tv-navigation.mjs y android-tv/: navegación y proyecto de prueba para TV.
- seo/, SEO-Y-PUBLICACION.md, ANDROID-TV-Y-OTRAS-TV.md: preparación y límites de publicación/TV.
- tests/bbb-full.mjs, tests/bbb-app.mjs, tests/player-stabilization.test.mjs; fixtures anteriores aislados de la copia local para mantener reproducibilidad.
- research/catalog-verification.json: clasificación actual con evidencia resumida.
- .gitignore y esta guía. Los informes y archivos de etapas anteriores permanecen; esta guía describe el estado más reciente y sustituye sus instrucciones de reproducción pendientes para Big Buck Bunny.
