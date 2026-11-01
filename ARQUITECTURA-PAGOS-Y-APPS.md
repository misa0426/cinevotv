# Preparación de pagos y futuras aplicaciones

El único proveedor habilitado es simulation. Las políticas de planes y países son datos del servidor; la web no decide permisos a partir del nombre de un plan ni de un pago enviado por el cliente. No hay SDK, claves, tarjetas, cuenta bancaria o llamadas a Stripe, Scotiabank, Google Play Billing o StoreKit.

Una integración futura deberá convertir eventos verificados de un proveedor en una suscripción canónica de la cuenta: plan, estado, país de facturación, moneda, importe en centavos, fecha de renovación, identificador externo, origen del proveedor e identificador de evento. Antes de aplicar un evento se debe comprobar su firma o recibo, su titularidad y su idempotencia. El precio debe proceder de un catálogo aprobado para ese país. Los precios null bloquean activar el plan, nunca se sustituyen por CAD o una conversión inventada.

Las funciones de cuentas, favoritos, historial y dispositivos pertenecen a la cuenta en el servidor, no a la aplicación de compra. Así podrán compartirse después entre web, Android e iOS sin duplicar favoritos ni confiar en una declaración de pago del dispositivo.

Stripe es solo un candidato para evaluar en la web. No se crea una conexión bancaria ni se solicita información de Scotiabank. La autorización de cobros reales y de recepción bancaria requiere una tarea posterior explícita.

Antes de implementar o publicar aplicaciones se deberán revisar de nuevo las reglas vigentes de las tiendas y las excepciones por región. Google Play contempla requisitos de facturación para bienes digitales y suscripciones de video; Apple tiene reglas de compras dentro de la app y de aplicaciones de lectura. La arquitectura debe admitir proveedores separados y verificación en el servidor, sin suponer que se puede utilizar el mismo enlace de pago externo en todos los países.

Fuentes oficiales consultadas:

- Google Play Payments: https://support.google.com/googleplay/android-developer/answer/9858738
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

No se ha iniciado desarrollo móvil ni se han activado servicios de facturación.
