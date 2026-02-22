# Linksight

Plataforma de analytics y planificacion de contenido para LinkedIn. Permite analizar el rendimiento de tus publicaciones, obtener recomendaciones con IA y planificar tu contenido.

## Requisitos previos

npm run dev:all


- **Node.js** >= 18
- **MongoDB** corriendo en local (puerto 27017) o remoto
- Claves de **Stripe** (publishable + secret + webhook secret)
- Clave de **Google Gemini API**

## Instalacion

```bash
git clone <repo-url>
cd linkedin
npm install
```

## Configuracion

### Backend (`server/.env`)

Crea el archivo `server/.env` con las siguientes variables:

```env
MONGODB_URI=mongodb://localhost:27017/linksight
JWT_SECRET=cambia-esto-por-una-cadena-segura-de-min-32-chars
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

## Desarrollo

Necesitas dos terminales:

**Terminal 1 - Backend (Express + MongoDB):**

```bash
npm run dev:server
```

Arranca el servidor Express en el puerto 3001 con nodemon (auto-reload).

**Terminal 2 - Frontend (Vite):**

```bash
npm run dev
```

Arranca Vite en el puerto 5173. Las peticiones a `/api` se redirigen automaticamente al backend gracias al proxy configurado en `vite.config.ts`.

Abre `http://localhost:5173` en el navegador.

## Produccion

### Build

```bash
npm run build
```

Genera los archivos estaticos en `dist/`.

### Arrancar servidor

```bash
NODE_ENV=production npm start
```

En produccion, Express sirve tanto la API (`/api/*`) como los archivos estaticos desde `dist/`.

### Deploy en VPS con Apache

Configuracion de Apache como reverse proxy:

```apache
ProxyPass /api http://localhost:3001/api
ProxyPassReverse /api http://localhost:3001/api
```

Gestionar el proceso con PM2:

```bash
pm2 start server/index.js --name linksight-api
```

## Estructura del proyecto

```
linkedin/
  src/                    # Frontend React
    components/           # Componentes UI
    hooks/                # Custom hooks (useAuth, useUserRole, usePremiumActions)
    lib/                  # API client, stripe, utils
    types/                # TypeScript types
  server/                 # Backend Express
    config/               # Conexion MongoDB
    middleware/            # Auth JWT, error handler
    models/               # Modelos Mongoose (User, LinkedInPost, PlannerPost, etc.)
    routes/               # Rutas API (auth, posts, premium, stripe, planner, etc.)
    services/             # Logica de negocio (premiumService)
  dist/                   # Build de produccion (generado)
```

## Funcionalidades

### Autenticacion
- Registro e inicio de sesion con email y password
- JWT con access token (15 min) y refresh token (7 dias con rotacion)

### Analytics
- Subida de datos de LinkedIn via CSV
- Dashboard con metricas (visualizaciones, reacciones, comentarios, compartidos)
- Analisis avanzado por tipo de contenido, horarios y tendencias
- Categorizacion automatica de posts con Gemini AI

### Recomendaciones IA
- Analisis completo del perfil con Gemini AI
- Recomendaciones de contenido, horarios, frecuencia y estrategias de engagement
- Historial de analisis con limites segun el plan

### Planificador de contenido
- Crear, editar y programar publicaciones
- Vista de lista y calendario
- Optimizacion de posts con IA (compara original vs optimizado)

### Planes y suscripciones
- Tres planes: Free, Premium y Pro
- Integracion con Stripe (checkout, portal de cliente, webhooks)
- Limites de uso por plan (analisis de perfil, optimizaciones, categorizaciones)

### Extension de Chrome
- Sincronizacion de sesion con la extension de Chrome para scrapear datos de LinkedIn

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refrescar token |
| GET | `/api/auth/me` | Perfil del usuario |
| POST | `/api/auth/logout` | Cerrar sesion |
| GET | `/api/posts` | Posts de LinkedIn del usuario |
| POST | `/api/posts/upsert` | Upsert batch de posts (CSV) |
| PUT | `/api/posts/:url/category` | Actualizar categoria de un post |
| GET | `/api/premium/limits` | Limites del plan actual |
| GET | `/api/premium/usage` | Uso mensual |
| GET | `/api/premium/cycle-usage` | Uso del ciclo de facturacion |
| POST | `/api/premium/actions` | Registrar accion premium |
| GET | `/api/products` | Productos y precios activos |
| POST | `/api/stripe/checkout` | Crear sesion de checkout |
| POST | `/api/stripe/portal` | Crear sesion del portal |
| POST | `/api/stripe/webhook` | Webhook de Stripe |
| GET | `/api/planner/posts` | Posts del planificador |
| POST | `/api/planner/posts` | Crear post |
| PUT | `/api/planner/posts/:id` | Actualizar post |
| GET | `/api/recommendations/latest` | Ultima recomendacion |
| POST | `/api/recommendations` | Guardar recomendacion |

## Scripts disponibles

| Script | Descripcion |
|--------|-------------|
| `npm run dev` | Frontend en modo desarrollo (Vite, puerto 5173) |
| `npm run dev:server` | Backend en modo desarrollo (nodemon, puerto 3001) |
| `npm run build` | Build de produccion |
| `npm start` | Arrancar servidor de produccion |
| `npm run lint` | Linter TypeScript |
