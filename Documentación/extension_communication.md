# Documentación de Comunicación con la Extensión de Chrome

## Resumen
La aplicación web se comunica con la extensión de Chrome para mantener sincronizada la información de autenticación. Esta comunicación se realiza mediante el sistema de mensajes de Chrome (`chrome.runtime.sendMessage`).

## ID de la Extensión
La extensión debe estar registrada con el siguiente ID:
```javascript
const EXTENSION_ID = 'doenkplbeocjbahgmieaeghpmeglaaoc';
```

## Tipos de Mensajes

### 1. Verificación de Sincronización
**Enviado por la web app:**
```javascript
{
  type: 'CHECK_SYNC'
}
```

**Respuesta esperada de la extensión:**
```javascript
{
  synced: boolean // true si la extensión ya tiene los datos de sesión, false si necesita actualización
}
```

### 2. Envío de Datos de Autenticación
**Enviado por la web app:**
```javascript
{
  type: 'AUTH_SUCCESS',
  session: {
    access_token: string,
    refresh_token: string,
    user: {
      // Datos del usuario de Supabase
    }
  }
}
```

**Respuesta esperada de la extensión:**
Cualquier respuesta que confirme la recepción (puede ser un simple `{ success: true }`).

## Momentos de Sincronización
La web app intenta sincronizar con la extensión en los siguientes momentos:

1. Cuando el usuario inicia sesión
2. Cuando cambia la ruta en la aplicación
3. Cuando se recarga la página
4. Cuando la sesión cambia por cualquier motivo

## Implementación en la Extensión

### 1. Configuración del Manifest
En el `manifest.json` de la extensión, asegúrate de incluir los permisos necesarios:

```json
{
  "permissions": [
    "runtime"
  ],
  "externally_connectable": {
    "matches": [
      "*://tu-dominio.com/*",
      "*://localhost/*"  // Para desarrollo
    ]
  }
}
```

### 2. Manejo de Mensajes
En el background script de la extensión, implementa el siguiente listener:

```javascript
chrome.runtime.onMessageExternal.addListener(
  async (message, sender, sendResponse) => {
    // Verificar que el mensaje viene de tu dominio
    if (!sender.url.includes('tu-dominio.com')) {
      return;
    }

    switch (message.type) {
      case 'CHECK_SYNC':
        // Verificar si ya tienes los datos de sesión almacenados
        const hasSession = await checkStoredSession(); // Implementa esta función
        sendResponse({ synced: hasSession });
        break;

      case 'AUTH_SUCCESS':
        // Almacenar los datos de sesión
        await storeSession(message.session); // Implementa esta función
        sendResponse({ success: true });
        break;
    }
  }
);
```

### 3. Almacenamiento de Datos
Se recomienda almacenar los datos de sesión de forma segura:

```javascript
async function storeSession(session) {
  await chrome.storage.local.set({
    'auth_session': session,
    'last_sync': new Date().toISOString()
  });
}

async function checkStoredSession() {
  const data = await chrome.storage.local.get(['auth_session']);
  return !!data.auth_session;
}
```

## Flujo de Comunicación

1. La web app verifica la sincronización enviando `CHECK_SYNC`
2. La extensión responde si necesita los datos (`synced: false`) o no (`synced: true`)
3. Si se necesita sincronización, la web app envía `AUTH_SUCCESS` con los datos
4. La extensión almacena los datos y confirma la recepción

## Manejo de Errores

La extensión debe:
1. Validar el origen de los mensajes
2. Manejar casos donde los datos de sesión estén incompletos
3. Implementar reintentos si el almacenamiento falla
4. Mantener logs de errores para debugging

## Seguridad

Consideraciones importantes:
1. Verificar siempre el origen de los mensajes
2. No almacenar datos sensibles en `localStorage`
3. Implementar encriptación si es necesario
4. Limpiar datos cuando el usuario cierra sesión
5. Validar la integridad de los datos recibidos

## Testing

Se recomienda probar los siguientes escenarios:
1. Sincronización inicial
2. Recargas de página
3. Cambios de ruta
4. Cierre de sesión
5. Errores de conexión
6. Datos de sesión inválidos 