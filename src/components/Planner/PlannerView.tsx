import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types/posts';
import PostList from './PostList';
import PostEditor from './PostEditor';
import Calendar from './Calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

export default function PlannerView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando posts:', error);
      return;
    }

    setPosts(data || []);
  };

  const handleCreatePost = () => {
    setSelectedPost(null);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setSelectedPost(null);
    setIsEditorOpen(false);
  };

  const handlePostSelect = (post: Post) => {
    setSelectedPost(post);
    setIsEditorOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planificador de Contenido</h1>
        <Button onClick={handleCreatePost}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Publicación
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 blur-3xl -z-10" />
        <Tabs defaultValue="list" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="w-[400px]">
              <TabsTrigger value="list" className="flex-1">Lista</TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1">Calendario</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list">
            <PostList 
              posts={posts}
              onPostSelect={handlePostSelect}
              onPostUpdate={loadPosts}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <Calendar 
              posts={posts.filter(p => p.state === 'planificado')}
              onPostSelect={handlePostSelect}
            />
          </TabsContent>
        </Tabs>
      </div>

      {isEditorOpen && (
        <PostEditor
          post={selectedPost}
          onClose={handleEditorClose}
          onSave={() => {
            loadPosts();
            handleEditorClose();
          }}
        />
      )}
    </div>
  );
} 