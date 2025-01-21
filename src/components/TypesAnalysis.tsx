// TypesAnalysis.tsx
import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

const TypesAnalysis = ({ data }) => {
  const [postTypeData, setPostTypeData] = useState([]);
  const [sortField, setSortField] = useState('engagementRate');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const calculatePostTypeData = () => {
      const postTypes = {};

      data.forEach(post => {
        const postType = post.post_type || 'Sin tipo';
        if (!postTypes[postType]) {
          postTypes[postType] = { count: 0, views: 0, likes: 0, comments: 0, shares: 0 };
        }
        postTypes[postType].count += 1;
        postTypes[postType].views += post.views;
        postTypes[postType].likes += post.likes;
        postTypes[postType].comments += post.comments;
        postTypes[postType].shares += post.shares;
      });

      const postTypeDataArray = Object.entries(postTypes).map(([key, value]) => ({
        post_type: key,
        count: value.count,
        views: value.views,
        likes: value.likes,
        comments: value.comments,
        shares: value.shares,
        engagementRate: value.views > 0 ? ((value.likes + value.comments + value.shares) / value.views) * 100 : 0,
      }));

      setPostTypeData(postTypeDataArray);
    };

    calculatePostTypeData();
  }, [data]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPostTypeData = [...postTypeData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipos de Contenido</h3>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead onClick={() => handleSort('post_type')} className="cursor-pointer">Tipo de Contenido</TableHead>
              <TableHead onClick={() => handleSort('count')} className="cursor-pointer text-right">Posts</TableHead>
              <TableHead onClick={() => handleSort('views')} className="cursor-pointer text-right">Alcance Promedio</TableHead>
              <TableHead onClick={() => handleSort('likes')} className="cursor-pointer text-right">Interacciones Promedio</TableHead>
              <TableHead onClick={() => handleSort('engagementRate')} className="cursor-pointer text-right">Engagement Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPostTypeData.map((typeData, idx) => {
              const avgViews = typeData.views / typeData.count;
              const avgInteractions = (typeData.likes + typeData.comments + typeData.shares) / typeData.count;

              return (
                <TableRow key={idx} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{typeData.post_type}</TableCell>
                  <TableCell className="text-right">{typeData.count}</TableCell>
                  <TableCell className="text-right">{avgViews.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{avgInteractions.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{typeData.engagementRate.toFixed(2)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TypesAnalysis;
