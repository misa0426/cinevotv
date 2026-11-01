# VixunoTV para televisores: prototipo, no aplicación publicada

Se prepara un contenedor Android instalable desde código para Android TV/Google TV que reutiliza la interfaz, sesiones, catálogo y favoritos del servidor existente mediante WebView. No es una simple afirmación de que una web adaptable sea una APK. El proyecto está en android-tv y requiere compilarse y probarse: **no se generó todavía una APK ni se ejecutó un emulador**. No se detectaron JDK, Gradle, adb ni SDK Android instalados. No se descargó el toolchain ni se aceptaron licencias de SDK automáticamente.

Esta primera arquitectura evita duplicar autenticación y listas, mantiene cookies en el mismo origen y no expone interfaces JavaScript nativas. El contenedor limita navegación interna al servidor de prueba. Para una aplicación de producción se evaluará una interfaz Compose for TV y Media3 con un backend HTTPS estable y autenticación específica; ese desarrollo no está terminado ni debe confundirse con este prototipo WebView. El simulador no modifica Firebase real y sus usuarios están en memoria.

## Preparación y compilación, pendientes de autorización de descargas

Requisitos compatibles fijados para esta prueba: JDK 17, Gradle 8.11.1, Android Gradle Plugin 8.9.2, SDK Platform 35 y Build Tools 35.0.0. Se deben revisar las exigencias vigentes de la tienda antes de un futuro lanzamiento. No se incluye una clave de firma ni un Gradle Wrapper binario descargado. Application ID tv.vixuno.preview es de pruebas y no cambia identificadores Firebase.

1. Tras instalar el toolchain autorizado, abrir android-tv en Android Studio o definir el SDK en local.properties (ignorado por Git).
2. Iniciar el servidor local con `.\Start-CinevoTV.ps1 -Port 8088`.
3. Iniciar un emulador Android TV o conectar un televisor en modo desarrollador. No se habilita acceso del servidor a toda la red.
4. Ejecutar `adb reverse tcp:8088 tcp:8088` para que 127.0.0.1 del dispositivo llegue al servidor del ordenador. Algunos televisores/transports pueden no soportarlo: comprobar antes de prometer compatibilidad.
5. En android-tv, ejecutar `gradle :app:assembleDebug` con Gradle 8.11.1. La compilación puede descargar dependencias; requiere la autorización correspondiente. Instalar con `adb install -r app/build/outputs/apk/debug/app-debug.apk` solo cuando exista la APK y el usuario autorice el dispositivo.
6. Abrir VixunoTV en el lanzador TV. La activity declara LEANBACK_LAUNCHER y no exige pantalla táctil. Solo el localhost de prueba permite HTTP; el resto exige HTTPS.

## Pruebas necesarias

La interfaz web habilita navegación espacial al abrir `/?tv=1`: flechas, foco morado visible, Enter en tarjetas/botones y regreso. No intercepta las flechas de campos, selectores o controles nativos de vídeo. El contenedor maneja pantalla completa mediante WebChromeClient y regreso antes de cerrar la activity.

Probar con mando de cinco direcciones: recorrer cabecera, categorías y tarjetas; abrir detalles; activar Play; pausar y reanudar; avanzar/retroceder; entrar/salir de pantalla completa; regresar de detalles; entrar con una cuenta ficticia; añadir/quitar favoritos; recargar y comprobar la misma cuenta; salir y comprobar aislamiento. Las pruebas de geometría o eventos sintéticos no sustituyen este ensayo físico.

Pendiente: compilación, APK, mando real, teclado remoto, WebView y códecs del televisor, renderizado a distancia, comportamiento suspendido/reanudado y pruebas de cuenta/favoritos en dispositivo. No hay una versión lista para Google Play. No se publica ni se crea una cuenta de desarrollador de pago.

## Samsung y LG: planes separados

- Samsung: aplicación Tizen Web, manifiesto/config.xml, navegación y teclas de regreso con mando, certificados y firma propios, políticas CSP y compatibilidad audiovisual por año/modelo; evaluar AVPlay cuando el reproductor web no cubra el dispositivo. Primero emulador y televisor autorizado. No instalar Tizen Studio ni publicar en Seller Office sin instrucciones.
- LG: aplicación webOS con appinfo.json, permisos y empaquetado webOS, Developer Mode en un dispositivo autorizado, pruebas de mando/foco y formatos por modelo. No presumir que el mismo paquete Android instala en webOS. No se preparó ni publicó un IPK.

Fuentes oficiales consultadas: https://developer.android.com/training/tv/get-started/create ; https://developer.android.com/build/releases/agp-8-9-0-release-notes ; https://developer.samsung.com/smarttv/develop/specifications/general-specifications.html ; https://webostv.developer.lge.com/develop/getting-started/build-your-first-web-app .
