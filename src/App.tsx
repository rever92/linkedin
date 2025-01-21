// App.tsx
import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useAuth } from './hooks/useAuth';
import { checkExtensionSync } from './lib/extensionCommunication';

// Componentes
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Analysis from './components/Analysis';
import Pricing from './components/Pricing';
import PlannerView from './components/Planner/PlannerView';
import Auth from './components/Auth';
import { ThemeProvider } from './lib/theme';

interface ProtectedRouteProps {
  children: React.ReactNode;
  session: Session | null;
}

const ProtectedRoute = ({ children, session }: ProtectedRouteProps) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { session, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Efecto para sincronizar con la extensión
  useEffect(() => {
    if (session) {
      checkExtensionSync(session);
    }
  }, [session]); // Se ejecuta cuando cambia la sesión

  // Efecto para sincronizar en cambios de ruta
  useEffect(() => {
    if (session) {
      checkExtensionSync(session);
    }
  }, [location.pathname]); // Se ejecuta cuando cambia la ruta

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleLogin = () => {
    navigate('/login');
  };

  const renderLayout = (children: React.ReactNode) => {
    const isPublicPage = location.pathname === '/' || location.pathname === '/login';
    
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          {isPublicPage && (
            <Navbar onLogin={handleLogin} session={isAuthenticated} />
          )}

          <div className={`flex ${isPublicPage ? 'pt-16' : ''}`}>
            {isAuthenticated && !isPublicPage && (
              <Sidebar currentPath={location.pathname} />
            )}

            <div
              className={`flex-1 transition-all duration-300 ${
                isAuthenticated && !isPublicPage ? 'lg:ml-20' : ''
              }`}
            >
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  };

  return (
    <Routes>
      <Route
        path="/"
        element={renderLayout(<LandingPage onLogin={handleLogin} />)}
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/analysis" replace />
          ) : (
            renderLayout(<Auth />)
          )
        }
      />

      <Route
        path="/pricing"
        element={renderLayout(
          <ProtectedRoute session={session}>
            <Pricing />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/analysis/*"
        element={renderLayout(
          <ProtectedRoute session={session}>
            <Analysis />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/planner/*"
        element={renderLayout(
          <ProtectedRoute session={session}>
            <PlannerView />
          </ProtectedRoute>
        )}
      />

      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard/*" element={<Navigate to="/analysis" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
