// PostsTable.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { LinkedInPost } from '../types';
import { ChevronUp, ChevronDown, Search, ExternalLink, X } from 'lucide-react';
import { api } from '../lib/api';
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
  const [hasSession, setHasSession] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
  const [waitTime, setWaitTime] = useState<number>(0);
  const [postsToProcess, setPostsToProcess] = useState<LinkedInPost[]>([]);
  const { registerAction, checkBatchAnalysisLimit } = usePremiumActions();
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);

  useEffect(() => {
    const session = api.getStoredSession();
    setHasSession(!!session);
    if (session) {
      checkSubmissionLimit();
    }
  }, []);

  useEffect(() => {
    const newPosts = data.filter(post => !post.category);
    setPostsToProcess(newPosts);
  }, [data]);

  const checkSubmissionLimit = async () => {
    if (!hasSession) return;

    try {
      const canProcess = await checkBatchAnalysisLimit();
      setCanSubmit(canProcess);
    } catch (error) {
      console.error('Error al verificar límite de análisis:', error);
      setCanSubmit(false);
    }
  };

  const handleSubmitBatch = async () => {
    if (!hasSession) {
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
            try {
              await api.updatePostCategory(categoryInfo.url, categoryInfo.category);
              console.log(`Post actualizado correctamente`);
            } catch (err) {
              console.error(`Error actualizando post:`, err);
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
    // Primero filtramos los datos
    const filtered = filteredData.filter(post => 
      post.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Luego ordenamos los datos filtrados
    return [...filtered].sort((a, b) => {
      // Ordenación por fecha
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      // Ordenación numérica para campos numéricos
      if (['views', 'likes', 'comments', 'shares'].includes(sortField)) {
        // Asegurarnos de que estamos tratando con números
        const aValue = Number(a[sortField as keyof LinkedInPost] || 0);
        const bValue = Number(b[sortField as keyof LinkedInPost] || 0);
        
        // Ordenar de forma numérica
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Ordenación de texto para otros campos
      const aValue = String(a[sortField as keyof LinkedInPost] || '');
      const bValue = String(b[sortField as keyof LinkedInPost] || '');
      
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
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

  const openPostModal = (post: LinkedInPost) => {
    setSelectedPost(post);
  };

  const closePostModal = () => {
    setSelectedPost(null);
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
                  <div className="flex items-center space-x-2">
                    <div 
                      className="max-w-xl truncate cursor-pointer hover:text-blue-500" 
                      onClick={() => openPostModal(post)}
                    >
                      {post.text}
                    </div>
                    <a 
                      href={post.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página {currentPage + 1} de {Math.max(1, Math.ceil(sortedAndFilteredData.length / postsPerPage))}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(sortedAndFilteredData.length / postsPerPage) - 1}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
          >
            Siguiente
          </button>
          <select 
            value={postsPerPage} 
            onChange={handlePostsPerPageChange} 
            className="border rounded-md p-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          >
            {[10, 25, 50, 100].map((num) => (
              <option key={num} value={num}>{num} publicaciones</option>
            ))}
          </select>
        </div>
        
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

      {/* Modal para mostrar el texto completo */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Publicación</h3>
              <button 
                onClick={closePostModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fecha: {new Date(selectedPost.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tipo: {selectedPost.post_type || '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Categoría: {selectedPost.category || 'Sin categoría'}
              </p>
            </div>
            <div className="mb-4 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {selectedPost.text}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <div>
                <span className="mr-4">👁️ {selectedPost.views.toLocaleString()}</span>
                <span className="mr-4">👍 {selectedPost.likes.toLocaleString()}</span>
                <span className="mr-4">💬 {selectedPost.comments.toLocaleString()}</span>
                <span>🔄 {selectedPost.shares.toLocaleString()}</span>
              </div>
              <a 
                href={selectedPost.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                Ver en LinkedIn <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
