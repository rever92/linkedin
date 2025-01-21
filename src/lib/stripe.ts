import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Asegúrate de que la clave pública de Stripe está definida
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublicKey) {
    console.error('La clave pública de Stripe no está definida en las variables de entorno');
}

const stripePromise = loadStripe(stripePublicKey);

export interface Price {
    id: string;
    stripe_price_id: string;
    active: boolean;
    currency: string;
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    unit_amount: number;
    product: {
        name: string;
        description: string | null;
    };
}

export async function getActiveProducts(): Promise<Price[]> {
    try {
        // Primero, obtener los precios activos
        const { data: prices, error: pricesError } = await supabase
            .from('stripe_prices')
            .select('*, stripe_product_id')
            .eq('active', true)
            .order('unit_amount');

        if (pricesError) {
            console.error('Error obteniendo precios:', pricesError);
            throw pricesError;
        }

        if (!prices) return [];

        // Luego, obtener los productos correspondientes
        const { data: products, error: productsError } = await supabase
            .from('stripe_products')
            .select('*')
            .in('stripe_product_id', prices.map(price => price.stripe_product_id));

        if (productsError) {
            console.error('Error obteniendo productos:', productsError);
            throw productsError;
        }

        // Combinar los resultados
        const pricesWithProducts = prices.map(price => ({
            ...price,
            product: products?.find(p => p.stripe_product_id === price.stripe_product_id) || {
                name: 'Producto no encontrado',
                description: null
            }
        }));

        return pricesWithProducts;
    } catch (error) {
        console.error('Error cargando precios:', error);
        return [];
    }
}

export async function createCheckoutSession(priceId: string) {
    try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { price_id: priceId }
        });

        if (error) {
            console.error('Error de función:', error);
            throw error;
        }

        if (!data || !data.session) {
            console.error('Respuesta inválida:', data);
            throw new Error('No se recibió una sesión válida');
        }

        return data.session;
    } catch (error) {
        console.error('Error creando sesión de checkout:', error);
        throw error;
    }
}

export async function createPortalSession() {
    try {
        const { data: { url }, error } = await supabase.functions.invoke('create-portal-session', {
            body: {}
        });

        if (error) throw error;
        return url;
    } catch (error) {
        console.error('Error creando sesión del portal:', error);
        throw error;
    }
}

export { stripePromise }; 