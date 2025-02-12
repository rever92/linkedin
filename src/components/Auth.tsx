import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthProps {
  onClose?: () => void;
}

// Función para obtener la URL de redirección
const getRedirectUrl = () => {
  const baseUrl = window.location.origin;
  const path = '/auth/callback';
  return `${baseUrl}${path}`;
};

export default function Auth({ onClose }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard/analysis');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);

      // Intentar iniciar sesión con OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getRedirectUrl(),
          data: {
            redirect_to: '/dashboard/analysis'
          }
        },
      });

      if (error) throw error;
      
      // Guardar el email en localStorage para futuras sesiones
      localStorage.setItem('lastLoginEmail', email);
      
      setMessage({
        type: 'success',
        text: '¡Te hemos enviado un enlace de acceso! Revisa tu correo para continuar.',
      });

      // Si el envío fue exitoso y hay una función onClose, la llamamos después de un delay
      if (onClose) {
        setTimeout(onClose, 3000);
      }
    } catch (error: any) {
      console.error('Error en el inicio de sesión:', error);
      setMessage({
        type: 'error',
        text: error.error_description || error.message || 'Ha ocurrido un error al enviar el enlace de acceso.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Recuperar el último email usado
  useEffect(() => {
    const lastEmail = localStorage.getItem('lastLoginEmail');
    if (lastEmail) {
      setEmail(lastEmail);
    }
  }, []);

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
                disabled={loading}
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : null}
              {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}