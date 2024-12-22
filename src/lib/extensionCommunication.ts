import { Session } from '@supabase/supabase-js';

// Reemplaza esto con el ID que copiaste de chrome://extensions/
const EXTENSION_ID = 'doenkplbeocjbahgmieaeghpmeglaaoc'; 

let sessionSent = false; // Variable para controlar el envío de la sesión

export const sendAuthToExtension = async (session: Session | null) => {
  if (!session || sessionSent) return; // Verificamos si ya se envió la sesión

  sessionSent = true; // Marcamos que la sesión ha sido enviada

  try {
    // Verificamos si estamos en un entorno de navegador que soporta extensiones
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
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
      console.log('Sesión enviada a la extensión correctamente:', response);
    }
  } catch (error) {
    console.log('No se pudo comunicar con la extensión:', error);
  }
};

// Nueva función para verificar la sincronización
export const checkExtensionSync = async (session: Session | null) => {
  if (!session) return;

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const response = await chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: 'CHECK_SYNC' }
      );

      if (!response || !response.synced) {
        await sendAuthToExtension(session);
      }
    }
  } catch (error) {
    console.log('Error al verificar sincronización con la extensión:', error);
  }
};