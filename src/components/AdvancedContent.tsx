// AdvancedContent.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LinkedInPost } from '../types';
import { TagCloud } from 'react-tagcloud';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const AdvancedContent = ({ data }) => {
  // Análisis de palabras clave más usadas
  const wordCounts = {};
  data.forEach(post => {
    const words = post.text.toLowerCase().split(/\W+/);
    words.forEach(word => {
      if (word.length > 4) { // Filtra palabras cortas
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });

  const wordCloudData = Object.entries(wordCounts).map(([word, count]) => ({
    value: word,
    count,
  }));

  // Análisis de longitud óptima de contenido
  const lengthData = data.map(post => ({
    contentLength: post.text.length,
    engagementRate: ((post.likes + post.comments + post.shares) / post.views) * 100 || 0,
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Análisis de Contenido</h3>

        {/* Palabras clave más usadas */}
        <div className="mb-8">
          <h4 className="text-md font-semibold mb-2">Palabras Clave Más Usadas</h4>
          <TagCloud
            minSize={12}
            maxSize={35}
            tags={wordCloudData}
            className="myTagCloud"
          />
        </div>

        {/* Análisis de longitud óptima de contenido */}
        <div>
          <h4 className="text-md font-semibold mb-2">Longitud Óptima del Contenido</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contentLength" name="Longitud del Contenido" />
                <YAxis dataKey="engagementRate" name="Engagement Rate" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={lengthData} fill="#82ca9d" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedContent;
