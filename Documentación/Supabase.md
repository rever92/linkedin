# Configuración de Supabase

## Tablas

### user_profiles
Tabla principal de perfiles de usuario.

Campos importantes:
- `id`: UUID del usuario (referencia a auth.users)
- `role`: FREE, PREMIUM, PRO
- `subscription_status`: free, active, canceled, etc.
- `subscription_start_date`: Inicio de suscripción
- `next_billing_date`: Próximo cobro
- `subscription_plan`: Plan actual
- `payment_provider`: 'stripe'
- `payment_provider_subscription_id`: ID de suscripción
- `payment_provider_customer_id`: ID de cliente

### stripe_customers
Relación entre usuarios y clientes de Stripe.

Campos:
- `id`: UUID
- `user_id`: UUID del usuario
- `stripe_customer_id`: ID del cliente en Stripe
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización

### stripe_subscriptions
Suscripciones activas de los usuarios.

Campos:
- `id`: UUID
- `user_id`: UUID del usuario
- `stripe_subscription_id`: ID de suscripción en Stripe
- `stripe_customer_id`: ID del cliente
- `stripe_price_id`: ID del precio
- `status`: Estado de la suscripción
- `current_period_start`: Inicio del período
- `current_period_end`: Fin del período

## Edge Functions

### create-checkout-session
Crea una sesión de pago en Stripe.

Variables de entorno necesarias:
```env
STRIPE_SECRET_KEY=sk_test/live_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

### stripe-webhook
Maneja eventos de Stripe y actualiza las tablas.

Variables de entorno necesarias:
```env
STRIPE_SECRET_KEY=sk_test/live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Políticas RLS

### user_profiles
```sql
-- Usuarios pueden ver/editar su propio perfil
CREATE POLICY "Usuarios pueden ver su perfil"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### stripe_customers
```sql
-- Usuarios pueden ver sus datos de cliente
CREATE POLICY "Usuarios pueden ver su cliente"
ON stripe_customers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir inserción desde función Edge
CREATE POLICY "Permitir inserción desde función Edge"
ON stripe_customers FOR INSERT
TO authenticated
WITH CHECK (true);
```

## Funciones SQL

### set_user_premium
```sql
SELECT set_user_premium('uuid-del-usuario');
```

### set_user_pro
```sql
SELECT set_user_pro('uuid-del-usuario');
```

### set_user_free
```sql
SELECT set_user_free('uuid-del-usuario');
```

## Mantenimiento

### Monitorización
- Revisar logs de Edge Functions
- Verificar estado de suscripciones
- Comprobar políticas RLS

### Backups
- Respaldo regular de tablas
- Documentación de cambios
- Registro de eventos importantes




