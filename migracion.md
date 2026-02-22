# Despliegue en VPS (Plesk + Node.js)

## Resumen

La app es un solo proceso Node.js que sirve la API + el frontend estático.
En produccion, `npm start` arranca Express en un puerto, y Plesk hace de reverse proxy.

---

## 1. Preparar el build en local

```bash
# Desde la raiz del proyecto
npm run build
```

Esto genera la carpeta `dist/` con el frontend compilado.

---

## 2. Subir archivos al VPS

### Opcion A: Git (recomendado)

En el VPS, dentro del directorio del subdominio:

```bash
git pull origin master
npm install --production
npm run build
```

> Si es la primera vez: `git clone https://github.com/rever92/linkedin .`

### Opcion B: Subir manualmente (SFTP / File Manager de Plesk)

Sube estos archivos/carpetas al directorio del subdominio:

```
server/          (todo el directorio)
dist/            (generado por npm run build)
package.json
package-lock.json
vite.config.ts   (solo si haces build en el VPS)
src/             (solo si haces build en el VPS)
tsconfig*.json   (solo si haces build en el VPS)
public/          (solo si haces build en el VPS)
index.html       (solo si haces build en el VPS)
```

**NO subir:** `node_modules/`, `.env*`, `tablas/`

---

## 3. Configurar variables de entorno

En Plesk, ve a: **Subdominio > Node.js > Environment Variables**

Configura estas variables:

```
NODE_ENV=production
PORT=3001

# MongoDB - usar la URI de tu MongoDB en el VPS o MongoDB Atlas
MONGODB_URI=mongodb://localhost:27017/linksight

# JWT
JWT_SECRET=<tu-secreto-jwt-largo-y-aleatorio>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de la app (tu subdominio)
APP_URL=https://tu-subdominio.tudominio.com
```

> Si Plesk no permite env vars desde el panel, crea el archivo `server/.env` directamente en el VPS.

---

## 4. Configurar Node.js en Plesk

En **Subdominio > Node.js**:

| Campo | Valor |
|---|---|
| Node.js version | 18+ (la que tengas) |
| Document root | / (raiz del subdominio) |
| Application root | / (raiz del subdominio) |
| Application startup file | **server/index.js** |
| Application mode | production |

Pulsa **Enable Node.js** si no esta activo.

---

## 5. Instalar dependencias en el VPS

Desde el panel de Plesk (boton "NPM Install") o por SSH:

```bash
cd /var/www/vhosts/tudominio.com/tu-subdominio
npm install --production
```

---

## 6. Build del frontend (si subes el codigo fuente)

Si clonaste el repo y no subiste `dist/`:

```bash
npm install          # necesita devDependencies para build
npm run build
```

---

## 7. Migrar datos al MongoDB del VPS

### Opcion A: mongodump/mongorestore (mas rapido)

En tu PC local:

```bash
# Exportar la base de datos local
mongodump --db linksight --out ./dump
```

Sube la carpeta `dump/` al VPS y restaura:

```bash
mongorestore --db linksight ./linksight
```

### Opcion B: Ejecutar el script de migracion

Si usas MongoDB Atlas (accesible desde el VPS), puedes ejecutar el script directamente:

```bash
node server/scripts/migrate-from-supabase.js --clean
```

> Asegurate de que `MONGODB_URI` en `server/.env` apunte a la base correcta.

---

## 8. Configurar Stripe webhook

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Actualiza (o crea) el endpoint:
   - URL: `https://tu-subdominio.tudominio.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copia el nuevo `Signing secret` (whsec_...) y ponlo como `STRIPE_WEBHOOK_SECRET`

---

## 9. Reiniciar y verificar

1. En Plesk > Node.js, pulsa **Restart App**
2. Abre `https://tu-subdominio.tudominio.com`
3. Verifica:
   - La pagina carga (frontend servido por Express)
   - Login funciona (API + MongoDB conectados)
   - Los posts aparecen en el dashboard (datos migrados)
   - PWA: aparece el icono de instalar en Chrome

---

## 10. Troubleshooting

### La app no arranca
- Revisa los logs en Plesk > Node.js > Logs (o `/var/www/vhosts/.../logs/`)
- Verifica que `server/index.js` es el startup file
- Comprueba que MongoDB esta corriendo: `mongosh` o `systemctl status mongod`

### Error 502 Bad Gateway
- Plesk no puede conectar con el proceso Node. Verifica el puerto y que la app arranco sin errores

### Los assets no cargan (CSS/JS)
- Verifica que `dist/` existe y contiene archivos
- Comprueba que `NODE_ENV=production` esta configurado (para que Express sirva static files)

### MongoDB connection refused
- Asegurate de que MongoDB esta instalado y corriendo en el VPS
- Alternativa: usar [MongoDB Atlas](https://cloud.mongodb.com) (free tier) y apuntar `MONGODB_URI` ahi

### Stripe webhook falla
- Verifica que `STRIPE_WEBHOOK_SECRET` es el correcto para la URL del VPS
- El webhook necesita raw body, ya configurado en `server/index.js`

---

## Estructura en produccion

```
tu-subdominio/
  server/
    index.js          <-- startup file
    .env              <-- variables de entorno (crear en VPS)
    models/
    routes/
    middleware/
    config/
  dist/               <-- frontend compilado
    index.html
    assets/
    icons/
    manifest.webmanifest
    sw.js
  node_modules/
  package.json
```

Express sirve todo desde un solo puerto:
- `/api/*` -> rutas del backend
- `/*` -> archivos estaticos de `dist/`
