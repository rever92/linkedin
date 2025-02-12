// PostsTable.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { LinkedInPost } from '../types';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { usePremiumActions } from '../hooks/usePremiumActions';

interface PostsTableProps {
  data: LinkedInPost[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function PostsTable({ data }: PostsTableProps) {
  const [sortField, setSortField] = useState<keyof LinkedInPost>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [session, setSession] = useState<Session | null>(null);
  const [canSubmit, setCanSubmit] = useState(true);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
  const [waitTime, setWaitTime] = useState<number>(0);
  const [postsToProcess, setPostsToProcess] = useState<LinkedInPost[]>([]);
  const { registerAction, checkBatchAnalysisLimit } = usePremiumActions();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkSubmissionLimit();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkSubmissionLimit();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const newPosts = data.filter(post => !post.category);
    setPostsToProcess(newPosts);
  }, [data]);

  const checkSubmissionLimit = async () => {
    if (!session) return;

    try {
      const canProcess = await checkBatchAnalysisLimit();
      setCanSubmit(canProcess);
    } catch (error) {
      console.error('Error al verificar límite de análisis:', error);
      setCanSubmit(false);
    }
  };

  const handleSubmitBatch = async () => {
    if (!session) {
      alert('No hay sesión activa. Por favor, inicia sesión.');
      return;
    }

    if (!canSubmit) {
      alert('Has alcanzado el límite de análisis para tu plan. Actualiza tu plan para continuar.');
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

    try {
      await fetchCategoriesForNewPosts(postsToProcess);
      
      // Registrar la acción premium
      await registerAction('batch_analysis', {
        posts_count: postsToProcess.length,
        analysis_type: 'categorization'
      });

      // Esperar 3 minutos antes de permitir otro envío
      await delay(180000);
      setCanSubmit(true);
      
      // Actualizar el límite después de procesar
      checkSubmissionLimit();
    } catch (error) {
      console.error('Error al procesar el lote:', error);
      setCanSubmit(true);
    }
  };

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

          const prompt = `Revisa los textos de estas publicaciones y categorízalas temáticas que tratan. Primero revisa todos los textos y crea un listado de las categorías que vas a usar. Las categorías deberían ser lo suficientemente amplias para abarcar varios contenidos, por ejemplo: 'Transformación Digital', 'Innovación', 'Inteligencia Artificial', 'Ciberseguridad', 'Autobombo', ... Crea un máximo de 15 categorías. Dame en un JSON el resultado incluyendo: url, y la categoría que has definido. Responde únicamente con el JSON.
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

          // Manejo del error 429
          if (response.status === 429) {
            console.error('Límite de cuota excedido. Esperando antes de reintentar...');
            const waitTime = 60000; // Esperar 60 segundos
            await delay(waitTime);
            continue; // Reintentar la solicitud
          }

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

  // Filtrado y ordenamiento de los posts
  const filteredData = useMemo(() => {
    return data.filter(post => post.text.trim() !== '');
  }, [data]);

  const sortedAndFilteredData = useMemo(() => {
    return filteredData
      .filter(post => 
        post.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        
        const aValue = String(a[sortField] || '');
        const bValue = String(b[sortField] || '');
        
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        }
        return bValue.localeCompare(aValue);
      });
  }, [filteredData, sortField, sortDirection, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return sortedAndFilteredData.slice(startIndex, endIndex);
  }, [sortedAndFilteredData, currentPage, postsPerPage]);

  const handleSort = (field: keyof LinkedInPost) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: keyof LinkedInPost }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < Math.ceil(sortedAndFilteredData.length / postsPerPage)) {
      setCurrentPage(newPage);
    }
  };

  const handlePostsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPostsPerPage(Number(event.target.value));
    setCurrentPage(0);
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-4">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Buscar publicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {[
                { key: 'date', label: 'Fecha' },
                { key: 'text', label: 'Texto' },
                { key: 'views', label: 'Visualizaciones' },
                { key: 'likes', label: 'Reacciones' },
                { key: 'comments', label: 'Comentarios' },
                { key: 'shares', label: 'Compartidos' },
                { key: 'post_type', label: 'Tipo' },
                { key: 'category', label: 'Temas'}
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key as keyof LinkedInPost)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    <SortIcon field={key as keyof LinkedInPost} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {paginatedData.map((post, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {new Date(post.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="max-w-xl truncate">{post.text}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {post.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {post.likes.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {post.comments.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {post.shares.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {post.post_type || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {post.category ? post.category : <span className="loader">Cargando...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-between items-center">
        <select 
          value={postsPerPage} 
          onChange={handlePostsPerPageChange} 
          className="border rounded-md p-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        >
          {[10, 25, 50, 100].map((num) => (
            <option key={num} value={num}>{num} publicaciones</option>
          ))}
        </select>
        
        {/* Botón para enviar lote */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleSubmitBatch} 
            disabled={!canSubmit || postsToProcess.length === 0}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar Lote
          </button>
          <div>
            {postsToProcess.length} posts por procesar
          </div>
          {waitTime > 0 && (
            <div>
              Tienes que esperar: {new Date(waitTime * 1000).toISOString().substr(11, 8)} para lanzar otro lote
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
