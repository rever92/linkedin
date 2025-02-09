import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center">
              <LineChart className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Linksight</span>
            </div>
            <p className="mt-4 text-gray-600">
              Optimiza tu contenido en LinkedIn con datos e IA
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Producto</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#caracteristicas" className="text-base text-gray-600 hover:text-blue-600">
                  Características
                </a>
              </li>
              <li>
                <a href="#testimonios" className="text-base text-gray-600 hover:text-blue-600">
                  Testimonios
                </a>
              </li>
              <li>
                <a href="#precios" className="text-base text-gray-600 hover:text-blue-600">
                  Precios
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Soporte</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="mailto:support@linksight.es" className="text-base text-gray-600 hover:text-blue-600">
                  Contacto
                </a>
              </li>
              <li>
                <Link to="/privacidad" className="text-base text-gray-600 hover:text-blue-600">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/privacidad" className="text-base text-gray-600 hover:text-blue-600">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-base text-gray-600 hover:text-blue-600">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-base text-gray-600 hover:text-blue-600">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            © {new Date().getFullYear()} Linksight Solutions, S.L. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 