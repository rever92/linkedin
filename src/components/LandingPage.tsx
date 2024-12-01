import { ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Optimiza tu contenido en LinkedIn con <span className="text-blue-600">datos e IA</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
            Analiza, mide y mejora el rendimiento de tus publicaciones con insights basados en datos reales
          </p>
          <button
            onClick={onLogin}
            className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Empieza gratis <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <button
            className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100"
          >
            Ver demo
          </button>
          <p className="mt-4 text-gray-500">
            Más de X profesionales ya optimizan su contenido con Linksight
          </p>
        </div>

        <div className="mt-12 flex justify-center">
          <img src="https://images.pexels.com/photos/5716001/pexels-photo-5716001.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Dashboard" className="w-3/4 rounded-lg shadow-lg" />
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Feature
            icon={<BarChart2 className="h-8 w-8 text-blue-500" />}
            title="Conoce tu audiencia"
            description="Métricas detalladas de engagement, mejores horarios para publicar, análisis de temas más efectivos."
          />
          <Feature
            icon={<Zap className="h-8 w-8 text-blue-500" />}
            title="Optimiza con IA"
            description="Recomendaciones personalizadas, categorización automática, insights accionables."
          />
          <Feature
            icon={<Shield className="h-8 w-8 text-blue-500" />}
            title="Ahorra tiempo"
            description="Dashboard unificado, importación sencilla de datos, reportes automatizados."
          />
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold">Demostración de Producto</h2>
          <p className="mt-4">Video/GIF animado mostrando el dashboard interactivo, análisis de métricas y recomendaciones de IA.</p>
          <button className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Prueba gratis durante 14 días
          </button>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center">Testimonios</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <img src="https://via.placeholder.com/150" alt="Usuario 1" className="rounded-full mb-4" />
              <p className="text-gray-500">"Linksight ha transformado la forma en que analizo mis publicaciones. ¡Altamente recomendado!"</p>
              <p className="font-bold">- Juan Pérez</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <img src="https://via.placeholder.com/150" alt="Usuario 2" className="rounded-full mb-4" />
              <p className="text-gray-500">"Las recomendaciones de IA son precisas y me han ayudado a mejorar mi engagement."</p>
              <p className="font-bold">- María López</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <img src="https://via.placeholder.com/150" alt="Usuario 3" className="rounded-full mb-4" />
              <p className="text-gray-500">"El dashboard es intuitivo y fácil de usar. ¡Me encanta!"</p>
              <p className="font-bold">- Carlos García</p>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center">Planes y Precios</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold">Gratuito</h3>
              <p className="mt-4">Acceso limitado, 1 funcionalidad IA al mes</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Seleccionar
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold">Pro</h3>
              <p className="mt-4">Uso limitado de IA, reportes mensuales</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Seleccionar
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold">Infinity</h3>
              <p className="mt-4">Uso ilimitado de IA, reportes en tiempo real</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
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
          <button className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Comienza tu prueba gratuita
          </button>
          <p className="mt-4">14 días gratis, sin compromisos.</p>
        </div>
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