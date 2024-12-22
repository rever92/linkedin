import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Sparkles } from 'lucide-react';

interface PremiumBannerProps {
  message?: string;
}

const PremiumBanner: React.FC<PremiumBannerProps> = ({ 
  message = "Esta es una funcionalidad premium" 
}) => {
  return (
    <Card className="w-full bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Sparkles className="w-12 h-12 text-amber-500" />
          <h3 className="text-xl font-semibold text-amber-900">{message}</h3>
          <p className="text-amber-700">
            Actualiza a Premium para desbloquear todas las funcionalidades y llevar tu perfil de LinkedIn al siguiente nivel
          </p>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => {/* TODO: Implementar lógica de actualización */}}
          >
            Actualizar a Premium
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumBanner; 