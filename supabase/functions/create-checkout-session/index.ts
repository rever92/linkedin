import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

// Verificar variables de entorno
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY no está configurada')
}

const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Verificar que es un POST
    if (req.method !== 'POST') {
      throw new Error(`Método ${req.method} no soportado`)
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variables de entorno de Supabase no configuradas')
      throw new Error('Error de configuración del servidor')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Obtener usuario
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError) {
      console.error('Error obteniendo usuario:', userError)
      throw new Error('Error de autenticación')
    }
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener price_id del body
    const { price_id } = await req.json()
    if (!price_id) {
      throw new Error('No se proporcionó el ID del precio')
    }

    console.log('Procesando checkout para:', {
      user_id: user.id,
      price_id: price_id
    })

    // Obtener o crear el cliente de Stripe
    const { data: customers, error: customersError } = await supabaseClient
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customersError) {
      console.error('Error buscando cliente:', customersError)
    }

    let customerId: string
    if (!customers?.stripe_customer_id) {
      console.log('Creando nuevo cliente en Stripe')
      // Crear nuevo cliente en Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Guardar el ID del cliente en Supabase
      const { error: insertError } = await supabaseClient
        .from('stripe_customers')
        .insert([{ user_id: user.id, stripe_customer_id: customerId }])

      if (insertError) {
        console.error('Error guardando cliente:', insertError)
        throw new Error('Error creando cliente')
      }
    } else {
      customerId = customers.stripe_customer_id
    }

    console.log('Cliente Stripe:', customerId)

    // Crear la sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    console.log('Sesión creada:', session.id)

    return new Response(
      JSON.stringify({ session }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error en create-checkout-session:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 