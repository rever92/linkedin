import { useEffect, useState, useRef } from 'react';
import { LinkedInPost } from './types';
import { LineChart } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import { Session } from '@supabase/supabase-js';
import { sendAuthToExtension, checkExtensionSync } from './lib/extensionCommunication';
import { ThemeProvider } from './lib/theme';
import Analysis from './components/Analysis';
import PlannerView from './components/Planner/PlannerView';

export default function App() {
  const [data, setData] = useState<LinkedInPost[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const dataLoadedRef = useRef(false);
  const [currentView, setCurrentView] = useState('analysis');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      sendAuthToExtension(session);
      if (session && !dataLoadedRef.current) {
        loadUserData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      sendAuthToExtension(session);
      if (session && !dataLoadedRef.current) {
        loadUserData();
      }
    });

    // Verificar sincronización cada 5 minutos
    const syncInterval = setInterval(() => {
      if (session) {
        checkExtensionSync(session);
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(syncInterval);
    };
  }, [session]);

  const loadUserData = async () => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    try {
      const { data: posts, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading data:', error);
        return;
      }

      setData(posts);
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  // Dentro de la función renderContent
  const renderContent = () => {
    if (!session) {
      if (showAuth) {
        return <Auth />;
      }
      return <LandingPage onLogin={() => setShowAuth(true)} />;
    }

    switch (currentView) {
      case 'analysis':
        return <Analysis data={data} />;
      case 'planner':
        return <PlannerView />;
      default:
        return <Analysis data={data} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar onNavigate={setCurrentView} currentView={currentView} />
        
        <div className="flex-1 transition-all duration-300 lg:ml-20">
          {/* <header className="bg-card shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <LineChart className="w-8 h-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">
                    Linksight
                  </h1>
                </div>
              </div>
            </div>
          </header> */}

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}