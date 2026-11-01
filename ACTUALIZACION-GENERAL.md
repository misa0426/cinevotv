# Actualización general de CinevoTV

Implementada en codex/cinevotv-mejoras. Conserva las Etapas 1–3 y su suite de pruebas. No se publicó, fusionó ni conectó Firebase de producción, Stripe, una cuenta bancaria o aplicaciones móviles.

## Abrir la versión actual

- Plataforma: http://localhost:8083/
- Administración: http://localhost:8083/admin
- Administrador ficticio: admin@cinevo.test.
- Contraseña temporal: .local/admin-acceso.txt. El acceso anterior se conserva en una copia .local/admin-acceso-anterior-*.txt.

    .\Start-CinevoTV.ps1 -Port 8083

La instancia anterior no se detuvo para no vaciar sus datos ficticios en memoria. La nueva instancia tiene su propio entorno ficticio; no es una migración de cuentas reales. El servidor local continúa siendo temporal: al detener una instancia se pierde su estado en memoria. La persistencia duradera sigue pendiente y no se debe usar con datos reales.

Antes de editar se revisaron el estado del repositorio y las pruebas. La base previa pasó sus 75 comprobaciones. También se guardó una copia de los archivos anteriores en .local/snapshots/actualizacion-*. Ningún archivo fuente anterior se borró.

## Planes de Canadá

| Función | Gratis · 0 CAD/mes | Premium · 6.99 CAD/mes | Familiar · 9.99 CAD/mes |
|---|---|---|---|
| Catálogo | Solo gratuito y promociones autorizadas | Incluye Premium | Incluye Premium |
| Publicidad | Espacios preparados; sin anuncios reales | Sin espacios publicitarios | Sin espacios publicitarios |
| Mi Lista | Bloqueada con invitación a mejorar | Guardar y quitar | Guardar y quitar |
| Historial y Continuar viendo | Bloqueados | Disponibles | Disponibles |
| Calidad | Algunos títulos limitados a 480p | Hasta 1080p cuando haya archivo | Hasta 1080p cuando haya archivo |
| Dispositivos registrados | Sin restricción de plan definida | Sin restricción individual definida | Máximo 3 |
| Reproducciones simultáneas | Sin restricción de plan definida | Sin restricción individual definida | Máximo 2 |

Los límites no definidos se representan con null en las políticas, sin inventar cifras ni prometer una oferta comercial ilimitada. Las selecciones de plan y sus pagos son siempre ficticios.

## Mi Lista e historial

El servidor rechaza leer, agregar o quitar favoritos con Gratis. La interfaz muestra la invitación a Premium o Familiar. Al cancelar se mantiene el arreglo de favoritos y el historial de la cuenta; se bloquean sus consultas y se recuperan al volver a un plan de pago. No se eliminan los favoritos por cambiar de plan.

El progreso se guarda al pausar, cerrar o terminar y mediante heartbeat durante la reproducción. Continuar viendo muestra títulos incompletos y reanuda desde el progreso guardado. Los datos están separados por UID. Los títulos retirados no se pueden reproducir desde el historial.

## Dispositivos y sesiones de video

La cuenta mantiene un registro de dispositivos separado de las sesiones de reproducción. Cada navegador recibe una credencial aleatoria HttpOnly validada por el servidor. Volver a entrar en el mismo navegador no registra otro dispositivo. Familiar rechaza el cuarto registro; un navegador autorizado puede quitar uno antiguo desde el perfil.

Quitar un dispositivo revoca todas sus sesiones y sus reproducciones, sin borrar los favoritos ni el historial de la cuenta. No se puede quitar un dispositivo de otra cuenta. Las escrituras sensibles incluyen el UID esperado para impedir cambios cruzados entre pestañas con cuentas distintas.

Cada reproducción utiliza una autorización independiente vinculada a cuenta, dispositivo, contenido y variante. Dos pestañas pueden consumir dos cupos aunque exista un solo dispositivo registrado. Familiar rechaza la tercera reproducción simultánea. Las solicitudes repetidas de la misma instancia no duplican cupos.

Pausar, terminar o cerrar libera la autorización; se intenta enviar el cierre con keepalive. Si un proceso se apaga o se pierde la red, el cupo caduca tras 65 segundos sin heartbeat. El navegador envía heartbeat cada 20 segundos mientras reproduce. Bajar de plan revoca las autorizaciones anteriores.

Esta identificación reconoce credenciales de navegador, no hardware físico infalsificable. No hay DRM ni atestación de dispositivos. Los bytes ya descargados no pueden recuperarse; la API valida cada nueva solicitud de archivo o rango. La protección comercial con medios segmentados, CDN y controles operativos requiere trabajo posterior autorizado.

## Calidad real y contenido autorizado

