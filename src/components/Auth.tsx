import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';

interface AuthProps {
  onClose?: () => void;
}

// Función para obtener la URL de redirección según el entorno
const getRedirectUrl = () => {
  // Si existe la variable de entorno VITE_AUTH_REDIRECT_URL, úsala
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) {
    console.log('Using redirect URL from env:', import.meta.env.VITE_AUTH_REDIRECT_URL);
    return import.meta.env.VITE_AUTH_REDIRECT_URL;
  }
  
  // Como fallback, usa la URL de origen
  console.log('Using fallback URL:', window.location.origin);
  return window.location.origin;
};

export default function Auth({ onClose }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) throw error;
      
      setMessage({
        type: 'success',
        text: '¡Te hemos enviado un enlace de acceso! Revisa tu correo para continuar.',
      });

      // Si el envío fue exitoso y hay una función onClose, la llamamos después de un delay
      if (onClose) {
        setTimeout(onClose, 3000);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.error_description || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Introduce tu e-mail
          </h2>
          <p className="mt-6 text-center text-1xl text-gray-900">
            Para facilitarte el proceso, Linksight no usa contraseñas. Recibirás un correo con un enlace de acceso.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSendMagicLink}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enviando enlace...' : 'Enviar enlace de acceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}