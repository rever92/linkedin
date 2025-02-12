import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ScatterChart, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import _ from 'lodash';
import { Switch } from "@/components/ui/switch";

interface Post {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  text?: string;
  category?: string;
}

interface TimeAnalysis {
  day: number;
  hour: number;
  engagement: number;
  postsCount: number;
}

interface LengthAnalysis {
  length: number;
  engagement: number;
  views: number;
}

interface KeywordStat {
  word: string;
  count: number;
  percentage: string;
}

interface HeatmapCell {
  engagement: number;
  posts: number;
  normalizedEngagement?: number;
}

interface AdvancedMetricsProps {
  data: Post[];
  filteredData: Post[];
}

const AdvancedMetrics = ({ data, filteredData }: AdvancedMetricsProps) => {
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis[]>([]);
  const [lengthAnalysis, setLengthAnalysis] = useState<LengthAnalysis[]>([]);
  const [keywordStats, setKeywordStats] = useState<KeywordStat[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showAllHours, setShowAllHours] = useState(false);

  useEffect(() => {
    if (!data || data.length === 0) return;
    analyzeData();
  }, [data]); // Note: we're using data, not filteredData

  const calculateEngagement = (post: Post): number => {
    if (!post.views || post.views === 0) return 0;
    return ((post.likes + post.comments + post.shares) / post.views * 100);
  };

  const analyzeData = () => {
    try {
      // Time-based analysis using all data
      const timeStats = data
        .filter(post => post.date && post.views > 0)
        .map(post => {
          const date = new Date(post.date);
          return {
            dayOfWeek: date.getDay(),
            hour: date.getHours(),
            engagement: calculateEngagement(post)
          };
        });

      type TimeStatType = {
        dayOfWeek: number;
        hour: number;
        engagement: number;
      };

      const timeAggregated = _.groupBy(timeStats, (item: TimeStatType) => 
        `${item.dayOfWeek}-${item.hour}`
      ) as { [key: string]: TimeStatType[] };
      
      const timeAnalysisData: TimeAnalysis[] = Object.entries(timeAggregated)
        .map(([key, posts]: [string, TimeStatType[]]) => {
          const [day, hour] = key.split('-').map(Number);
          const avgEngagement = _.meanBy(posts, 'engagement') ?? 0;
          return { 
            day, 
            hour, 
            engagement: avgEngagement,
            postsCount: posts.length 
          };
        })
        .filter(item => item.postsCount >= 2); // Only consider times with at least 2 posts

      // Post length analysis
      const lengthData = data
        .filter((post): post is Post & { text: string } => Boolean(post.text && post.views > 0))
        .map(post => ({
          length: post.text.length,
          engagement: calculateEngagement(post),
          views: post.views
        }))
        .filter(item => !isNaN(item.engagement) && isFinite(item.engagement));

      const stopWords = new Set([
        'hashtag',
        // Convertir el contenido del archivo paste.txt en un Set para búsqueda eficiente
        ...`para, sobre, pero, esta, como, semana, transformaciondigital, cómo, mucho, esto, este, cada, todo, ¿qué, está, transformacióndigital, tiene, mejor, suscribirte, tenemos, hacer, aquí, también, ¡recuerda, algo, puede, hace, ¿cómo, desde, tener, ahora, todos, nuestro, nuestra, gran, bien, clave, muchas, años, solo, cuando, siempre, forma, entre, nuevo, gracias, decir, están, interesante, generar, ayer, nuestros, menos, poco, debemos, recibir, nueva, porque, hasta, cosas, parece, estos, parte, tienes, podemos, manera, nuevos, crear, hablamos, veces, aunque, otro, tipo, procesos, sino, actual, donde, paso, cambios, cualquier, inteligenciaartificial, real, hecho, antes, mayor, digitales, hemos, artículo, nuevas, importante, dejo, estamos, debe, estar, hablar, pueden, toda, caso, vamos, base, abordar, primer, ideas, nadie, grandes, mejorar, tienen, potencial, realmente, seguro, poder, dice, mismo, claves, situación, hacia, aplicar, compartir, queremos, ayuda, algunos, sido, momento, entender, equipos, herramientas, calidad, creo, nada, todas, respuesta, otros, otras, capaz, javier, millones, posible, joaquin, nuestras, pasado, imagen, igual, allá, ellos, seguir, haciendo, hora, luis, vemos, carretero, llegar, pues, primera, necesitamos, bruno, mañana, según, ejemplo, tomar, algún, edición, mediante, haber, importancia, dónde, ello, además, estas, usar,¿por, claro, buena, pasos, meses, duda, requiere, ¿quién, tanto, días, mayoría, manuel, opináis?, empresa?, nosotros, saber, cuál, jornada, vídeo, puedes, ¡qué, david, había, alguien, persona, expertos, cuenta, sólo,¿sabes, ante, broseta, propio, sabe, otra, fácil, sigue, riesgos, lanzado, tema, casi, principales, hacen, esos, resto, conocer, buen, interesantes, últimos, falta, jose, algunas, través, lectura, martinez, vida, trabajando, mano, cuento, tenido, verdad, estás, minutos, quiere, contar, llega, estado, idea, post, será, noticias, serán, tiempos, próximo, lleva, ""el, relevantes, viene, unos, elegir,¿quieres, hacemos, apuntas?, muestra, nivel, nunca, último, imágenes, aquello, aquellos, palabras, ¿nos, debería, cuándo, rápido, buscar, conseguir, clara, pasa, ella, próximos, trata, medio, siguiente, carlos, casos, dentro, muchos, quieres, permite, ventajas, incluso, obstante, quiero, cerca, contra, entornos, ""no, guerrero, plazo, afecta, punto, ¡suscríbete, publicidad, durante, digital"", nombre, blanca, funciona, posibles, diferentes, suena, jorge, usando, ¿cuál, digital?, súper, confían, tras, unas, alguna, semanas, parece?, pueda, tenéis, alto, siendo, venta, jueves, oscar, visto, genera, dejar, raul, 2020, 2022, josé, with, junto, empezamos, media, pronto, implicaciones, seguramente, vale, primero, búsquedas, empezar, vivir, encontrado, hablando, lanza, tengo, estoy, estaba, linkedin, importantes, fuente, virtual, ellas, rafael, espacio, breve, quién, respecto, consiste, interesantísima, soft, negociosdigitales, juntos, martínez, define, conseguido, viernes, vuestra, llevo, cuáles, llegan, ejemplos, comentarios, profesional, lugar, haga, volver, tantas, mayores, verdadero, garcía, piensa, encontrar, distintas, personal, tres, aplica, lanzar, varias, hacerlo, basado, luego, supone, único, tendremos, poner, utilizar, puntos, horas, textos, creciendo, usos, activos, grupo, prueba, suficiente, ¿tienes, varios, facilitar, anunciado, ingresos, dando, podría, sothis, 930h, colegio, pequeño, resumen, tenga, velasco, muchísimo, adaptarse, genial, ayudar, bajo, pilar, permiten, supuesto, inteligenciaartifical, oído, dupré, patricia, suscríbete, semanal, opiniones, recibirla, oferta, 2023, todavía, necesidades, diferencia, orive, eugenia, dicen, comprar, sede, especialmente, interesantísimo, única, disponible, digitalizar, revolucionar, mitad, espero, necesario, preparando, anunció, brutal, alta, pedro, mientras, garantizar, queda, propios, ningún, entienden, adoptar, mantener, termina,¿hay, modo, empezado, antonio, cosa, llamado, novedades, cualquiera, vuelta, pretende, ángel, opinión, combinación, implica, lopez, quiera, respuestas, total, parecía, intentar, empieza, conclusiones, haces, sirve, creado, rápida, buscando, principal, francisco, deja, directo, toma, fernández, dado,¡apúntate, oficial, común, programa, arrancamos, pocas, gómez, pasada, aumentar, palabra, ofrece, juan`.split(',').map(word => word.trim().toLowerCase())
      ]);

      // Keyword analysis
      const words = data
        .filter((post): post is Post & { text: string } => Boolean(post.text))
        .flatMap(post => 
          post.text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .split(/\s+/)
            .filter(word => 
              word.length > 3 && 
              !stopWords.has(word) &&
              !word.startsWith('http') &&
              !word.startsWith('https')
            )
        );

      const wordStats = _.countBy(words);
      const keywordsData: KeywordStat[] = Object.entries(wordStats)
        .map(([word, count]) => ({ 
          word, 
          count: Number(count),
          percentage: (Number(count) / data.length * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count);

      // Log top 200 words to console
      console.log(keywordsData.slice(0, 200).map(w => w.word).join(', '));

      setTimeAnalysis(timeAnalysisData);
      setLengthAnalysis(lengthData);
      setKeywordStats(keywordsData);
      setTotalPosts(data.length);
    } catch (error) {
      console.error('Error analyzing data:', error);
    }
  };

  const getBestAndWorstTimes = () => {
    if (!timeAnalysis.length) return null;

    const sorted = [...timeAnalysis].sort((a, b) => b.engagement - a.engagement);
    const best3 = sorted.slice(0, 3);
    const worst3 = sorted.slice(-3).reverse();
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    return {
      best: best3.map(time => ({
        day: days[time.day],
        hour: time.hour,
        engagement: time.engagement.toFixed(2),
        posts: time.postsCount
      })),
      worst: worst3.map(time => ({
        day: days[time.day],
        hour: time.hour,
        engagement: time.engagement.toFixed(2),
        posts: time.postsCount
      }))
    };
  };

  const times = getBestAndWorstTimes();

  if (!data || data.length === 0) {
    return null;
  }

  // Preparar datos para el mapa de calor
  const prepareHeatmapData = () => {
    // Solo horas de 7 a 23
    const heatmapData = Array(17).fill(0).map(() => 
      Array(7).fill({ engagement: 0, posts: 0 })
    );

    // Primer paso: recolectar todos los datos
    data.forEach(post => {
      if (post.date && post.views > 0) {
        const date = new Date(post.date);
        const hour = date.getHours();
        if (hour >= 7 && hour <= 23) {
          const day = date.getDay();
          const engagement = calculateEngagement(post);
          const hourIndex = hour - 7;
          
          const currentCell = heatmapData[hourIndex][day];
          const newEngagement = currentCell.posts === 0 ? 
            engagement : 
            (currentCell.engagement * currentCell.posts + engagement) / (currentCell.posts + 1);
          
          heatmapData[hourIndex][day] = {
            engagement: newEngagement,
            posts: currentCell.posts + 1
          };
        }
      }
    });

    // Filtrar celdas según el toggle y ajustar escala
    const validCells = heatmapData.flat().filter(cell => 
      showAllHours ? cell.posts > 0 : cell.posts >= 3
    );
    
    if (validCells.length === 0) return heatmapData;

    const engagements = validCells.map(cell => cell.engagement || 0);
    const minEngagement = Math.min(...engagements);
    const maxEngagement = Math.max(...engagements);
    const range = maxEngagement - minEngagement || 1; // Evitar división por cero

    // Normalizar los valores para mejor contraste
    return heatmapData.map(row =>
      row.map(cell => ({
        ...cell,
        normalizedEngagement: (showAllHours ? cell.posts > 0 : cell.posts >= 3)
          ? ((cell.engagement || 0) - minEngagement) / range
          : 0
      }))
    );
  };

  const getColorStyle = (cell: HeatmapCell) => {
    if (!showAllHours && cell.posts < 3) return { backgroundColor: '#f9fafb' }; // gray-50
    if (cell.posts === 0) return { backgroundColor: '#f9fafb' }; // gray-50 para celdas sin posts
    
    // Colores base en RGB para mayor contraste
    const startColor = {r: 198, g: 246, b: 242}; // #c6f6f2 - más claro
    const midColor = {r: 53, g: 184, b: 175};    // #35b8af - medio
    const endColor = {r: 21, g: 94, b: 89};      // #155e59 - más oscuro
    
    // Usar una curva exponencial para aumentar el contraste
    const intensity = Math.pow(cell.normalizedEngagement, 1.5);
    
    // Interpolar colores
    let r, g, b;
    if (intensity <= 0.5) {
      // Interpolar entre startColor y midColor
      const t = intensity * 2;
      r = Math.round(startColor.r + (midColor.r - startColor.r) * t);
      g = Math.round(startColor.g + (midColor.g - startColor.g) * t);
      b = Math.round(startColor.b + (midColor.b - startColor.b) * t);
    } else {
      // Interpolar entre midColor y endColor
      const t = (intensity - 0.5) * 2;
      r = Math.round(midColor.r + (endColor.r - midColor.r) * t);
      g = Math.round(midColor.g + (endColor.g - midColor.g) * t);
      b = Math.round(midColor.b + (endColor.b - midColor.b) * t);
    }
    
    return { backgroundColor: `rgb(${r},${g},${b})` };
  };

  const heatmapData = prepareHeatmapData();
  const maxEngagement = Math.max(
    ...heatmapData.flat().map(cell => cell.engagement)
  );

  return (
    <div className="grid gap-4 grid-cols-1">
      <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mapa de Calor: Engagement por Día y Hora</h3>
              <div className="flex items-center gap-2">
                <HoverCard>
                  <HoverCardTrigger>
                    <div className="flex items-center gap-2 cursor-help">
                      <label className="text-sm text-muted-foreground">Mostrar todas las horas</label>
                      <Switch
                        checked={showAllHours}
                        onCheckedChange={setShowAllHours}
                      />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <p className="text-sm">
                      Por defecto, solo se muestran las horas con 3 o más posts para asegurar datos significativos.
                      Activa esta opción para ver todas las horas independientemente del número de posts.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 border"></th>
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                        <th key={day} className="p-1 border font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row, hourIndex) => (
                      <tr key={hourIndex}>
                        <td className="p-1 border font-medium whitespace-nowrap text-center">
                          {`${(hourIndex + 7).toString().padStart(2, '0')}:00`}
                        </td>
                        {row.map((cell, day) => (
                          <td 
                            key={`${hourIndex}-${day}`} 
                            style={getColorStyle(cell)}
                            className="border h-6 relative"
                          >
                            <HoverCard>
                              <HoverCardTrigger className="w-full h-full block cursor-default">
                                <div className="w-full h-full"></div>
                              </HoverCardTrigger>
                              <HoverCardContent>
                                <div className="text-sm">
                                  <p className="font-medium">Estadísticas:</p>
                                  <p>Engagement promedio: {cell.engagement.toFixed(2)}%</p>
                                  <p>Posts publicados: {cell.posts}</p>
                                  {cell.posts < 3 && (
                                    <p className="text-gray-500 italic">Mínimo 3 posts necesarios</p>
                                  )}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-2 flex items-center justify-end gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3" style={{backgroundColor: '#f9fafb'}}></span>
                    <span>Sin datos suficientes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3" style={{backgroundColor: '#c6f6f2'}}></span>
                    <span>Bajo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3" style={{backgroundColor: '#35b8af'}}></span>
                    <span>Medio</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3" style={{backgroundColor: '#155e59'}}></span>
                    <span>Alto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {lengthAnalysis.length > 0 && (
          <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Correlación: Longitud vs Engagement</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="length" 
                        name="Longitud" 
                        unit=" caracteres"
                      />
                      <YAxis 
                        type="number" 
                        dataKey="engagement" 
                        name="Engagement" 
                        unit="%" 
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => {
                          if (name === 'length') return `${value} caracteres`;
                          if (name === 'engagement') return `${Number(value).toFixed(2)}%`;
                          return value;
                        }}
                      />
                      <Scatter 
                        data={lengthAnalysis} 
                        fill="#4ECDC4"
                        opacity={0.6}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {keywordStats.length > 0 && (
          <Card className="border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Palabras Clave Más Usadas</h3>
                <div className="flex flex-wrap gap-2">
                  {keywordStats.slice(0, 30).map((word) => (
                    <HoverCard key={word.word}>
                      <HoverCardTrigger>
                        <span 
                          className="px-2 py-1 bg-primary/10 rounded-full cursor-pointer transition-all hover:bg-primary/20"
                          style={{
                            fontSize: `${Math.max(0.8, Math.min(2, word.count / (keywordStats[0].count / 2)))}em`
                          }}
                        >
                          {word.word}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Frecuencia de uso:</p>
                          <p className="text-sm text-muted-foreground">
                            Usada {word.count} veces
                            <br />
                            Aparece en el {word.percentage}% de los posts
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvancedMetrics;