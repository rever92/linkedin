import { useEffect, useState, useRef } from 'react';
import { LinkedInPost } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { LineChart } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCategoriesForNewPosts(posts: LinkedInPost[]) {
  const newPosts = posts.filter(post => !post.category);
  
  if (newPosts.length === 0) return;
  
  for (let i = 0; i < newPosts.length; i += 10) {
    const batch = newPosts.slice(i, i + 10);
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`Procesando lote ${i/10 + 1} de ${Math.ceil(newPosts.length/10)} (${batch.length} publicaciones)`);
        
        // Construimos el prompt para el lote actual
        const prompt = batch.map((post, index) => (
          `Post ${index + 1}: "${post.text}"\n` +
          "Por favor, proporciona una categoría breve (1-2 palabras) que mejor describa la temática del post anterior."
        )).join("\n\n");

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log('Respuesta de la API:', result);

        // Procesamos la respuesta para extraer las categorías
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
          throw new Error('Respuesta inválida de la API');
        }

        // Intentamos extraer las categorías de la respuesta
        const categories = responseText.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            // Intentamos extraer la categoría de cada línea
            const categoryMatch = line.match(/(?:categoría:|category:|:)\s*(.+)/i);
            return categoryMatch ? categoryMatch[1].trim() : line.trim();
          });

        console.log('Categorías procesadas:', categories);

        // Verificamos que tenemos el mismo número de categorías que posts
        if (categories.length !== batch.length) {
          throw new Error(`Número incorrecto de categorías (${categories.length}) para el lote de ${batch.length} posts`);
        }

        // Actualizamos la base de datos
        for (let j = 0; j < batch.length; j++) {
          await supabase
            .from('linkedin_posts')
            .update({ category: categories[j] })
            .eq('url', batch[j].url);
        }

        // Si llegamos aquí, el lote se procesó correctamente
        break;

      } catch (error) {
        retries++;
        console.error(`Error en el intento ${retries}/${maxRetries}:`, error);
        
        if (retries === maxRetries) {
          console.error('Se alcanzó el máximo de reintentos para el lote actual');
          return;
        }
        
        // Esperamos un tiempo exponencial entre reintentos
        await delay(Math.pow(2, retries) * 1000);
      }
    }
    
    // Esperamos entre lotes
    if (i + 10 < newPosts.length) {
      await delay(2000);
    }
  }
}

export default function App() {
  const [data, setData] = useState<LinkedInPost[]>([]);
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !dataLoadedRef.current) {
        loadUserData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && !dataLoadedRef.current) {
        loadUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      await fetchCategoriesForNewPosts(posts);
      
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
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