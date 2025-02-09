npx supabase secrets set --project-ref kddqxyivhcucamgfcwmu STRIPE_WEBHOOK_SECRET=whsec_czo36NiBVLbhkVL7gv5Eckdfj47u3Olb
npx supabase functions deploy stripe-webhook --project-ref kddqxyivhcucamgfcwmu

# [DONE] 1 Implementar rutas amigables en la aplicación
En mi aplicación me gustaría implementar urls para que se pueda navegar de forma más sencilla y manejar mejor procesos como la regarga de la página. ¿Puedes ayudarme a implementarlo?
Asegúrate de que en el proceso no rompemos nada de la funcionalidad lógica actual.
Las urls que me gustarían son:
Todo el apartado de usuario debería tener la url /dashboard
/dashboard/analysis -> correspondería al componente Dashboard (que se visualiza en un subapartado del tab que hay en Analysis.tsx)
/dashboard/posts -> el componente PostAnalysis (que se visualiza en un subapartado del tab que hay en Analysis.tsx)
/dashboard/advanced -> el componente AdvancedMetrics (que se visualiza en un subapartado del tab que hay en Analysis.tsx)
/dashboard/recommendations -> el componente AIRecommentations (que se visualiza en un subapartado del tab que hay en Analysis.tsx)
/planner -> carga PostList que es un subcomponente dentro de PlannerView
/planner/calendar -> carga Calendar que es un subcomponente dentro de PlannerView
/pricing -> carga el componente Pricing
En el sidebar quiero mantener solo "Análisis" que lleve a /dashboard/inicio, "Planificador" que lleve a /planner y "Planes y Precios" que lleve a /pricing.
Revisa bien toda la lógica de carga antes de implementar las rutas, ya que he tenido algún problema antes, principalmente con el componente Dashboard.tsx, que cuando cargaba, hacía que cualquier otra url a la que intentaba acceder después mediante un click en un link no cargara nunca.

# [DONE] 2 Redirecciones
Si inicio sesión, que me redireccione a /dashboard/analysis
Si tengo sesión iniciada pero voy a la landing, que aparezca en el navbar el botón de "Ir a mi panel" y que me redireccione a /dashboard/analysis
Si no tengo sesión iniciada y voy a /dashboard/analysis, que me redireccione a /login (creo que tal vez tenemos que establecer la url de login)




# Otras mejoras

Persistencia de sesión
En el visualizador de timings, filtro para ver todo o ver solo huecos con más de 3 posts

Hacer el apartado de recomendaciones más intuitivo y estructurado
En planner, si hay un post planificado para hoy, que se muestre arriba destacado como "Post de hoy"
Editor wysiwyg para posts
Si un usuario no tiene datos en su tabla de posts, no debería ver un dashboard vacío, sino que debería ver un mensaje de bienvenida, un vídeo de YouTube explicando cómo extraer sus datos y un botón para ir a descargar la extensión de Chrome.
Página para gestionar tu suscripción
Página de "Gracias". URL post compra:
    Test-  http://localhost:5173/success?session_id=cs_test_a1DTc6Q4D4oDZDriqq6UfPqG4uUIaNBpa4KPDKUnIA1mKqfAreJt5i63OE
    Live- http://localhost:5173/success?session_id=cs_live_b11WkxJJAa2Ci6NsNOawj5qUwIc8fKqwVb53m45IQbmBMdMltStrkJIWev
    http://localhost:5173/success?session_id=cs_live_b1AH4kDdA0ggx0Vy3C5D36cGVLtdDSJBa1OmGpbkdvGawHFn52C6NRFRMR
    http://localhost:5173/success?session_id=cs_live_b1ogsgopVVbEi38cKu2kvwmm34CpfjQtaV2ebig5awbmvEYAZP3zVr2NAO






