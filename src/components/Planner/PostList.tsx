import { useState } from 'react';
import { Post, PostState } from '../../types/posts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';

interface PostListProps {
  posts: Post[];
  onPostSelect: (post: Post) => void;
  onPostUpdate: () => void;
}

export default function PostList({ posts, onPostSelect, onPostUpdate }: PostListProps) {
  const [filter, setFilter] = useState<PostState | 'todos'>('todos');
  const [schedulingPost, setSchedulingPost] = useState<Post | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const filteredPosts = posts.filter(post => 
    filter === 'todos' ? true : post.state === filter
  );

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

  const handleDelete = async (post: Post) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      onPostUpdate();
    } catch (error) {
      console.error('Error al eliminar el post:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as PostState | 'todos')}
        >
          <SelectTrigger className="w-[180px]">
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

      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="group p-6 bg-card rounded-[30px] shadow-sm hover:shadow-md transition-all"
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
                    {format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: es })}
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
                  onClick={() => handleDelete(post)}
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
              <div className="mt-4 p-6 bg-muted/50 rounded-[20px] space-y-4">
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
                      className="w-full px-3 py-1.5 rounded-[15px] border bg-background"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-sm text-muted-foreground">Hora</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[15px] border bg-background"
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

        {filteredPosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay publicaciones que mostrar
          </div>
        )}
      </div>
    </div>
  );
} 