import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <p className="text-lg mb-2">Última actualización: 2 de febrero de 2025</p>
            <p className="text-gray-600">
              En Linksight Solutions, S.L. nos comprometemos a proteger y respetar su privacidad. 
              Esta política explica cómo recopilamos, utilizamos y protegemos sus datos personales.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ¿Quién es el responsable del tratamiento de sus datos?</h2>
            <p className="mb-4">Responsable: Linksight Solutions, S.L.</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>NIF: B87654321</li>
              <li>Domicilio social: Calle Innovación, 123, 28001 Madrid, España</li>
              <li>Email: privacy@linksight.es</li>
              <li>Teléfono: +34 911 234 567</li>
              <li>Delegado de Protección de Datos (DPO): dpo@linksight.es</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. ¿Qué datos personales recopilamos?</h2>
            <p className="mb-4">Podemos recopilar los siguientes tipos de información:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Información de identificación personal (nombre, dirección de email, teléfono)</li>
              <li>Datos de facturación y pago</li>
              <li>Información técnica (dirección IP, tipo de navegador, dispositivo)</li>
              <li>Datos de uso del sitio web y servicios</li>
              <li>Comunicaciones que mantiene con nosotros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. ¿Con qué finalidad tratamos sus datos personales?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Gestionar la prestación de nuestros servicios</li>
              <li>Procesar sus pagos y transacciones</li>
              <li>Enviar comunicaciones comerciales (con su consentimiento)</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Prevenir y detectar fraudes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. ¿Cuál es la legitimación para el tratamiento de sus datos?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>La ejecución de un contrato</li>
              <li>El consentimiento del usuario</li>
              <li>El cumplimiento de obligaciones legales</li>
              <li>El interés legítimo del responsable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. ¿Por cuánto tiempo conservaremos sus datos?</h2>
            <p className="mb-4 text-gray-600">
              Conservaremos sus datos personales durante el tiempo necesario para cumplir con los fines 
              para los que fueron recopilados y para cumplir con nuestras obligaciones legales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. ¿A qué destinatarios se comunicarán sus datos?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Proveedores de servicios necesarios para nuestra actividad</li>
              <li>Autoridades competentes en casos requeridos por ley</li>
              <li>Entidades del grupo empresarial para fines administrativos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Transferencias internacionales de datos</h2>
            <p className="mb-4 text-gray-600">
              Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio 
              Económico Europeo (EEE). En estos casos, garantizamos que existan garantías adecuadas 
              para proteger sus datos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. ¿Cuáles son sus derechos?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Acceso: obtener confirmación sobre si estamos tratando sus datos</li>
              <li>Rectificación: corregir datos inexactos o incompletos</li>
              <li>Supresión: solicitar la eliminación de sus datos</li>
              <li>Oposición: oponerse al tratamiento de sus datos</li>
              <li>Portabilidad: recibir y transmitir sus datos a otro responsable</li>
              <li>Limitación del tratamiento: restringir el procesamiento de sus datos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. ¿Cómo puede ejercer sus derechos?</h2>
            <p className="mb-4 text-gray-600">
              Puede ejercer sus derechos enviando un correo electrónico a privacy@linksight.es o una 
              carta a nuestra dirección postal, incluyendo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Fotocopia de su DNI o documento identificativo equivalente</li>
              <li>Descripción del derecho que desea ejercer</li>
              <li>Dirección a efectos de notificaciones</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Medidas de seguridad</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Cifrado de datos</li>
              <li>Capacidad de garantizar la confidencialidad, integridad y disponibilidad</li>
              <li>Capacidad de restaurar el acceso a los datos en caso de incidente</li>
              <li>Proceso de verificación y evaluación regular de la eficacia de las medidas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Cookies</h2>
            <p className="text-gray-600">
              Nuestro sitio web utiliza cookies y tecnologías similares. Para más información, 
              consulte nuestra <a href="/cookies" className="text-blue-600 hover:text-blue-800">Política de Cookies</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Modificaciones de la política de privacidad</h2>
            <p className="text-gray-600">
              Nos reservamos el derecho de modificar esta política de privacidad para adaptarla a 
              novedades legislativas o jurisprudenciales. En dichos supuestos, anunciaremos en esta 
              página los cambios introducidos con razonable antelación a su puesta en práctica.
            </p>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contacto</h2>
            <p className="mb-4 text-gray-600">
              Si tiene alguna pregunta sobre esta política de privacidad o el tratamiento de sus datos 
              personales, puede contactar con nuestro Delegado de Protección de Datos en:
            </p>
            <ul className="list-none space-y-2 text-gray-600">
              <li>Email: dpo@linksight.es</li>
              <li>Teléfono: +34 911 234 567</li>
              <li>Dirección: Calle Innovación, 123, 28001 Madrid, España</li>
            </ul>
          </section>

          <p className="mt-8 text-gray-600">
            También tiene derecho a presentar una reclamación ante la Agencia Española de Protección 
            de Datos (www.aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 