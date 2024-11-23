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