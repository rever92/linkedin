import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lightbulb } from 'lucide-react';
import { analyzeProfileMetrics } from './utils/metrics-analyzer';
import { LinkedInPost } from '../types';
import Spinner from './ui/spinner';
import { supabase } from '../lib/supabase';

interface RecommendationsProps {
  data: LinkedInPost[];
}

const AIRecommendations: React.FC<RecommendationsProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [nextAnalysisDate, setNextAnalysisDate] = useState<Date | null>(null);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Error al obtener el usuario:', userError || 'No autenticado');
          setInitialLoading(false);
          return;
        }

        const { data: recommendationsData, error } = await supabase
          .from('recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('date_generated', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error al cargar las recomendaciones:', error);
          setInitialLoading(false);
          return;
        }

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
        }
      } catch (err) {
        console.error('Error al cargar las recomendaciones:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadRecommendations();
  }, []);

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

  const getAIRecommendations = async () => {
    setLoading(true);
    
    try {
      // Analizar los datos usando nuestro analizador
      const analysisData = analyzeProfileMetrics(data);

      // Obtener las 25 publicaciones más recientes y extraer solo el campo text
      const lastPosts = data.slice(0, 25).map(post => post.text); 

      // Añadir las últimas publicaciones al análisis
      analysisData.lastPosts = lastPosts; 

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
      const recommendationsData = {};

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error al obtener el usuario:', userError);
        return;
      }

      if (user) {
        recommendationsData.user_id = user.id;
      } else {
        console.error('Usuario no autenticado');
        return;
      }

      // Insertar las recomendaciones en Supabase
      const { data: insertData, error: insertError } = await supabase
        .from('recommendations')
        .insert([recommendationsData]);

      if (insertError) {
        console.error('Error al insertar recomendaciones:', insertError);
      } else {
        console.log('Recomendaciones guardadas:', insertData);
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
    } catch (err) {
      console.error('Error al analizar los datos:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Análisis del Perfil
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
          <div className="flex justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.length > 0 && (
              <div className="mt-4">
                {recommendations.map((item, index) => (
                  <div key={index} className="mb-6">
                    <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                    <div
                      className="prose"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={getAIRecommendations}
              disabled={loading || !!nextAnalysisDate}
              className="w-full"
            >
              {loading
                ? 'Analizando perfil...'
                : nextAnalysisDate
                ? 'Debes esperar para realizar un nuevo análisis'
                : 'Analizar perfil'}
            </Button>
            {timeRemaining && (
              <div className="text-center text-sm text-gray-500">
                Puedes realizar un nuevo análisis en {timeRemaining}.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;