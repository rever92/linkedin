import { UploadCloud } from 'lucide-react';
import Papa from 'papaparse';
import { LinkedInPost } from '../types';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

interface FileUploadProps {
  onDataLoaded: (data: LinkedInPost[]) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      Papa.parse(file, {
        complete: async (results) => {
          try {
            const posts = results.data.slice(1).map((row: any) => {
              const [datePart, timePart] = row[1].split(', ');
              const [day, month, year] = datePart.split('/');
              const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;

              return {
                url: row[0],
                date: isoDate,
                text: row[2],
                views: parseInt(row[3]) || 0,
                likes: parseInt(row[4]) || 0,
                comments: parseInt(row[5]) || 0,
                shares: parseInt(row[6]) || 0,
                post_type: row[7],
                user_id: user.id
              };
            });

            for (const post of posts) {
              const { error: upsertError } = await supabase
                .from('linkedin_posts')
                .upsert([{
                  url: post.url,
                  date: post.date,
                  text: post.text,
                  views: post.views,
                  likes: post.likes,
                  comments: post.comments,
                  shares: post.shares,
                  post_type: post.post_type,
                  user_id: user.id
                }], {
                  onConflict: ['url'],
                  ignoreDuplicates: false
                });

              if (upsertError) throw upsertError;
            }

            const { data: updatedPosts, error: loadError } = await supabase
              .from('linkedin_posts')
              .select('*')
              .order('date', { ascending: false });

            if (loadError) throw loadError;

            onDataLoaded(updatedPosts);
          } catch (err: any) {
            setError(err.message);
            console.error('Error uploading data:', err);
          } finally {
            setUploading(false);
          }
        },
        error: (err: any) => {
          setError(err.message);
          setUploading(false);
        },
        header: false
      });
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">CSV file with LinkedIn data</p>
          {uploading && (
            <p className="mt-2 text-sm text-blue-500">Uploading data...</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}