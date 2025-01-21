-- Tabla para almacenar los clientes de Stripe
create table if not exists public.stripe_customers (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null unique,
    stripe_customer_id text not null unique,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Políticas RLS
alter table public.stripe_customers enable row level security;

-- Políticas para clientes (usuarios solo pueden ver y actualizar sus propios datos)
create policy "Usuarios pueden ver sus propios datos de cliente"
    on public.stripe_customers for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propios datos de cliente"
    on public.stripe_customers for update
    to authenticated
    using (auth.uid() = user_id);

-- Trigger para actualizar updated_at
create trigger update_stripe_customers_updated_at
    before update on public.stripe_customers
    for each row
    execute function public.update_updated_at_column(); 