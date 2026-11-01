# CinevoTV · Etapa 2

Implementación local en codex/cinevotv-mejoras. No se ha publicado, fusionado ni conectado con datos reales.

## Cambios

- Portada con arte original en CSS, navegación fija, tarjetas con ilustraciones abstractas propias, buscador integrado, reproductor y ventanas de autenticación rediseñados.
- Diseño adaptable a computadora, tableta y móvil. Navegación por teclado, foco visible, enlace para saltar al contenido, cierre con Escape y aislamiento del foco en las ventanas.
- Registro e inicio de sesión con formularios únicos, validación, mostrar/ocultar contraseña, limpieza de credenciales y bloqueo compartido contra solicitudes simultáneas de acceso y registro.
- Perfil de cuenta con nombre editable, iniciales y plan simulado. No se han añadido perfiles múltiples por cuenta.
- Mi Lista permite guardar y quitar desde cada tarjeta y desde la propia lista, con contador. Conserva separación por UID, control de operaciones pendientes y descarte de respuestas de sesiones anteriores.
- Plan Gratis con anuncios y Premium sin anuncios por 6.99 CAD/mes. La elección es una simulación por UID en memoria, sin pasarela de pago, sin cargos, sin anuncios reales y sin asignar derechos de acceso reales.
- El adaptador de Firebase rechaza la configuración conocida de producción antes de inicializar el SDK. Las operaciones nuevas del adaptador solo deben usarse con un proyecto de pruebas separado mediante el servidor local.

## Abrir y revisar

La vista iniciada para esta entrega usa http://localhost:8082/. Si no está activa, desde PowerShell en la raíz del repositorio ejecuta:

    .\Start-CinevoTV.ps1 -Port 8082

1. Confirma el aviso PRUEBA LOCAL AISLADA. La configuración de producción no se sirve.
2. Explora el catálogo y usa Ver demostración en la portada. Comprueba que se detenga el video al cerrar.
3. Registra prueba-a@example.test con una contraseña ficticia de al menos seis caracteres. Abre Mi perfil, cambia el nombre y pulsa Guardar nombre.
4. Guarda Movie 1 y Series 1. Quita uno desde su tarjeta y el otro desde Mi Lista. Guarda de nuevo para comprobar que sigue funcionando.
5. En Planes pulsa Probar Premium. El perfil debe mostrar Premium · simulación. Puedes volver a Gratis. No se piden tarjetas ni datos de pago.
6. Cierra sesión y registra prueba-b@example.test. Sus favoritos deben estar vacíos y su plan debe ser Gratis. Al volver a A, dentro de la misma pestaña, se recuperan su nombre, lista y elección de plan.
7. Reduce el ancho del navegador y prueba navegación, búsqueda, formularios, catálogo, planes y reproductor.

El simulador conserva cuentas, nombres y favoritos únicamente en memoria por pestaña. Las elecciones de plan también son temporales. Todo se reinicia al recargar. Usa solo datos ficticios. No se garantiza persistencia entre pestañas ni dispositivos en el simulador.

## Ejecutar pruebas

    .\tests\run.ps1
    .\tests\visual.ps1

El resultado esperado es 39 comprobaciones funcionales y 4 de diseño, todas PASS. Las pruebas bloquean la red y sustituyen Firebase por simuladores; el adaptador real se prueba con sustitutos del SDK, sin contactar con servicios.

Para revisar capturas de otras secciones:

    .\tests\visual.ps1 -Section peliculas
    .\tests\visual.ps1 -Section suscripciones

Las capturas se guardan en tests/.generated/preview-SECCION-ANCHO.png. La revisión de anchos usa un iframe del tamaño indicado para evitar el ancho mínimo de la ventana de Edge headless. No equivale a una certificación en dispositivos físicos.

El MP4 de demostración existente tiene una prueba separada de descarga y decodificación:

    .\tests\verify-video.ps1

## Seguridad y compatibilidad

No se migraron ni borraron datos. El esquema usuarios/{uid}.favoritos conserva sus títulos. Tanto guardar como quitar usan transacciones con merge para conservar otros campos. Las listas malformadas se rechazan sin sobrescribirlas. La edición de nombre usa el usuario autenticado y exige que coincida el UID.

No se modificaron reglas de Firestore. La comprobación real de permisos, persistencia y sincronización requiere un entorno Firebase de pruebas autorizado; la comprobación de interfaz no demuestra la seguridad de las reglas desplegadas. Consulta PRUEBAS-LOCALES.md para el modo con Firebase de pruebas. No uses el proyecto de producción.

## Pendiente

- Validación integrada con Firebase de pruebas, incluyendo reglas de autorización y operaciones simultáneas entre dispositivos.
- Pruebas manuales en celulares y televisores físicos, y en navegadores distintos de Edge.
- Persistencia de la simulación de planes si se desea en una etapa posterior; ahora se reinicia al recargar.
- Incorporar contenido real solo tras verificar y documentar su licencia. Se mantienen los ocho títulos y el MP4 de flores existentes; las nuevas carátulas son composiciones CSS originales, sin material comercial añadido.
- Anuncios y cobros reales siguen fuera de esta entrega.
