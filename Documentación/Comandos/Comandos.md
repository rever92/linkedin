# Cambiar a usuario pro
UPDATE user_profiles
SET subscription_plan = 'pro',     -- En minúsculas según el constraint
    subscription_status = 'active',
    role = 'PRO',                  -- En mayúsculas según el constraint
    subscription_start_date = now(),
    next_billing_date = (now() + interval '1 month'),
    updated_at = now(),
    subscription_payment_status = 'paid'
WHERE id = 'ef437f47-040e-410b-a1b9-84004b850c8f';