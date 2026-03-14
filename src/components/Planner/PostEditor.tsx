import { useState, useEffect } from 'react';
import { Post, PostState, AIGeneratedImage, PlanEditorContext, getPostId } from '../../types/posts';
import { api } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Calendar as CalendarIcon, Clock, Image as ImageIcon, Brain, Sparkles, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog as DialogPrimitive } from '@radix-ui/react-dialog';
import ReactMarkdown from 'react-markdown';
import { usePremiumActions } from '../../hooks/usePremiumActions';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';

const MAX_OPTIMIZATIONS_PER_POST = 3;
const MAX_MONTHLY_OPTIMIZATIONS = 30;

interface PostEditorProps {
  post?: Post | null;
  initialDate?: string; // Fecha inicial para un nuevo post
  onClose: () => void;
  onSave: () => void;
  allPosts?: Post[]; // Lista de todos los posts para identificar fechas ocupadas
  planContext?: PlanEditorContext | null;
}

const imageStyles = [
  { id: 'realistic', name: 'Realista', preview: '/styles/realistic.png' },
  { id: '3d', name: 'Animación 3D', preview: '/styles/3d.png' },
  { id: 'pixar', name: 'Estilo Pixar', preview: '/styles/pixar.png' },
  { id: 'anime', name: 'Anime', preview: '/styles/anime.png' },
  { id: 'watercolor', name: 'Acuarela', preview: '/styles/watercolor.png' },
];

