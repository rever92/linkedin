import React, { useEffect, useState } from 'react';
import { Price, createCheckoutSession, getActiveProducts } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Check, Timer, Lock } from 'lucide-react';
import Spinner from './ui/spinner';

interface PlanFeature {
    name: string;
    limit: string;
    unit: string;
    extra?: string;
}

interface Plan {
    name: string;
    price: string;
    interval: string;
    description?: string;
    features: PlanFeature[];
}

const plans: Record<string, Plan> = {
    free: {
        name: "Gratis",
        price: "0",
        interval: "mes",
        description: "Planifica todas las publicaciones que quieras y publica desde Linksight GRATIS PARA SIEMPRE",
        features: [
            { name: "Optimizador de posts", limit: "1", unit: "optimización/mes" },
            { name: "Análisis del perfil y recomendaciones", limit: "0", unit: "análisis/mes" },
            { name: "Generación de imágenes", limit: "1", unit: "imagen/mes" },
            { name: "Extracción de temas de posts", limit: "0", unit: "extracciones/mes" },
            { name: "Scrapeo de posts con la extensión de Chrome", limit: "1", unit: "scrapeo/mes" }
        ]
    },
    premium: {
        name: "Premium",
        price: "4,99",
        interval: "mes",
        features: [
            { name: "Optimizador de posts", limit: "8", unit: "optimizaciones/mes", extra: "máx. 2 por publicación" },
            { name: "Análisis del perfil y recomendaciones", limit: "3", unit: "análisis/mes", extra: "máx. 1 por día" },
            { name: "Generación de imágenes", limit: "10", unit: "imágenes/mes" },
            { name: "Extracción de temas de posts", limit: "10", unit: "extracciones/mes" },
            { name: "Scrapeo de posts con la extensión de Chrome", limit: "3", unit: "scrapeos/mes" }
        ]
    },
    pro: {
        name: "Pro",
        price: "14,99",
        interval: "mes",
        features: [
            { name: "Optimizador de posts", limit: "60", unit: "optimizaciones/mes", extra: "máx. 5 por publicación" },
            { name: "Análisis del perfil y recomendaciones", limit: "10", unit: "análisis/mes", extra: "máx. 1 por día" },
            { name: "Generación de imágenes", limit: "30", unit: "imágenes/mes" },
            { name: "Extracción de temas de posts", limit: "∞", unit: "extracciones/mes" },
            { name: "Scrapeo de posts con la extensión de Chrome", limit: "∞", unit: "scrapeos/mes" }
        ]
    }
};

const FeatureIcon: React.FC<{ feature: PlanFeature; planType: 'free' | 'premium' | 'pro' }> = ({ feature, planType }) => {
    if (planType === 'free') {
        if (feature.limit === '0') {
            return <Lock className="h-6 w-6 text-gray-400" />;
        }
        return <Timer className="h-6 w-6 text-orange-400" />;
    }
    return <Check className="h-6 w-6 text-green-500" />;
};

const PricingCard: React.FC<{
    plan: typeof plans.free;
    isPopular?: boolean;
    onSubscribe?: () => void;
    loading?: boolean;
    type: 'free' | 'premium' | 'pro';
}> = ({ plan, isPopular, onSubscribe, loading, type }) => (
    <div className={`bg-white rounded-[25px] shadow-lg border border-gray-200 relative ${isPopular ? 'scale-105' : ''}`}>
        {isPopular && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-8 py-2 rounded-full text-sm font-medium">
                    Más popular
                </span>
            </div>
        )}
        <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-extrabold text-gray-900">{plan.price}€</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">/{plan.interval}</span>
            </div>
            {plan.description && (
                <p className="mt-4 text-sm text-gray-600 font-medium">
                    {plan.description}
                </p>
            )}
            <ul className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                            <FeatureIcon feature={feature} planType={type} />
                        </div>
                        <div className="ml-3">
                            <p className="text-base text-gray-600">{feature.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold ai-gradient-text">
                                    {feature.limit}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {feature.unit}
                                </span>
                                {feature.extra && (
                                    <span className="text-xs text-gray-400 ml-1">
                                        ({feature.extra})
                                    </span>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            {onSubscribe && (
                <button
                    onClick={onSubscribe}
                    disabled={loading}
                    className={`mt-8 block w-full ${
                        loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-semibold py-4 px-6 rounded-[25px] transition duration-150 ease-in-out`}
                >
                    {loading ? 'Procesando...' : plan.price === "0" ? 'Empezar gratis' : 'Suscribirse'}
                </button>
            )}
        </div>
    </div>
);

const Pricing: React.FC = () => {
    const [prices, setPrices] = useState<Price[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [processingSubscription, setProcessingSubscription] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        fetchPrices();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchPrices = async () => {
        try {
            const prices = await getActiveProducts();
            setPrices(prices);
        } catch (error) {
            console.error('Error cargando precios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (price: Price) => {
        try {
            setProcessingSubscription(true);

            if (!user) {
                window.location.href = '/';
                return;
            }

            const session = await createCheckoutSession(price.stripe_price_id);
            if (session?.url) {
                window.location.href = session.url;
            } else {
                throw new Error('No se recibió una URL de checkout válida');
            }
        } catch (error) {
            console.error('Error al iniciar suscripción:', error);
            alert('Hubo un error al procesar tu suscripción. Por favor, intenta de nuevo.');
        } finally {
            setProcessingSubscription(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="py-12 bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900">
                        Planes de Suscripción
                    </h2>
                    <p className="mt-4 text-xl text-gray-600">
                        Elige el plan que mejor se adapte a tus necesidades
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
                    <PricingCard 
                        plan={plans.free}
                        type="free"
                    />
                    <PricingCard 
                        plan={plans.premium}
                        type="premium"
                        isPopular={true}
                        onSubscribe={() => {
                            const premiumPrice = prices.find(p => p.product.name.toLowerCase().includes('premium'));
                            if (premiumPrice) handleSubscribe(premiumPrice);
                        }}
                        loading={processingSubscription}
                    />
                    <PricingCard 
                        plan={plans.pro}
                        type="pro"
                        onSubscribe={() => {
                            const proPrice = prices.find(p => p.product.name.toLowerCase().includes('pro'));
                            if (proPrice) handleSubscribe(proPrice);
                        }}
                        loading={processingSubscription}
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing; 