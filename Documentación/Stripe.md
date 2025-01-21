Perfecto, ahora te explicaré los pasos que necesitas seguir para completar la integración:
Configurar las variables de entorno:
Ve a tu dashboard de Stripe y obtén las claves necesarias
Reemplaza los valores en .env.local con tus claves reales
Asegúrate de no compartir estas claves en el control de versiones
Crear los productos en Stripe:
Ve al dashboard de Stripe > Products
Crea dos productos: uno para el plan PREMIUM y otro para el plan PRO
Para cada producto, crea un precio recurrente (subscription)
Guarda los IDs de los precios, los necesitarás más tarde
Configurar el webhook de Stripe:
En el dashboard de Stripe, ve a Developers > Webhooks
Añade un nuevo endpoint: https://tu-proyecto.supabase.co/functions/v1/stripe-webhook
Selecciona los eventos customer.subscription.created, customer.subscription.updated y customer.subscription.deleted
Guarda el Webhook Secret y añádelo a tus variables de entorno
Desplegar las funciones Edge:
Instala Supabase CLI si no lo tienes: npm install -g supabase
Despliega las funciones:
Integrar el componente de precios:
Añade el componente Pricing a tu aplicación
Puedes añadirlo como una nueva ruta /pricing o integrarlo donde necesites mostrar los planes
Actualizar la navegación:
Añade un enlace al portal de facturación en el área de cuenta del usuario
Puedes usar la función createPortalSession para redirigir al usuario al portal de Stripe
Probar la integración:
Usa el modo de prueba de Stripe (test mode)
Prueba una suscripción con una tarjeta de prueba: 4242 4242 4242 4242
Verifica que los webhooks funcionen correctamente
Comprueba que los roles se actualicen en la base de datos
Monitorización:
Configura alertas en Stripe para eventos importantes
Revisa los logs de las funciones Edge en Supabase
Monitoriza los webhooks en el dashboard de Stripe