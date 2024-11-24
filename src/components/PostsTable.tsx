import { useState, useMemo, useEffect } from 'react';
import { LinkedInPost } from '../types';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface PostsTableProps {
  data: LinkedInPost[];
}

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const handlePageClick = (pageNumber: number | string) => {
    if (typeof pageNumber === 'number') {
      console.log('Cambiando a página:', pageNumber - 1);
      onPageChange(pageNumber - 1);
    }
  };

  const getPageNumbers = () => {
    const delta = 2;
    const pages = [];
    const currentPageNumber = currentPage + 1;

    // Siempre mostrar primera página
    pages.push(1);

    // Añadir puntos suspensivos si es necesario
    if (currentPageNumber - delta > 2) {
      pages.push('...');
    }

    // Calcular rango alrededor de la página actual
    for (let i = Math.max(2, currentPageNumber - delta); 
         i <= Math.min(totalPages - 1, currentPageNumber + delta); 
         i++) {
      pages.push(i);
    }

    // Añadir puntos suspensivos si es necesario
    if (currentPageNumber + delta < totalPages - 1) {
      pages.push('...');
    }

    // Siempre mostrar última página si hay más de una
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        Anterior
      </button>
      
      {getPageNumbers().map((pageNumber, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handlePageClick(pageNumber)}
          className={`px-3 py-1 rounded ${
            pageNumber === currentPage + 1
              ? 'bg-blue-500 text-white'
              : typeof pageNumber === 'number'
              ? 'hover:bg-gray-100'
              : ''
          }`}
          disabled={typeof pageNumber !== 'number'}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        Siguiente
      </button>
    </nav>
  );
};

export default function PostsTable({ data }: PostsTableProps) {
  const [sortField, setSortField] = useState<keyof LinkedInPost>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(10);

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
        
        const aValue = String(a[sortField] || '');
        const bValue = String(b[sortField] || '');
        
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        }
        return bValue.localeCompare(aValue);
      });
  }, [filteredData, sortField, sortDirection, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return sortedAndFilteredData.slice(startIndex, endIndex);
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

  const handlePageChange = (newPage: number) => {
    console.log('Cambiando a página:', newPage);
    if (newPage >= 0 && newPage < Math.ceil(sortedAndFilteredData.length / postsPerPage)) {
      setCurrentPage(newPage);
    }
  };

  const handlePostsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPostsPerPage(Number(event.target.value));
    setCurrentPage(0);
  };

  useEffect(() => {
    console.log({
      currentPage,
      totalPages: Math.ceil(sortedAndFilteredData.length / postsPerPage),
      totalPosts: sortedAndFilteredData.length,
      postsPerPage,
      paginatedDataLength: paginatedData.length
    });
  }, [currentPage, postsPerPage, sortedAndFilteredData]);

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
              {[
                { key: 'date', label: 'Fecha' },
                { key: 'text', label: 'Texto' },
                { key: 'views', label: 'Visualizaciones' },
                { key: 'likes', label: 'Reacciones' },
                { key: 'comments', label: 'Comentarios' },
                { key: 'shares', label: 'Compartidos' }
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key as keyof LinkedInPost)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    <SortIcon field={key as keyof LinkedInPost} />
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.category ? post.category : <span className="loader">Cargando...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-between items-center">
        <select 
          value={postsPerPage} 
          onChange={handlePostsPerPageChange} 
          className="border rounded-md p-1"
        >
          {[10, 25, 50, 100].map((num) => (
            <option key={num} value={num}>{num} publicaciones</option>
          ))}
        </select>
        
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(sortedAndFilteredData.length / postsPerPage)}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}