export default function PostEditor({ post, initialDate, onClose, onSave, allPosts = [], planContext = null }: PostEditorProps) {
  const [content, setContent] = useState(post?.content || '');
  const [state, setState] = useState<PostState>(post?.state || 'borrador');
  const [scheduledDate, setScheduledDate] = useState(
    post?.scheduled_datetime
      ? format(new Date(post.scheduled_datetime), 'yyyy-MM-dd')
      : initialDate || ''
  );
  const [scheduledTime, setScheduledTime] = useState(
    post?.scheduled_datetime
      ? format(new Date(post.scheduled_datetime), 'HH:mm')
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(imageStyles[0].id);
  const [generatedImages, setGeneratedImages] = useState<AIGeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'image'>('content');
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    registerAction,
    checkPostOptimizationLimit,
    loading: actionLoading,
    error: actionError
  } = usePremiumActions();
  const [currentPostId, setCurrentPostId] = useState<string | null>(post ? getPostId(post) || null : null);
  const [isNewPostCreated, setIsNewPostCreated] = useState(false);

  // Si se proporciona una fecha inicial, mostrar automáticamente el programador
  useEffect(() => {
    if (initialDate && !post) {
      setState('planificado');
    }
  }, [initialDate, post]);

  useEffect(() => {
    setCurrentPostId(post ? getPostId(post) || null : null);
  }, [post]);

  // Efecto para cambiar el estado a "planificado" cuando se selecciona una fecha
  useEffect(() => {
    if (scheduledDate && state !== 'planificado') {
      setState('planificado');
    }
  }, [scheduledDate]);

  const handleGenerateImage = async () => {
    // Aquí iría la lógica de generación de imágenes
    console.log('Generando imagen con:', { imagePrompt, selectedStyle });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Si hay fecha pero no hora, establecemos una hora predeterminada (00:00)
      const finalScheduledTime = scheduledDate && !scheduledTime ? '00:00' : scheduledTime;
      
      const postData = {
        content,
        state,
        scheduled_datetime: state === 'planificado' && scheduledDate
          ? new Date(`${scheduledDate}T${finalScheduledTime || '00:00'}`).toISOString()
          : null,
      };

      if (currentPostId) {
        // Actualizar post existente
        await api.updatePlannerPost(currentPostId, postData);
      } else {
        // Crear nuevo post
        const newPost = await api.createPlannerPost(postData);
        if (newPost) {
          setCurrentPostId(getPostId(newPost) || null);
          setIsNewPostCreated(true);
        }
      }

      // Mostrar mensaje de éxito temporal
      setSuccessMessage("✅ Post guardado correctamente");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      onSave();
    } catch (error: any) {
      console.error('Error al guardar el post:', error);
      setError(error.message || 'Error al guardar la publicación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptimizeWithAI = async () => {
    try {
      // Verificar que hay contenido para optimizar
      if (content.trim() === '') {
        setOptimizationError('No hay contenido para optimizar. Por favor, escribe algo primero.');
        return;
      }

      // Verificar límites antes de proceder
      const canOptimize = await checkPostOptimizationLimit(currentPostId || 'new');
      if (!canOptimize) {
        setOptimizationError('Has alcanzado el límite de optimizaciones permitido para este post o para tu plan');
        return;
      }

      setIsOptimizing(true);
      setOptimizationError(null);
      // Guardar el contenido original antes de optimizar
      setOriginalContent(content);

      const user = api.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Si el post no existe, guardarlo primero como borrador temporal
      let postId = currentPostId;

      if (!postId) {
        try {
          console.log('💾 Guardando borrador temporal antes de optimizar...');
          const postData = {
            content,
            state: 'borrador', // Siempre guardar como borrador inicialmente
            scheduled_datetime: state === 'planificado' && scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : null,
          };

          const newPost = await api.createPlannerPost(postData);
          if (!newPost) throw new Error('Error al guardar el post');

          postId = getPostId(newPost);
          setCurrentPostId(postId); // Actualizar el estado con el nuevo ID
          setIsNewPostCreated(true);
          console.log('📝 Borrador temporal guardado con ID:', postId);

          // Mostrar mensaje informativo
          setSuccessMessage("Se ha guardado un borrador temporal para optimizar");
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error: any) {
          console.error('❌ Error al guardar el borrador temporal:', error);
          throw new Error('Error al guardar el post: ' + error.message);
        }
      } else {
        console.log('🔄 Optimizando post existente con ID:', postId);

        // Si hay cambios pendientes, actualizar el post antes de optimizarlo
        if (hasChanges()) {
          console.log('📝 Actualizando post existente antes de optimizar...');
          const postData = {
            content,
            state,
            scheduled_datetime: state === 'planificado' && scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : null,
          };

          await api.updatePlannerPost(postId, postData);
          console.log('✅ Post actualizado antes de optimizar');
        }
      }

      // Registrar la acción premium
      const actionRegistered = await registerAction('post_optimization', {
        post_id: postId,
        content_length: content.length
      });

      if (!actionRegistered) {
        throw new Error('Error al registrar la acción premium');
      }

      console.log('✨ Acción premium registrada');

      const result = await api.optimizePlannerPost(postId, content);
      const optimizedText = result.optimized_content;
      console.log('📄 Texto optimizado:', optimizedText);

      setOptimizedContent(optimizedText);
      setShowComparison(true);

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
    if (!optimizedContent) return;

    try {
      setIsSaving(true);
      // Usar el ID almacenado en el estado
      const postId = currentPostId;
      if (!postId) {
        throw new Error('No se encontró el ID del post');
      }

      // Guardar la optimización en la tabla de historial
      await api.savePlannerOptimization(postId, {
        original_content: originalContent || content,
        optimized_content: optimizedContent,
        plan_item_id: post?.plan_item_id || planContext?.planItem?._id || null,
      });

      // Actualizar el contenido en el estado local
      setContent(optimizedContent);

      // Actualizar el post con el nuevo contenido
      await api.updatePlannerPost(postId, {
        content: optimizedContent,
        // Si es un post nuevo creado como borrador, mantener el estado que el usuario haya seleccionado
        state: state
      });
      
      // Cerrar la comparación
      setShowComparison(false);
      setOptimizedContent(null);
      setOriginalContent(null);
      
      console.log('✅ Post actualizado correctamente con el contenido optimizado');
      // Mostrar mensaje de éxito temporal
      setSuccessMessage("✅ Optimización aplicada correctamente");
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error: any) {
      console.error('Error al guardar la optimización:', error);
      setError('Error al guardar la optimización: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardOptimization = () => {
    setShowComparison(false);
    setOptimizedContent(null);
    setOriginalContent(null);
    
    // Si es un post nuevo que se creó solo para optimizar y el usuario descarta la optimización,
    // mostrar un mensaje informativo
    if (isNewPostCreated && !post) {
      setSuccessMessage("Se ha guardado un borrador con tu contenido original");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const hasChanges = () => {
    if (!post) {
      return content.trim() !== '' || state !== 'borrador' || scheduledDate !== '' || scheduledTime !== '';
    }
    return content !== post.content ||
      state !== post.state ||
      scheduledDate !== (post.scheduled_datetime ? format(new Date(post.scheduled_datetime), 'yyyy-MM-dd') : '') ||
      scheduledTime !== (post.scheduled_datetime ? format(new Date(post.scheduled_datetime), 'HH:mm') : '');
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowSaveDialog(true);
      setIsClosing(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = async (shouldSave: boolean) => {
    if (shouldSave) {
      await handleSave();
    }
    setShowSaveDialog(false);
    if (isClosing) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!currentPostId) return;

    try {
      setIsDeleting(true);
      setError(null);
      await api.updatePlannerPost(currentPostId, { state: 'eliminado' });
      setShowDeleteDialog(false);
      onSave();
    } catch (error: any) {
      console.error('Error al eliminar el post:', error);
      setError(error.message || 'Error al eliminar la publicación');
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para determinar si una fecha tiene posts programados
  const hasScheduledPostsOnDate = (date: Date) => {
    try {
      // Convertir la fecha a formato YYYY-MM-DD para comparar solo la fecha sin la hora
      const dateString = format(date, 'yyyy-MM-dd');
      
      return allPosts.some(p => {
        if (!p.scheduled_datetime) return false;
        const postDate = format(new Date(p.scheduled_datetime), 'yyyy-MM-dd');
        return postDate === dateString && (currentPostId !== getPostId(p)); // Excluir el post actual
      });
    } catch (error) {
      console.error('Error al verificar posts programados:', error);
      return false;
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white shadow-lg">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-6 pt-4 pb-2 border-b">
              <h2 className="text-xl font-medium text-gray-800 ">
                {post ? 'Editar Publicación' : 'Nueva Publicación'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 ">
                {post ? 'Modifica los detalles de tu publicación' : 'Crea una nueva publicación para LinkedIn'}
              </p>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'image')} className="flex-1 flex flex-col">
              <div className="border-b px-6">
                <TabsList className="h-10 w-full bg-transparent border-b-0 justify-start gap-6 p-0">
                  <TabsTrigger 
                    value="content" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 py-2 h-10 bg-transparent text-gray-600 data-[state=active]:text-blue-600 font-medium "
                  >
                    Contenido
                  </TabsTrigger>
                  <TabsTrigger 
                    value="image" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 py-2 h-10 bg-transparent text-gray-600 data-[state=active]:text-blue-600 font-medium "
                  >
                    Imagen
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="content" className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {/* Mensajes de éxito o error */}
                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100 flex items-center ">
                      <span className="mr-2">⚠️</span> {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100 flex items-center ">
                      <span className="mr-2">✅</span> {successMessage}
                    </div>
                  )}

                  {planContext?.planItem && (
                    <div className="flex items-center justify-start">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Procede de un plan IA
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent align="start" className="w-96">
                          <div className="space-y-2 text-sm text-gray-700">
                            <p><strong>Tema:</strong> {planContext.planItem.topic}</p>
                            <p><strong>Formato:</strong> {planContext.planItem.content_type || 'No definido'}</p>
                            <p><strong>Pain point:</strong> {planContext.planItem.pain_point || 'No definido'}</p>
                            <p><strong>Contrarian insight:</strong> {planContext.planItem.contrarian_insight || 'No definido'}</p>
                            <p><strong>Objetivo:</strong> {planContext.planItem.objective || 'No definido'}</p>
                            <p><strong>CTA:</strong> {planContext.planItem.cta || 'No definido'}</p>
                            {planContext.strategy && (
                              <p>
                                <strong>Tono:</strong> {planContext.strategy.tone || 'No definido'} · <strong>Target:</strong> {planContext.strategy.target_audience || 'No definido'}
                              </p>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  )}

                  {/* Comparación de contenido original vs optimizado */}
                  {showComparison && optimizedContent && (
                    <div className="mb-6 border rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="font-medium text-gray-700 flex items-center ">
                          <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                          Contenido optimizado con IA
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 ">Revisa el contenido optimizado y decide si deseas aplicar los cambios.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        <div className="flex flex-col h-full">
                          <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center ">
                            <span className="mr-1">📝</span> Original
                          </h4>
                          <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap border border-gray-100 text-gray-700 text-sm h-[250px] overflow-y-auto flex-grow  leading-relaxed">
                            {originalContent || content}
                          </div>
                        </div>
                        
                        <div className="flex flex-col h-full">
                          <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center ">
                            <span className="mr-1">✨</span> Optimizado
                          </h4>
                          <div className="p-3 bg-white rounded-md whitespace-pre-wrap border border-purple-100 text-gray-800 text-sm h-[250px] overflow-y-auto flex-grow  leading-relaxed">
                            {optimizedContent}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 p-3 bg-gray-50 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDiscardOptimization} 
                          className="text-gray-600 "
                        >
                          Descartar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleAcceptOptimization} 
                          className="bg-blue-600 hover:bg-blue-700 "
                        >
                          Aplicar cambios
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Área de texto principal - más grande y prominente */}
                  {!showComparison && (
                    <>
                      <div className="relative">
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Escribe tu publicación aquí..."
                          className="min-h-[250px] text-base p-4 border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 transition-all resize-none leading-relaxed"
                        />
                      </div>

                      {/* Sección de estado y programación - más sutil */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="w-full sm:w-1/3">
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
                          <Select
                            value={state}
                            onValueChange={(value) => setState(value as PostState)}
                          >
                            <SelectTrigger className="w-full border-gray-200">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="borrador" className="">Borrador</SelectItem>
                              <SelectItem value="listo" className="">Listo</SelectItem>
                              <SelectItem value="planificado" className="">Planificado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="w-full sm:w-2/3 flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Fecha</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal border-gray-200",
                                    !scheduledDate && "text-gray-400"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                                  {scheduledDate ? format(new Date(scheduledDate), "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <div className="calendar-with-indicators">
                                  <Calendar
                                    mode="single"
                                    selected={scheduledDate ? new Date(scheduledDate) : undefined}
                                    onSelect={(date) => date && setScheduledDate(format(date, 'yyyy-MM-dd'))}
                                    initialFocus
                                    locale={es}
                                    modifiers={{
                                      hasScheduledPosts: (date) => hasScheduledPostsOnDate(date)
                                    }}
                                    modifiersClassNames={{
                                      hasScheduledPosts: "bg-blue-50 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-500 after:rounded-full"
                                    }}
                                    className="p-0"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="w-32">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Hora</label>
                            <div className="relative">
                              <select
                                value={scheduledTime}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScheduledTime(e.target.value)}
                                className="w-full pl-8 h-10 rounded-md border border-gray-200 bg-background"
                              >
                                <option value="" className="">Sin hora</option>
                                {Array.from({ length: 96 }, (_, i) => {
                                  const hour = Math.floor(i / 4);
                                  const minute = (i % 4) * 15;
                                  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                  return (
                                    <option key={time} value={time} className="">
                                      {time}
                                    </option>
                                  );
                                })}
                              </select>
                              <Clock className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón de IA - más sutil pero atractivo */}
                      <Button
                        onClick={handleOptimizeWithAI}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all "
                        disabled={!content.trim() || isOptimizing || actionLoading}
                      >
                        {isOptimizing || actionLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span className="">Optimizando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            <span className="">Mejorar con IA</span>
                          </div>
                        )}
                      </Button>

                      {optimizationError && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100 flex items-center ">
                          <span className="mr-2">⚠️</span> {optimizationError}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="image" className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Descripción de la imagen</label>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImagePrompt(e.target.value)}
                      placeholder="Describe la imagen que deseas generar..."
                      className="mt-1 border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Estilo</label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger className="w-full mt-1 border-gray-200">
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
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generar Imagen
                  </Button>

                  {generatedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {generatedImages.map((image) => (
                        <div key={image.id} className="relative group overflow-hidden rounded-lg">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
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

            {/* Footer con botones */}
            <div className="border-t p-4 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                {currentPostId && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSaving || isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose} className="text-gray-600">
                  Cancelar
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || isDeleting || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Guardando...
                  </div>
                ) : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para guardar cambios */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[400px] bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-800 ">Guardar cambios</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 ">
              Has realizado cambios en esta publicación. ¿Quieres guardarlos antes de cerrar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleConfirmClose(false)}
              className=""
            >
              Descartar
            </Button>
            <Button
              onClick={() => handleConfirmClose(true)}
              className="bg-blue-600 hover:bg-blue-700 "
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[420px] bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-800 ">Eliminar publicación</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 ">
              Esta acción enviará solo esta publicación a estado eliminado. No afectará a otros duplicados.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
            <p><strong>ID:</strong> {currentPostId || 'sin id'}</p>
            <p>
              <strong>Programación:</strong>{' '}
              {scheduledDate
                ? `${scheduledDate}${scheduledTime ? ` ${scheduledTime}` : ''}`
                : 'sin fecha'}
            </p>
            <p><strong>Contenido:</strong> {(content || '').slice(0, 100)}{content.length > 100 ? '...' : ''}</p>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !currentPostId}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
