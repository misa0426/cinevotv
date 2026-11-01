Big Buck Bunny pasa de una ficha pendiente a reproducción completa local con su archivo oficial por ID. Nunca recibe una variante del vídeo de flores. Pausar conserva URL/posición y libera el cupo simultáneo; reanudar valida de nuevo el límite. Las demostraciones se conservan en fixtures, fuera del catálogo de revisión.

La PR incorpora también el trabajo local acumulado de etapas anteriores, que aún estaba sin seguimiento en esta rama: autenticación aislada, favoritos por usuario, catálogo/búsqueda, administración ficticia, precios simulados, traducciones y diseño VixunoTV. Conserva la solución por identificadores de la PR #2, sin fusionarla ni cerrarla automáticamente.

Validación: 182 comprobaciones base aprobadas; 3 pruebas de interfaz con el archivo real aprobadas; fullscreen en navegador aprobado mediante gesto CDP. Ensayo completo 1× de Big Buck Bunny: 596,566 s de vídeo, 597,507 s de reloj, 14.684 fotogramas y 29.369.492 bytes de audio decodificado; créditos inspeccionados. La salida automatizada estuvo silenciada: no se afirma escucha humana. Las pruebas de geometría/eventos TV son simuladas; las inspecciones Android son estáticas.

Fuente/licencia: https://peach.blender.org/about/ (CC BY 3.0), descarga oficial de Blender Video registrada por SHA-256. Los 66 MB fueron autorizados y están solo en .local, excluidos de Git. No se sube vídeo ni credencial temporal a GitHub. En otro checkout la reproducción queda deshabilitada hasta obtener una copia autorizada, probarla completa y revisar créditos; no hay descarga automática.

Preparación independiente: metadatos y sitemap para la URL pública observada; localhost noindex. Proyecto Android TV/Google TV WebView y foco con mando, sin APK compilada; faltan SDK/JDK/Gradle y prueba física. Planes separados para Samsung/LG. La app local requiere backend y no debe copiarse directamente a Pages.

Pendientes: Sprite Fright y otras 28 candidatas, permiso/reproducción por recurso, audio en altavoces, teléfonos/TV físicos, APK y Firebase real de pruebas. El simulador no modifica producción ni reglas y pierde sus datos al terminar el proceso. No hay pagos ni publicidad reales.

Revisión en la computadora de desarrollo: http://localhost:8089/ . Instrucciones y estados por fase: FASES-REPRODUCTOR-ENTREGA.md. Comandos: .\Start-CinevoTV.ps1 -Port 8089; .\tests\run-all.ps1; node tests/bbb-app.mjs solo tras aprobar la copia local. Ver la guía para el ensayo completo y su autorización de descarga.

**Borrador para revisión: no fusionar, desplegar en Pages, activar producción, contratar servicios ni publicar aplicaciones. No modifica main. Coste de servicios contratados: 0 CAD.**
