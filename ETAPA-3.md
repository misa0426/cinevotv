# CinevoTV · Etapa 3 local

Rama: codex/cinevotv-mejoras. Cuenta administradora ficticia autorizada: admin@cinevo.test. No se conecta con Firebase de producción ni se procesan cobros reales.

## Abrir

    .\Start-CinevoTV.ps1 -Port 8082

- Plataforma: http://localhost:8082/
- Panel: http://localhost:8082/admin
- Correo administrador: admin@cinevo.test.
- Contraseña temporal: consultar .local/admin-acceso.txt o la salida de la terminal. Se genera al iniciar el servidor. El archivo está excluido de Git y no es accesible por HTTP.

El servidor usa Node.js ya disponible en la computadora y solo módulos incorporados, sin instalar paquetes. El lanzador busca node en PATH y después en el runtime de Codex existente. Si no encuentra Node, se detiene sin descargar ni contratar nada. Escucha únicamente en 127.0.0.1; no expone el panel a la red local.

## Autenticación y permisos

Las sesiones y los permisos se comprueban en el servidor para cada operación. La cuenta administradora se reserva al arrancar; un registro público no puede asignar el rol admin ni registrar ese correo reservado. Las contraseñas ficticias se almacenan en memoria como hashes scrypt con sal aleatoria. La sesión utiliza una cookie HttpOnly y SameSite=Strict, con ocho horas de vigencia y revocación al salir. No se configura Secure porque esta demostración solo usa HTTP en loopback; este servidor no debe publicarse.

Las rutas administrativas rechazan invitados y clientes normales. Las solicitudes con Origin ajeno se rechazan, se limita el tamaño del JSON y hay control básico de intentos fallidos. Las escrituras de perfil, favoritos y plan exigen que el UID esperado coincida con la sesión, para evitar actualizar otra cuenta tras un cambio de sesión entre pestañas.

El simulador de la Etapa 3 sustituye al simulador exclusivamente por pestaña durante el uso normal. Ahora cuentas, favoritos, planes y catálogo se mantienen en memoria del servidor; sobreviven a recargar o cerrar una pestaña y se comparten dentro del mismo origen. Se reinician al detener el servidor. No se migran datos reales. Los simuladores antiguos se conservan para las pruebas de regresión.

## Panel disponible

- Resumen: clientes registrados, Premium y Gratis, ingresos mensuales y totales netos simulados, suscripciones activas y canceladas.
- Clientes: nombre, correo ficticio, registro, plan, estado e historial de pagos disponible. Filtros por texto y plan.
- Pagos: registros ficticios aprobados, fallidos y reembolsados. Los ingresos se calculan en centavos CAD; los fallidos no suman y los reembolsos restan. El mes se calcula en UTC.
- Suscripciones: historial de altas, cancelaciones y fecha prevista de renovación. No hay renovaciones automáticas, cobros ni conexión con proveedores financieros.
- Catálogo: agregar borradores, editar título/descripción/carátula original/categoría, elegir Gratis o Premium, programar un periodo gratuito y retirar contenido sin borrarlo.
- Categorías: agregar y quitar categorías vacías. Una categoría utilizada debe reasignarse antes de quitarla.

El panel inicia con seis clientes ficticios y sus historiales. Los registros y selecciones de plan realizados en la plataforma local se reflejan al pulsar Actualizar en el panel. La cuenta del administrador se excluye del número de clientes.

## Contenido y permisos de reproducción

Se conservan los ocho títulos de demostración y el MP4 de flores existente. Las carátulas son composiciones originales en CSS. No se admiten URLs de videos o imágenes externos desde el editor. Se pueden crear borradores con derechos pendientes; para hacer visible un título solo se permite el video de demostración identificado con su referencia CC0. Esto no constituye un verificador automático de licencias comerciales.

Fuente del video: https://github.com/mdn/interactive-examples/tree/main/media/cc0-videos
Licencia revisada: https://github.com/mdn/interactive-examples/blob/main/LICENSE

