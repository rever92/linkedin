import { useEffect, useState } from 'react';
import { LinkedInPost } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { LineChart } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';

export default function App() {
  const [data, setData] = useState<LinkedInPost[]>([]);
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    const { data: posts, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading data:', error);
      return;
    }

    setData(posts);
  };

  if (!session) {
    if (showAuth) {
      return <Auth />;
    }
    return <LandingPage onLogin={() => setShowAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LineChart className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                LinkedIn Analytics Dashboard
              </h1>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {data.length === 0 ? (
          <FileUpload onDataLoaded={setData} />
        ) : (
          <Dashboard data={data} />
        )}
      </main>
    </div>
  );
}