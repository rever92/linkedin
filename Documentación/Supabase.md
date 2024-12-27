# recommendations
No description available


Language: Javascript
Columns

Name	Format	Type	Description
id	
integer

number	
user_id	
uuid

string	
date_generated	
timestamp with time zone

string	
tipos_de_contenido	
text

string	
mejores_horarios	
text

string	
longitud_optima	
text

string	
frecuencia_recomendada	
text

string	
estrategias_de_engagement	
text

string	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: recommendations, error } = await supabase
  .from('recommendations')
  .select('*')
Read specific columns

let { data: recommendations, error } = await supabase
  .from('recommendations')
  .select('some_column,other_column')
Read referenced tables

let { data: recommendations, error } = await supabase
  .from('recommendations')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: recommendations, error } = await supabase
  .from('recommendations')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: recommendations, error } = await supabase
  .from('recommendations')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('recommendations')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('recommendations')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('recommendations')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('recommendations')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('recommendations')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'recommendations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'recommendations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'recommendations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'recommendations' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'recommendations', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()





  # linkedin_posts
No description available


Language: Javascript
Columns

Name	Format	Type	Description
url	
text

string	
user_id	
uuid

string	
date	
timestamp with time zone

string	
text	
text

string	
views	
integer

number	
likes	
integer

number	
comments	
integer

number	
shares	
integer

number	
post_type	
text

string	
created_at	
timestamp with time zone

string	
updated_at	
timestamp with time zone

string	
category	
text

string	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: linkedin_posts, error } = await supabase
  .from('linkedin_posts')
  .select('*')
Read specific columns

let { data: linkedin_posts, error } = await supabase
  .from('linkedin_posts')
  .select('some_column,other_column')
Read referenced tables

let { data: linkedin_posts, error } = await supabase
  .from('linkedin_posts')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: linkedin_posts, error } = await supabase
  .from('linkedin_posts')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: linkedin_posts, error } = await supabase
  .from('linkedin_posts')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('linkedin_posts')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('linkedin_posts')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('linkedin_posts')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('linkedin_posts')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('linkedin_posts')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'linkedin_posts' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'linkedin_posts' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'linkedin_posts' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'linkedin_posts' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'linkedin_posts', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

  # categorization_events
No description available


Language: Javascript
Columns

Name	Format	Type	Description
id	
integer

number	
user_id	
uuid

string	
created_at	
timestamp with time zone

string	
batch_number	
integer

number	
processed	
boolean

boolean	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: categorization_events, error } = await supabase
  .from('categorization_events')
  .select('*')
Read specific columns

let { data: categorization_events, error } = await supabase
  .from('categorization_events')
  .select('some_column,other_column')
Read referenced tables

let { data: categorization_events, error } = await supabase
  .from('categorization_events')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: categorization_events, error } = await supabase
  .from('categorization_events')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: categorization_events, error } = await supabase
  .from('categorization_events')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('categorization_events')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('categorization_events')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('categorization_events')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('categorization_events')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('categorization_events')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'categorization_events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'categorization_events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'categorization_events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'categorization_events' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'categorization_events', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()




//usuarios y roles
-- Crear la tabla si no existe
create table if not exists public.user_profiles (
 id uuid references auth.users on delete cascade not null primary key,
 role text not null default 'PREMIUM',
 trial_ends_at timestamptz default (now() + interval '15 days'),
 subscription_expiry timestamptz,
 beta_features jsonb,
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 
 constraint role_check check (role in ('FREE', 'PREMIUM', 'PRO', 'BETA_TESTER'))
);

-- Eliminar trigger de trial si existe
drop trigger if exists check_user_trial on user_profiles;

-- Eliminar función de trial si existe
drop function if exists check_trial_expiration;

-- Crear trigger para updated_at (usando la función existente)
drop trigger if exists update_user_profiles_updated_at on user_profiles;
create trigger update_user_profiles_updated_at
 before update on user_profiles
 for each row
 execute function update_updated_at_column();

-- Crear función para verificar trial
create function check_trial_expiration()
returns trigger as $check_trial$
begin
 if new.trial_ends_at < now() and new.role = 'PREMIUM' and new.subscription_expiry is null then
   new.role := 'FREE';
 end if;
 return new;
end;
$check_trial$ language plpgsql;

-- Crear trigger para verificar trial
create trigger check_user_trial
 before update on user_profiles
 for each row
 execute function check_trial_expiration();

-- Políticas RLS
alter table user_profiles enable row level security;

-- Eliminar políticas existentes si las hay
drop policy if exists "Users can view own profile" on user_profiles;
drop policy if exists "Users can update own profile" on user_profiles;

-- Crear nuevas políticas
create policy "Users can view own profile"
 on user_profiles for select
 using ( auth.uid() = id );

