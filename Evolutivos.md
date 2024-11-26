Paso 1
Para limitar el uso de la API necesitaremos restringir el uso de llamadas posibles.
Para ello haremos que:
- El usuario solo pueda hacer 3 lotes de categorización por día.
- Cada lote pueda contener un máximo de 10 publicaciones.
- El usuario deberá mandar cada lote de forma manual haciendo click en un botón, y espere a que se procese.
- El usuario no podrá hacer click en ese botón hasta pasados 3 minutos.
Para todo esto, además de la funcionalidad de la app, seguramnente tendremos que crear una o varias tablas en la base de datos de supabase para almacenar los eventos de cuándo un usuario haya hecho un lote para en base a eso calcular si puede seguir haciendo lotes o no y cuándo podrá hacer el siguiente. Dame también el SQL de supabase para crear esas tablas y los permisos oportunos. 

Paso 2
El botón de enviar lote en Dashboard debe ser más visible, estar ubicado encima de la tabla de publicaciones, y con estilos más modernos y atractivos, similares al del resto de componentes. 

Paso 3
Para un usuario que ya tenga datos en la bbdd, tiene que existir un botón que le permita volver a subir datos como en la funcionalidad inicial, pero en este caso se deberá hacer un cotejo de qué posts existen ya en la bbdd en base a la url, y  subir los que no existan, así como actualizar los campos views,	likes,	comments,	shares,	type de aquellos que ya existan.

Paso 4
En Dashboard, cuando un usuario suba un csv para actualizar sus datos, agregar un popup con un spinner y el texto "Actualizando tus datos" mientras se actualizan los posts, y mensaje de confirmación y un botón de "Actualiza para ver tus nuevos datos" que refresque la página.
En FileUpload, hacer algo parecido también.

Paso 5
Añade entre las tarjetas de Posts y Visualizaciones una nueva que sea "Ratio de Engagement", que muestre el dato para el periodo filtrado de Interacciones/Visualizaciones
Mostrar en cada tarjeta de datos (Posts, visualizaciones, reacciones, comentarios, compartidos, y ratio de engagement) una comparativa respecto a un periodo de igual duración pero anterior (es decir, si estoy viendo "esta semana" que me lo compare con los datos de la semana anterior). Los datos de la comparativa se deberían ver en la esquina superior derecha de la tarjeta, y mostrase con una flecha hacia arriba y en verde si son positivos, y con una flecha hacia abajo y en rojo si son negativos. 
Además, debajo de cada indicador principal, sería interesante mostrar el ratio por publicación, es decir, las visualizaciones por publicación, reacciones por publicación, ... Esto debería visualizarse también dentro de la misma tarjeta, justo debajo del indicador principal, y en tamaño de fuente más pequeña.


Paso 6
Añade a la derecha del gráfico temporal, un gráfico que permita visualizar en un gráfico tipo tarta el reparto por tipo de publicación. Cada tipo debería mostrar un tooltip al pasar el ratón por encima, que permita visualizar el alcance promedio por tipo de post, la interacción promedia, y los comentarios promedios. 
Debajo del gráfico y antes de la tabla, crea una pequeña tabla que muestre un listado con las categorías de los posts, el recuento de posts por cada categoría, el alcance promedio por categoría, la interacción promedia por categoría (sumando reacciones, comentarios, y compartidos), y la tasa de engagement por categoría (interacción total/visualizaciones). 
Añade una columna a la tabla de publicaciones con el "Ratio de Engagement", que muestre el dato para el periodo filtrado de Interacciones/Visualizaciones de cada publicaciones

Futuros pasos
Ampliar tamaño de lotes que se envían a la API de Google a 30

Nuevos análisis
Mejor y peor día/hora para publicar basado en engagement
Estacionalidad en el engagement (¿hay meses/períodos mejores?)
Longitud óptima de los posts (correlación entre extensión y engagement)
Gráfico de correlación entre longitud y engagement
Nube de palabras clave más efectivas
Tasa de crecimiento de seguidores -> Dato que habrá que meter a mano

Nuevo apartado -> Generador de contenido en base a IA Generativa y a tus posts con mejor engagement.
Formulario en el que elijes
    -Categoría (en base a las categorías de los posts)
    -Tema de referencia (te deja meter un campo de texto explicando de qué quieres hablar, e incluso pegar un artículo)
    -Envias eso a la API junto con ejemplos de tus top 20 posts de esa categoría y con el prompt para generar contenido, y te vevuelve un post y un prompt para una imagen con IA

Esta url abre linkedin con el popup de publicar, se puede usar para post automatizado -> https://www.linkedin.com/feed/?shareActive=true&src=direct%2Fnone&veh=direct%2Fnone

Añadir scraping de datos con python en un back -> https://github.com/joeyism/LinkedIn_scraper

Definición de la bbdd:
CREATE TABLE categorization_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    batch_number INTEGER,
    processed BOOLEAN DEFAULT FALSE
);

-- Crear un índice para facilitar las consultas
CREATE INDEX idx_user_id ON categorization_events (user_id);

-- Permisos
GRANT SELECT, INSERT ON categorization_events TO authenticated;