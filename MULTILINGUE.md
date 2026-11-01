# Soporte multilingüe de CinevoTV

Implementación local en la rama codex/cinevotv-mejoras. Conserva las etapas anteriores y las políticas de planes, dispositivos, calidad y territorios. No usa servicios externos de traducción o geolocalización.

## Abrir y probar

- Plataforma: http://localhost:8084/
- Panel: http://localhost:8084/admin
- Cuenta administradora ficticia: admin@cinevo.test. Contraseña temporal en .local/admin-acceso.txt.
- Se conservó el acceso anterior en .local/admin-acceso-antes-idiomas-*.txt. La instancia anterior no se detuvo.

    .\Start-CinevoTV.ps1 -Port 8084

El selector English / Español está visible en la cabecera de la plataforma y del panel, también en la vista móvil. Cambiarlo no recarga la página ni borra los valores que se están escribiendo.

## Selección automática

| País aproximado | Idioma inicial | Moneda de consulta |
|---|---|---|
| Canadá | Inglés | CAD |
| Estados Unidos | Inglés | USD |
| España | Español | EUR |
| México | Español | USD |
| Irlanda | Inglés | EUR |

Prioridad: elección manual guardada, idioma del país aproximado y, si no se identifica un país admitido, primer idioma compatible del navegador. Si tampoco hay inglés o español entre sus preferencias, se usa inglés como alternativa.

La estimación se realiza localmente usando una zona horaria reconocible y, como alternativa, la región de las etiquetas de idioma del navegador. Es una aproximación y puede equivocarse; no comprueba la ubicación física. No se solicita GPS, no se accede a una API de IP y no se envían la zona horaria o las preferencias de idioma a terceros.

El aviso País aproximado explica esta limitación. La ubicación estimada se calcula al abrir la página; una elección manual continúa teniendo prioridad en las siguientes visitas aunque cambien esas señales.

## Preferencia

La selección se guarda como en o es en la clave cinevo.language de localStorage, por navegador y origen del sitio. Se comparte entre la plataforma y el panel del mismo origen y se respeta al recargar. No se sincroniza mediante Firebase ni entre navegadores o dispositivos. Cambiar de puerto de prueba representa otro origen y, por tanto, otra preferencia.

Si el navegador impide guardar almacenamiento local, el cambio funciona en la página actual, pero no puede garantizarse su persistencia al recargar. Los valores ajenos a en/es se ignoran. No se borran otras claves de almacenamiento.

## Qué se traduce

El catálogo central i18n.mjs contiene las traducciones de navegación, portada, controles, formularios, validación, planes, perfil, mensajes dinámicos, límites de dispositivos y reproducción, categorías, panel, filtros y estados. Los mensajes conocidos que devuelve la API se traducen en la interfaz sin modificar las decisiones de autorización del servidor.

Las categorías incorporadas incluyen sus dos etiquetas. Para una categoría personalizada, el administrador puede proporcionar Nombre en español y Nombre en inglés. Si omite el segundo, se conserva el nombre original. Cambiar idioma solo cambia las etiquetas; los identificadores y valores usados para filtrar o guardar no cambian.

No se traducen nombres de clientes, correos, títulos introducidos por el administrador ni descripciones personalizadas de forma automática. Los campos en edición conservan sus valores. Las descripciones estándar del video de demostración sí tienen traducción.

Los importes del panel se formatean con la configuración regional elegida, manteniendo moneda y valor en centavos. Las fechas del panel siguen indicando UTC. Los controles nativos del navegador pueden seguir el idioma del propio navegador.

## Audio y subtítulos

El módulo solo trabaja con texto y atributos de interfaz autorizados. No modifica source, track, audio, video, volumen, mute, rutas de medios ni pistas de subtítulos. El selector de calidad y las restricciones de reproducción conservan su implementación previa.

## Precios y seguridad

El país aproximado inicializa únicamente la consulta de precios. El idioma no cambia el país de la cuenta, los importes ni la moneda. Canadá mantiene 6.99 CAD para Premium y 9.99 CAD para Familiar; los precios de pago internacionales siguen pendientes.

La región del servidor y las licencias territoriales no dependen de la preferencia de idioma ni de la estimación del navegador. Cambiar un selector, localStorage o el idioma no concede Premium, no amplía cupos y no autoriza un territorio.

Las traducciones se insertan como texto, sin interpretar HTML. Las zonas con nombres y datos de clientes están excluidas del traductor. La autenticación y los permisos administrativos siguen comprobándose en el servidor. Las cookies de sesión se aíslan por puerto para que distintas instancias locales no se sobrescriban. No se añadió seguimiento ni un servicio externo.

## Pruebas

    .\tests\run-all.ps1

135 comprobaciones aprobadas: las 104 anteriores, 12 de reglas de idioma/aislamiento y 19 de navegador multilingüe. Informe completo: tests/.generated/run-all-i18n-latest.txt.

Se verificaron los cinco países, país desconocido, preferencias inválidas, prioridad manual, cambio de país y recarga, precios CAD/USD pendientes, conservación de sesión y favoritos, valores de formularios, nombres sin traducir, categorías bilingües, panel y diseño inglés de escritorio y móvil de 390 píxeles.

La regresión histórica conserva su idioma base español para mantener sus expectativas. La suite multilingüe adicional ejecuta la aplicación y el panel reales con su módulo de idiomas, mientras simula exclusivamente las señales de país del navegador y utiliza clientes ficticios.

Las capturas están en tests/.generated/i18n-app.png, i18n-admin.png e i18n-frame.png. La vista móvil usa un viewport de 390 píxeles; no sustituye una prueba en teléfonos físicos.

## Revisión manual sugerida

1. Abre la plataforma y comprueba el aviso de país aproximado y el selector.
2. Cambia a Español o English; recarga y confirma que se conserva la elección.
3. Escribe un correo en un formulario y cambia el idioma; el valor debe permanecer.
4. Consulta los precios de México, Estados Unidos, España e Irlanda: cambia la moneda y se muestran los precios pendientes, sin inventarlos.
5. Entra con una cuenta ficticia, selecciona un plan y comprueba Mi Lista. Cambiar idioma no debe cambiar la cuenta ni sus favoritos.
6. En el panel agrega una categoría con sus etiquetas española e inglesa y abre el editor. Cambiar el idioma debe conservar la categoría seleccionada y los textos en edición.

No se modificaron Firebase de producción, reglas, datos reales, audio o subtítulos. No se activaron pagos, no se contrataron servicios y no se publicaron ni fusionaron cambios. Se mantiene el límite anterior del simulador: sus datos de cuenta están en memoria y se reinician al detener esa instancia.
