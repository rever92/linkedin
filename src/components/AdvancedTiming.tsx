// AdvancedTiming.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LinkedInPost } from '../types';
import {
  HeatMapGrid
} from 'react-grid-heatmap';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const AdvancedTiming = ({ data }) => {
  // Preparar datos para el mapa de calor
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const heatmapData = Array.from({ length: 7 }, () => Array(24).fill(0));

  data.forEach(post => {
    const date = new Date(post.date);
    const day = date.getDay();
    const hour = date.getHours();
    heatmapData[day][hour] += post.views; // Puedes cambiar 'views' por otra métrica
  });

  // Análisis detallado de mejores momentos para publicar
  const flattenedData = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      flattenedData.push({
        day,
        hour,
        value: heatmapData[day][hour],
      });
    }
  }

  const bestTimes = flattenedData
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(item => ({
      day: days[item.day],
      hour: item.hour,
      value: item.value,
    }));

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Timing Avanzado</h3>

        {/* Mapa de calor */}
        <div className="mb-8">
          <h4 className="text-md font-semibold mb-2">Mapa de Calor de Actividad</h4>
          <div className="overflow-x-auto">
            <HeatMapGrid
              data={heatmapData}
              xLabels={hours}
              yLabels={days}
              square
              cellHeight="15px"
              cellWidth="15px"
              cellStyle={(background, value, min, max, data, x, y) => ({
                background: `rgb(66, 86, 244, ${value / max})`,
                fontSize: '0px',
              })}
              cellRender={(value) => value && <span>{value}</span>}
            />
          </div>
        </div>

        {/* Análisis detallado de mejores momentos para publicar */}
        <div>
          <h4 className="text-md font-semibold mb-2">Mejores Momentos para Publicar</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="text-right">Alcance Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bestTimes.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.day}</TableCell>
                  <TableCell>{item.hour}:00</TableCell>
                  <TableCell className="text-right">{item.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedTiming;