La API de reproducción valida que el contenido esté publicado, tenga derechos de demostración y sea Gratis, esté dentro de su promoción gratuita o la cuenta tenga Premium simulado. El inicio de promoción es inclusivo y el fin exclusivo, con reloj del servidor y fechas UTC. Retirar o cambiar la disponibilidad revoca la siguiente solicitud y el sondeo del catálogo detiene la reproducción activa cuando detecta el cambio.

El MP4 de demostración es público: esta simulación no proporciona DRM ni protección de una CDN comercial. No se ha incorporado contenido comercial ni un servidor de distribución de películas reales.

## Planes

Gratis: contenido gratuito y espacios reservados para publicidad, sin anuncios ni rastreadores reales. Premium: 6.99 CAD mensuales como referencia de la simulación, sin espacios publicitarios. Seleccionar Premium genera un evento de suscripción y un pago ficticio de 699 centavos; repetir la misma selección no duplica el pago. Volver a Gratis cancela la suscripción simulada y conserva su historial. Nunca se solicita una tarjeta ni se llama a una pasarela de pago.

## Revisión paso a paso

1. Abre /admin sin sesión: solo debe aparecer el acceso. Entra con admin@cinevo.test y la contraseña local.
2. Revisa métricas, clientes, pagos y suscripciones. Todas las cifras llevan la indicación de simulación.
3. En Catálogo agrega un borrador. Prueba publicarlo con derechos pendientes: el servidor debe rechazarlo.
4. Selecciona Solo video de flores MDN · CC0 verificado, guarda y comprueba el título en la plataforma.
5. Edita título, descripción, categoría y paleta. El catálogo se actualiza aproximadamente cada dos segundos; el buscador y Mi Lista usan los datos actualizados.
6. Marca el título Premium y comprueba el rechazo de reproducción como invitado o cliente Gratis. Usa una ventana privada para otra cuenta ficticia.
7. Selecciona Premium en esa cuenta, verifica la reproducción simulada y la ausencia del espacio publicitario; Actualizar en el panel debe mostrar su suscripción y pago ficticios.
8. Configura un periodo gratuito UTC que incluya el momento actual y comprueba el acceso con Gratis. Retira el título y comprueba que desaparece del catálogo público, conservando el registro administrativo.
9. Cierra la sesión administradora: el panel borra métricas y tablas. Un cliente normal no puede recuperar esos datos mediante la API.

## Pruebas

    .\tests\run-stage3.ps1

75 comprobaciones aprobadas: 43 previas (39 funcionales y 4 de diseño), 18 de modelo/API y 14 integradas de navegador. Se probaron sesiones, roles, UID, CSRF, privacidad de credenciales, métricas netas, renovaciones de fin de mes, historial, cambios concurrentes, favoritos estables al editar, retiro, derechos pendientes, categorías y límites de promociones.

Las pruebas integradas ejecutan la aplicación y el panel reales en Edge contra una instancia HTTP independiente del simulador, con clientes ficticios y dominios externos bloqueados. La reproducción multimedia se sustituye en esas pruebas para no descargar el MP4. El script tests/verify-video.ps1 de la etapa anterior conserva la prueba separada del video existente.

Además se revisaron capturas del panel a 1440 y 390 píxeles, sin desbordamiento:

    node .\tests\capture-admin.mjs

Capturas: tests/.generated/admin-preview-1440.png y admin-preview-390.png. No se incluyen en Git.

## Pendiente antes de un servicio real

Persistencia duradera y copias de seguridad del entorno ficticio; backend desplegable con HTTPS y gestión de secretos; asignación de permisos a una cuenta real autorizada; reglas y pruebas de Firebase en un proyecto separado; distribución protegida de medios y licencias comerciales documentadas. La renovación automática, publicidad real y pagos reales requieren una autorización y una implementación posteriores. No se ha modificado ninguna regla ni dato de producción.
