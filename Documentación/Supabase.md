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




