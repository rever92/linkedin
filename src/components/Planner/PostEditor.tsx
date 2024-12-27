import { useState, useEffect } from 'react';
import { Post, PostState, AIGeneratedImage } from '../../types/posts';
import { supabase } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { format } from 'date-fns';
import { Calendar, Clock, Image as ImageIcon, Share2, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog as DialogPrimitive } from '@radix-ui/react-dialog';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { usePremiumActions } from '../../hooks/usePremiumActions';

// Mover la inicialización dentro de una función para evitar problemas con import.meta
const getGoogleAI = () => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
};

const MAX_OPTIMIZATIONS_PER_POST = 3;
const MAX_MONTHLY_OPTIMIZATIONS = 30;

interface PostEditorProps {
  post?: Post | null;
  onClose: () => void;
  onSave: () => void;
}

const imageStyles = [
  { id: 'realistic', name: 'Realista', preview: '/styles/realistic.png' },
  { id: '3d', name: 'Animación 3D', preview: '/styles/3d.png' },
  { id: 'pixar', name: 'Estilo Pixar', preview: '/styles/pixar.png' },
  { id: 'anime', name: 'Anime', preview: '/styles/anime.png' },
  { id: 'watercolor', name: 'Acuarela', preview: '/styles/watercolor.png' },
];

interface OptimizationDialogProps {
  originalContent: string;
  optimizedContent: string;
  onAccept: () => void;
  onDiscard: () => void;
}

const OptimizationDialog: React.FC<OptimizationDialogProps> = ({
  originalContent,
  optimizedContent,
  onAccept,
  onDiscard
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Comparación de Contenido</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Original</h3>
          <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
            {originalContent}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Optimizado</h3>
          <div className="p-4 bg-purple-50 rounded-lg prose prose-sm max-w-none">
            <ReactMarkdown>{optimizedContent}</ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onDiscard}>
          Descartar
        </Button>
        <Button onClick={onAccept}>
          Aceptar cambios
        </Button>
      </div>
    </div>
  </div>
);

