# Dos películas abiertas para VixunoTV

Cambios locales en la rama `codex/cinevotv-mejoras`; sin publicación, compras ni servicios contratados. Las fichas se definen en `index.html` y se integran en catálogo, búsqueda, categorías y Mi Lista mediante la lógica existente. Firebase Authentication y el adaptador de producción no se modifican. Se mantienen los ocho títulos de demostración.

## Fuentes verificadas el 1 de noviembre de 2026

### Big Buck Bunny (2008)

- Titular y atribución: © 2008 Blender Foundation / www.bigbuckbunny.org. Blender Foundation | www.blender.org.
- Proyecto y condiciones: https://peach.blender.org/about/
- Licencia del proyecto y del material del sitio: https://creativecommons.org/licenses/by/3.0/
- Galería oficial: https://peach.blender.org/media-gallery/
- Póster descargado, JPEG de 64 432 bytes: https://peach.blender.org/wp-content/uploads/poster_bunny_small.jpg
- Equipo/créditos: https://peach.blender.org/the-team/
- Distribución oficial: https://peach.blender.org/download/

La página oficial permite expresamente reutilización y distribución comercial con atribución. Para exhibir el filme completo exige conservar la secuencia final de créditos. Los listados oficiales consultados en `download.blender.org/peach/bigbuckbunny_movies/` y `download.blender.org/demo/movies/BBB/` ofrecen archivos ZIP: no se asignan como fuentes del reproductor HTML5. No se ha descargado ni incorporado ningún vídeo.

### Sprite Fright (2021)

- Atribución requerida: (CC) Blender Foundation | studio.blender.org.
- Proyecto: https://studio.blender.org/films/sprite-fright/
- Condiciones oficiales del proyecto: https://studio.blender.org/projects/sprite-fright/pages/about/
- Esa página indica Creative Commons Attribution 1.0 y permite distribución comercial con atribución: https://creativecommons.org/licenses/by/1.0/
- El recurso específico del póster indica CC BY 4.0; se registra por separado, sin atribuir esa versión a todo el proyecto: https://studio.blender.org/projects/api/assets/5448/?site_context=featured_artwork
- Licencia del póster: https://creativecommons.org/licenses/by/4.0/
- Póster oficial descargado, JPEG de 251 495 bytes: https://studio.blender.org/files/public/thumbnail/59/5927dc487d457a39f4439d0423675c7c/5927dc487d457a39f4439d0423675c7c.jpg
- Créditos completos: https://studio.blender.org/films/sprite-fright/pages/credits/

El enlace de reproducción de la página principal dirige a YouTube, no a un archivo directo verificado. No se extraen vídeos de YouTube ni se usan URLs firmadas temporales. La reproducción permanece pendiente. La ficha avisa del contenido de terror y violencia.

## Condiciones conservadas

Ambas fichas muestran título, año, sinopsis original redactada para VixunoTV, categoría, póster y botón de reproducción con estado pendiente. Las fichas incluyen atribución, fuente, licencia y acceso a créditos completos. Los pósteres oficiales se conservan completos, sin recortes ni modificaciones del archivo; se ajusta únicamente su tamaño en pantalla. No se usan logos del proyecto como identidad de VixunoTV ni se sugiere respaldo de Blender. Los logos y marcas tienen condiciones independientes de las licencias de los proyectos.

No se afirma haber probado la reproducción de estas películas. El botón explica que falta configurar una URL oficial reproducible y la API rechaza el intento de saltarse ese estado. Nunca se sustituye una película por el vídeo de flores. Antes de habilitar reproducción se debe verificar el archivo específico completo, sus créditos, licencia, formato y disponibilidad; no basta con que una dirección termine en .mp4. No hay vídeos grandes en el repositorio ni enlaces de reproducción sin comprobar.

Mi Lista conserva las condiciones actuales de acceso por plan. Las dos fichas pueden guardarse/quitarse con Premium o Familiar, siempre separadas por usuario; el visionado futuro de estas obras se marca como Gratis.

## Archivos cambiados

- `index.html`: fuente editorial JSON de las dos fichas.
- `app.js`: pósteres, metadatos, atribuciones, búsqueda/categorías y bloqueo explícito de reproducción pendiente.
- `styles.css`: imagen completa del póster y presentación de créditos.
- `i18n.mjs`: textos nuevos en inglés y español.
- `dev/server.mjs`: lectura de las fichas y rutas explícitas para los dos pósteres.
- `dev/simulation.mjs`: nuevas fichas autorizadas, favoritos y rechazo de reproducción pendiente; no asigna las variantes de flores.
- `assets/posters/big-buck-bunny.jpg`, `assets/posters/sprite-fright.jpg`: archivos oficiales pequeños.
- `tests/open-films.test.mjs`: seis pruebas de fichas, licencias registradas, favoritos privados, archivos y rutas.
- `tests/i18n-app-checks.js`: dos pruebas de interfaz para búsqueda/póster y atribución/favoritos/reproducción pendiente.
- `tests/checks.js`, `tests/local-checks.js`, `tests/run.ps1`, `tests/i18n-browser.mjs`, `tests/run-all.ps1`: ampliación del catálogo y actualización de pruebas que asumían ocho tarjetas o posiciones fijas.
- `PELICULAS-ABIERTAS.md`: fuentes, atribución y límites de esta entrega.

La evidencia de consultas y los informes de pruebas se guardan en `tests/.generated/`, excluido de Git. Las pruebas no verifican pagos ni Firebase de producción.

Resultado final: **174 comprobaciones aprobadas, sin fallos** (104 regresión, 12 idioma/aislamiento, 30 navegador, 22 precios/anualidades, 6 películas abiertas). Informe: `tests/.generated/run-all-open-films.txt`. Se ejecuta con `.\tests\run-all.ps1`. Las pruebas del navegador verifican póster visible, búsqueda, año, atribución, guardado/quita y que el botón pendiente no carga ningún vídeo sustituto. La comprobación HTTP compara los bytes de los JPEG con los originales locales.

Revisión: http://localhost:8086/#peliculas. Esta nueva instancia mantiene los datos ficticios en memoria separados de la anterior en 8085, que no se detuvo. Para volver a iniciarla: `.\Start-CinevoTV.ps1 -Port 8086`. Las credenciales temporales del panel de esta instancia están en `.local/admin-acceso.txt`; el archivo de acceso anterior se copió localmente antes de iniciar el nuevo servidor. No usar cuentas ni contraseñas reales.
