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
import { Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Escribe tu publicación aquí..."
              className="min-h-[200px]"
            />

            {!showScheduler && (
              <div className="flex gap-2">
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
              <Button variant="outline" onClick={handleSchedule}>
                <Calendar className="w-4 h-4 mr-2" />
                Planificar
              </Button>
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