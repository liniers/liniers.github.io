# Portfolio Alvaro Liniers
 
https://github.com/liniers/portfolio-2026/tree/main

https://liniers.github.io/portfolio-2026/

Hola Jesús, Icíar!

Solo para dar un poco de info del trabajo, que así sin presentarlo quizás es más confuso todo:

Mi trabajo para el desarrollo del portfolio me lo he tomado un pcoo ha modo experimental.

Ha consistido principalmente en preparar una serie de "funcionalidades base" para que pueda ir escalando en el futuro a medida que aprenda más. Básicamente mi idea es que mi portfolio sea un lugar de experimento y al mismo tiempo de muestra de mi trabajo (aunque aún tengo una selección de prueba para testear).

Los programas / funcionalidades / bloques de codigo que he ido incluyendo son las siguientes:

1.- Maquetar thumbs: a partir del data.json se extrae los datos para el portfolio para maquetar un grid allterno de 6 y 5 miniaturas.

2.- GSAP + Lenis Setup: Lenis es una librería que aporta un suavizado en el scroll.

3.- Toggle botones vista grid / vista global: Los botones inferiores cambian de vista grid (aleatoria) a vista global (filtrada por categorías), para dar una visión global y organizada de los proyecto.

4.- Animación texto tubo 3D: Este efecto de GSAP interactua con el scroll para "rodar" un tubo de texto 3D. Edité el original de un codepen manualmente para que estuviera sincronizado con el scroll.

5.- Toggle de imágenes: Esta funcionalidad permite mostrar u ocultar las imágenes del portfolio.

6.- Hover Effect - Mostrar imagen: Se trata de una interacción de hover sobre las miniaturas ocultas.

8.- Motion Thumbs - Parallax con Stagger: Este es un efecto de parallax hecho con GSAP para dar una sensación extra de coreografía y suavidad en el scroll.

9.- Morph SVG: Se ha trabajado en un .js (svg-animations) a parte la animación del avatar a partir del plugin Morph GSAP. Todo manualmente.

10.- Quick View Function: Es una previsualización del trabajo que se abre al hacer click. A modo de overlay. Esta pantalla la quiero mejorar para que sea más interesante. De momento, he incluido controles de atrás y adelante para recorrer la categoría relativa al proyecto + controles de pausa y mute en vídeos. Este bloque de código está también en un .js a parte (gallery-navigation).

11. Modos claro y oscuro: El uso semántico del color es muy sencillo, solo hay dos variables, una para el fondo y otra para el texto, que se invierten dependiendo del modo seleccionado.

Como podréis ver, me he ido apoyando de la IA (sobretodo en el js) para ir creando estas funcionalidades. Todas las he ido leyendo y manipulando a medida que iba necesitando. Pero aún me queda bastante trabajo de limpieza.

En cuanto al CSS, he intentado seguir las estructuras que se nos pedían y fuimos viendo en clase, aunque es verdad que mucho estilo esta inluido en el js, muchos para gestionar las animaciones en GSAP. Lo que estoy haciendo ahora es intentar pasar todo a variables para poder controlar desde la hoja de estilos el diseño. Prefiero poder tener todo accesible desde ahí para que luego me sea más facil cambiar el diseño sin romper funcionalidades.  

La versión móvil está funcionando pero con bugs que tengo que ir corrigiendo una vez limpie todo.


EXTRA: Quería automatizar la forma de actualizar el portfolio de manera facil. Con ayuda de Gemini, hemos creado un archivo python + un comando para mac, que sea capaz de leer mis carpetas del el escritorio para generar el data.json: Lo que hace básicamente es leer los niveles de carpetas para formar las categorías según su organización. Entonces cada vez que incluya una nueva carpeta o imagen, puedo ejecutar el comando para que genere:

img/
 ├── Ditto/        <-- Esto será el “Cliente”
 │    ├── Design Systems/            <-- Esto será la “Categoria”
 │    │    ├── Ditto_App-2025-red.jpg <-- Esto el título del proyecto + el año
