-- Comenzar una transacción para asegurar que todo se ejecuta o nada
BEGIN;

-- Desactivar todos los productos y precios existentes
UPDATE public.stripe_products SET active = false;
UPDATE public.stripe_prices SET active = false;

-- Eliminar suscripciones antiguas (opcional, comentado por seguridad)
-- DELETE FROM public.stripe_subscriptions;

-- Eliminar precios antiguos (opcional, comentado por seguridad)
-- DELETE FROM public.stripe_prices;

-- Eliminar productos antiguos (opcional, comentado por seguridad)
-- DELETE FROM public.stripe_products;

-- Insertar o actualizar productos de prueba
INSERT INTO public.stripe_products (stripe_product_id, name, description, active)
VALUES 
    ('prod_RTjNt59qRzUQC2', 'Premium', 'Plan Premium con funcionalidades avanzadas', true),
    ('prod_RTjNXN9DP2i1SF', 'Pro', 'Plan Pro con funcionalidades ilimitadas', true)
ON CONFLICT (stripe_product_id) 
DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = now();

-- Insertar o actualizar precios de prueba
INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, active, currency, interval, interval_count, unit_amount)
VALUES 
    ('price_1QaluLAo452W2cfXahBPv9e0', 'prod_RTjNt59qRzUQC2', true, 'eur', 'month', 1, 499),
    ('price_1QaluZAo452W2cfXGHJVfOyI', 'prod_RTjNXN9DP2i1SF', true, 'eur', 'month', 1, 1499)
ON CONFLICT (stripe_price_id) 
DO UPDATE SET 
    active = EXCLUDED.active,
    unit_amount = EXCLUDED.unit_amount,
    updated_at = now();

-- Verificar que los datos se insertaron correctamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.stripe_products 
        WHERE stripe_product_id IN ('prod_RTjNt59qRzUQC2', 'prod_RTjNXN9DP2i1SF')
        AND active = true
    ) THEN
        RAISE EXCEPTION 'Error: No se encontraron los productos de prueba esperados';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.stripe_prices 
        WHERE stripe_price_id IN ('price_1QaluLAo452W2cfXahBPv9e0', 'price_1QaluZAo452W2cfXGHJVfOyI')
        AND active = true
    ) THEN
        RAISE EXCEPTION 'Error: No se encontraron los precios de prueba esperados';
    END IF;
END $$;

-- Si todo está bien, confirmar la transacción
COMMIT;

-- Si algo falla, la transacción se revertirá automáticamente (ROLLBACK) 