export default function PostEditor({ post, onClose, onSave }: PostEditorProps) {
  const [content, setContent] = useState(post?.content || '');
  const [state, setState] = useState<PostState>(post?.state || 'borrador');
  const [scheduledDate, setScheduledDate] = useState(
    post?.scheduled_datetime 
      ? format(new Date(post.scheduled_datetime), 'yyyy-MM-dd')
      : ''
  );
  const [scheduledTime, setScheduledTime] = useState(
    post?.scheduled_datetime 
      ? format(new Date(post.scheduled_datetime), 'HH:mm')
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(imageStyles[0].id);
  const [generatedImages, setGeneratedImages] = useState<AIGeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'image'>('content');
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const { 
    registerAction, 
    checkPostOptimizationLimit,
    loading: actionLoading, 
    error: actionError 
  } = usePremiumActions();

  const handleSchedule = () => {
    setShowScheduler(true);
    setState('planificado');
  };

  const handleSaveSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      setError('Por favor, selecciona una fecha y hora');
      return;
    }
    setShowScheduler(false);
    handleSave();
  };

  const handleGenerateImage = async () => {
    // Aquí iría la lógica de generación de imágenes
    console.log('Generando imagen con:', { imagePrompt, selectedStyle });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const postData = {
        content,
        state,
        scheduled_datetime: state === 'planificado' && scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : null,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      if (post) {
        // Actualizar post existente
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', post.id);

        if (error) throw error;
      } else {
        // Crear nuevo post
        const { error } = await supabase
          .from('posts')
          .insert([postData]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      console.error('Error al guardar el post:', error);
      setError(error.message || 'Error al guardar la publicación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareToLinkedIn = () => {
    const encodedText = encodeURIComponent(content);
    const linkedInUrl = `https://www.linkedin.com/feed/?linkOrigin=LI_BADGE&shareActive=true&text=${encodedText}`;
    window.open(linkedInUrl, '_blank');
  };

  const handleOptimizeWithAI = async () => {
    try {
      // Verificar límites antes de proceder
      const canOptimize = await checkPostOptimizationLimit(post?.id || 'new');
      if (!canOptimize) {
        setOptimizationError('Has alcanzado el límite de optimizaciones permitido para este post o para tu plan');
        return;
      }

      setIsOptimizing(true);
      setOptimizationError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuario no autenticado');

      console.log('👤 Usuario autenticado:', user.id);

      // Verificar límites de optimización
      if (post) {
        const { data: optimizations, error: countError } = await supabase
          .from('post_optimizations')
          .select('id')
          .eq('post_id', post.id);

        if (countError) throw countError;
        console.log('🔄 Optimizaciones previas:', optimizations?.length);

        if (optimizations && optimizations.length >= 3) {
          throw new Error('Has alcanzado el límite de optimizaciones para este post');
        }
      }

      // Verificar límite mensual
      const { data: monthlyCount, error: monthlyError } = await supabase
        .rpc('get_monthly_optimizations', {
          p_user_id: user.id
        });

      if (monthlyError) throw monthlyError;
      console.log('📅 Optimizaciones mensuales:', monthlyCount);

      if (monthlyCount >= MAX_MONTHLY_OPTIMIZATIONS) {
        throw new Error('Has alcanzado el límite mensual de optimizaciones');
      }

      // Obtener recomendaciones y posts
      const { data: recentRecommendation, error: recError } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('date_generated', { ascending: false })
        .limit(1)
        .single();

      if (recError) throw recError;
      console.log('💡 Recomendaciones obtenidas:', recentRecommendation);

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data: topPosts, error: postsError } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', oneYearAgo.toISOString())
        .order('views', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;
      console.log('📊 Posts más exitosos:', topPosts);

      // Generar el prompt
      const prompt = `Eres un experto en comunicación digital y marketing de contenidos con amplia experiencia en LinkedIn. Tu tarea es optimizar un post sobre propósitos de año nuevo, manteniendo su tono personal y auténtico mientras incorporas las mejores prácticas de engagement.

<post_original>
${content}
</post_original>

<recomendaciones_engagement>
${JSON.stringify(recentRecommendation, null, 2)}
</recomendaciones_engagement>

<posts_del_autor>
${JSON.stringify(topPosts, null, 2)}
</posts_del_autor>

Para crear una versión mejorada del post, deberás seguir las instrucciones de <recomendaciones_engagement>, así como unas pautas adicionales:
- Mantener el mensaje clave del post original
- Conservar el tono habitual del autor en base a sus posts anteriores que encontrarás en <posts_del_autor>
- Incorporar al menos una pregunta abierta que invite a la participación
- Utilizar emojis estratégicamente para mejorar la legibilidad (solo si el autor los utiliza habitualmente en sus posts)
- Estructurar el contenido con espaciado y formato visual atractivo
- Incluir una llamada a la acción claro al final
- Asegurar que el contenido sea conciso y directo

Para validar la calidad del contenido optimizado, verifica que:
- Mantiene la voz y personalidad del autor original
- No excede la longitud recomendada
- Incluye elementos visuales (emojis) de manera efectiva
- Tiene una estructura clara y fácil de leer
- Genera oportunidades de interacción
- Conserva el valor y la utilidad del contenido original

Proporciona el post mejorado en formato texto, listo para ser publicado en LinkedIn, manteniendo los saltos de línea y emojis apropiados.`;

      console.log('📝 Prompt generado:', prompt);

      // Inicializar el modelo dentro de la función
      const model = getGoogleAI();
      console.log('🤖 Modelo inicializado, enviando prompt...');

      const result = await model.generateContent(prompt);
      console.log('✨ Respuesta recibida:', result);
      
      const optimizedText = result.response.text();
      console.log('📄 Texto optimizado:', optimizedText);

      setOptimizedContent(optimizedText);

      // Registrar la acción premium después de una optimización exitosa
      if (optimizedContent) {
        await registerAction('post_optimization', {
          post_id: post?.id || 'new',
          content_length: content.length,
          optimized_length: optimizedContent.length
        });
      }

    } catch (error: any) {
      console.error('❌ Error al optimizar:', error);
      setOptimizationError(
        error.message || 
        error.details || 
        'Error al optimizar el contenido'
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAcceptOptimization = async () => {
    if (!optimizedContent || !post) return;

    try {
      // Guardar la optimización
      const { error: optimizationError } = await supabase
        .from('post_optimizations')
        .insert([{
          post_id: post.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          original_content: content,
          optimized_content: optimizedContent
        }]);

      if (optimizationError) throw optimizationError;

      // Actualizar el contenido
      setContent(optimizedContent);
      setOptimizedContent(null);
    } catch (error) {
      console.error('Error al guardar la optimización:', error);
      setError('Error al guardar la optimización');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {post ? 'Editar Publicación' : 'Nueva Publicación'}
          </DialogTitle>
          <DialogDescription>
            {post ? 'Modifica los detalles de tu publicación' : 'Crea una nueva publicación para LinkedIn'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'image')}>
          <TabsList>
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="image">Imagen</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu publicación aquí..."
              className="min-h-[200px]"
            />

            {!showScheduler && (
              <div className="flex justify-between items-center">
                <Select
                  value={state}
                  onValueChange={(value) => setState(value as PostState)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="listo">Listo</SelectItem>
                    <SelectItem value="planificado">Planificado</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleOptimizeWithAI}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                  disabled={!content.trim() || isOptimizing || actionLoading}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isOptimizing || actionLoading ? 'Optimizando...' : 'Mejorar con IA'}
                </Button>
              </div>
            )}

            {(showScheduler || state === 'planificado') && (
              <div className="space-y-4 bg-muted p-4 rounded-lg">
                <h3 className="font-medium">Programar publicación</h3>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-muted-foreground">Fecha</label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledDate(e.target.value)}
                        className="pl-8"
                      />
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-sm text-muted-foreground">Hora</label>
                    <div className="relative">
                      <select
                        value={scheduledTime}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScheduledTime(e.target.value)}
                        className="w-full pl-8 h-10 rounded-md border bg-background"
                      >
                        <option value="">Seleccionar</option>
                        {Array.from({ length: 96 }, (_, i) => {
                          const hour = Math.floor(i / 4);
                          const minute = (i % 4) * 15;
                          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                          return (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </select>
                      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {optimizationError && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {optimizationError}
              </div>
            )}

            {optimizedContent && (
              <OptimizationDialog
                originalContent={content}
                optimizedContent={optimizedContent}
                onAccept={handleAcceptOptimization}
                onDiscard={() => setOptimizedContent(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Descripción de la imagen</label>
                <Textarea
                  value={imagePrompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImagePrompt(e.target.value)}
                  placeholder="Describe la imagen que deseas generar..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Estilo</label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Selecciona un estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex items-center gap-3 py-1">
                          <img
                            src={style.preview}
                            alt={style.name}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                          <span className="font-medium">{style.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim()}
                className="w-full"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Generar Imagen
              </Button>

              {generatedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">
                          Seleccionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            {!showScheduler && (
              <>
                <Button variant="outline" onClick={handleSchedule}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Planificar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleShareToLinkedIn}
                  disabled={!content.trim()}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Publicar en LinkedIn
                </Button>
              </>
            )}
            <Button 
              onClick={showScheduler ? handleSaveSchedule : handleSave} 
              disabled={isSaving || !content.trim()}
            >
              {isSaving ? 'Guardando...' : (showScheduler ? 'Guardar y Programar' : 'Guardar')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 