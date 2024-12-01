He creado una aplicación con react y su papel es como fondo que sirve para realizar las métricas de LinkedIn de un usuario. Esta aplicación extrae los datos del perfil de usuario mediante una extensión de Google Chrome que el usuario puede ejecutar en su perfil y extraer de ahí datos de subs publicaciones como el listado de publicaciones y por cada una de ellas las visualizaciones las reacciones los comentarios y las veces que se ha compartido así como el tipo de publicación que es (imagen, video, texto, compartida, artículo, …).
Esta aplicación busca ayudar a un usuario a optimizar su perfil de LinkedIn en base a datos es decir ser una persona data driven a la hora de generar contenidos en LinkedIn. 
A futuro la idea dentro de muy poco tiempo es que puede incluso generar un calendario de publicaciones y crear publicaciones de éxito con IA generativa en base a sus publicaciones anteriores y un tema que quiera tratar.



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


Paso 7 
Nuevos análisis
Mejor y peor día/hora para publicar basado en engagement
Estacionalidad en el engagement (¿hay meses/períodos mejores?)
Longitud óptima de los posts (correlación entre extensión y engagement)
Gráfico de correlación entre longitud y engagement
Nube de palabras clave más efectivas
Tasa de crecimiento de seguidores -> Dato que habrá que meter a mano

Paso
KPI nuevo de posts/semana para el periodo elegido (con comparativa respecto al mismo espacio de tiempo anterior)


Paso 8


Futuros pasos
Ampliar tamaño de lotes que se envían a la API de Google a 30

Planificador de contenidos. Este planificador de contenidos en principio tendrá dos grandes apartados:
Publicaciones - Aquí el usuario podrá ir creando y guardando sus ideas de publicaciones, marcando estados como "Borrador, Listo, ..." y podrá incluso asignar el día y hora a la que lo quiere publicar.
Calendario - El usuario podrá ir organizando cuándo quiere lanzar cada una de sus publicaciones (aunque no se podrá programar, porque Linkedin no lo permitee sta url abre linkedin con el popup de publicar, por lo que se puede usar para post automatizado que cuando carge, espere un par de segundos y pegue el contenido de la publicación (no la imagen)-> https://www.linkedin.com/feed/?shareActive=true&src=direct%2Fnone&veh=direct%2Fnone ).
Funcionalidades IA:
* Generar un plan de contenidos. En base a las recomendaciones que hayas obtenido en tu perfil en base al análisis actual, te crea una propuesta de plan de publicaciones que se puede añadir a tu listado de publicaciones. 
* Generador un contenido con ia. Para cada contenido específico, te permite crear un nuevo contenido con IA o hacer un análisis sobre uno que ya has cread, y una vez te genera la nueva versión, te muestra uno al lado del otro para que los comprares y te pide revision y permite incluso modificarlo.

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