import { Session } from '@supabase/supabase-js';

// Declaración de tipos para chrome
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (extensionId: string, message: any) => Promise<any>;
      };
    };
  }
  var chrome: Window['chrome'];
}

// Reemplaza esto con el ID que copiaste de chrome://extensions/
const EXTENSION_ID = 'akfigmhfdpiimkoahgglfdkadgiinhno'; 

let sessionSent = false;

// Función de utilidad para verificar el estado de la extensión
const checkExtensionAvailability = () => {
  const details = {
    chromeExists: typeof chrome !== 'undefined',
    runtimeExists: typeof chrome !== 'undefined' && !!chrome.runtime,
    sendMessageExists: typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage,
    extensionId: EXTENSION_ID
  };

  console.log('📊 [Extension] Estado de disponibilidad:', details);
  return details.chromeExists && details.runtimeExists && details.sendMessageExists;
};

export const sendAuthToExtension = async (session: Session | null) => {
  if (!session) {
    console.log('📝 [Extension] No hay sesión para enviar');
    return;
  }

  // Verificar disponibilidad antes de intentar enviar
  if (!checkExtensionAvailability()) {
    console.log('❌ [Extension] No se puede enviar la sesión: API de Chrome no disponible');
    return;
  }

  try {
    console.log('📝 [Extension] Intentando enviar sesión a la extensión...');
    console.log('📝 [Extension] Estado de la sesión:', {
      hasAccessToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token,
      hasUser: !!session.user,
      userId: session.user?.id
    });
    
    const response = await chrome.runtime.sendMessage(
      EXTENSION_ID,
      {
        type: 'AUTH_SUCCESS',
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user
        }
      }
    );

    console.log('✅ [Extension] Sesión enviada correctamente:', {
      responseReceived: !!response,
      responseType: typeof response,
      responseDetails: response
    });
    sessionSent = true;
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Error desconocido',
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      extensionId: EXTENSION_ID
    };
    
    console.log('❌ [Extension] Error al enviar datos:', errorDetails);
    sessionSent = false;
  }
};

export const checkExtensionSync = async (session: Session | null) => {
  if (!session) {
    console.log('📝 [Extension] No hay sesión para verificar');
    return;
  }

  console.log('📝 [Extension] Iniciando verificación de sincronización...');
  
  // Verificar disponibilidad antes de intentar sincronizar
  if (!checkExtensionAvailability()) {
    console.log('❌ [Extension] No se puede verificar sincronización: API de Chrome no disponible');
    return;
  }

  try {
    console.log('📝 [Extension] Enviando solicitud de verificación...');
    
    const response = await chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type: 'CHECK_SYNC' }
    );

    console.log('📝 [Extension] Respuesta de verificación recibida:', {
      responseReceived: !!response,
      responseType: typeof response,
      syncStatus: response?.synced
    });

    if (!response || !response.synced) {
      console.log('📝 [Extension] Sincronización necesaria, enviando datos...');
      sessionSent = false;
      await sendAuthToExtension(session);
    } else {
      console.log('✅ [Extension] Extensión sincronizada correctamente');
    }
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Error desconocido',
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      isExtensionInstalled: checkExtensionAvailability(),
      extensionId: EXTENSION_ID,
      timestamp: new Date().toISOString()
    };
    
    console.log('❌ [Extension] Error al verificar sincronización:', errorDetails);
    sessionSent = false;
  }
};