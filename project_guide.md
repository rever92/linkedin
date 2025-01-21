# Sistema de Suscripciones

## Estructura de la Base de Datos

### Tablas Principales

#### user_profiles
Almacena la información principal de suscripción del usuario:
- `subscription_status`: Estado actual ('active', 'canceled', 'past_due', 'trialing', 'incomplete')
- `subscription_plan`: Plan actual ('free', 'pro', 'business')
- `subscription_payment_status`: Estado del pago
- Fechas importantes: `subscription_start_date`, `next_billing_date`, `subscription_cancel_at`, etc.
- Información de Stripe: `payment_provider_subscription_id`, `payment_provider_customer_id`
- Información de facturación: dirección, email, etc.

#### subscription_history
Registra todos los cambios en las suscripciones:
- Cambios de estado
- Cambios de plan
- Eventos de pago
- Metadatos adicionales

#### subscription_plans
Define los planes disponibles:
- Precios
- Características
- Límites
- Intervalos de facturación

#### subscription_payments
Registra todas las transacciones:
- Montos
- Estados
- Información de pago
- URLs de facturas y recibos

## Integración con Stripe

### Flujo de Suscripción
1. El usuario selecciona un plan
2. Se crea un Customer en Stripe
3. Se crea la suscripción en Stripe
4. Se actualiza la información en `user_profiles`
5. Se registra el evento en `subscription_history`

### Webhooks de Stripe
Eventos importantes a manejar:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Manejo de Pagos
- Los pagos se procesan automáticamente a través de Stripe
- Los estados de pago se sincronizan mediante webhooks
- Se mantiene un registro local en `subscription_payments`

## Límites y Características por Plan

### Free
- Análisis básicos
- Límites restrictivos
- Sin acceso a características premium

### Pro
- Análisis avanzados
- Límites expandidos
- Acceso a la mayoría de características

### Business
- Análisis ilimitados
- Sin restricciones
- Acceso a todas las características

## Gestión de Roles

Los roles se asignan automáticamente según el plan:
- Plan Free -> Rol 'free'
- Plan Pro -> Rol 'pro'
- Plan Business -> Rol 'business'

## Manejo de Períodos de Prueba

- Período inicial configurable por plan
- Estado 'trialing' durante el período
- Conversión automática al finalizar

## Cancelaciones y Reembolsos

### Cancelación
1. El usuario solicita cancelación
2. Se marca `subscription_cancel_at`
3. La suscripción permanece activa hasta el final del período

### Reembolsos
- Se procesan manualmente a través de Stripe
- Se registran en `subscription_payments`
- Se actualiza el estado de la suscripción según corresponda

## Seguridad

- Toda la información sensible de pago se maneja en Stripe
- Solo se almacenan tokens y IDs de referencia
- Se implementan políticas RLS para proteger la información

## Monitoreo y Alertas

- Monitoreo de pagos fallidos
- Alertas de cancelaciones
- Métricas de conversión y retención 