import { useState } from 'react';
import { Post, PostState } from '../../types/posts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Trash2, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

type SortOption = 
  | 'created_asc'
  | 'created_desc'
  | 'scheduled_asc'
  | 'scheduled_desc';

interface PostListProps {
  posts: Post[];
  onPostSelect: (post: Post) => void;
  onPostUpdate: () => void;
}

export default function PostList({ posts, onPostSelect, onPostUpdate }: PostListProps) {
  const [filter, setFilter] = useState<PostState | 'todos'>('todos');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [hideOldPosts, setHideOldPosts] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState<Post | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const filteredPosts = posts.filter(post => {
    if (filter !== 'todos' && post.state !== filter) return false;
    
    if (hideOldPosts && post.scheduled_datetime) {
      const scheduledDate = new Date(post.scheduled_datetime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduledDate < today) return false;
    }
    
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'created_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'scheduled_asc':
        if (!a.scheduled_datetime && !b.scheduled_datetime) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (!a.scheduled_datetime) return 1;
        if (!b.scheduled_datetime) return -1;
        return new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime();
      case 'scheduled_desc':
        if (!a.scheduled_datetime && !b.scheduled_datetime) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (!a.scheduled_datetime) return 1;
        if (!b.scheduled_datetime) return -1;
        return new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime();
      default:
        return 0;
    }
  });

  const getStateColor = (state: PostState) => {
    switch (state) {
      case 'borrador':
        return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-200';
      case 'listo':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-200';
      case 'planificado':
        return 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-200';
      default:
        return 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSchedule = async (post: Post) => {
    if (!scheduledDate || !scheduledTime) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          state: 'planificado',
          scheduled_datetime: new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;

      setSchedulingPost(null);
      setScheduledDate('');
      setScheduledTime('');
      onPostUpdate();
    } catch (error) {
      console.error('Error al programar el post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ state: 'eliminado' })
        .eq('id', postId);

      if (error) throw error;

      onPostUpdate();
      setPostToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar el post:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPostToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => postToDelete && handleDelete(postToDelete.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-[250px] bg-white border border-gray-200/50 shadow">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Más recientes primero</SelectItem>
              <SelectItem value="created_asc">Más antiguos primero</SelectItem>
              <SelectItem value="scheduled_asc">Programados (ascendente)</SelectItem>
              <SelectItem value="scheduled_desc">Programados (descendente)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as PostState | 'todos')}
          >
            <SelectTrigger className="w-[180px] bg-white border border-gray-200/50 shadow">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="borrador">Borradores</SelectItem>
              <SelectItem value="listo">Listos</SelectItem>
              <SelectItem value="planificado">Planificados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="hide-old-posts"
            checked={hideOldPosts}
            onCheckedChange={setHideOldPosts}
          />
          <Label htmlFor="hide-old-posts" className="text-sm text-muted-foreground cursor-pointer">
            Ocultar anteriores
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        {sortedPosts.map((post) => (
          <div
            key={post.id}
            className="group p-6 bg-white border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-[25px]"
          >
            <div className="flex justify-between items-start gap-4">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onPostSelect(post)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(post.state)}`}>
                    {post.state}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Creado el {format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <p className="line-clamp-2 text-foreground text-sm">
                  {post.content}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {post.state !== 'planificado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSchedulingPost(post)}
                    className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                  >
                    <CalendarClock className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPostToDelete(post)}
                  className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {post.scheduled_datetime && (
              <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                <CalendarClock className="w-4 h-4" />
                Programado para: {format(new Date(post.scheduled_datetime), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
              </p>
            )}

            {schedulingPost?.id === post.id && (
              <div className="mt-4 p-6 bg-white border border-gray-200/50 shadow-md rounded-[25px] space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Programar publicación
                </h4>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-muted-foreground">Fecha</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[25px] border border-gray-200/50 shadow-sm bg-white"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-sm text-muted-foreground">Hora</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[25px] border border-gray-200/50 shadow-sm bg-white"
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
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSchedulingPost(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSchedule(post)}
                    disabled={!scheduledDate || !scheduledTime}
                  >
                    Programar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sortedPosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay publicaciones que mostrar
          </div>
        )}
      </div>
    </div>
  );
} 