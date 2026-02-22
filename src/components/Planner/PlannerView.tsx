import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Post } from '../../types/posts';
import PostList from './PostList';
import PostEditor from './PostEditor';
import Calendar from './Calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function PlannerView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await api.getPlannerPosts();
      setPosts(data || []);
    } catch (error) {
      console.error('Error cargando posts:', error);
    }
  };

  const handleCreatePost = () => {
    setSelectedPost(null);
    setSelectedDate('');
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setSelectedPost(null);
    setSelectedDate('');
    setIsEditorOpen(false);
  };

  const handlePostSelect = (post: Post) => {
    setSelectedPost(post);
    setSelectedDate('');
    setIsEditorOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedPost(null);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
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
                onDateSelect={handleDateSelect}
              />
            } />
          </Routes>
        </Tabs>
      </div>

      {isEditorOpen && (
        <PostEditor
          post={selectedPost}
          initialDate={selectedDate}
          onClose={handleEditorClose}
          onSave={() => {
            loadPosts();
            handleEditorClose();
          }}
          allPosts={posts}
        />
      )}
    </div>
  );
} 