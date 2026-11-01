# Preparación de buscadores, sin publicación

El 1 de noviembre de 2026 se comprobó por HTTP que `https://misa0426.github.io/cinevotv/` responde 200 y muestra el título CinevoTV. Es la URL pública observada, no un dominio nuevo. No se ha modificado esa versión ni se afirma que esté indexada en Google.

La rama de desarrollo prepara título, descripción, canonical, Open Graph y un objeto WebSite con los nombres VixunoTV, Vixuno y Vixuno TV. No se anuncian vídeos reproducibles, estrenos, valoraciones ni precios mediante datos estructurados sin evidencia. No se usan imágenes sociales que aún no existan en la URL pública.

`seo/public/sitemap.xml` contiene solo la URL pública comprobada: no inventa páginas de películas, fechas de actualización, fragmentos como #miLista ni rutas privadas. `seo/public/robots.txt` es una plantilla para la raíz del host público. GitHub Pages de proyecto publica bajo /cinevotv/: colocar allí robots.txt **no controla** el rastreo del host. Para tener efecto se debe disponer del robots.txt en la raíz de misa0426.github.io o usar un alojamiento futuro autorizado. No se ha cambiado ninguna configuración remota.

Localhost sirve robots.txt con Disallow: / y cabecera X-Robots-Tag: noindex, nofollow. Es deliberado: cuentas y métricas ficticias no deben indexarse. Una publicación autorizada debe usar la configuración pública, nunca copiar esas cabeceras locales; las rutas administrativas seguirán protegidas por autenticación, independientemente de robots.txt.

La aplicación local depende de /api y no se puede desplegar sin más copiando HTML a Pages. Antes de publicar se necesita un backend de producción aprobado y HTTPS; el simulador local no es ese backend. Revisar también rutas de recursos y el prefijo /cinevotv/. No se ha contratado alojamiento.

## Search Console, después de autorizar publicación

1. Acceder con la cuenta del propietario a https://search.google.com/search-console/ .
2. Añadir una propiedad de prefijo URL exactamente `https://misa0426.github.io/cinevotv/`. Una propiedad de dominio requeriría control DNS, que no se presume para github.io.
3. Elegir la verificación HTML ofrecida y guardar el archivo o meta exactos proporcionados por Google. No inventar tokens ni reutilizar credenciales. Su publicación requiere autorización del propietario.
4. Tras publicar la versión revisada, verificar que raíz, recursos y sitemap responden correctamente desde fuera, y que las páginas públicas no llevan noindex. No quitar protección al panel o a la API.
5. Enviar `https://misa0426.github.io/cinevotv/sitemap.xml` en Sitemaps cuando exista públicamente. Inspeccionar la URL raíz y solicitar indexación. Usar la prueba de URL publicada para revisar el HTML renderizado.
6. Consultar los informes de indexación. Solicitar indexación no garantiza inclusión, posiciones ni fechas. No se ha iniciado sesión ni enviado ninguna solicitud a Google.

Fuente: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap . La evaluación móvil automatizada de la rama no sustituye PageSpeed/Lighthouse en el despliegue público ni pruebas físicas.
