import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lightbulb, Brain } from 'lucide-react';
import { analyzeProfileMetrics, ProfileAnalysis } from './utils/metrics-analyzer';
import { LinkedInPost } from '../types';
import Spinner from "@/components/ui/spinner";
import { api } from '../lib/api';
import { useUserRole } from '../hooks/useUserRole';
import { usePremiumActions } from '../hooks/usePremiumActions';
import PremiumBanner from './ui/premium-banner';

interface RecommendationsProps {
  data: LinkedInPost[];
}

interface Recommendation {
  title: string;
  content: string;
}

interface RecommendationData {
  tipos_de_contenido: string;
  mejores_horarios: string;
  longitud_optima: string;
  frecuencia_recomendada: string;
  estrategias_de_engagement: string;
  user_id: string;
}

interface ProfileAnalysisWithPosts extends ProfileAnalysis {
  lastPosts: string[];
}

const AIRecommendations: React.FC<RecommendationsProps> = ({ data }) => {
  const { 
    hasAccess, 
    loading: roleLoading, 
    role, 
    subscriptionStatus,
    subscriptionPlan 
  } = useUserRole();
  const { 
    registerAction, 
    checkProfileAnalysisLimit,
    getRoleLimits,
    loading: actionLoading, 
    error: actionError 
  } = usePremiumActions();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [nextAnalysisDate, setNextAnalysisDate] = useState<Date | null>(null);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canAnalyze, setCanAnalyze] = useState(false);

  const getAIRecommendations = async () => {
    // Verificar límites antes de proceder
    const canPerformAnalysis = await checkProfileAnalysisLimit();
    if (!canPerformAnalysis) {
      setError(
        'Has alcanzado el límite de análisis permitido para tu plan. ' +
        'Actualiza tu plan para realizar más análisis o espera hasta que puedas realizar el siguiente.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Analizar los datos usando nuestro analizador
      const baseAnalysis = analyzeProfileMetrics(data);
      const lastPosts = data.slice(0, 25).map(post => post.text);
      
      // Crear el objeto de análisis completo
      const analysisData: ProfileAnalysis & { lastPosts: string[] } = {
        ...baseAnalysis,
        lastPosts
      };

      // Imprimir el análisis en la consola
      console.log('Análisis completo del perfil:', analysisData);
      
      // Enviar el analysisData a la API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Eres un analista experto en marketing digital y growth hacking, especializado en optimización de perfiles profesionales en LinkedIn. Tu tarea es analizar exhaustivamente las métricas de rendimiento de un perfil de LinkedIn y proporcionar recomendaciones estratégicas personalizadas basadas en datos.\nAquí te dejo los siguientes datos sobre un perfil de LinkedIn\n1. Métricas Generales:\n${JSON.stringify(analysisData.generalMetrics, null, 2)}\n2. Análisis por Tipo de Publicación:\n${JSON.stringify(analysisData.postTypeAnalysis, null, 2)}\n3. Análisis por Categoría:\n${JSON.stringify(analysisData.categoryAnalysis, null, 2)}\n4. Análisis de Tiempos:\n${JSON.stringify(analysisData.timeAnalysis, null, 2)}\n5. Análisis de Longitud de Contenido:\n${JSON.stringify(analysisData.contentLength, null, 2)}\n6. Tendencias:\n${JSON.stringify(analysisData.trends, null, 2)}\n7. Últimas Publicaciones:\n${JSON.stringify(analysisData.lastPosts, null, 2)}\n\nBasándote en estos datos, genera un análisis completo que incluya:\nUn resumen ejecutivo que destaque:\nLos principales hallazgos del análisis\nLas métricas más relevantes y su interpretación\nLas tendencias más significativas identificadas\nLas áreas de oportunidad más importantes\n\nUn análisis detallado que examine:\nRendimiento general del perfil\nPatrones de engagement por tipo de contenido\nAnálisis de temporalidad y mejores momentos para publicar\nImpacto de la longitud del contenido\nEvolución y tendencias del perfil\n\nCon esto, elabora una serie de recomendaciones específicas sobre:\nTipos de contenido a priorizar en base a su rendimiento\nMejores horarios para publicar. Especifica al usuario en qué días y horas debería enfocarse para obtener mejores resultados. \nLongitud óptima de las publicaciones\nFrecuencia de publicación recomendada. Habla sobre cuántas publicaciones a la semana serían recomendables. \nEstrategias para aumentar el engagement (basado en las métricas y el análisis de las últimas 25 publicaciones del usuario). No hables de "Las últimas 25 publicaciones", habla de "Tus contenidos más recientes...". Además, centrate en las 3 recomendaciones que más beneficios podrían llegar a tener.\n\nEl análisis debe ser:\nBasado en datos y respaldado por métricas específicas\nPráctico y orientado a acciones concretas\nPersonalizado según las fortalezas y áreas de mejora identificadas\nClaro y estructurado, evitando jerga técnica innecesaria\nEnfocado en resultados medibles\n\nAsegúrate de:\nIdentificar patrones y correlaciones significativas en los datos\nProporcionar contexto para cada recomendación\nPriorizar las recomendaciones según su potencial impacto\nIncluir ejemplos específicos cuando sea relevante\nConsiderar las tendencias actuales de LinkedIn\n\nFormato -> Cada uno de los apartados de recomendaciones deberá ir entre etiquetas html con su título, es decir:\n<Tipos de contenido></Tipos de contenido>\n<Mejores horarios></Mejores horarios>\n<Longitud óptima></Longitud óptima>\n<Frecuencia recomendada></Frecuencia recomendada>\n<Estrategias de engagement></Estrategias de engagement>\nEstructura cada apartado en formato bullet points y dame los contenidos de cada apartado en html\n\n\nPresenta tus conclusiones de manera estructurada y profesional, manteniendo un equilibrio entre el análisis técnico y las recomendaciones prácticas. \nEl objetivo final es proporcionar un plan de acción claro y ejecutable para mejorar el rendimiento del perfil en LinkedIn.\nHabla siempre de "tú" al usuario, no de forma abstracta. Por ejemplo,\n\t- tu recomendación no debe ser "Implementar un sistema de...", sino "Implementa un sistema de ...",\n\t- tu recomendación no debe ser "Identificar y conectar ...", sino "Identifica y conecta ..."\nSi vas a hacer recomendaciones, da siempre ejemplos. Por ejemplo, si le dices al usuario "Utiliza palabras clave relevantes en tus publicaciones y en tu perfil para mejorar el posicionamiento y el alcance." deberías darle ejemplos de palabras clave que ese usuario en concreto debería incorporar.\nEvita decir recomendaciones sobre el análisis del contenido como "Analiza el rendimiento individual de cada post".\n`
            }]
          }]
        }),
      });

      // Leer la respuesta una sola vez
      const result = await response.json();
      console.log('Respuesta de la API:', result);

      // Acceder al texto generado correctamente
      const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Respuesta relevante: ", responseText)
      if (responseText) {
        // Extraer contenido relevante usando regex
        const regex = /<([^>]+)>([\s\S]*?)<\/\1>/g;
        let match;
        const extractedContent = [];

        while ((match = regex.exec(responseText)) !== null) {
          const title = match[1].trim();
          const content = match[2].trim();
          // Lista de títulos que nos interesan
          const validTitles = [
            'Tipos de contenido',
            'Mejores horarios',
            'Longitud óptima',
            'Frecuencia recomendada',
            'Estrategias de engagement',
          ];
          if (validTitles.includes(title)) {
            extractedContent.push({ title, content });
          }
        }

        console.log('Contenido extraído:', extractedContent);

        // Preparar los datos para guardar en Supabase
        const recommendationsData: RecommendationData = {
          tipos_de_contenido: '',
          mejores_horarios: '',
          longitud_optima: '',
          frecuencia_recomendada: '',
          estrategias_de_engagement: '',
          user_id: ''
        };

        extractedContent.forEach(({ title, content }) => {
          // Reemplazar **texto** por <strong>texto</strong>
          const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

          switch (title) {
            case 'Tipos de contenido':
              recommendationsData.tipos_de_contenido = formattedContent;
              break;
            case 'Mejores horarios':
              recommendationsData.mejores_horarios = formattedContent;
              break;
            case 'Longitud óptima':
              recommendationsData.longitud_optima = formattedContent;
              break;
            case 'Frecuencia recomendada':
              recommendationsData.frecuencia_recomendada = formattedContent;
              break;
            case 'Estrategias de engagement':
              recommendationsData.estrategias_de_engagement = formattedContent;
              break;
            default:
              break;
          }
        });

        // Obtener el usuario actual
        const user = api.getUser();

        if (!user) {
          console.error('Usuario no autenticado');
          return;
        }

        recommendationsData.user_id = user.id;

        // Insertar las recomendaciones
        const insertData = await api.saveRecommendation(recommendationsData);

        if (insertData) {
          // Registrar la acción premium
          await registerAction('profile_analysis', {
            recommendations_id: insertData._id || insertData.id,
            metrics_analyzed: Object.keys(baseAnalysis)
          });

          // Actualizar estados
          const generatedDate = new Date();
          setNextAnalysisDate(generatedDate);
          setLastAnalysisDate(generatedDate.toLocaleDateString('es-ES'));
        }

        // Actualizar el estado con el contenido formateado
        setRecommendations(
          extractedContent.map((item) => ({
            ...item,
            content: item.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
          }))
        );
      } else {
        console.error('Respuesta vacía o inválida:', result);
      }

      // Después de un análisis exitoso
      setCanAnalyze(false);
    } catch (err: any) {
      console.error('Error al analizar los datos:', err);
      setError(err.message || 'Error al analizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Verificar acceso y cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!hasAccess('premium_ai_recommendations') || !role) {
        setInitialLoading(false);
        return;
      }

      try {
        const user = api.getUser();

        if (!user) {
          console.error('Usuario no autenticado');
          setInitialLoading(false);
          return;
        }

        // Obtener las últimas recomendaciones y el perfil del usuario en paralelo
        const [latestRecommendationResponse, userProfile] = await Promise.all([
          api.getLatestRecommendation().catch(() => null),
          api.getUserProfile().catch(() => null)
        ]);

        const recommendationsData = latestRecommendationResponse ? [latestRecommendationResponse] : [];

        if (!userProfile) {
          console.error('No se pudo obtener el perfil del usuario');
          setInitialLoading(false);
          return;
        }

        console.log('Debug - Perfil de usuario:', userProfile);

        // Obtener el número de análisis en el ciclo actual
        let cycleAnalyses = 0;

        if (userProfile?.subscription_start_date) {
          console.log('Debug - Usando ciclo personalizado');
          const cycleActions = await api.getPremiumCycleUsage();

          console.log('Debug - Acciones del ciclo:', cycleActions);
          cycleAnalyses = cycleActions?.find(
            (action: { action_type: string; count: number }) => action.action_type === 'profile_analysis'
          )?.count || 0;
        } else {
          console.log('Debug - Usando mes natural');
          const monthlyActions = await api.getPremiumUsage();

          console.log('Debug - Acciones mensuales:', monthlyActions);
          cycleAnalyses = monthlyActions?.find(
            (a: any) => a.action_type === 'profile_analysis'
          )?.count || 0;
        }

        console.log('Debug - Total de análisis en el ciclo:', cycleAnalyses);

        if (recommendationsData && recommendationsData.length > 0) {
          const latestRecommendation = recommendationsData[0];
          setRecommendations([
            {
              title: 'Tipos de contenido',
              content: latestRecommendation.tipos_de_contenido,
            },
            {
              title: 'Mejores horarios',
              content: latestRecommendation.mejores_horarios,
            },
            {
              title: 'Longitud óptima',
              content: latestRecommendation.longitud_optima,
            },
            {
              title: 'Frecuencia recomendada',
              content: latestRecommendation.frecuencia_recomendada,
            },
            {
              title: 'Estrategias de engagement',
              content: latestRecommendation.estrategias_de_engagement,
            },
          ]);

          const generatedDate = new Date(latestRecommendation.date_generated);
          setNextAnalysisDate(generatedDate);
          setLastAnalysisDate(generatedDate.toLocaleDateString('es-ES'));

          // Obtener los límites del rol actual
          const roleLimits = await getRoleLimits(role);
          
          if (roleLimits) {
            const now = new Date();
            const lastAnalysisDate = new Date(latestRecommendation.date_generated);
            const daysSinceLastAnalysis = Math.floor(
              (now.getTime() - lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Verificar primero el límite diario
            if (daysSinceLastAnalysis < 1) {
              const hoursRemaining = 24 - Math.floor((now.getTime() - lastAnalysisDate.getTime()) / (1000 * 60 * 60));
              const minutesRemaining = 60 - Math.floor((now.getTime() - lastAnalysisDate.getTime()) / (1000 * 60)) % 60;
              setTimeRemaining(`0d ${hoursRemaining}h ${minutesRemaining}m`);
              setError('Debes esperar 24 horas entre análisis.');
              setCanAnalyze(false);
            } 
            // Verificar el límite mensual
            else if (cycleAnalyses >= roleLimits.profile_analysis.monthly_limit) {
              console.log('Debug - Límites del rol:', roleLimits);
              console.log('Debug - Análisis realizados:', cycleAnalyses);
              console.log('Debug - Límite mensual:', roleLimits.profile_analysis.monthly_limit);
              
              let nextResetDate;
              
              if (userProfile?.next_billing_date) {
                // Asegurarnos de que la fecha de próxima facturación no sea más de un mes
                const nextBillingDate = new Date(userProfile.next_billing_date);
                const oneMonthFromNow = new Date(now);
                oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                
                nextResetDate = nextBillingDate < oneMonthFromNow ? nextBillingDate : oneMonthFromNow;
                console.log('Debug - Usando fecha de próxima facturación (ajustada):', nextResetDate);
              } else {
                // Si no hay fecha de facturación, usar el primer día del próximo mes
                nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                console.log('Debug - Usando primer día del próximo mes:', nextResetDate);
              }

              const daysUntilNextCycle = Math.ceil((nextResetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const hoursUntilNextCycle = Math.floor(((nextResetDate.getTime() - now.getTime()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutesUntilNextCycle = Math.floor(((nextResetDate.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
              
              console.log('Debug - Tiempo hasta próximo ciclo:', {
                days: daysUntilNextCycle,
                hours: hoursUntilNextCycle,
                minutes: minutesUntilNextCycle
              });

              setTimeRemaining(`${daysUntilNextCycle}d ${hoursUntilNextCycle}h ${minutesUntilNextCycle}m`);
              setError(`Has alcanzado el límite de ${roleLimits.profile_analysis.monthly_limit} análisis para este ciclo.`);
              setCanAnalyze(false);
            } else {
              setCanAnalyze(true);
              setError(null);
              setTimeRemaining('');
            }
          }
        } else {
          // Si no hay análisis previos, permitir realizar uno
          setCanAnalyze(true);
        }
      } catch (err) {
        console.error('Error al cargar las recomendaciones:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [role, hasAccess]); // Solo depender de role y hasAccess

  useEffect(() => {
    if (nextAnalysisDate) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = nextAnalysisDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();

        if (diff <= 0) {
          setTimeRemaining('');
          setNextAnalysisDate(null);
          clearInterval(interval);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [nextAnalysisDate]);

  // Si está cargando el rol o los datos iniciales, mostrar loader
  if (roleLoading || initialLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar acceso premium, mostrar banner
  if (!hasAccess('premium_ai_recommendations')) {
    let message = 'Obtén recomendaciones personalizadas basadas en IA para optimizar tu contenido';
    
    if (subscriptionStatus === 'past_due') {
      message = 'Tu suscripción tiene un pago pendiente. Por favor, actualiza tu método de pago para continuar usando esta función.';
    } else if (subscriptionStatus === 'canceled') {
      message = 'Tu suscripción ha sido cancelada. Renueva tu suscripción para volver a acceder a esta función.';
    } else if (role === 'free') {
      message = 'Actualiza a un plan Pro o Business para acceder a las recomendaciones de IA.';
    }

    return (
      <PremiumBanner message={message} />
    );
  }

  return (
    <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Análisis del Perfil
            {subscriptionStatus === 'trialing' && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                Período de Prueba
              </span>
            )}
          </div>
          {lastAnalysisDate && (
            <span className="text-sm text-gray-500">
              Fecha de último análisis: {lastAnalysisDate}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {initialLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={getAIRecommendations}
                  disabled={loading || actionLoading || !canAnalyze || initialLoading || subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled'}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {loading || actionLoading
                    ? 'Analizando perfil...'
                    : recommendations.length === 0 && canAnalyze
                    ? '¡Haz tu primer análisis de perfil!'
                    : canAnalyze
                    ? 'Analizar perfil'
                    : 'Debes esperar para realizar un nuevo análisis'}
                </Button>

                {recommendations.length === 0 && canAnalyze && (
                  <p className="text-sm text-gray-600 text-center max-w-lg">
                    Obtén recomendaciones personalizadas basadas en IA para optimizar tu contenido y aumentar tu engagement en LinkedIn
                  </p>
                )}

                {!canAnalyze && timeRemaining && error?.includes('límite') && (
                  <div className="text-center text-sm text-gray-500 p-2 bg-gray-50 rounded-md w-full border border-gray-200/50">
                    <span className="font-medium">Próximo análisis disponible en:</span>
                    <div className="font-mono text-base mt-1">{timeRemaining}</div>
                  </div>
                )}

                {subscriptionStatus === 'trialing' && (
                  <div className="text-center text-sm text-blue-600 p-2 bg-blue-50 rounded-md w-full border border-gray-200/50">
                    Estás en período de prueba. Aprovecha para probar todas las funcionalidades premium.
                  </div>
                )}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="mt-8 space-y-6">
                {recommendations.map((item, index) => (
                  <div key={index} className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;