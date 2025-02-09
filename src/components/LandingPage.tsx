import { ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import Footer from './Footer';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<number>(0);

  const features: Feature[] = [
    {
      icon: <BarChart2 className="h-8 w-8 text-blue-500" />,
      title: "20x más rápido que programar",
      description: "Usa tu lenguaje nativo para describir tu idea, y deja que Linksight haga el resto. Crear para la web es más rápido y fácil que nunca.",
      image: "https://via.placeholder.com/800x400?text=20x+Más+Rápido"
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      title: "Edita con prompts",
      description: "Olvídate de la sobrecarga de ingenieros frontend o freelancers para mantener tu sitio web. Pide cambios directamente en texto.",
      image: "https://via.placeholder.com/800x400?text=Edición+con+Prompts"
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "Tú eres dueño del código",
      description: "Todo lo que Linksight construye es tuyo. Sincroniza tu código con Github y edita en cualquier editor, exporta o publica tu app al instante con un click.",
      image: "https://via.placeholder.com/800x400?text=Tu+Código"
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between py-16">
          <div className="w-full lg:w-1/2 lg:pr-12">
            <div className="mb-8">
              <span className="text-purple-600 font-medium text-sm uppercase tracking-wide">
                MEJOR SERVICIO DE SOFTWARE 
              </span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Optimiza tu contenido en LinkedIn con Datos e IA
            </h1>
            <p className="text-xl text-gray-600 mb-8">
            Analiza, mide y mejora el rendimiento de tus publicaciones con insights basados en datos reales y usando Inteligencia Artificial
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
              >
                Empezar ahora
              </button>
              <button 
                className="px-8 py-4 text-gray-700 rounded-full font-medium border-2 border-gray-200 hover:border-purple-600 hover:text-purple-600 transition-colors"
              >
                Explorar más
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 mt-12 lg:mt-0">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-50 rounded-3xl transform rotate-3"></div>
              
              <div className="relative bg-white rounded-3xl shadow-xl p-6 transform -rotate-3">
                <img
                  src="https://via.placeholder.com/600x400?text=Analytics+Dashboard"
                  alt="Analytics Dashboard"
                  className="w-full rounded-2xl"
                />
                
                <div className="absolute -top-8 -left-8 bg-white rounded-2xl shadow-lg p-4 transform -rotate-6">
                  <img
                    src="https://via.placeholder.com/80x80?text=Stats"
                    alt="Statistics"
                    className="w-20 h-20"
                  />
                </div>
                
                <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-lg p-4 transform rotate-6">
                  <img
                    src="https://via.placeholder.com/80x80?text=Chart"
                    alt="Chart"
                    className="w-20 h-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="caracteristicas" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Construye software de alta calidad sin escribir código</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Crear software nunca ha sido más accesible. Con Linksight, simplemente describe tu idea en tus propias palabras y observa cómo se transforma en una aplicación completamente funcional con una estética hermosa.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/2 space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-[25px] cursor-pointer transition-all duration-300 ${
                    selectedFeature === index
                      ? 'bg-white border-2 border-purple-500'
                      : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                  }`}
                  onClick={() => setSelectedFeature(index)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                      <p className="mt-2 text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-1/2 sticky top-8">
              <div className="bg-white rounded-[25px] shadow-xl overflow-hidden">
                <img
                  src={features[selectedFeature].image}
                  alt={features[selectedFeature].title}
                  className="w-full h-auto object-cover rounded-[25px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold">Demostración de Producto</h2>
          <p className="mt-4">Video/GIF animado mostrando el dashboard interactivo, análisis de métricas y recomendaciones de IA.</p>
          <button
            className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            onClick={onLogin}
          >
            Prueba gratis durante 14 días
          </button>
        </div>

        <div id="testimonios" className="mt-20 pt-16 -mt-16">
          <h2 className="text-3xl font-bold text-center">Testimonios</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-[25px] shadow-lg">
              <img src="https://via.placeholder.com/150" alt="Usuario 1" className="rounded-full mb-4" />
              <p className="text-gray-500">"Linksight ha transformado la forma en que analizo mis publicaciones. ¡Altamente recomendado!"</p>
              <p className="font-bold">- Juan Pérez</p>
            </div>
            <div className="bg-white p-6 rounded-[25px] shadow-lg">
              <img src="https://via.placeholder.com/150" alt="Usuario 2" className="rounded-full mb-4" />
              <p className="text-gray-500">"Las recomendaciones de IA son precisas y me han ayudado a mejorar mi engagement."</p>
              <p className="font-bold">- María López</p>
            </div>
            <div className="bg-white p-6 rounded-[25px] shadow-lg">
              <img src="https://via.placeholder.com/150" alt="Usuario 3" className="rounded-full mb-4" />
              <p className="text-gray-500">"El dashboard es intuitivo y fácil de usar. ¡Me encanta!"</p>
              <p className="font-bold">- Carlos García</p>
            </div>
          </div>
        </div>

        <div id="precios" className="mt-20 pt-16 -mt-16">
          <h2 className="text-3xl font-bold text-center">Planes y Precios</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-[25px] shadow-lg text-center">
              <h3 className="text-xl font-bold">Gratuito</h3>
              <p className="mt-4">Acceso limitado, 1 funcionalidad IA al mes</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700">
                Seleccionar
              </button>
            </div>
            <div className="bg-white p-6 rounded-[25px] shadow-lg text-center">
              <h3 className="text-xl font-bold">Pro</h3>
              <p className="mt-4">Uso limitado de IA, reportes mensuales</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700">
                Seleccionar
              </button>
            </div>
            <div className="bg-white p-6 rounded-[25px] shadow-lg text-center">
              <h3 className="text-xl font-bold">Infinity</h3>
              <p className="mt-4">Uso ilimitado de IA, reportes en tiempo real</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700">
                Seleccionar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center">Garantías</h2>
          <p className="mt-4">Prueba gratuita de 14 días, sin tarjeta de crédito, cancela cuando quieras, soporte prioritario.</p>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center">Preguntas Frecuentes</h2>
          <div className="mt-4">
            {[
              { question: "¿Cómo empiezo?", answer: "Simplemente regístrate y comienza a usar Linksight." },
              { question: "¿Qué datos necesito?", answer: "Solo necesitas tu cuenta de LinkedIn y tus publicaciones." },
              { question: "¿Es seguro?", answer: "Sí, utilizamos encriptación de datos de nivel industrial." },
              { question: "¿Cómo funciona la IA?", answer: "Analiza tus publicaciones y te da recomendaciones personalizadas." },
              { question: "¿Puedo exportar los datos?", answer: "Sí, puedes exportar tus reportes en formato CSV." },
              { question: "¿Qué soporte ofrecen?", answer: "Ofrecemos soporte prioritario a todos nuestros usuarios." },
            ].map((item, index) => (
              <div key={index} className="border-b">
                <button
                  className="w-full text-left py-4 px-4 focus:outline-none"
                  onClick={() => toggleAccordion(index)}
                >
                  <h3 className="font-semibold">{item.question}</h3>
                </button>
                {activeIndex === index && (
                  <p className="px-4 pb-4">{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold">Mejora tu presencia en LinkedIn hoy mismo</h2>
          <p className="mt-4">Únete a los profesionales que ya optimizan su contenido con datos.</p>
          <button
            className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            onClick={onLogin}
          >
            Comienza tu prueba gratuita
          </button>
          <p className="mt-4">14 días gratis, sin compromisos.</p>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-500">{description}</p>
    </div>
  );
}