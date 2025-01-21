import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

// 1. Inicializamos Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// 2. Creamos un cryptoProvider para Deno
const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Variables de entorno
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// 3. Supabase con la Service Role Key
const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature || !webhookSecret) {
      console.error('Error: Falta firma del webhook o secreto')
      return new Response('Webhook secret not configured', { status: 400 })
    }

    // Obtenemos el cuerpo como texto
    const body = await req.text()
    console.log('Cuerpo del webhook recibido:', body)

    // 4. Verificar la firma del webhook de forma asíncrona
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      console.error(`⚠️ Error de firma del webhook: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`Evento recibido: ${event.type}`)

    switch (event.type) {
      // -------------------------------------------------------------------
      //  checkout.session.completed
      // -------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Sesión de checkout completada:', session)

        // Obtener la suscripción de Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        console.log('Suscripción recuperada:', subscription)

        // Obtener el price y el producto
        const price = await stripe.prices.retrieve(subscription.items.data[0].price.id)
        const product = await stripe.products.retrieve(price.product as string)

        console.log('Producto:', product)
        console.log('Metadata del producto:', product.metadata)

        // Crear o actualizar el cliente en 'stripe_customers'
        const { error: customerError } = await supabase
          .from('stripe_customers')
          .upsert({
            user_id: session.client_reference_id,
            stripe_customer_id: session.customer,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (customerError) {
          console.error('Error creando/actualizando cliente:', customerError)
          throw customerError
        }

        // Crear o actualizar la suscripción en 'stripe_subscriptions'
        const { error: subscriptionError } = await supabase
          .from('stripe_subscriptions')
          .upsert({
            user_id: session.client_reference_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (subscriptionError) {
          console.error('Error creando/actualizando suscripción:', subscriptionError)
          throw subscriptionError
        }

        // Actualizar el perfil del usuario en 'user_profiles'
        const role = product.metadata.role || 'FREE'
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            role,
            subscription_status: subscription.status,
            subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            subscription_plan: role,
            payment_provider: 'stripe',
            payment_provider_subscription_id: subscription.id,
            payment_provider_customer_id: session.customer,
          })
          .eq('id', session.client_reference_id)

        if (profileError) {
          console.error('Error actualizando perfil:', profileError)
          throw profileError
        }

        console.log('Checkout completado procesado correctamente')
        break
      }

      // -------------------------------------------------------------------
      //  customer.subscription.created / updated
      // -------------------------------------------------------------------
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscriptionEvent = event.data.object
        console.log('Procesando suscripción:', subscriptionEvent)

        // Obtener price y product
        const priceEvent = await stripe.prices.retrieve(subscriptionEvent.items.data[0].price.id)
        const productEvent = await stripe.products.retrieve(priceEvent.product as string)

        console.log('Producto:', productEvent)
        console.log('Metadata del producto:', productEvent.metadata)

        // Obtener user_id de la tabla 'stripe_customers'
        const { data: customerData, error: customerEventError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', subscriptionEvent.customer)
          .single()

        if (customerEventError) {
          console.error('Error obteniendo cliente:', customerEventError)
          throw customerEventError
        }

        const userId = customerData.user_id

        // Actualizar 'stripe_subscriptions'
        const { error: subscriptionEventError } = await supabase
          .from('stripe_subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionEvent.id,
            stripe_customer_id: subscriptionEvent.customer,
            stripe_price_id: subscriptionEvent.items.data[0].price.id,
            status: subscriptionEvent.status,
            current_period_start: new Date(subscriptionEvent.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionEvent.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (subscriptionEventError) {
          console.error('Error actualizando suscripción:', subscriptionEventError)
          throw subscriptionEventError
        }

        // Actualizar 'user_profiles' con el rol y las fechas
        const roleEvent = productEvent.metadata.role || 'FREE'
        const { error: profileEventError } = await supabase
          .from('user_profiles')
          .update({
            role: roleEvent,
            subscription_status: subscriptionEvent.status,
            subscription_start_date: new Date(subscriptionEvent.current_period_start * 1000).toISOString(),
            next_billing_date: new Date(subscriptionEvent.current_period_end * 1000).toISOString(),
            subscription_plan: roleEvent,
            payment_provider: 'stripe',
            payment_provider_subscription_id: subscriptionEvent.id,
            payment_provider_customer_id: subscriptionEvent.customer,
          })
          .eq('id', userId)

        if (profileEventError) {
          console.error('Error actualizando perfil:', profileEventError)
          throw profileEventError
        }

        console.log('Suscripción procesada correctamente')
        break
      }

      // -------------------------------------------------------------------
      //  customer.subscription.deleted
      // -------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object
        console.log('Procesando cancelación de suscripción:', deletedSubscription)

        // Buscar user_id en 'stripe_customers'
        const { data: deletedCustomerData, error: deletedCustomerError } = await supabase
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', deletedSubscription.customer)
          .single()

        if (deletedCustomerError) {
          console.error('Error obteniendo cliente para cancelación:', deletedCustomerError)
          throw deletedCustomerError
        }

        // Actualizar 'stripe_subscriptions' con el nuevo estado
        const { error: deleteSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .update({
            status: deletedSubscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', deletedSubscription.id)

        if (deleteSubscriptionError) {
          console.error('Error actualizando suscripción cancelada:', deleteSubscriptionError)
          throw deleteSubscriptionError
        }

        // Dejar el perfil como 'FREE'
        const { error: deleteProfileError } = await supabase
          .from('user_profiles')
          .update({
            role: 'FREE',
            subscription_status: 'canceled',
            subscription_plan: 'FREE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', deletedCustomerData.user_id)

        if (deleteProfileError) {
          console.error('Error actualizando perfil cancelado:', deleteProfileError)
          throw deleteProfileError
        }

        console.log('Cancelación de suscripción procesada correctamente')
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Error procesando webhook:', err)
    return new Response(
      JSON.stringify({ 
        error: {
          message: err.message,
          stack: err.stack,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
