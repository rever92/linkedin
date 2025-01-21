-- Función para convertir un usuario a PREMIUM por un mes
CREATE OR REPLACE FUNCTION set_user_premium(user_uuid UUID) RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET role = 'PREMIUM',
        subscription_status = 'active',
        subscription_start_date = CURRENT_TIMESTAMP,
        next_billing_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
        subscription_plan = 'PREMIUM',
        payment_provider = 'stripe'
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para convertir un usuario a PRO por un mes
CREATE OR REPLACE FUNCTION set_user_pro(user_uuid UUID) RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET role = 'PRO',
        subscription_status = 'active',
        subscription_start_date = CURRENT_TIMESTAMP,
        next_billing_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
        subscription_plan = 'PRO',
        payment_provider = 'stripe'
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para convertir un usuario a FREE
CREATE OR REPLACE FUNCTION set_user_free(user_uuid UUID) RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET role = 'FREE',
        subscription_status = 'free',
        subscription_start_date = NULL,
        next_billing_date = NULL,
        subscription_plan = NULL,
        payment_provider = NULL
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Ejemplos de uso:
-- SELECT set_user_premium('ef437f47-040e-410b-a1b9-84004b850c8f');
-- SELECT set_user_pro('ef437f47-040e-410b-a1b9-84004b850c8f');
-- SELECT set_user_free('ef437f47-040e-410b-a1b9-84004b850c8f');

-- Query para ver el estado actual de un usuario
-- SELECT id, role, subscription_status, subscription_start_date, next_billing_date, subscription_plan 
-- FROM user_profiles 
-- WHERE id = 'ef437f47-040e-410b-a1b9-84004b850c8f'; 