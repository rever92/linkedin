# Linksight

Plataforma de analytics y optimizacion de contenido para LinkedIn. Analiza el rendimiento de tus publicaciones, optimiza tu contenido con IA y planifica tu estrategia.

PWA installable con soporte offline.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + MongoDB (Mongoose)
- **Auth**: JWT (access token 15min + refresh token 7d con rotacion)
- **Pagos**: Stripe (checkout, portal, webhooks)
- **IA**: Google Gemini API (optimizacion de posts, analisis de perfil, categorizacion)
- **PWA**: vite-plugin-pwa + Workbox (installable, cache del shell, offline)

## Requisitos

- **Node.js** >= 18
- **MongoDB** corriendo en local (puerto 27017) o remoto
- Claves de **Stripe** (publishable + secret + webhook secret)
- Clave de **Google Gemini API**

## Instalacion

```bash
git clone https://github.com/rever92/linkedin.git
cd linkedin
npm install
```

## Configuracion

### Backend (`server/.env`)

```env
MONGODB_URI=mongodb://localhost:27017/linksight
JWT_SECRET=cadena-aleatoria-larga-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### Frontend (`.env.development`)

```env
VITE_API_URL=/api
VITE_GEMINI_API_KEY=tu-clave-gemini
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Frontend produccion (`.env.production`)

```env
VITE_API_URL=/api
VITE_GEMINI_API_KEY=tu-clave-gemini
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

Las variables `VITE_*` se incrustan en el build. Deben existir antes de ejecutar `npm run build`.

## Desarrollo

```bash
npm run dev:all
```

Arranca frontend (Vite, puerto 5173) y backend (Express + nodemon, puerto 3001) simultaneamente. Las peticiones a `/api` se redirigen al backend via proxy en `vite.config.ts`.

Abrir `http://localhost:5173`.

## Funcionalidades

### Analytics de LinkedIn
- Importacion de datos via CSV o extension de Chrome
- Dashboard con metricas: visualizaciones, reacciones, comentarios, compartidos
- Analisis por tipo de contenido, horarios y tendencias
- Categorizacion automatica de posts con Gemini AI

### Optimizacion con IA
- Analisis completo del perfil con recomendaciones personalizadas
- Optimizacion de posts (compara original vs version optimizada)
- Recomendaciones de contenido, horarios, frecuencia y engagement
- Historial de analisis con limites segun plan

### Planificador de contenido
- Crear, editar y programar publicaciones
- Filtros por estado (borrador, listo, planificado) y ordenacion
- Programacion por fecha y hora
- Vista de posts del dia destacados

### Planes y suscripciones
- Tres planes: Free, Pro, Business
- Integracion completa con Stripe (checkout, portal de cliente, webhooks)
- Limites de uso por plan (analisis de perfil, optimizaciones, categorizaciones)
- Si Stripe no esta configurado, la app funciona sin pagos

### PWA
- Installable en movil y escritorio
- Cache del shell (JS, CSS, HTML, iconos)
- Soporte offline basico
- Manifest con iconos 192x192 y 512x512

### Extension de Chrome
- Sincronizacion de sesion con la extension para scrapear datos de LinkedIn

## Despliegue en VPS (Plesk + Node.js)

### 1. Subir codigo

```bash
# En el VPS, dentro del directorio del subdominio (/httpdocs)
git pull origin master
npm install
```

### 2. Crear `.env.production` en la raiz

```env
VITE_API_URL=/api
VITE_GEMINI_API_KEY=tu-clave-gemini
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Build

Desde Plesk: **Run Script** > `build`, o por SSH:

```bash
npm run build
```

### 4. Variables de entorno del backend

Configurar en **Plesk > Node.js > Environment Variables** (no usar .env en produccion):

- `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `APP_URL=https://tu-dominio.com`
- `NODE_ENV=production`

### 5. Configuracion de Plesk Node.js

| Campo | Valor |
|---|---|
| Application startup file | `server/index.js` |
| Document root | `/httpdocs/dist` |
| Application root | `/httpdocs` |

### 6. Restart App

Pulsar **Restart App** en Plesk.

### Fix: SPA routing con Apache (.htaccess)

Plesk usa Apache delante de Node.js. Cuando el usuario navega a `/login` o `/analysis`, Apache busca esos archivos en `dist/` y da 500 porque no existen (es una SPA).

El fix es el archivo `public/.htaccess` que se copia a `dist/` en cada build:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # NO tocar /api/ - dejar que lleguen a Node.js
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^ - [L]

  # Archivos y directorios existentes se sirven directamente
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Todo lo demas -> index.html (SPA fallback)
  RewriteRule ^ index.html [L]
</IfModule>
```

Sin este archivo, cualquier ruta que no sea `/` da error 500 en produccion. El archivo vive en `public/` para que Vite lo copie automaticamente a `dist/` con cada build.

### Stripe webhook

Actualizar en [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks):

- URL: `https://tu-dominio.com/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## Scripts

| Script | Descripcion |
|---|---|
| `npm run dev` | Frontend dev (Vite, puerto 5173) |
| `npm run dev:server` | Backend dev (nodemon, puerto 3001) |
| `npm run dev:all` | Frontend + backend simultaneos |
| `npm run build` | Build de produccion (dist/) |
| `npm start` | Servidor de produccion |
| `node server/scripts/reset-password.js <email> <pass>` | Resetear contraseña de usuario |
| `node server/scripts/migrate-from-supabase.js` | Migrar datos desde CSV de Supabase |

## API

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refrescar token |
| GET | `/api/auth/me` | Perfil del usuario |
| POST | `/api/auth/logout` | Cerrar sesion |
| GET | `/api/posts` | Posts de LinkedIn del usuario |
| POST | `/api/posts/upsert` | Upsert batch de posts |
| PUT | `/api/posts/:url/category` | Actualizar categoria |
| GET | `/api/premium/limits` | Limites del plan |
| GET | `/api/premium/usage` | Uso mensual |
| GET | `/api/premium/cycle-usage` | Uso del ciclo |
| POST | `/api/premium/actions` | Registrar accion premium |
| GET | `/api/products` | Productos y precios activos |
| POST | `/api/stripe/checkout` | Crear sesion de checkout |
| POST | `/api/stripe/portal` | Portal de facturacion |
| POST | `/api/stripe/webhook` | Webhook de Stripe |
| GET | `/api/planner/posts` | Posts del planificador |
| POST | `/api/planner/posts` | Crear post |
| PUT | `/api/planner/posts/:id` | Actualizar post |
| POST | `/api/planner/posts/:id/optimizations` | Guardar optimizacion |
| GET | `/api/recommendations/latest` | Ultima recomendacion |
| POST | `/api/recommendations` | Guardar recomendacion |

## Estructura

```
linkedin/
  src/                    # Frontend React + TypeScript
    components/           # Componentes UI (Analysis, Planner, Auth, etc.)
    hooks/                # useAuth, useUserRole, usePremiumActions
    lib/                  # ApiClient, stripe, theme, extensionCommunication
    types/                # TypeScript types (auth, posts)
  server/                 # Backend Express
    config/               # Conexion MongoDB
    middleware/            # Auth JWT, error handler
    models/               # Mongoose: User, LinkedInPost, PlannerPost, etc.
    routes/               # auth, posts, premium, stripe, planner, recommendations
    scripts/              # migrate-from-supabase, reset-password
  public/                 # Assets estaticos (iconos PWA, .htaccess, favicon)
  dist/                   # Build de produccion (generado, en .gitignore)
```
