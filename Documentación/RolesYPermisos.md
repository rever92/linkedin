# Sistema de Roles y Permisos

## Estructura de la Base de Datos

La gestión de roles y permisos se maneja a través de la tabla `user_profiles` en Supabase con la siguiente estructura:

```sql
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null default 'FREE',
  is_beta_tester boolean default false,
  trial_ends_at timestamptz default (now() + interval '15 days'),
  subscription_expiry timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint role_check check (role in ('FREE', 'PREMIUM', 'PRO'))
);
```

### Campos Principales
- `role`: Define el nivel de acceso base del usuario ('FREE', 'PREMIUM', 'PRO')
- `is_beta_tester`: Indica si el usuario tiene acceso a funcionalidades en beta
- `trial_ends_at`: Fecha de finalización del período de prueba
- `subscription_expiry`: Fecha de vencimiento de la suscripción

## Tipos de Roles

### Roles Base
1. **FREE**
   - Acceso a funcionalidades básicas
   - Sin acceso a características premium

2. **PREMIUM**
   - Acceso a todas las funcionalidades básicas
   - Acceso a características premium como:
     - Recomendaciones de IA
     - Análisis avanzado
     - Otras funcionalidades premium

3. **PRO**
   - Incluye todas las características de PREMIUM
   - Acceso a funcionalidades adicionales pro (futuras)

### Beta Testers
- Cualquier usuario (FREE, PREMIUM, PRO) puede ser beta tester
- Los beta testers tienen acceso a funcionalidades en desarrollo
- Se gestiona mediante el campo `is_beta_tester`

## Implementación en el Frontend

### Hook useUserRole

El hook `useUserRole` proporciona una interfaz para manejar los roles y permisos:

```typescript
const {
  role,                // Rol actual del usuario
  isBetaTester,        // Si el usuario es beta tester
  hasAccess,           // Función para verificar acceso a funcionalidades
  canAccessBetaFeature // Función para verificar acceso a features beta
} = useUserRole();
```

### Verificación de Acceso

#### Para Funcionalidades Premium
```typescript
if (hasAccess('premium_feature_name')) {
  // Mostrar funcionalidad premium
} else {
  // Mostrar banner de actualización
}
```

#### Para Funcionalidades Beta
```typescript
if (canAccessBetaFeature('beta_feature_name')) {
  // Mostrar funcionalidad beta
} else {
  // Ocultar o deshabilitar la funcionalidad
}
```

### Componentes de UI

#### PremiumBanner
Componente reutilizable para mostrar mensajes de actualización:
```typescript
<PremiumBanner message="Mensaje personalizado para la funcionalidad" />
```

#### HOC withRoleAccess
Higher-Order Component para proteger rutas y componentes:
```typescript
const ProtectedComponent = withRoleAccess(Component, {
  feature: 'feature_name',
  customMessage: 'Mensaje personalizado'
});
```

## Ejemplos de Uso

### Proteger una Funcionalidad Premium
```typescript
const AIRecommendations = () => {
  const { hasAccess } = useUserRole();

  if (!hasAccess('premium_ai_recommendations')) {
    return <PremiumBanner message="Obtén recomendaciones personalizadas..." />;
  }

  return <ComponenteRecomendaciones />;
};
```

### Mostrar/Ocultar Funcionalidad Beta
```typescript
const Sidebar = () => {
  const { canAccessBetaFeature } = useUserRole();

  return (
    <nav>
      {canAccessBetaFeature('beta_planner') && (
        <Link to="/planner">Planificador (Beta)</Link>
      )}
    </nav>
  );
};
```

## Gestión de Permisos

### Nomenclatura de Features
- Features premium: `premium_feature_name`
- Features beta: `beta_feature_name`
- Features básicas: `feature_name`

### Verificación de Acceso Premium
El acceso premium se verifica considerando:
1. Rol del usuario (PREMIUM o PRO)
2. Estado del período de prueba
3. Estado de la suscripción

### Verificación de Acceso Beta
El acceso beta se verifica únicamente por el campo `is_beta_tester`

## Administración

### Actualizar Rol de Usuario
```sql
update user_profiles
set role = 'PREMIUM'
where id = 'USER_ID';
```

### Gestionar Beta Testers
```sql
-- Hacer beta tester
update user_profiles
set is_beta_tester = true
where id = 'USER_ID';

-- Quitar acceso beta
update user_profiles
set is_beta_tester = false
where id = 'USER_ID';
```

## Consideraciones de Seguridad

1. **RLS (Row Level Security)**
   - Implementado en Supabase para proteger los datos de usuario
   - Los usuarios solo pueden ver y modificar su propio perfil

2. **Verificación en Frontend y Backend**
   - El acceso se verifica tanto en el frontend como en el backend
   - Las políticas RLS aseguran que los datos están protegidos incluso si se bypassa el frontend

3. **Expiración Automática**
   - Los períodos de prueba y suscripciones expiran automáticamente
   - Se actualiza el rol a FREE cuando expira la suscripción 