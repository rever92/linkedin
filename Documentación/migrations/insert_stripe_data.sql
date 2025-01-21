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

-- Insertar productos
insert into stripe_products (stripe_product_id, name, description, metadata)
values 
    ('prod_RTi98cnP42rnkc', 'Premium', 'Plan Premium con funcionalidades avanzadas', '{"role": "PREMIUM"}'::jsonb),
    ('prod_RTi8qRvpW8dlnV', 'Pro', 'Plan Pro con todas las funcionalidades', '{"role": "PRO"}'::jsonb)
on conflict (stripe_product_id) 
do update set 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata,
    active = true;

-- Insertar precios
insert into stripe_prices (stripe_price_id, stripe_product_id, currency, interval, interval_count, unit_amount)
values 
    ('price_1QakiwAo452W2cfXfMzwuTFw', 'prod_RTi98cnP42rnkc', 'eur', 'month', 1, 499),
    ('price_1QakicAo452W2cfXroAYro1j', 'prod_RTi8qRvpW8dlnV', 'eur', 'month', 1, 1499)
on conflict (stripe_price_id) 
do update set 
    stripe_product_id = EXCLUDED.stripe_product_id,
    currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    interval_count = EXCLUDED.interval_count,
    unit_amount = EXCLUDED.unit_amount,
    active = true;

-- Verificar que los datos se insertaron correctamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.stripe_products 
        WHERE stripe_product_id IN ('prod_RTi98cnP42rnkc', 'prod_RTi8qRvpW8dlnV')
        AND active = true
    ) THEN
        RAISE EXCEPTION 'Error: No se encontraron los productos esperados';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.stripe_prices 
        WHERE stripe_price_id IN ('price_1QakiwAo452W2cfXfMzwuTFw', 'price_1QakicAo452W2cfXroAYro1j')
        AND active = true
    ) THEN
        RAISE EXCEPTION 'Error: No se encontraron los precios esperados';
    END IF;
END $$;

-- Si todo está bien, confirmar la transacción
COMMIT;

-- Si algo falla, la transacción se revertirá automáticamente (ROLLBACK) 