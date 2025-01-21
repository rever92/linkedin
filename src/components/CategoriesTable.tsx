// CategoriesTable.tsx
import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

const CategoriesTable = ({ data }) => {
  const [categoryData, setCategoryData] = useState([]);
  const [sortField, setSortField] = useState('engagementRate');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const calculateCategoryData = () => {
      const categories = {};

      data.forEach(post => {
        const category = post.category || 'Sin categoría';
        if (!categories[category]) {
          categories[category] = { count: 0, views: 0, likes: 0, comments: 0, shares: 0 };
        }
        categories[category].count += 1;
        categories[category].views += post.views;
        categories[category].likes += post.likes;
        categories[category].comments += post.comments;
        categories[category].shares += post.shares;
      });

      const categoryDataArray = Object.entries(categories).map(([key, value]) => ({
        category: key,
        count: value.count,
        views: value.views,
        likes: value.likes,
        comments: value.comments,
        shares: value.shares,
        engagementRate: value.views > 0 ? ((value.likes + value.comments + value.shares) / value.views) * 100 : 0
      }));

      setCategoryData(categoryDataArray);
    };

    calculateCategoryData();
  }, [data]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCategoryData = [...categoryData].sort((a, b) => {
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
        <h3 className="text-lg font-semibold mb-4">Categorías</h3>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead onClick={() => handleSort('category')} className="cursor-pointer">Categoría</TableHead>
              <TableHead onClick={() => handleSort('count')} className="cursor-pointer text-right">Posts</TableHead>
              <TableHead onClick={() => handleSort('views')} className="cursor-pointer text-right">Alcance Promedio</TableHead>
              <TableHead onClick={() => handleSort('likes')} className="cursor-pointer text-right">Interacciones Promedio</TableHead>
              <TableHead onClick={() => handleSort('engagementRate')} className="cursor-pointer text-right">Engagement Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCategoryData.map((category, idx) => {
              const avgViews = category.views / category.count;
              const avgInteractions = (category.likes + category.comments + category.shares) / category.count;

              return (
                <TableRow key={idx} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{category.category}</TableCell>
                  <TableCell className="text-right">{category.count}</TableCell>
                  <TableCell className="text-right">{avgViews.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{avgInteractions.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{category.engagementRate.toFixed(2)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CategoriesTable;
