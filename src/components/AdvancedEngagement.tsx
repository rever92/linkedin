// AdvancedEngagement.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LinkedInPost } from '../types';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const AdvancedEngagement = ({ data }) => {
  // Gráfico de correlación entre longitud y engagement
  const scatterData = data.map(post => ({
    contentLength: post.text.length,
    engagement: post.likes + post.comments + post.shares,
  }));

  // Análisis detallado de engagement por categoría
  const categoryData = {};
  data.forEach(post => {
    const category = post.category || 'Sin categoría';
    if (!categoryData[category]) {
      categoryData[category] = { count: 0, engagement: 0 };
    }
    categoryData[category].count += 1;
    categoryData[category].engagement += post.likes + post.comments + post.shares;
  });

  const categoryEngagementData = Object.entries(categoryData).map(([category, value]) => ({
    category,
    averageEngagement: value.engagement / value.count,
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Engagement Avanzado</h3>

        {/* Gráfico de correlación entre longitud y engagement */}
        <div className="mb-8">
          <h4 className="text-md font-semibold mb-2">Correlación entre Longitud y Engagement</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contentLength" name="Longitud del Contenido" />
                <YAxis dataKey="engagement" name="Engagement" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Análisis detallado de engagement por categoría */}
        <div>
          <h4 className="text-md font-semibold mb-2">Engagement por Categoría</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Engagement Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryEngagementData.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.averageEngagement.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedEngagement;
