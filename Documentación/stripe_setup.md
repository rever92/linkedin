# Configuración de Stripe

## Configuración Inicial

1. Crear cuenta en Stripe y obtener las claves API:
   - Para desarrollo: Usar las claves de prueba (Test)
   - Para producción: Usar las claves reales (Live)

2. Configurar variables de entorno:
   ```env
   # .env.development
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # En Supabase Edge Functions
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. Crear productos en Stripe:
   - Crear en modo TEST para desarrollo
   - Añadir metadato `role: PREMIUM` o `role: PRO` según corresponda
   - Guardar los IDs de productos y precios

4. Ejecutar migraciones SQL:
   ```sql
   -- Crear tablas
   stripe_tables.sql
   
   -- Insertar productos y precios
   insert_stripe_data.sql
   
   -- Actualizar user_profiles
   user_profiles.sql
   ```

## Desarrollo y Pruebas

1. Usar tarjeta de prueba: `4242 4242 4242 4242`
   - Cualquier fecha futura
   - Cualquier CVC
   - Cualquier código postal

2. Verificar en Supabase:
   - Se crea registro en `stripe_customers`
   - Se crea registro en `stripe_subscriptions`
   - Se actualiza `user_profiles` con el rol y fechas

3. Funciones de gestión manual:
   ```sql
   -- Hacer PREMIUM
   SELECT set_user_premium('uuid-del-usuario');
   
   -- Hacer PRO
   SELECT set_user_pro('uuid-del-usuario');
   
   -- Hacer FREE
   SELECT set_user_free('uuid-del-usuario');
   ```

## Pasar a Producción

1. Cambiar a modo LIVE en Stripe:
   - Crear productos reales con los mismos metadatos
   - Obtener nuevas claves API de producción
   - Actualizar webhook con nueva URL y secreto

2. Actualizar variables de entorno:
   ```env
   # .env.production
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   
   # En Supabase Edge Functions
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. Ejecutar SQL de inserción con IDs de producción:
   ```sql
   -- Insertar productos y precios de producción
   insert_stripe_live_data.sql
   ```

## Estructura de Datos

### Tablas
- `stripe_customers`: Relación usuario-cliente de Stripe
- `stripe_products`: Productos disponibles
- `stripe_prices`: Precios de los productos
- `stripe_subscriptions`: Suscripciones activas
- `user_profiles`: Información de suscripción del usuario

### Campos Importantes en user_profiles
- `role`: FREE, PREMIUM, PRO
- `subscription_status`: free, active, canceled, etc.
- `subscription_start_date`: Inicio de suscripción
- `next_billing_date`: Próximo cobro
- `subscription_plan`: Plan actual
- `payment_provider`: 'stripe'
- `payment_provider_subscription_id`: ID de suscripción en Stripe
- `payment_provider_customer_id`: ID de cliente en Stripe 