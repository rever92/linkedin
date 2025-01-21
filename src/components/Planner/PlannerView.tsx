import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .neq('state', 'eliminado')
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

  const getCurrentTab = () => {
    return location.pathname.includes('/calendar') ? 'calendar' : 'list';
  };

  const handleTabChange = (value: string) => {
    navigate(value === 'calendar' ? '/planner/calendar' : '/planner');
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-3xl -z-10" />
        <Tabs value={getCurrentTab()} onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="w-[400px] bg-white border border-gray-200/50 shadow-md">
              <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-primary/10">Lista</TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 data-[state=active]:bg-primary/10">Calendario</TabsTrigger>
            </TabsList>
          </div>

          <Routes>
            <Route index element={
              <PostList 
                posts={posts}
                onPostSelect={handlePostSelect}
                onPostUpdate={loadPosts}
              />
            } />
            <Route path="calendar" element={
              <Calendar 
                posts={posts.filter(p => p.state === 'planificado')}
                onPostSelect={handlePostSelect}
              />
            } />
          </Routes>
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