Los únicos videos usados son el MP4 de flores existente y una derivación local de ese mismo video. Se conservó el original 960×540 y se generó una variante real 640×360 mediante Edge, sin instalar transcodificadores ni descargar programas.

- Los títulos de demostración número 4 tienen un límite de 480p para Gratis; se entrega el archivo real 360p, no una etiqueta falsa de 480p.
- Premium y Familiar pueden recibir 540p. No hay archivo 1080p y la API rechaza pedirlo; no se reescala el original para simular HD.
- La interfaz enumera solo las variantes disponibles y permitidas.
- Los archivos se entregan desde /api/media con autorización de reproducción y soporte de rangos; no se devuelve la URL pública de origen al iniciar una reproducción.
- Para incorporar otras resoluciones hacen falta archivos autorizados y metadatos verificados. No se aceptan URLs comerciales arbitrarias desde el editor.

Los archivos locales están en .local/media, excluidos de Git. Para reconstruir la derivación con el MP4 de demostración ya disponible:

    node .\dev\prepare-demo.mjs

La licencia y la procedencia se documentan en ETAPA-3.md. Las carátulas continúan siendo composiciones originales en CSS.

## Países y licencias

| País | Moneda | Premium | Familiar |
|---|---|---|---|
| Canadá | CAD | 6.99 | 9.99 |
| Estados Unidos | USD | Pendiente | Pendiente |
| México | USD | Pendiente | Pendiente |
| España | EUR | Pendiente | Pendiente |
| Irlanda | EUR | Pendiente | Pendiente |

Las políticas centralizadas están en dev/policies.mjs. No se aplican tipos de cambio ni importes internacionales inventados. La consulta de precios en la web no cambia el país de la cuenta ni activa un plan sin precio.

El editor permite seleccionar territorios de demostración verificados. Catálogo, reproducción y solicitudes de bytes comprueban la lista de territorios del contenido. Un cliente no puede habilitar un país enviando cabeceras o campos de formulario.

La instancia local simula Canadá mediante una región asignada en el servidor. Los tests también ejecutan instancias de otras regiones. No se implementó geolocalización por IP ni se lanzó distribución internacional. Antes de un servicio público se necesita una fuente geográfica confiable y revisar licencias reales por territorio. No se contrató ningún servicio de geolocalización.

## Administración

Se mantiene la autorización de administrador en el servidor y la cuenta ficticia reservada. El resumen incluye usuarios Gratis, Premium y Familiar; clientes, nombres y correos ficticios; suscripciones activas, canceladas y renovadas; renovaciones previstas; ingresos netos mensuales y totales e historial de pagos.

El catálogo conserva borradores, edición de títulos/descripciones/carátulas originales/categorías, acceso Gratis o Premium, promociones gratuitas, retirada sin borrar y protección frente a ediciones obsoletas. Se añadieron territorios y límite gratuito de 480p por título.

La renovación simulada es manual y solo se acepta cuando corresponde. Registra 699 o 999 centavos CAD según el plan y preserva el historial. No hay renovación automática ni política de cobros fallidos o de gracia comercial: esas decisiones y su integración real siguen pendientes.

## Verificación

    .\tests\run-all.ps1

104 comprobaciones en la suite completa:

- 43 de la base de las Etapas 1 y 2, incluidas cuatro medidas de diseño.
- 18 del modelo y API de la Etapa 3.
- 19 integradas de navegador, incluidas Familiar, cancelación, precios pendientes, dispositivos e historial.
- 18 nuevas de políticas, cuotas, expiración, revocación, aislamiento, calidad y territorio.
- 3 reproducciones y autorizaciones con archivos reales de 360p y 540p.
- 2 comprobaciones del panel adaptable a 1440 y 390 píxeles.
- 1 prueba separada del MP4 original.

El informe completo de la última ejecución está en tests/.generated/run-all-latest.txt. Los tests de modelo/API usan relojes controlados para probar renovaciones y caducidades sin esperar un mes ni generar cobros. Las pruebas de navegador usan instancias independientes con datos ficticios; no alteran la instancia de revisión ni producción.

La mayoría de las pruebas no utiliza Internet. La prueba heredada verify-video.ps1 descarga únicamente el MP4 público de demostración existente. No se usan películas comerciales ni datos reales.

## Pendiente

Persistencia duradera y recuperación de los datos ficticios; backend y HTTPS de producción; integración con un Firebase de pruebas separado; geolocalización confiable y licencias comerciales por país; archivos HD autorizados; verificación en celulares/televisores físicos; facturación e impuestos y verificación de recibos/webhooks reales. No se empezó ninguna app Android o iOS.

No se modificó producción, no se conectó Scotiabank, no se instaló Stripe ni una pasarela real, no se compró o contrató ningún servicio y no se publicaron ni fusionaron cambios.