create policy "Users can update own profile"
 on user_profiles for update
 using ( auth.uid() = id );

-- Crear extensión pg_cron si no existe
create extension if not exists pg_cron;

-- Manejar la eliminación y creación del job de manera segura
DO $$
BEGIN
   -- Intentar eliminar el job si existe
   PERFORM cron.unschedule('check-expired-trials');
EXCEPTION
   WHEN OTHERS THEN
       -- Ignorar el error si el job no existe
       NULL;
END $$;

-- Crear el nuevo job
select cron.schedule(
 'check-expired-trials',
 '0 0 * * *',
 $$
 update user_profiles 
 set role = 'FREE'
 where trial_ends_at < now() 
   and role = 'PREMIUM' 
   and subscription_expiry is null;
 $$
);


create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;


create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();





# premium_actions
Tabla para el seguimiento global de acciones premium por usuario

Language: Javascript
Columns

Name | Format | Type | Description
--- | --- | --- | ---
id | integer | number | ID único de la acción
user_id | uuid | string | ID del usuario que realizó la acción
action_type | text | string | Tipo de acción (ej: 'profile_analysis', 'post_optimization', etc)
created_at | timestamp with time zone | string | Fecha y hora de la acción
metadata | jsonb | object | Datos adicionales específicos de la acción (ej: post_id, analysis_id, etc)

Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: premium_actions, error } = await supabase
  .from('premium_actions')
  .select('*')

// Ejemplo de consulta para obtener el total de acciones por tipo en el último mes
let { data: monthly_actions, error } = await supabase
  .from('premium_actions')
  .select('action_type, count(*)')
  .eq('user_id', 'user-uuid')
  .gte('created_at', 'now() - interval \'1 month\'')
  .group('action_type')

-- Crear tabla premium_actions
create table if not exists public.premium_actions (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  action_type text not null,
  created_at timestamptz default now(),
  metadata jsonb,
  
  constraint action_type_check check (action_type in ('profile_analysis', 'post_optimization'))
);

-- Políticas RLS
alter table premium_actions enable row level security;

-- Crear políticas
create policy "Users can view own actions"
  on premium_actions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own actions"
  on premium_actions for insert
  with check ( auth.uid() = user_id );

-- Crear índices
create index premium_actions_user_id_idx on premium_actions(user_id);
create index premium_actions_created_at_idx on premium_actions(created_at);
create index premium_actions_action_type_idx on premium_actions(action_type);

-- Función para obtener el conteo mensual de acciones por tipo
create or replace function get_monthly_actions(p_user_id uuid)
returns table (action_type text, count bigint)
language sql
security definer
as $$
  select 
    action_type,
    count(*)
  from premium_actions
  where user_id = p_user_id
    and created_at >= date_trunc('month', current_date)
  group by action_type;
$$;

-- Crear tabla premium_limits
create table if not exists public.premium_limits (
  id bigint generated by default as identity primary key,
  role text not null,
  action_type text not null,
  limit_type text not null,
  limit_value integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint role_check check (role in ('FREE', 'PREMIUM', 'PRO', 'BETA_TESTER')),
  constraint action_type_check check (action_type in ('profile_analysis', 'post_optimization')),
  constraint limit_type_check check (limit_type in ('days_between_analysis', 'max_per_post', 'monthly_limit')),
  unique(role, action_type, limit_type)
);

-- Crear trigger para updated_at
create trigger update_premium_limits_updated_at
  before update on premium_limits
  for each row
  execute function update_updated_at_column();

-- Insertar límites por defecto
insert into premium_limits (role, action_type, limit_type, limit_value)
values
  -- PREMIUM limits
  ('PREMIUM', 'profile_analysis', 'days_between_analysis', 30),
  ('PREMIUM', 'post_optimization', 'max_per_post', 3),
  ('PREMIUM', 'post_optimization', 'monthly_limit', 30),
  -- PRO limits
  ('PRO', 'profile_analysis', 'days_between_analysis', 7),
  ('PRO', 'post_optimization', 'max_per_post', 5),
  ('PRO', 'post_optimization', 'monthly_limit', 100),
  -- FREE limits (todos a 0)
  ('FREE', 'profile_analysis', 'days_between_analysis', 0),
  ('FREE', 'post_optimization', 'max_per_post', 0),
  ('FREE', 'post_optimization', 'monthly_limit', 0)
on conflict (role, action_type, limit_type) do update
  set limit_value = EXCLUDED.limit_value;

-- Función para obtener los límites de un rol
create or replace function get_role_limits(p_role text)
returns table (
  action_type text,
  limit_type text,
  limit_value integer
)
language sql
security definer
as $$
  select 
    action_type,
    limit_type,
    limit_value
  from premium_limits
  where role = p_role;
$$;




