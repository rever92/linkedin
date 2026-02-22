import { UploadCloud } from 'lucide-react';
import Papa from 'papaparse';
import { LinkedInPost } from '../types';
import { api } from '../lib/api';
import { useState } from 'react';
import Spinner from '@/components/ui/spinner';

interface FileUploadProps {
  onDataLoaded: (data: LinkedInPost[]) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const extractDateFromPostId = (postId: string): string => {
    try {
      const timestamp = parseInt(BigInt(postId).toString(2).slice(0, 41), 2);
      const date = new Date(timestamp);
      
      // Formatear la fecha y hora en formato ISO
      const isoDate = date.toISOString();
      return isoDate;
    } catch (error) {
      throw new Error('Error al extraer la fecha del ID del post');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setLoading(true);
    setUpdateMessage(null);

    try {
      const user = api.getUser();
      if (!user) throw new Error('No authenticated user found');

      Papa.parse(file, {
        complete: async (results) => {
          try {
            const posts = results.data.slice(1).map((row: any) => {
              let isoDate;
              const url = row[0];

              // Extraer el ID de la publicación de la URL
              const postIdMatch = url.match(/(\d{19})/);
              if (postIdMatch) {
                const postId = postIdMatch[1];
                isoDate = extractDateFromPostId(postId);
              } else if (row[1]) {
                // Si hay fecha en el CSV, usar el formato anterior
                const [datePart, timePart] = row[1].split(', ');
                const [day, month, year] = datePart.split('/');
                isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
              } else {
                throw new Error('No se pudo extraer la fecha del post');
              }

              return {
                url: url,
                date: isoDate,
                text: row[2],
                views: parseInt(row[3]) || 0,
                likes: parseInt(row[4]) || 0,
                comments: parseInt(row[5]) || 0,
                shares: parseInt(row[6]) || 0,
                post_type: row[7],
              };
            });

            await api.upsertPosts(posts);

            const updatedPosts = await api.getPosts();

            onDataLoaded(updatedPosts);
            setUpdateMessage('Datos actualizados correctamente.');
          } catch (err: any) {
            setError(err.message);
            console.error('Error uploading data:', err);
          } finally {
            setLoading(false);
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

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Spinner />
            <p className="mt-2">Actualizando tus datos...</p>
          </div>
        </div>
      )}

      {updateMessage && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <p>{updateMessage}</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Actualiza para ver tus nuevos datos
          </button>
        </div>
      )}
    </div>
  );
}