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
  console.log('Iniciando fetchCategoriesForNewPosts');
  console.log(`Total de posts a procesar: ${posts.length}`);
  
  const newPosts = posts.filter(post => !post.category);
  console.log(`Posts sin categoría: ${newPosts.length}`);
  
  if (newPosts.length === 0) {
    console.log('No hay posts nuevos para procesar');
    return;
  }
  
  for (let i = 0; i < newPosts.length; i += 10) {
    const batch = newPosts.slice(i, i + 10);
    console.log(`\n=== Iniciando procesamiento de lote ${i/10 + 1} ===`);
    console.log(`Tamaño del lote: ${batch.length} posts`);
    
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        console.log(`\nIntento ${retries + 1}/${maxRetries}`);
        
        // Construimos el prompt con formato JSON
        const postsForPrompt = batch.map(post => ({
          url: post.url,
          text: post.text
        }));

        const prompt = `Revisa los textos de estas publicaciones y categorízalas temáticas que tratan. Primero revisa todos los textos y crea un listado de las categorías que vas a usar. Las categorías deberían ser lo suficientemente amplias para abarcar varios contenidos, por ejemplo: 'Transformación Digital', 'Innovación', 'Inteligencia Artificial, 'Ciberseguridad', 'Autobombo', ... Crea un máximo de 15 categorías. Dame en un JSON el restultado incluyendo: url, y la categoría que has definido. Responde únicamente con el JSON".     
        Posts a analizar:
        ${JSON.stringify(postsForPrompt, null, 2)}`;
        
        console.log('Prompt construido:', prompt.substring(0, 200) + '...');
        
        console.log('Enviando solicitud a la API de Google...');
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
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
        });

        console.log('Respuesta recibida');
        console.log('Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error en la respuesta:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log('Respuesta completa de la API:', JSON.stringify(result, null, 2));

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
          console.error('Respuesta sin texto válido:', result);
          throw new Error('Respuesta inválida de la API');
        }

        // Extraer el JSON de la respuesta
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          console.error('No se encontró JSON en la respuesta:', responseText);
          throw new Error('Formato de respuesta inválido');
        }

        const categoriesData = JSON.parse(jsonMatch[1]);
        console.log('Categorías procesadas:', categoriesData);

        if (!Array.isArray(categoriesData) || categoriesData.length !== batch.length) {
          console.error(`Número incorrecto de categorías. Esperadas: ${batch.length}, Recibidas: ${categoriesData.length}`);
          throw new Error('Número incorrecto de categorías');
        }

        // Actualización de la base de datos
        console.log('Actualizando categorías en la base de datos...');
        for (const categoryInfo of categoriesData) {
          console.log(`Actualizando post con URL: ${categoryInfo.url}, Categoría: ${categoryInfo.category}`);
          const { error } = await supabase
            .from('linkedin_posts')
            .update({ category: categoryInfo.category })
            .eq('url', categoryInfo.url);
          
          if (error) {
            console.error(`Error actualizando post:`, error);
          } else {
            console.log(`Post actualizado correctamente`);
          }
        }

        console.log('Lote procesado exitosamente');
        break;

      } catch (error) {
        retries++;
        console.error(`\nError en el intento ${retries}:`, error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace disponible');
        
        if (retries === maxRetries) {
          console.error('Se alcanzó el máximo de reintentos para el lote actual');
          return;
        }
        
        const waitTime = Math.pow(2, retries) * 2000;
        console.log(`Esperando ${waitTime}ms antes del siguiente intento...`);
        await delay(waitTime);
      }
    }
    
    if (i + 10 < newPosts.length) {
      console.log('\nEsperando 2 segundos antes del siguiente lote...');
      await delay(2000);
    }
  }
  
  console.log('\nProcesamiento de todos los lotes completado');
}

export default function App() {
  const [data, setData] = useState<LinkedInPost[]>([]);
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const dataLoadedRef = useRef(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
  const [postsToProcess, setPostsToProcess] = useState<LinkedInPost[]>([]);
  const [waitTime, setWaitTime] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !dataLoadedRef.current) {
        loadUserData();
        checkSubmissionLimit();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && !dataLoadedRef.current) {
        loadUserData();
        checkSubmissionLimit();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSubmissionLimit = async () => {
    if (!session) return;

    const { data: events, error } = await supabase
      .from('categorization_events')
      .select('*')
      .eq('user_id', session.user.id)
      .gt('created_at', new Date(new Date().setDate(new Date().getDate() - 1))) // Últimos 1 día

    if (error) {
      console.error('Error al obtener eventos de categorización:', error);
      return;
    }

    setSubmissionCount(events.length);
    setCanSubmit(events.length < 3);
  };

  const handleSubmitBatch = async (posts: LinkedInPost[]) => {
    if (!canSubmit) {
      alert('Has alcanzado el límite de 3 lotes por día. Intenta de nuevo mañana.');
      return;
    }

    if (lastSubmissionTime && new Date().getTime() - lastSubmissionTime.getTime() < 180000) {
      const remainingTime = 180000 - (new Date().getTime() - lastSubmissionTime.getTime());
      setWaitTime(Math.ceil(remainingTime / 1000));
      alert('Debes esperar 3 minutos antes de enviar otro lote.');
      return;
    }

    setCanSubmit(false);
    setLastSubmissionTime(new Date());

    await fetchCategoriesForNewPosts(posts);

    // Registrar el evento en la base de datos
    const { error } = await supabase
      .from('categorization_events')
      .insert([{ user_id: session.user.id, batch_number: submissionCount + 1 }]);

    if (error) {
      console.error('Error al registrar el evento de categorización:', error);
    } else {
      setSubmissionCount(prev => prev + 1);
      console.log('Evento de categorización registrado correctamente');
    }

    // Esperar 3 minutos antes de permitir otro envío
    await delay(180000);
    setCanSubmit(true);
  };

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
      const newPosts = posts.filter(post => !post.category);
      setPostsToProcess(newPosts);
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
          <>
            <Dashboard data={data} />
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => handleSubmitBatch(postsToProcess)} 
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
              >
                Enviar Lote
              </button>
            </div>
            <div>
              {postsToProcess.length} posts por procesar
            </div>
            {waitTime > 0 && (
              <div>
                Tienes que esperar: {new Date(waitTime * 1000).toISOString().substr(11, 8)} para lanzar otro lote
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}