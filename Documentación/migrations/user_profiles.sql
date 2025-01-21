-- Añadir columnas para suscripciones si no existen
DO $$ 
BEGIN
    -- Añadir columna role si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'FREE';
    END IF;

    -- Añadir columna subscription_start si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'subscription_start') THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_start timestamptz;
    END IF;

    -- Añadir columna subscription_end si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'subscription_end') THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_end timestamptz;
    END IF;

    -- Añadir columna subscription_status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_status text DEFAULT 'free';
    END IF;

END $$;

-- Limpiar valores existentes que no cumplan con las restricciones
UPDATE user_profiles 
SET role = 'FREE' 
WHERE role NOT IN ('FREE', 'PREMIUM', 'PRO') OR role IS NULL;

UPDATE user_profiles 
SET subscription_status = 'free' 
WHERE subscription_status NOT IN ('free', 'trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused', 'paid') 
OR subscription_status IS NULL;

UPDATE user_profiles 
SET subscription_plan = NULL 
WHERE subscription_plan NOT IN ('FREE', 'PREMIUM', 'PRO');

-- Eliminar restricciones existentes si existen
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_status_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_plan_check;

-- Añadir restricciones actualizadas
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('FREE', 'PREMIUM', 'PRO'));

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_subscription_status_check 
CHECK (subscription_status IN ('free', 'trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused', 'paid'));

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_subscription_plan_check 
CHECK (subscription_plan IN ('FREE', 'PREMIUM', 'PRO') OR subscription_plan IS NULL); 