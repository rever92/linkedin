import { loadStripe } from '@stripe/stripe-js';
import { api } from './api';

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
        const products = await api.getActiveProducts();
        return products;
    } catch (error) {
        console.error('Error cargando precios:', error);
        return [];
    }
}

export async function createCheckoutSession(priceId: string) {
    try {
        const data = await api.createCheckoutSession(priceId);

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
        const { url } = await api.createPortalSession();
        return url;
    } catch (error) {
        console.error('Error creando sesión del portal:', error);
        throw error;
    }
}

export { stripePromise };
