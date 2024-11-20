import { useState, useMemo } from 'react';
import { LinkedInPost } from '../types';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface PostsTableProps {
  data: LinkedInPost[];
}

export default function PostsTable({ data }: PostsTableProps) {
  const [sortField, setSortField] = useState<keyof LinkedInPost>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(25);

  const filteredData = useMemo(() => {
    return data.filter(post => post.text.trim() !== '');
  }, [data]);

  const sortedAndFilteredData = useMemo(() => {
    return filteredData
      .filter(post => 
        post.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
  }, [filteredData, sortField, sortDirection, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * postsPerPage;
    return sortedAndFilteredData.slice(startIndex, startIndex + postsPerPage);
  }, [sortedAndFilteredData, currentPage, postsPerPage]);

  const handleSort = (field: keyof LinkedInPost) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: keyof LinkedInPost }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePostsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPostsPerPage(Number(event.target.value));
    setCurrentPage(0);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar publicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['fecha', 'texto', 'visualizaciones', 'reacciones', 'comentarios', 'compartidos'].map((field) => (
                <th
                  key={field}
                  onClick={() => handleSort(field as keyof LinkedInPost)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                    <SortIcon field={field as keyof LinkedInPost} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((post, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(post.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xl truncate">{post.text}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.likes.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.comments.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.shares.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-between items-center">
        <select value={postsPerPage} onChange={handlePostsPerPageChange} className="border rounded-md p-1">
          {[10, 25, 50, 100].map((num) => (
            <option key={num} value={num}>{num} publicaciones</option>
          ))}
        </select>
        <div>
          {Array.from({ length: Math.ceil(sortedAndFilteredData.length / postsPerPage) }, (_, index) => (
            <button key={index} onClick={() => handlePageChange(index)} className={`mx-1 ${currentPage === index ? 'font-bold' : ''}`}>
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}