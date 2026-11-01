# Pruebas locales de CinevoTV

**Versión actual: Etapa 3.** Consulta [ETAPA-3.md](./ETAPA-3.md). El servidor local actual conserva los datos ficticios entre recargas y los reinicia al detenerse. Las indicaciones siguientes describen también los simuladores anteriores usados en las pruebas de regresión.

La Etapa 2 amplía esta guía: consulta [ETAPA-2.md](./ETAPA-2.md) para probar el nombre del perfil, quitar favoritos y seleccionar planes simulados.

## 1. Abrir la página de forma segura

El servidor preparado escucha solo en esta computadora y usa Firebase simulado por defecto. No instala paquetes ni accede a Authentication o Firestore de producción. La portada, las tarjetas y el código app.js son los mismos de la aplicación; el servidor sustituye únicamente el adaptador Firebase en la respuesta HTTP y añade un aviso de prueba. No modifica firebase.js.

En PowerShell:

    cd "C:\Users\barea\OneDrive\Documents\GitHub\cinevotv"
    .\Start-CinevoTV.ps1

Abre http://localhost:8080/ en Edge o Chrome. No abras index.html con doble clic. Deja la terminal abierta y usa Ctrl+C para detener tu instancia. Si el puerto está ocupado, ejecuta .\Start-CinevoTV.ps1 -Port 8081 y abre http://localhost:8081/. No es necesario conceder acceso desde redes públicas.

Confirma el aviso PRUEBA LOCAL AISLADA antes de introducir datos. Usa solamente correos ficticios y contraseñas de prueba. Los datos existen en memoria, en esa pestaña: se conservan al cerrar e iniciar sesión, pero se reinician al recargar o cerrar la pestaña y no se comparten entre pestañas. Esto es una simulación, no una prueba de persistencia de Firebase.

## 2. Probar películas y series

1. Abre Movie 1. El detalle debe mostrar Movie 1, sin el texto Guardar.
2. Pulsa Play: debe verse el video de flores existente. Usa pausa, reproducción y avance.
3. Cierra el detalle: el video debe detenerse.
4. Repite con Movie 2 y Series 1. Verifica que cambie el título y el tipo.
5. Puedes repetir con los ocho títulos. Todos apuntan al mismo MP4 de demostración; esto es intencional y no hay películas comerciales añadidas.

El video y la imagen de demostración requieren Internet. No requieren Firebase. Si falla el video, abre las herramientas de desarrollador (F12), pestañas Consola y Red, y anota el error. No pegues contraseñas, tokens ni datos personales en reportes.

## 3. Probar registro, acceso y Mi Lista

1. Pulsa Registrarse y crea Prueba A: prueba-a@example.test / Cinevo123! (solo para esta simulación).
2. Debe aparecer el correo de A y un botón Cerrar sesión. Guarda Movie 1 y Series 1.
3. Mi Lista debe mostrar ambos una sola vez; sus botones deben indicar Guardado.
4. Cierra sesión. Mi Lista debe quedar sin los títulos de A.
5. Registra Prueba B: prueba-b@example.test / Cinevo123!. Su lista debe estar vacía. Guarda Movie 2.
6. Cierra sesión e intenta entrar como A con una contraseña incorrecta. Debe aparecer un mensaje en español.
7. Entra como A con la contraseña de prueba correcta. Deben aparecer Movie 1 y Series 1; Movie 2 debe pertenecer solo a B.
8. Prueba registro con correo inválido o contraseña de menos de seis caracteres: el envío debe ser rechazado.
9. No recargues durante esta secuencia. Recargar elimina únicamente el estado simulado de la pestaña; para repetir desde cero puedes recargar.

## 4. Probar el buscador

1. Escribe Movie 1: debe quedar ese título.
2. Escribe MÓVIE   1, con mayúsculas, acento y espacios repetidos: debe encontrar Movie 1.
3. Escribe guardar: no debe encontrar títulos por el texto del botón.
4. Escribe series y pulsa Movies: no debe haber resultados. Pulsa Series: deben aparecer las cuatro series.
5. Borra la búsqueda y pulsa Todo: deben reaparecer los ocho títulos.

## 5. Ejecutar las comprobaciones automáticas

    .\tests\run.ps1

El resultado esperado es 39 líneas PASS y ninguna FAIL. Usa Edge headless con la red bloqueada y Firebase simulado. Los archivos generados se guardan en tests/.generated/, excluido de Git.

Para descargar y comprobar por separado el MP4 público de demostración con el decodificador real de Edge:

    .\tests\verify-video.ps1

El resultado esperado comienza con PASS: MP4 descargado y reproducido y muestra tiempo de reproducción y resolución. Esta prueba sí requiere Internet para descargar el video, pero no usa Firebase. La descarga permanece en tests/.generated/.

## 6. Comprobaciones que necesitan Firebase real

La autenticación del servicio, persistencia tras recargar, sincronización entre pestañas/dispositivos, contención de transacciones y autorización mediante reglas no se certifican con el simulador. Para verificarlas hace falta un proyecto Firebase de pruebas separado, con datos ficticios. No se ha creado ni configurado ninguno durante este trabajo.

Firebase recomienda separar los entornos: https://firebase.google.com/docs/projects/dev-workflows/overview-environments

Si ya tienes un proyecto de pruebas autorizado:

1. Confirma en Firebase Console que es un proyecto distinto de cinevotv-a3378, con Email/Password habilitado y Firestore disponible. No uses la configuración de producción. No cambies reglas ni actives facturación para seguir esta guía.
2. Crea la carpeta local .local y copia dev/firebase-pruebas.example.json como .local/firebase-pruebas.json. Sustituye los cuatro valores por la configuración de la aplicación web de ese proyecto de pruebas. No uses una cuenta de servicio ni claves privadas. .local está excluido de Git.
3. Inicia otra instancia en un puerto distinto:

    .\Start-CinevoTV.ps1 -Port 8081 -FirebaseConfigPath .\.local\firebase-pruebas.json

4. Abre http://localhost:8081/ y comprueba que el aviso diga FIREBASE DE PRUEBAS REAL y el identificador correcto. El servidor rechaza la configuración de producción conocida.
5. Repite la secuencia de dos cuentas con correos ficticios de prueba. Aquí sí se crearán usuarios y documentos ficticios en el proyecto de pruebas.
6. Recarga y confirma que la sesión y los favoritos persisten. Abre otra pestaña del mismo origen y guarda títulos distintos en ambas: deben conservarse todos los favoritos.
7. Usa una ventana privada para B y confirma que no aparecen los títulos de A.
8. Si aparece permission-denied, un error de dominio o de configuración, detente y registra el mensaje. No abras las reglas ni cambies ajustes de seguridad para eludirlo. La comprobación del rechazo de lectura/escritura a otro UID requiere una prueba dedicada contra reglas del entorno de pruebas; comprobar solo la interfaz no demuestra esa protección.

Si no dispones de un proyecto de pruebas autorizado, permanece en el modo simulado. No es posible certificar la integración real sin un entorno adecuado. No se requiere registrar usuarios en producción ni modificar sus datos para probar la interfaz.

## Resultado de esta revisión

- Servidor local: HTTP 200, adaptador simulado servido sin configuración de producción y acceso a .git rechazado con 404.
- Suite: 39 pruebas funcionales aprobadas en Edge.
- MP4 existente: descargado y reproducido por Edge; avance observado de 0,3 segundos y resolución 960 × 540.
- No se accedió a cuentas o documentos reales ni se modificaron reglas de Firebase. No se publicó ni fusionó ningún cambio.
