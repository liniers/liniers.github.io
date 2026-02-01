/* ÍNDICE DE FUNCIONALIDADES

1.- Maquetar thumbs - Lineas 34 a 263
2.- GSAP + Lenis Setup - Líneas 157 a 171
3.- Toggle botones vista grid / vista global - Líneas 187 a 348
4.- Animación texto tubo 3D - Líneas 354 a 398
5.- Toggle de imágenes - Líneas 405 a 459
6.- Toggle vista global - agrupado por categorías - Líneas 465 a 689
7.- Hover Effect - Mostrar imagen - Líneas 694 a 715
8.- Motion Thumbs - Parallax con Stagger - Líneas 721 a 746
9.- Theme Toggle con Morph SVG - Revisar - Líneas 751 a 775
10.- Quick View Function - Líneas 780 a 1070
11.- Scrim y Popup - Quick-view centrado - Líneas 1075 a 1130

*/


// Variables globales

let trabajosData = []; // Datos de trabajos cargados desde JSON
let posicionesOriginales = []; // Guardar posiciones originales de los thumbs
let vistaRandomActiva = false; // Estado para saber si estamos mostrando imágenes random

// Paleta de colores para los thumbs
const colorPalette = [
    '#C02822', // Rojo
    '#728D3B', // Verde oliva
    '#1A4575', // Azul oscuro
    '#D2605F', // Coral
    '#F4B33F', // Amarillo dorado
    '#2C5F6F', // Azul petróleo
    '#A3333D', // Rojo vino
    '#4A7C59', // Verde bosque
    '#E8927C', // Salmón
    '#5B8C85'  // Verde azulado
];


// 1.- Maquetar thumbs

// Función helper para obtener configuración del grid
function getGridConfig() {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
        itemsPerRow1: parseInt(rootStyles.getPropertyValue('--grid-items-per-row-1')) || 6,
        itemsPerRow2: parseInt(rootStyles.getPropertyValue('--grid-items-per-row-2')) || 5,
        spacingH: parseInt(rootStyles.getPropertyValue('--grid-spacing-horizontal')) || 12,
        spacingV: parseInt(rootStyles.getPropertyValue('--grid-spacing-vertical')) || 8,
        thumbSpan: parseInt(rootStyles.getPropertyValue('--grid-thumb-span')) || 2,
        startRow: parseInt(rootStyles.getPropertyValue('--grid-start-row')) || 0,
        startCol: parseInt(rootStyles.getPropertyValue('--grid-start-col')) || 6
    };
}

// Función helper para calcular posición en el grid
function calculateGridPosition(index, config) {
    let currentRow = 0;
    let elementsInCurrentRow = 0;
    let tempIndex = 0;
    
    while (tempIndex < index) {
        const itemsInThisRow = currentRow % 2 === 0 ? config.itemsPerRow1 : config.itemsPerRow2;
        elementsInCurrentRow++;
        tempIndex++;
        
        if (elementsInCurrentRow >= itemsInThisRow) {
            currentRow++;
            elementsInCurrentRow = 0;
        }
    }
    
    const colIndex = elementsInCurrentRow;
    const gridRow = config.startRow + (currentRow * config.spacingV);
    const itemsInCurrentRow = currentRow % 2 === 0 ? config.itemsPerRow1 : config.itemsPerRow2;
    const colOffset = currentRow % 2 === 0 ? 0 : config.spacingH / 2;
    const gridColumn = config.startCol + colOffset + (colIndex * config.spacingH);
    
    return { gridRow, gridColumn };
}

function maquetar_thumbs(data){
    trabajosData = data;
    const cuadriculaTrabajos = document.querySelector("#portfolio-items .thumbs-grid");
    const gridConfig = getGridConfig();
    posicionesOriginales = [];

    data.forEach((trabajo, index) => {
        const miniaturaCuadrada = document.createElement("article");
        miniaturaCuadrada.classList.add(`thumb-${index + 1}`, 'hide-image', 'reactive-scale');
        miniaturaCuadrada.dataset.workId = trabajo.id;

        const workInfo = document.createElement("div");
        workInfo.classList.add('work-info');
        miniaturaCuadrada.appendChild(workInfo);
        
        miniaturaCuadrada.style.backgroundColor = colorPalette[index % colorPalette.length];
        
        const isVideo = /\.(mp4|webm|ogg)$/i.test(trabajo.thumbnail);
        
        if (isVideo) {
            const video = document.createElement('video');
            Object.assign(video, {
                src: `assets/img/${trabajo.thumbnail}`,
                autoplay: true,
                loop: true,
                muted: true,
                playsInline: true
            });
            Object.assign(video.style, {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: '0',
                left: '0'
            });
            miniaturaCuadrada.appendChild(video);
            miniaturaCuadrada.style.position = 'relative';
        } else {
            Object.assign(miniaturaCuadrada.style, {
                backgroundImage: `url('assets/img/${trabajo.thumbnail}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            });
        }

        const workCategory = document.createElement('p');
        workCategory.classList.add('work-category');
        workCategory.textContent = trabajo.categoria;
        workInfo.appendChild(workCategory);
        
        const workTitle = document.createElement('h3');
        workTitle.classList.add('work-title', 'text-display');
        workTitle.textContent = trabajo.titulo;
        workInfo.appendChild(workTitle);
        
        const position = calculateGridPosition(index, gridConfig);
        posicionesOriginales.push(position);
        
        miniaturaCuadrada.style.setProperty('grid-row', `${position.gridRow} / span ${gridConfig.thumbSpan}`);
        miniaturaCuadrada.style.setProperty('grid-column', `${position.gridColumn} / span ${gridConfig.thumbSpan}`);
        
        cuadriculaTrabajos.appendChild(miniaturaCuadrada);
    });

    
    // Inicializar interacciones y animaciones con delay para asegurar renderizado


    setTimeout(() => {
        setupThumbsHover(); // Inicializar hover de todas las thumbs con GSAP
        thumbsMotion(); // Activar efecto parallax con stagger
        setupQuickView(); // Inicializar quick view
        
        // Activar vista listado por defecto sin animación inicial
        window.vistaListadoActiva = false;
        const vistaListadoBtn = document.getElementById('vistaListado');
        if (vistaListadoBtn && !window.vistaListadoActiva) {
            // Simular el click sin mostrar la transición
            const thumbs = document.querySelectorAll('[class*="thumb-"]');
            
            window.vistaListadoActiva = true;
            document.body.classList.add('view-listado');
            document.body.classList.remove('view-global');
            
            // Ocultar container-scroll
            const containerScroll = document.querySelector('.container-scroll');
            if (containerScroll) {
                containerScroll.style.opacity = '0';
                containerScroll.style.display = 'none';
            }
            
            // Matar ScrollTriggers del parallax
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars && st.vars.trigger === document.querySelector("#portfolio-items")) {
                    st.kill();
                }
            });
            
            // Limpiar transforms de parallax
            thumbs.forEach(thumb => {
                gsap.set(thumb, { y: 0, clearProps: "transform" });
            });
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const thumbHeight = 100;
            const thumbWidth = Math.min(viewportWidth * 0.4, 100);
            const spacing = 16;
            
            const centerX = (viewportWidth - thumbWidth) / 2;
            const startY = 40;
            const totalHeight = (thumbs.length * thumbHeight) + ((thumbs.length - 1) * spacing) + 80;
            
            document.body.style.minHeight = `${totalHeight}px`;
            
            thumbs.forEach((thumb, index) => {
                thumb.style.position = 'absolute';
                thumb.style.left = `${centerX}px`;
                thumb.style.top = `${startY + (index * (thumbHeight + spacing))}px`;
                thumb.style.width = `${thumbWidth}px`;
                thumb.style.height = `${thumbHeight}px`;
                thumb.style.gridRow = 'auto';
                thumb.style.gridColumn = 'auto';
                thumb.style.zIndex = '1';
            });
            
            // Activar botón vistaListado en el header
            if (window.headerLeftButtons && window.toggleActiveButton) {
                const currentActive = Array.from(document.querySelectorAll('.toggle-grid button')).find(btn => btn.classList.contains('button-active'));
                if (currentActive !== vistaListadoBtn) {
                    toggleActiveButton(vistaListadoBtn, currentActive);
                }
            }
        }
        
        // Hacer visible el body
        gsap.to('body', { opacity: 1, duration: 1, ease: 'power2.inOut'});
    }, 100);
}


// 2.- GSAP + LENIS SETUP


const lenis = new Lenis({
    //infinite: true, 
    syncTouch: true, 
});

function onRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(onRaf);
}
requestAnimationFrame(onRaf);

// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
lenis.on('scroll', ScrollTrigger.update);

// Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
// This ensures Lenis's smooth scroll animation updates on each GSAP tick
gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

// Disable lag smoothing in GSAP to prevent any delay in scroll animations
gsap.ticker.lagSmoothing(0);





// 3.- TOGGLE BOTONES VISTA RANDOM / VISTA GLOBAL



const headerLeftButtons = document.querySelectorAll('.toggle-grid button');

if (headerLeftButtons.length >= 2) {
    const vistaListadoBtn = document.getElementById('vistaListado');
    const vistaGlobalBtnHeader = document.getElementById('vistaGlobal');
    const vistaGridBtn = headerLeftButtons[headerLeftButtons.length - 1]; // El último botón es random/grid
    const headerLeft = document.querySelector('.toggle-grid');
    
    // Crear elemento de fondo deslizante
    const slidingBackground = document.createElement('div');
    slidingBackground.className = 'button-background-slider';
    
    // Insertar el fondo en el miniaturaCuadrada
    headerLeft.insertBefore(slidingBackground, headerLeft.firstChild);
    
    // Asegurar que los botones estén por encima del fondo y sin su propio fondo // MEJOR SOLO CSS
    vistaGridBtn.style.position = 'relative';
    vistaGridBtn.style.zIndex = '1';
    vistaGlobalBtnHeader.style.position = 'relative';
    vistaGlobalBtnHeader.style.zIndex = '1';
    if (vistaListadoBtn) {
        vistaListadoBtn.style.position = 'relative';
        vistaListadoBtn.style.zIndex = '1';
    }
    
    // Inicializar posición y tamaño del fondo según el botón activo
    function initSlidingBackground() {
        const activeButton = Array.from(headerLeftButtons).find(btn => btn.classList.contains('button-active'));
        
        slidingBackground.style.width = `${activeButton.offsetWidth}px`;
        slidingBackground.style.height = `${activeButton.offsetHeight}px`;
        slidingBackground.style.left = `${activeButton.offsetLeft}px`; //
        slidingBackground.style.top = `${activeButton.offsetTop}px`;
    }
    
    // Inicializar después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(initSlidingBackground, 50);
    
    // Función para mover el fondo al botón activo
    window.toggleActiveButton = function(buttonToActivate, buttonToDeactivate) {
        buttonToDeactivate.classList.remove('button-active');
        buttonToActivate.classList.add('button-active');
        
        const currentLeft = parseFloat(slidingBackground.style.left);
        const currentWidth = parseFloat(slidingBackground.style.width);
        const targetLeft = buttonToActivate.offsetLeft;
        const targetWidth = buttonToActivate.offsetWidth;
        const targetHeight = buttonToActivate.offsetHeight;
        const targetTop = buttonToActivate.offsetTop;
        
        // Calcular si vamos a la derecha o izquierda
        const goingRight = targetLeft > currentLeft;
        
        // Calcular el ancho del stretch: desde el inicio del botón actual hasta el final del botón destino
        const stretchWidth = goingRight 
            ? (targetLeft + targetWidth) - currentLeft  // Desde left actual hasta right del destino
            : (currentLeft + currentWidth) - targetLeft; // Desde left del destino hasta right actual
        
        // Crear timeline para el efecto de stretch
        const tl = gsap.timeline();
        
        if (goingRight) {
            // Moverse a la derecha: expandir desde la izquierda, luego contraer desde la izquierda
            tl.to(slidingBackground, {
                width: '-200%',
                duration: 0.3,
                ease: "back.in(1.2)"
            })
            .to(slidingBackground, {
                left: targetLeft,
                top: targetTop,
                width: targetWidth,
                height: targetHeight,
                duration: 0.3,
                ease: "back.out(1.2)"
            }, '-=0.2');
        } else {
            // Moverse a la izquierda: expandir width, luego mover left y contraer
            tl.to(slidingBackground, {
                width: '100%',
                top: targetTop,
                height: targetHeight,
                duration: 0.3,
                ease: "back.in(1.2)"
            })
            .to(slidingBackground, {
                left: targetLeft,
                width: targetWidth,
                duration: 0.3,
                ease: "back.out(1.2)"
            }, '-=0.2');
        }
    }
    
    // Event listener para el botón de vista grid (el primero)
    vistaGridBtn.addEventListener('click', () => {
        console.log('Click en vistaGrid - Estado actual: vistaRandom=' + vistaRandomActiva + ', vistaGlobal=' + window.vistaGlobalActiva + ', vistaListado=' + window.vistaListadoActiva);
        
        // Si estamos en vista listado, salir usando su propio handler
        if (window.vistaListadoActiva && window.headerLeftButtons?.vistaListadoBtn) {
            window.headerLeftButtons.vistaListadoBtn.click();
            document.body.classList.remove('view-listado');
            return;
        }

        // Si estamos en vista global, volver a la última vista activa (proyectos o random)
        const currentActive = Array.from(headerLeftButtons).find(btn => btn.classList.contains('button-active'));
        if (currentActive !== vistaGridBtn) {
            toggleActiveButton(vistaGridBtn, currentActive);
            
            // Eliminar títulos de categoría si existen
            if (window.categoryTitles && window.categoryTitles.length > 0) {
                window.categoryTitles.forEach(title => {
                    gsap.to(title, {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            title.remove();
                        }
                    });
                });
                window.categoryTitles = [];
            }
            
            // Si estaba en vista global, volver a vista grid (proyectos o random según estado)
            if (window.vistaGlobalActiva) {
                const thumbs = document.querySelectorAll('[class*="thumb-"]');
                const state = Flip.getState(thumbs);
                
                window.vistaGlobalActiva = false;
                document.body.classList.remove('view-global');
                
                // Mostrar container-scroll
                const containerScroll = document.querySelector('.container-scroll');
                if (containerScroll) {
                    gsap.to(containerScroll, {
                        opacity: 1,
                        duration: 0.6,
                        display: 'block',
                        ease: 'power2.inOut'
                    });
                }
                
                // Leer configuración actual de CSS para restaurar correctamente
                const rootStyles = getComputedStyle(document.documentElement);
                const thumbSpan = parseInt(rootStyles.getPropertyValue('--grid-thumb-span')) || 2;
                
                thumbs.forEach((thumb) => {
                    const classList = Array.from(thumb.classList);
                    const thumbClass = classList.find(c => c.startsWith('thumb-'));
                    const index = parseInt(thumbClass.replace('thumb-', '')) - 1;
                    
                    // Reset estilos inline aplicados en vista global para restaurar grid
                    thumb.style.position = '';
                    thumb.style.left = '';
                    thumb.style.top = '';
                    thumb.style.width = '';
                    thumb.style.height = '';
                    thumb.style.borderRadius = '';
                    
                    if (posicionesOriginales[index]) {
                        thumb.style.gridRow = `${posicionesOriginales[index].gridRow} / span ${thumbSpan}`;
                        thumb.style.gridColumn = `${posicionesOriginales[index].gridColumn} / span ${thumbSpan}`;
                        thumb.style.aspectRatio = '1 / 1';
                    }
                });
                
                Flip.from(state, {
                    duration: 1.2,
                    ease: "power2.inOut",
                    stagger: 0.02,
                    scale: true,
                    simple: true,
                    onComplete: () => {
                        thumbs.forEach((thumb) => {
                            gsap.set(thumb, { clearProps: "transform" });
                        });
                        thumbsMotion();
                    }
                });
            }
        } else {
            // Ya estamos en vista grid - alternar entre proyectos y random
            const cuadriculaTrabajos = document.querySelector("#portfolio-items .thumbs-grid");
            if (!cuadriculaTrabajos || !trabajosData.length) return;
            
            // Animar fade out de thumbs actuales
            const thumbs = document.querySelectorAll('[class*="thumb-"]');
            
            gsap.to(thumbs, {
                opacity: 0,
                scale: 0.9,
                duration: 0.4,
                stagger: 0.02,
                ease: 'power2.in',
                onComplete: () => {
                    // Limpiar todos los thumbs
                    thumbs.forEach(thumb => thumb.remove());
                    
                    // Matar ScrollTriggers existentes
                    ScrollTrigger.getAll().forEach(st => st.kill());
                    
                    // Alternar estado y regenerar thumbs
                    vistaRandomActiva = !vistaRandomActiva;
                    console.log('Alternando a vista:', vistaRandomActiva ? 'RANDOM' : 'PROYECTOS');
                    
                    // Mostrar proyectos (funcionalidad random eliminada)
                    maquetar_thumbs(trabajosData);
                }
            });
        }
    });
    
    // Guardar referencia global para uso en otras funciones
    window.headerLeftButtons = { vistaGridBtn, vistaGlobalBtnHeader, vistaListadoBtn };
}

// 4.- ANIMACIÓN TEXTO TUBO 3D

const width = window.innerWidth;
const depth = -width / 30; // Profundidad del rodillo
const transformOrigin = `50% 50% ${depth}px`;

// Make container visible y fijo en centro
const containerScroll = document.querySelector(".container-scroll");
if (containerScroll) {
    // Posicionar fijo en centro centro
    containerScroll.style.position = 'fixed';
    containerScroll.style.top = '50%';
    containerScroll.style.left = '50%';
    containerScroll.style.transform = 'translate(-50%, -50%)';
    containerScroll.style.zIndex = '0';
    containerScroll.style.pointerEvents = 'none';
    
    gsap.set(containerScroll, { visibility: "visible" });

    // Grab all lines
    const linesScroll = document.querySelectorAll(".container-scroll .line");

    // Split characters for all lines
    const splitLinesScroll = Array.from(linesScroll).map(line => 
      new SplitText(line, { type: "chars", charsClass: "char" })
    );

    // 3D setup
    gsap.set(linesScroll, { perspective: 700, transformStyle: "preserve-3d" });

    // Animación 3D suave y continua en scroll (sin pin)
    const tlScroll = gsap.timeline({
      scrollTrigger: {
        trigger: "#portfolio-items",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        markers: false
      }
    });

    // Animate each line in scroll
    splitLinesScroll.forEach((split, index) => { 
      tlScroll.fromTo( 
        split.chars,
        { rotationX: -90 },
        { rotationX: 90, stagger: 0.03, ease: "none", transformOrigin },
        index * 0.3 // stagger between lines
      );
    });
}


// 5.- TOGGLE DE IMÁGENES

const toggleBtn = document.querySelector('.header-right button:first-child');
let imagesVisible = false; // Empiezan ocultas

// SVGs para el toggle (lo podría animar en el futuro)
const svgHidden = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="10" viewBox="0 0 22 10" fill="none">
                    <path d="M1.58105 0C5.20131 3.62026 8.73857 4.30318 11.6689 3.80078C14.6662 3.28685 17.1484 1.50917 18.4961 0.0332031L19.9727 1.38086C19.7084 1.67028 19.4062 1.96756 19.0723 2.26758L21.2754 5.10059L20.4863 5.71484L19.6963 6.32812L17.4961 3.5C16.6334 4.08712 15.6486 4.63007 14.5645 5.05371L15.9756 8.22949L14.1475 9.04199L12.6377 5.64551C12.4299 5.69218 12.2197 5.73499 12.0068 5.77148C10.8447 5.97073 9.62203 6.00855 8.3623 5.83398L7.69238 8.85254L5.73926 8.41895L6.41113 5.39355C5.42616 5.08336 4.42708 4.6328 3.42383 4.01758L1.74805 7.03516L0.874023 6.54883L0 6.06348L1.7793 2.85938C1.24102 2.42955 0.702549 1.94962 0.166992 1.41406L1.58105 0Z" fill="var(--color-text)"/>
                </svg>`;

const svgVisible = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="13" viewBox="0 0 22 13" fill="none">
  <path d="M1.81111 2.76126C6.22784 -0.0642495 13.1007 -1.69941 19.3951 2.78861C21.5933 4.35643 21.6503 7.55629 19.4781 9.18119C17.4232 10.7182 14.7147 12.0633 11.6236 12.357C8.50637 12.653 5.07116 11.8707 1.62849 9.26712C-0.563416 7.60929 -0.581643 4.29219 1.81111 2.76126ZM6.95271 2.58158C5.46627 3.02071 4.08922 3.67818 2.88923 4.44583C1.74653 5.17686 1.67989 6.79838 2.83552 7.6724C4.01832 8.56684 5.18509 9.20663 6.32087 9.64408C5.78925 8.84967 5.47908 7.89439 5.47908 6.86673V6.12747C5.47918 4.74176 6.04201 3.4871 6.95271 2.58158ZM13.7418 2.34134C14.8047 3.25817 15.479 4.61364 15.4791 6.12747V6.86673C15.4791 7.87182 15.1799 8.80654 14.6695 9.59037C16.0101 9.0759 17.2298 8.36505 18.2799 7.57962C19.3574 6.77356 19.3396 5.20524 18.234 4.41654C16.7599 3.36553 15.2451 2.70179 13.7418 2.34134ZM10.4771 3.49564C8.82047 3.49564 7.47746 4.83907 7.47712 6.49564C7.47712 8.15249 8.82027 9.49564 10.4771 9.49564C12.1338 9.49545 13.4771 8.15238 13.4771 6.49564C13.4768 4.83918 12.1336 3.49583 10.4771 3.49564Z" fill="var(--color-text)"/>
</svg>`;

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const thumbs = document.querySelectorAll('[class*="thumb-"]');
        imagesVisible = !imagesVisible;
        
        // Leer configuración actual de CSS
        const rootStyles = getComputedStyle(document.documentElement);
        const thumbSpan = parseInt(rootStyles.getPropertyValue('--grid-thumb-span')) || 2;
        const largeSpan = parseInt(rootStyles.getPropertyValue('--grid-thumb-span-large')) || thumbSpan + 3;
        
        // Capturar estado inicial con Flip
        const state = Flip.getState(thumbs);
        
        thumbs.forEach((thumb, index) => {
            // Toggle de imagen
            thumb.classList.toggle('hide-image');
            
            // Obtener posición original del array
            if (posicionesOriginales[index]) {
                const gridRow = posicionesOriginales[index].gridRow;
                const gridColumn = posicionesOriginales[index].gridColumn;
                
                // Cambiar span según visibilidad de imágenes
                if (imagesVisible) {
                    // Imágenes visibles: span más grande
                    thumb.style.gridRow = `${gridRow} / span ${largeSpan}`;
                    thumb.style.gridColumn = `${gridColumn} / span ${largeSpan}`;
                } else {
                    // Imágenes ocultas: span normal
                    thumb.style.gridRow = `${gridRow} / span ${thumbSpan}`;
                    thumb.style.gridColumn = `${gridColumn} / span ${thumbSpan}`;
                }
            }
        });
        
        // Animar la transición con Flip - instantáneo
        Flip.from(state, {
            duration: 1,
            ease: "power4.out",
            stagger: 0.01,
            scale: true,
            simple: true,
        });
        
        // Cambiar SVG del botón
        toggleBtn.innerHTML = imagesVisible ? svgVisible : svgHidden;
    });
}


// 6.- TOGGLE VISTA LISTADO - LISTA VERTICAL

const vistaListadoBtn = document.getElementById('vistaListado');
window.vistaListadoActiva = false;

if (vistaListadoBtn) {
    vistaListadoBtn.addEventListener('click', () => {
        const thumbs = document.querySelectorAll('[class*="thumb-"]');
        const state = Flip.getState(thumbs);
        
        if (!window.vistaListadoActiva) {
            // Activar vista listado
            window.vistaListadoActiva = true;
            document.body.classList.add('view-listado');
            document.body.classList.remove('view-global');
            
            // Guardar posición de scroll actual
            const currentScrollY = window.scrollY || window.pageYOffset;
            
            // Activar botón vistaListado en el header
            if (window.headerLeftButtons && window.toggleActiveButton) {
                toggleActiveButton(window.headerLeftButtons.vistaListadoBtn, 
                    window.vistaGlobalActiva ? window.headerLeftButtons.vistaGlobalBtnHeader : window.headerLeftButtons.vistaGridBtn);
            }
            
            // Si venimos de vista global, desactivarla
            if (window.vistaGlobalActiva) {
                window.vistaGlobalActiva = false;
                // Eliminar títulos de categoría
                window.categoryTitles.forEach(title => title.remove());
                window.categoryTitles = [];
            }
            
            // Ocultar container-scroll
            const containerScroll = document.querySelector('.container-scroll');
            if (containerScroll) {
                gsap.to(containerScroll, {
                    opacity: 0,
                    duration: 0.6,
                    display: 'none',
                    ease: 'power2.inOut'
                });
            }
            
            // Matar ScrollTriggers del parallax
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars && st.vars.trigger === document.querySelector("#portfolio-items")) {
                    st.kill();
                }
            });
            
            // Limpiar transforms de parallax
            thumbs.forEach(thumb => {
                gsap.set(thumb, { y: 0, clearProps: "transform" });
            });
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Tamaño horizontal con máximo 200px de alto
            const thumbHeight = 100;
            const thumbWidth = Math.min(viewportWidth * 0.4, 100); // 60% del ancho o máximo 600px
            const spacing = 16; // Espacio entre thumbs
            
            // Centrar horizontalmente
            const centerX = (viewportWidth - thumbWidth) / 2;
            
            // Calcular posición inicial - siempre desde el top del documento + margen
            const startY = 40; // Margen superior fijo
            const totalHeight = (thumbs.length * thumbHeight) + ((thumbs.length - 1) * spacing) + 80; // +80 para margen inferior
            
            // Asegurar que el body tenga altura suficiente para scroll
            document.body.style.minHeight = `${totalHeight}px`;
            
            thumbs.forEach((thumb, index) => {
                thumb.style.position = 'absolute';
                thumb.style.left = `${centerX}px`;
                thumb.style.top = `${startY + (index * (thumbHeight + spacing))}px`;
                thumb.style.width = `${thumbWidth}px`;
                thumb.style.height = `${thumbHeight}px`;
                thumb.style.gridRow = 'auto';
                thumb.style.gridColumn = 'auto';
                thumb.style.zIndex = '1';
                //thumb.style.willChange = 'auto';
                //thumb.style.borderRadius = '99px'; 
            });
            
            // Animar con Flip
            Flip.from(state, {
                duration: 1.2,
                ease: "power2.inOut",
                stagger: 0.02,
                absolute: true,
                scale: true
            });
            
        } else {
            // Desactivar vista listado - volver a vista grid
            window.vistaListadoActiva = false;
            document.body.classList.remove('view-listado');
            
            // Restaurar altura del body
            document.body.style.minHeight = '';
            
            // Activar botón vistaGrid en el header
            if (window.headerLeftButtons && window.toggleActiveButton) {
                toggleActiveButton(window.headerLeftButtons.vistaGridBtn, window.headerLeftButtons.vistaListadoBtn);
            }
            
            // Mostrar container-scroll
            const containerScroll = document.querySelector('.container-scroll');
            if (containerScroll) {
                gsap.to(containerScroll, {
                    opacity: 1,
                    duration: 0.6,
                    display: 'block',
                    ease: 'power2.inOut'
                });
            }
            
            thumbs.forEach((thumb) => {
                const classList = Array.from(thumb.classList);
                const thumbClass = classList.find(c => c.startsWith('thumb-'));
                const index = parseInt(thumbClass.replace('thumb-', '')) - 1;
                
                thumb.style.position = '';
                thumb.style.left = '';
                thumb.style.top = '';
                thumb.style.width = '';
                thumb.style.height = '';
                thumb.style.borderRadius = '';
                
                const rootStyles = getComputedStyle(document.documentElement);
                const thumbSpan = parseInt(rootStyles.getPropertyValue('--grid-thumb-span')) || 2;
                
                if (posicionesOriginales[index]) {
                    thumb.style.gridRow = `${posicionesOriginales[index].gridRow} / span ${thumbSpan}`;
                    thumb.style.gridColumn = `${posicionesOriginales[index].gridColumn} / span ${thumbSpan}`;
                    thumb.style.aspectRatio = '1 / 1';
                }
            });
            
            Flip.from(state, {
                duration: 1.2,
                ease: "power2.inOut",
                stagger: 0.02,
                scale: true,
                simple: true,
                onComplete: () => {
                    thumbs.forEach((thumb) => {
                        gsap.set(thumb, { clearProps: "transform" });
                    });
                    thumbsMotion();
                }
            });
        }
    });
}

// 7.- TOGGLE VISTA GLOBAL - AGRUPADO POR CATEGORÍAS


const vistaGlobalBtn = document.getElementById('vistaGlobal');
window.vistaGlobalActiva = false;
window.categoryTitles = []; // Array para guardar los títulos de categoría

if (vistaGlobalBtn) {
    vistaGlobalBtn.addEventListener('click', () => {
        // Solo ejecutar si el botón no está activo
        if (window.headerLeftButtons && window.headerLeftButtons.vistaGlobalBtnHeader.classList.contains('button-active')) {
            return;
        }
        
        const thumbs = document.querySelectorAll('[class*="thumb-"]');
        const state = Flip.getState(thumbs);

        
        
        if (!window.vistaGlobalActiva) {
            // Activar vista global
            window.vistaGlobalActiva = true;
            document.body.classList.add('view-global');
            
            // Guardar posición de scroll actual
            const currentScrollY = window.scrollY || window.pageYOffset;
            
            // Si venimos de vista listado, desactivarla
            const comingFromListado = window.vistaListadoActiva;
            if (comingFromListado) {
                window.vistaListadoActiva = false;
                document.body.classList.remove('view-listado');
            }
            
            // Activar botón vistaGlobal en el header
            if (window.headerLeftButtons && window.toggleActiveButton) {
                const buttonToDeactivate = comingFromListado ? window.headerLeftButtons.vistaListadoBtn : window.headerLeftButtons.vistaGridBtn;
                toggleActiveButton(window.headerLeftButtons.vistaGlobalBtnHeader, buttonToDeactivate);
            }
            
            // Ocultar container-scroll
            const containerScroll = document.querySelector('.container-scroll');
            if (containerScroll) {
                gsap.to(containerScroll, {
                    opacity: 0,
                    duration: 0.6,
                    display: 'none',
                    ease: 'power2.inOut'
                });
            }

            
            // Matar ScrollTriggers del parallax y limpiar transforms
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars && st.vars.trigger === document.querySelector("#portfolio-items")) {
                    st.kill();
                }
            });
            
            // Limpiar transforms de parallax de todos los thumbs
            thumbs.forEach(thumb => {
                gsap.set(thumb, { y: 0, clearProps: "transform" });
            });
            
            // Obtener categorías únicas
            const categorias = [...new Set(trabajosData.map(t => t.categoria))];
            const numCategorias = categorias.length;
            
            // Leer configuración de vista global desde CSS
            const rootStyles = getComputedStyle(document.documentElement);
            const globalViewCols = parseInt(rootStyles.getPropertyValue('--global-view-cols')) || 2;
            const globalViewRows = rootStyles.getPropertyValue('--global-view-rows').trim() === 'auto' 
                ? Math.ceil(numCategorias / globalViewCols) 
                : parseInt(rootStyles.getPropertyValue('--global-view-rows')) || 2;
            const thumbsPerRow = parseInt(rootStyles.getPropertyValue('--global-thumbs-per-row')) || 6;
            const categorySpacing = parseInt(rootStyles.getPropertyValue('--global-category-spacing')) || 60;
            const titleSpacing = parseInt(rootStyles.getPropertyValue('--global-title-spacing')) || 40;
            const titleSize = parseInt(rootStyles.getPropertyValue('--global-title-size')) || 14;
            
            // Calcular distribución de grupos en el viewport
            const cols = globalViewCols;
            const rows = globalViewRows;
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const margin = viewportWidth <= 480 ? 40 : 120; // Menos margen en móvil INCLUIR EN VARIABLES CSS
            
            // Espacio disponible para cada grupo
            const groupWidth = (viewportWidth - margin * 2) / cols;
            
            // Configuración de thumbs dentro de cada grupo
            const thumbSpan = 1;
            const gapSpan = 1;
            const totalSpanPerRow = thumbsPerRow * (thumbSpan + gapSpan);
            
            // Tamaño de cada thumb basado en el espacio del grupo
            const thumbSize = Math.min(
                (groupWidth - (viewportWidth <= 480 ? 40 : 100)) / thumbsPerRow,
                viewportWidth <= 480 ? 50 : 60 // Tamaño máximo adaptado
            );
            
            // Variable para tracking de posición vertical acumulativa
            let currentY = margin;
            
            // Pre-calcular altura máxima por fila en desktop para centrado correcto
            const maxHeightPerRow = [];
            if (viewportWidth > 480) {
                for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                    let maxInRow = 0;
                    categorias.forEach((cat, catIndex) => {
                        const catRow = Math.floor(catIndex / cols);
                        if (catRow === rowIndex) {
                            const thumbsInCat = trabajosData.filter(t => t.categoria === cat).length;
                            const numRows = Math.ceil(thumbsInCat / thumbsPerRow);
                            const blockH = numRows * thumbSize;
                            maxInRow = Math.max(maxInRow, blockH);
                        }
                    });
                    maxHeightPerRow.push(maxInRow);
                }
            }
            
            categorias.forEach((categoria, catIndex) => {
                // Obtener thumbs de esta categoría
                const thumbsEnCategoria = trabajosData
                    .map((trabajo, index) => ({ trabajo, index }))
                    .filter(({ trabajo }) => trabajo.categoria === categoria);
                
                // Calcular posición del grupo en la cuadrícula de grupos
                const groupCol = catIndex % cols;
                const groupRow = Math.floor(catIndex / cols);
                
                // Calcular filas necesarias para esta categoría ANTES de calcular posición
                const numThumbsInCat = thumbsEnCategoria.length;
                const numRows = Math.ceil(numThumbsInCat / thumbsPerRow);
                const blockHeight = numRows * thumbSize;
                
                // Posición base del grupo - Centrar correctamente
                const totalGridWidth = cols * groupWidth;
                const gridOffsetX = (viewportWidth - totalGridWidth) / 2;
                const groupBaseX = gridOffsetX + (groupCol * groupWidth) + (groupWidth / 2);
                
                // En móvil (1 columna) usar posición vertical acumulativa
                // En desktop/tablet usar grid basado en viewport
                let groupBaseY;
                if (viewportWidth <= 480) {
                    groupBaseY = currentY + blockHeight / 2 + titleSpacing;
                    currentY = currentY + blockHeight + categorySpacing;
                } else {
                    // Calcular altura total usando las alturas máximas por fila
                    const totalContentHeight = maxHeightPerRow.reduce((sum, h) => sum + h, 0) + (rows - 1) * categorySpacing;
                    const availableHeight = viewportHeight - margin * 2;
                    
                    // Centrar respecto al viewport visible, no al top de la página
                    const verticalOffset = totalContentHeight < availableHeight 
                        ? currentScrollY + margin + (availableHeight - totalContentHeight) / 2 
                        : currentScrollY + margin;
                    
                    // Calcular Y acumulando las filas anteriores
                    let yPosition = verticalOffset;
                    for (let i = 0; i < groupRow; i++) {
                        yPosition += maxHeightPerRow[i] + categorySpacing;
                    }
                    groupBaseY = yPosition + maxHeightPerRow[groupRow] / 2;
                }
                
                // Dimensiones totales del bloque de thumbs
                const blockWidth = thumbsPerRow * thumbSize;
                
                // Offset para centrar el bloque
                const offsetX = -blockWidth / 2;
                const offsetY = -blockHeight / 2;
                
                // Crear título de categoría METER EN CSS
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = categoria;
                categoryTitle.style.cssText = `
                    position: absolute;
                    left: ${groupBaseX + offsetX}px;
                    top: ${groupBaseY + offsetY - titleSpacing}px;
                `;
                document.body.appendChild(categoryTitle);
                window.categoryTitles.push(categoryTitle);
                
                // Animar entrada del título
                gsap.to(categoryTitle, {
                    opacity: 1,
                    duration: 1,
                    delay: 1,
                    ease: 'power2.out'
                });
                
                thumbsEnCategoria.forEach(({ index }, thumbIndexInCat) => {
                    const thumb = thumbs[index];
                    
                    // Calcular posición dentro del grupo
                    const colInGroup = thumbIndexInCat % thumbsPerRow;
                    const rowInGroup = Math.floor(thumbIndexInCat / thumbsPerRow);
                    
                    const thumbX = groupBaseX + offsetX + (colInGroup * thumbSize);
                    const thumbY = groupBaseY + offsetY + (rowInGroup * thumbSize);
                    
                    // Aplicar position absolute en lugar de fixed para permitir scroll
                    thumb.style.position = 'absolute';
                    thumb.style.left = `${thumbX}px`;
                    thumb.style.top = `${thumbY}px`;
                    thumb.style.zIndex = '1'; // Z-index explícito para thumbs
                    thumb.style.willChange = 'auto'; // Desactivar will-change para que z-index funcione
                    thumb.style.width = `${thumbSize}px`;
                    thumb.style.height = `${thumbSize}px`;
                    thumb.style.gridRow = 'auto';
                    thumb.style.gridColumn = 'auto';
                    thumb.style.aspectRatio = '1 / 1';
                    thumb.style.borderRadius = '';
                });
            });
            
            // Animar con Flip
            Flip.from(state, {
                duration: 1.2,
                ease: "power2.inOut",
                stagger: 0.02,
                absolute: true,
                scale: true
            });
            
        } else {
            // Desactivar vista global - volver a vista aleatoria
            window.vistaGlobalActiva = false;
            document.body.classList.remove('view-global');
            
            // Activar botón vistaGrid en el header
            if (window.headerLeftButtons && window.toggleActiveButton) {
                toggleActiveButton(window.headerLeftButtons.vistaGridBtn, window.headerLeftButtons.vistaGlobalBtnHeader);
            }
            // Eliminar títulos de categoría
            window.categoryTitles.forEach(title => {
                gsap.to(title, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: () => {
                        title.remove();
                    }
                });
            });
            window.categoryTitles = [];
            
            // Mostrar container-scroll
            const containerScroll = document.querySelector('.container-scroll');
            if (containerScroll) {
                gsap.to(containerScroll, {
                    opacity: 1,
                    duration: 0.6,
                    display: 'block',
                    ease: 'power2.inOut'
                });
            }
            
            thumbs.forEach((thumb) => {
                // Obtener el índice correcto desde la clase del thumb
                const classList = Array.from(thumb.classList);
                const thumbClass = classList.find(c => c.startsWith('thumb-'));
                const index = parseInt(thumbClass.replace('thumb-', '')) - 1;
                
                // Quitar position fixed y restaurar grid
                thumb.style.position = '';
                thumb.style.left = '';
                thumb.style.top = '';
                thumb.style.width = '';
                thumb.style.height = '';
                thumb.style.borderRadius = '';
                
                // Leer configuración actual de CSS para restaurar correctamente
                const rootStyles = getComputedStyle(document.documentElement);
                const thumbSpan = parseInt(rootStyles.getPropertyValue('--grid-thumb-span')) || 2;
                
                // Restaurar posiciones originales con el span correcto
                if (posicionesOriginales[index]) {
                    thumb.style.gridRow = `${posicionesOriginales[index].gridRow} / span ${thumbSpan}`;
                    thumb.style.gridColumn = `${posicionesOriginales[index].gridColumn} / span ${thumbSpan}`;
                    thumb.style.aspectRatio = '1 / 1';
                }
            });
            
            // Animar con Flip
            Flip.from(state, {
                duration: 1.2,
                ease: "power2.inOut",
                stagger: 0.02,
                scale: true,
                simple: true,
                onComplete: () => {
                    thumbs.forEach((thumb) => {
                        gsap.set(thumb, { clearProps: "transform" });
                    });
                    
                    // Reiniciar parallax
                    thumbsMotion();
                }
            });
        }
            
    });
}

// 7.- HOVER EFFECT - MOSTRAR IMAGEN Y WORK-INFO SIGUIENDO CURSOR

function setupThumbsHover() {
    const cuadriculaTrabajos = document.querySelector('#portfolio-items .thumbs-grid');
    if (!cuadriculaTrabajos) return;
    
    let hoverInfo = document.querySelector('.hover-work-info');
    let hoverCategory = null;
    let hoverTitle = null;

    if (!hoverInfo) {
        hoverInfo = document.createElement('div');
        hoverInfo.className = 'hover-work-info';

        hoverCategory = document.createElement('div');
        hoverCategory.className = 'work-category';

        hoverTitle = document.createElement('div');
        hoverTitle.className = 'work-title text-display';

        hoverInfo.appendChild(hoverCategory);
        hoverInfo.appendChild(hoverTitle);
        document.body.appendChild(hoverInfo);
    } else {
        hoverCategory = hoverInfo.querySelector('.work-category');
        hoverTitle = hoverInfo.querySelector('.work-title');
    }
    
    // Map para trackear estado de cada thumb
    const thumbStates = new WeakMap();
    
    // Delegación de eventos - mouseenter
    cuadriculaTrabajos.addEventListener('mouseenter', (e) => {
        const thumb = e.target.closest('[class*="thumb-"]');
        if (!thumb) return;
        
        const workCategory = thumb.querySelector('.work-category');
        const workTitle = thumb.querySelector('.work-title');
        
        if (document.body.classList.contains('view-listado')) {
            if (hoverCategory && workCategory) {
                hoverCategory.textContent = workCategory.textContent;
            }
            if (hoverTitle && workTitle) {
                hoverTitle.textContent = workTitle.textContent;
            }
            hoverInfo.classList.add('is-visible');
        }
        
        const wasImageHidden = thumb.classList.contains('hide-image');
        thumbStates.set(thumb, { wasImageHidden });
        
        if (wasImageHidden) {
            thumb.classList.remove('hide-image');
            const media = thumb.querySelector('video, img');
            if (media && document.body.classList.contains('view-listado')) {
                media.style.display = '';
                gsap.to(media, {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        }
    }, true);
    
    // Delegación de eventos - mousemove
    cuadriculaTrabajos.addEventListener('mousemove', (e) => {
        const thumb = e.target.closest('[class*="thumb-"]');
        if (!thumb) return;
        
        if (hoverInfo && document.body.classList.contains('view-listado')) {
            const offsetX = 24;
            const offsetY = -24;
            hoverInfo.style.left = `${e.clientX + offsetX}px`;
            hoverInfo.style.top = `${e.clientY + offsetY}px`;
        }
    });
    
    // Delegación de eventos - mouseleave
    cuadriculaTrabajos.addEventListener('mouseleave', (e) => {
        const thumb = e.target.closest('[class*="thumb-"]');
        if (!thumb) return;
        
        if (document.body.classList.contains('view-listado')) {
            hoverInfo.classList.remove('is-visible');
        }
        
        const state = thumbStates.get(thumb);
        if (state?.wasImageHidden) {
            const media = thumb.querySelector('video, img');
            if (media && document.body.classList.contains('view-listado')) {
                gsap.to(media, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: () => {
                        thumb.classList.add('hide-image');
                        media.style.display = 'none';
                    }
                });
            } else {
                thumb.classList.add('hide-image');
            }
        }
    }, true);
}



// 8.- MOTION THUMBS - PARALLAX CON STAGGER

function thumbsMotion() {
    


    const section = document.querySelector("#portfolio-items");
    const thumbs = document.querySelectorAll('[class*="thumb-"]'); 
    
    if (thumbs.length === 0) { 
        console.warn('No se encontraron elementos .thumb-*');
        return; 
    }
    
    thumbs.forEach((thumb, index) => {

        const staggerOffset = index * .2; // Ajusta este valor para más o menos stagger
        
        gsap.to(thumb, {
            y: 0, // (500) Esto provoca el salto despues del flip
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: staggerOffset, // Cada thumb tiene un scrub diferente
                markers: false,
            }
        });
    });
}


// 9.- THEME TOGGLE CON MORPH SVG - REVISAR

const themeToggleBtn = document.querySelector('.header-right button:last-child');

if (themeToggleBtn) {
    const svgPath = themeToggleBtn.querySelector('svg path');
    
    // Paths del SVG
    const moonPath = "M7 0C8.07363 0 9.09073 0.241865 10 0.673828C7.63509 1.79731 6 4.20763 6 7C6 9.79222 7.6353 12.2016 10 13.3252C9.09063 13.7573 8.07378 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0Z";
    const sunPath = "M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0Z";
    
    let isLightMode = false;
    
    themeToggleBtn.addEventListener('click', () => {
        isLightMode = !isLightMode;
        
        // Morph del path con GSAP
        gsap.to(svgPath, {
            duration: 0,
            morphSVG: isLightMode ? sunPath : moonPath,
            ease: "elastic.out(1,0.3)",
        });
        
        // Toggle del tema en el body
        document.body.classList.toggle('light-mode');
    });
}


// 10 - QUICK VIEW FUNCTION CON FLIP

let activeThumb = null; // Variable para trackear el thumb activo
let visitedThumbs = []; // Array para trackear thumbs visitados
let expandedThumb = null; // El thumb expandido actual

// Exponer visitedThumbs como variable global para gallery-navigation.js
window.visitedThumbs = visitedThumbs;

function setupQuickView() {
    const cuadriculaTrabajos = document.querySelector('#portfolio-items .thumbs-grid');
    
    if (!cuadriculaTrabajos) {
        console.warn('Contenedor de thumbs no encontrado');
        return;
    }
    
    // Delegación de eventos - un solo listener para todos los thumbs
    cuadriculaTrabajos.addEventListener('click', (e) => {
        const thumb = e.target.closest('[class*="thumb-"]');
        if (!thumb) return;
        
        e.stopPropagation();
        
        // Si se hace clic en el mismo thumb activo, cerrarlo
        if (activeThumb === thumb) {
            cerrarDetalle();
            return;
        }
        
        // Si hay otro thumb activo, cerrarlo primero
        if (activeThumb && activeThumb !== thumb) {
            cerrarDetalle();
            setTimeout(() => abrirThumb(thumb), 300);
        } else {
            abrirThumb(thumb);
        }
    });
}

function abrirThumb(thumb) {
    // Activar morph de cara
    if (typeof morphToSecondFace === 'function') {
        morphToSecondFace();
    }
    
    // Obtener datos del trabajo
    const workId = thumb.dataset.workId;
    const trabajo = trabajosData.find(t => t.id == workId);
    
    if (!trabajo) {
        console.warn('Trabajo no encontrado:', workId);
        return;
    }
    
    console.log('Trabajo seleccionado:', trabajo);
    
    // Inicializar navegación de galería
    if (typeof initGalleryNavigation === 'function') {
        initGalleryNavigation(trabajo);
    }
    
    // Marcar como visitado si no lo está
    if (!visitedThumbs.includes(thumb)) {
        visitedThumbs.push(thumb);
    }
    
    // Mostrar scrim
    scrim.style.display = 'block';
    gsap.to(scrim, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
    });
    
    // Guardar el thumb original para poder revertir
    activeThumb = thumb;
    
    // Crear una copia visual del thumb para expandir
    const thumbClone = thumb.cloneNode(true);
    thumbClone.classList.add('thumb-expanded');
    thumbClone.style.position = 'fixed';
    thumbClone.style.zIndex = '1001';
    thumbClone.style.pointerEvents = 'auto';
    thumbClone.style.cursor = 'default';
    
    // Copiar estilos computados del thumb original
    const thumbRect = thumb.getBoundingClientRect();
    thumbClone.style.top = thumbRect.top + 'px';
    thumbClone.style.left = thumbRect.left + 'px';
    thumbClone.style.width = thumbRect.width + 'px';
    thumbClone.style.height = thumbRect.height + 'px';
    
    // Asegurar que el video/imagen dentro del clone mantenga el aspect ratio correcto
    const media = thumbClone.querySelector('video, img');
    if (media) {
        media.style.objectFit = 'contain';
    }
    
    document.body.appendChild(thumbClone);
    expandedThumb = thumbClone;
    
    // Ocultar el thumb original temporalmente
    thumb.style.opacity = '0';
    
    // Preparar contenido expandido dentro del clone
    prepararContenidoExpandido(thumbClone, trabajo);
    
    // FLIP: Last - Calcular estado final (centrado en pantalla) con aspect ratio real
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Detectar si es vídeo o imagen
    const isVideo = /\.(mp4|webm|ogg)$/i.test(trabajo.thumbnail);
    
    // Función para calcular dimensiones con aspect ratio real
    const calcularDimensiones = (aspectRatio) => {
        let targetWidth = Math.min(960, viewportWidth * 0.9);
        let targetHeight = targetWidth / aspectRatio;
        
        // Ajustar si la altura excede el máximo permitido
        const maxHeight = viewportHeight * 0.6;
        if (targetHeight > maxHeight) {
            targetHeight = maxHeight;
            targetWidth = targetHeight * aspectRatio;
        }
        
        return { width: targetWidth, height: targetHeight };
    };
    
    // Obtener aspect ratio real del media
    if (media) {
        if (isVideo) {
            // Esperar a que el video tenga metadata para obtener dimensiones reales
            media.addEventListener('loadedmetadata', () => {
                const aspectRatio = media.videoWidth / media.videoHeight;
                const { width: targetWidth, height: targetHeight } = calcularDimensiones(aspectRatio);
                
                const targetLeft = (viewportWidth - targetWidth) / 2;
                const targetTop = (viewportHeight - targetHeight) / 2;
                
                // FLIP: Play - Animar la transición

                tl = gsap.timeline();
                TweenLite.set(thumbClone, {perspective:500});

                tl.to(thumbClone, { 
                    scale: .8,
                    duration: 0.2,
                    transform: 'rotateX(25deg)',
                    rotationY: '-15deg',
                    ease: 'power4.out' 
                })
                .to(thumbClone, {
                    scale: 1,
                    left: targetLeft,
                    top: targetTop,
                    width: targetWidth,
                    height: targetHeight,
                    borderRadius: '2rem',
                    duration: 0.6,
                    transform: 'rotateX(0deg)',
                    ease: 'power3.inOut',
                    onStart: () => {
                        setTimeout(() => {
                            mostrarControlesYInfo(thumbClone);
                            thumbClone.style.overflow = 'visible';
                        }, 400); 
                    }
                });
                
            }, { once: true });
            
            // Si el video ya tiene metadata cargada, ejecutar inmediatamente
            if (media.readyState >= 1) {
                const aspectRatio = media.videoWidth / media.videoHeight;
                const { width: targetWidth, height: targetHeight } = calcularDimensiones(aspectRatio);
                
                const targetLeft = (viewportWidth - targetWidth) / 2;
                const targetTop = (viewportHeight - targetHeight) / 2;
                
                gsap.to(thumbClone, {
                    left: targetLeft,
                    top: targetTop,
                    width: targetWidth,
                    height: targetHeight,
                    borderRadius: '2rem',
                    duration: 0.6,
                    ease: 'power2.inOut',
                    onStart: () => {
                        setTimeout(() => {
                            mostrarControlesYInfo(thumbClone);
                            thumbClone.style.overflow = 'visible';
                        }, 400); 
                    }
                });
            }
        } else {
            // Para imágenes, esperar a que carguen
            if (media.complete && media.naturalWidth > 0) {
                // Imagen ya cargada
                const aspectRatio = media.naturalWidth / media.naturalHeight;
                const { width: targetWidth, height: targetHeight } = calcularDimensiones(aspectRatio);
                
                const targetLeft = (viewportWidth - targetWidth) / 2;
                const targetTop = (viewportHeight - targetHeight) / 2;
                
                gsap.to(thumbClone, {
                    left: targetLeft,
                    top: targetTop,
                    width: targetWidth,
                    height: targetHeight,
                    borderRadius: '2rem',
                    duration: 0.6,
                    ease: 'power2.inOut',
                    onStart: () => {
                        setTimeout(() => {
                            mostrarControlesYInfo(thumbClone);
                            thumbClone.style.overflow = 'visible';
                        }, 400);
                    }
                });

                
            } else {
                // Esperar a que la imagen cargue
                media.addEventListener('load', () => {
                    const aspectRatio = media.naturalWidth / media.naturalHeight;
                    const { width: targetWidth, height: targetHeight } = calcularDimensiones(aspectRatio);
                    
                    const targetLeft = (viewportWidth - targetWidth) / 2;
                    const targetTop = (viewportHeight - targetHeight) / 2;
                    
                    gsap.to(thumbClone, {
                        left: targetLeft,
                        top: targetTop,
                        width: targetWidth,
                        height: targetHeight,
                        borderRadius: '2rem',
                        duration: 0.6,
                        ease: 'power2.inOut',
                        onStart: () => {
                            setTimeout(() => {
                                mostrarControlesYInfo(thumbClone);
                                thumbClone.style.overflow = 'visible';
                            }, 400);
                        }
                    });
                }, { once: true });
            }
        }
    } else {
        // Fallback: usar aspect ratio 1:1 si no hay media
        const { width: targetWidth, height: targetHeight } = calcularDimensiones(1);
        
        const targetLeft = (viewportWidth - targetWidth) / 2;
        const targetTop = (viewportHeight - targetHeight) / 2;
        
        tl = gsap.timeline();
                TweenLite.set(thumbClone, {perspective:800});

                tl.to(thumbClone, { 
                    scale: .9,
                    duration: 0.1,
                    transform: 'rotateX(25deg)',
                    rotationY: '-15deg',
                    ease: 'power4.out' 
                })
                .to(thumbClone, {
                    scale: 1,
                    left: targetLeft,
                    top: targetTop,
                    width: targetWidth,
                    height: targetHeight,
                    borderRadius: '2rem',
                    duration: 0.6,
                    transform: 'rotateX(0deg)',
                    ease: 'power3.inOut',
                    onStart: () => {
                        setTimeout(() => {
                            mostrarControlesYInfo(thumbClone);
                            thumbClone.style.overflow = 'visible';
                        }, 400); 
                    }
                });
    }
}

function prepararContenidoExpandido(thumbClone, trabajo) {
    // Limpiar work-info existente del clone
    const existingWorkInfo = thumbClone.querySelector('.work-info');
    if (existingWorkInfo) {
        existingWorkInfo.remove();
    }
    
    // Detectar si es vídeo o imagen
    const isVideo = /\.(mp4|webm|ogg)$/i.test(trabajo.thumbnail);
    
    // Crear contenedor de controles si es video
    if (isVideo) {
        const video = thumbClone.querySelector('video');
        if (video) {
            // Crear contenedor de controles
            const videoControls = document.createElement('div');
            videoControls.className = 'video-controls';
            videoControls.style.opacity = '0'; // Inicialmente oculto
            
            // Botón Play/Pause
            const playPauseBtn = document.createElement('button');
            playPauseBtn.className = 'video-control-btn play-pause-btn reactive-scale reactive-hover';
            playPauseBtn.setAttribute('data-state', 'playing');
            playPauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
            
            playPauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video.paused) {
                    video.play();
                    playPauseBtn.setAttribute('data-state', 'playing');
                    playPauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
                } else {
                    video.pause();
                    playPauseBtn.setAttribute('data-state', 'paused');
                    playPauseBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
                }
            });
            
            // Botón Mute/Unmute
            const muteBtn = document.createElement('button');
            muteBtn.className = 'video-control-btn mute-btn reactive-scale reactive-hover';
            muteBtn.setAttribute('data-state', 'muted');
            muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
            muteBtn.style.cssText = playPauseBtn.style.cssText;
            
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = !video.muted;
                if (video.muted) {
                    muteBtn.setAttribute('data-state', 'muted');
                    muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
                } else {
                    muteBtn.setAttribute('data-state', 'unmuted');
                    muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
                }
            });
            
            videoControls.appendChild(playPauseBtn);
            videoControls.appendChild(muteBtn);
            thumbClone.appendChild(videoControls);
        }
    }
    
    // Crear work info
    const workInfo = document.createElement('div');
    workInfo.className = 'work-info expanded-info';
    
    const workCategory = document.createElement('p');
    workCategory.className = 'work-category';
    workCategory.textContent = trabajo.categoria;
    
    const workTitle = document.createElement('h3');
    workTitle.className = 'work-title text-display';
    workTitle.textContent = trabajo.titulo;
    
    // Crear botón de expand
    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn reactive-scale reactive-hover';
    expandBtn.innerHTML = '<span class="material-symbols-outlined">expand_content</span>';
    
    // Event listener para abrir el project wrapper al hacer clic en el botón
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProjectWrapper(trabajo);
        cerrarDetalle(); // Opcional: cerrar el quick view al abrir el wrapper
    });
    
    const workDetails = document.createElement('p');
    workDetails.className = 'work-details';
    const placeholderMessages = [
        'Bonito, ¿no?. Si te gusta abre el proyecto para ver más.',
        '¿Te intriga? Abre el proyecto para ver los detalles.',
        'Más info dentro del proyecto. Ábrelo si te apetece.',
        'Pequeño teaser. Abre el proyecto para verlo completo.',
        'Si quieres ver más, entra al proyecto.'
    ];

    workDetails.textContent = trabajo.comentario || placeholderMessages[Math.floor(Math.random() * placeholderMessages.length)];


    workInfo.appendChild(expandBtn);
    workInfo.appendChild(workCategory);
    workInfo.appendChild(workTitle);
    workInfo.appendChild(workDetails);
    
    // Añadir work-info directamente al body (no al thumbClone) para que position: fixed funcione correctamente
    document.body.appendChild(workInfo);
    
    // Botón de navegación (si existe galería)
    if (trabajo.imagenes && trabajo.imagenes.length > 0) {
        const navButtons = document.createElement('div');
        navButtons.className = 'gallery-nav-buttons';
        navButtons.style.opacity = '0';
        navButtons.style.position = 'absolute';
        navButtons.style.top = '50%';
        navButtons.style.left = '1rem';
        navButtons.style.right = '1rem';
        navButtons.style.transform = 'translateY(-50%)';
        navButtons.style.display = 'flex';
        navButtons.style.justifyContent = 'space-between';
        navButtons.style.pointerEvents = 'auto';
        navButtons.style.zIndex = '10';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn prev-btn';
        prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';

        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn next-btn';
        nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
        
        //navButtons.appendChild(prevBtn);
        //navButtons.appendChild(nextBtn);
        //thumbClone.appendChild(navButtons);
    }
}

function mostrarControlesYInfo(thumbClone) {
    // Obtener todos los elementos a animar
    const videoControls = thumbClone.querySelector('.video-controls');
    const workInfo = document.querySelector('.work-info.expanded-info'); // Ahora está en el body
    const navButtons = thumbClone.querySelector('.gallery-nav-buttons');
    
    // Crear botón de cerrar si no existe
    let closeButton = thumbClone.querySelector('.close-expanded-btn');
    if (!closeButton) {
        closeButton = document.createElement('button');
        closeButton.className = 'close-expanded-btn reactive-scale reactive-hover';
        closeButton.innerHTML = '<span class="material-symbols-outlined">close</span>';
        
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            cerrarDetalle();
        });
        
        thumbClone.appendChild(closeButton);
    }
    
    // Animar la sombra del thumbClone
    gsap.to(thumbClone, {
        boxShadow: '0 0 134px 200px var(--scrim, #191922d4)',
        duration: 1,
        ease: 'power2.out'
    });
    
    // Animar líneas del work-info con SplitText (solo líneas)
    if (workInfo && typeof SplitText !== 'undefined') {
        const split = new SplitText(workInfo, { type: 'lines' });
        gsap.set(workInfo, { opacity: 1 });
        gsap.fromTo(split.lines, {
            opacity: 0,
            y: 20
        }, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.05,
            ease: 'back.out(1.7)'
        });
    }
    
    const otherElements = [videoControls, navButtons, closeButton].filter(el => el !== null);
    gsap.to(otherElements, {
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    });
}


// CERRAR DETALLE QUICK VIEW

// Crear scrim (overlay oscuro)
const scrim = document.createElement('div');
scrim.className = 'quick-view-scrim';
document.body.appendChild(scrim);

// Función para cerrar el detalle
function cerrarDetalle() {
    if (!activeThumb || !expandedThumb) return;
    
    // Volver a primera cara
    if (typeof morphToFirstFace === 'function') {
        morphToFirstFace();
    }
    
    // Guardar referencia al thumb antes de resetear
    const currentThumb = activeThumb;
    const wasVisited = visitedThumbs.includes(currentThumb);
    
    // Animar el cierre de controles y info primero
    const videoControls = expandedThumb.querySelector('.video-controls');
    const workInfo = document.querySelector('.work-info.expanded-info'); // Está en el body
    const navButtons = expandedThumb.querySelector('.gallery-nav-buttons');
    const closeButton = expandedThumb.querySelector('.close-expanded-btn');
    
    const elements = [videoControls, workInfo, navButtons, closeButton].filter(el => el !== null);
    
    gsap.to(elements, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
    });
    
    // Animar la sombra al cerrar
    gsap.to(expandedThumb, {
        boxShadow: '0 0 0px 0px var(--color-bg, #191922)',
        duration: 0.3,
        ease: 'power2.in'
    });
    
    // Obtener posición del thumb original
    const thumbRect = currentThumb.getBoundingClientRect();
    
    // opacidad del expandedThumb a mitad de la transición
    gsap.to(expandedThumb, {
        opacity: 0,
        delay: 0.3,
        duration: .2,
        ease: 'power2.in'
    });
    
    // Animar el thumb expandido de vuelta a su posición original
    gsap.to(expandedThumb, {
        left: thumbRect.left,
        top: thumbRect.top,
        width: thumbRect.width,
        height: thumbRect.height,
        borderRadius: wasVisited ? 'var(--radius-full)' : '0rem',
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: () => {
            // Remover el thumb expandido
            if (expandedThumb && expandedThumb.parentNode) {
                expandedThumb.parentNode.removeChild(expandedThumb);
            }
            expandedThumb = null;
            
            // Remover el work-info del body
            const workInfoToRemove = document.querySelector('.work-info.expanded-info');
            if (workInfoToRemove && workInfoToRemove.parentNode) {
                workInfoToRemove.parentNode.removeChild(workInfoToRemove);
            }
            
            // Mostrar el thumb original de nuevo con borderRadius aplicado
            if (currentThumb) {
                gsap.to(currentThumb, {
                    opacity: 1,
                    scale: 0.6,
                    borderRadius: wasVisited ? '4rem' : '0rem',
                    duration: 0.4,
                    ease: 'power4.out',
                    onComplete: () => {
                        gsap.to(currentThumb, {
                            scale: 1,
                            duration: 0.3,
                            ease: 'back.out(1.7)'
                        });
                    }
                });
            }
        }
    });
    
    // Ocultar scrim
    gsap.to(scrim, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            scrim.style.display = 'none';
        }
    });
    
    activeThumb = null;
}

// Event listener para cerrar al hacer clic en el scrim
scrim.addEventListener('click', cerrarDetalle);

// Event listener para cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeThumb) {
        cerrarDetalle();
    }
});



// 12.- PROJECT WRAPPER - ABRIR Y CERRAR (MÉTODO WINDOW TRANSLATE)

const projectWrapper = document.querySelector('.project-wrapper');
const pageContent = document.getElementById('page-content'); 
// Seleccionamos el contenido interno que vamos a desplazar
const mainContent = document.querySelector('.main-content'); 
const closeProjectBtn = document.getElementById('closeProject');

let savedScroll = 0;

function createProjectVideoControls(video) {
    const videoControls = document.createElement('div');
    videoControls.className = 'video-controls';
    videoControls.style.opacity = '1';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'video-control-btn play-pause-btn reactive-scale reactive-hover';
    playPauseBtn.setAttribute('data-state', 'playing');
    playPauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (video.paused) {
            video.play();
            playPauseBtn.setAttribute('data-state', 'playing');
            playPauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
        } else {
            video.pause();
            playPauseBtn.setAttribute('data-state', 'paused');
            playPauseBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        }
    });

    const muteBtn = document.createElement('button');
    muteBtn.className = 'video-control-btn mute-btn reactive-scale reactive-hover';
    muteBtn.setAttribute('data-state', 'muted');
    muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        if (video.muted) {
            muteBtn.setAttribute('data-state', 'muted');
            muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
        } else {
            muteBtn.setAttribute('data-state', 'unmuted');
            muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
        }
    });

    videoControls.appendChild(playPauseBtn);
    videoControls.appendChild(muteBtn);

    return videoControls;
}

function openProjectWrapper(trabajo) {
    if (!projectWrapper || !pageContent || !mainContent) return;
    
    console.log('Abriendo proyecto:', trabajo);

    // 1. Rellenar el cover-image (video o imagen) con aspect ratio
    const coverImage = projectWrapper.querySelector('.cover-image');
    if (coverImage) {
        // Limpiar contenido anterior
        coverImage.innerHTML = '';
        coverImage.style.backgroundImage = '';
        coverImage.style.aspectRatio = '';
        
        // Detectar si es video o imagen
        const isVideo = /\.(mp4|webm|ogg)$/i.test(trabajo.thumbnail);
        
        if (isVideo) {
            // Crear video
            const video = document.createElement('video');
            video.src = `assets/img/${trabajo.thumbnail}`;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'contain';
            
            // Obtener aspect ratio cuando tenga metadata
            video.addEventListener('loadedmetadata', () => {
                const aspectRatio = video.videoWidth / video.videoHeight;
                coverImage.style.aspectRatio = aspectRatio;
            });
            
            coverImage.appendChild(video);
        } else {
            // Crear imagen
            const img = document.createElement('img');
            img.src = `assets/img/${trabajo.thumbnail}`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            
            // Obtener aspect ratio cuando cargue
            img.addEventListener('load', () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                coverImage.style.aspectRatio = aspectRatio;
            });
            
            coverImage.appendChild(img);
        }
    }

    // 2. Rellenar datos del proyecto
    const projectTitle = projectWrapper.querySelector('.project-info .title');
    const projectSubtitle = projectWrapper.querySelector('.project-info .subtitle');
    
    if (projectTitle) {
        projectTitle.textContent = trabajo.titulo;
    }
    
    if (projectSubtitle) {
        if (trabajo.descripcion && typeof marked !== 'undefined') {
            if (trabajo.descripcion.endsWith('.md')) {
                fetch(trabajo.descripcion)
                    .then(res => res.text())
                    .then(md => {
                        projectSubtitle.innerHTML = marked.parse(md);
                    })
                    .catch(() => {
                        projectSubtitle.textContent = 'Descripción no disponible';
                    });
            } else {
                projectSubtitle.innerHTML = marked.parse(trabajo.descripcion);
            }
        } else {
            projectSubtitle.textContent = trabajo.descripcion || '';
        }
    }

    // 3. Rellenar row-grid con imágenes/videos
    const projectContent = projectWrapper.querySelector('.project-content');
    if (projectContent) {
        const existingRows = projectContent.querySelectorAll('.row-grid');
        existingRows.forEach((row) => row.remove());

        const mediaItems = Array.isArray(trabajo.imagenes) ? trabajo.imagenes : [];
        // Filtrar solo imágenes con random: false (imágenes del proyecto)
        const projectImages = mediaItems.filter(item => {
            // Si es string (formato antiguo), incluirlo
            if (typeof item === 'string') return true;
            // Si es objeto, solo incluir si random es false
            return item.random === false;
        });
        
        if (projectImages.length > 0) {
            projectImages.forEach((mediaItem) => {
                // Obtener la ruta (puede ser string directo o objeto con path)
                const mediaPath = typeof mediaItem === 'string' ? mediaItem : mediaItem.path;
                
                const rowGrid = document.createElement('div');
                rowGrid.className = 'row-grid';

                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaPath);
                if (isVideo) {
                    const video = document.createElement('video');
                    video.src = `assets/img/${mediaPath}`;
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.objectFit = 'contain';

                    rowGrid.appendChild(video);
                    rowGrid.appendChild(createProjectVideoControls(video));
                } else {
                    const img = document.createElement('img');
                    img.src = `assets/img/${mediaPath}`;
                    img.alt = '';
                    rowGrid.appendChild(img);
                }

                projectContent.appendChild(rowGrid);
            });
        }
    }

    // 4. Guardar dónde estamos
    savedScroll = window.scrollY || document.documentElement.scrollTop;

    // 4. Parar Lenis
    if (typeof lenis !== 'undefined') lenis.stop();

    // 5. EL TRUCO: 
    // Mover el contenido interno hacia arriba tantos píxeles como hayamos hecho scroll.
    // Así parece que seguimos en el mismo sitio, pero el contenedor padre empieza en 0.
    mainContent.style.transform = `translateY(-${savedScroll}px)`;

    // 6. Activar la clase (El CSS se encarga de fijar el padre y escalar)
    document.body.classList.add('project-open');
    
    // Opcional: Scrolear el body real a 0 para evitar saltos internos del navegador
    window.scrollTo(0, 0);

    // 7. Animar elementos del project-wrapper con stagger
    const projectElements = projectWrapper.querySelectorAll('.project-info, .cover-image, .row-grid');
    
    gsap.fromTo(projectElements, 
        {
            opacity: 0,
            y: 24
        },
        {
            opacity: 1,
            y: 0,
            duration: 1, 
            ease: "var(--easing-decelerate)",
            stagger: 0.1, 
            delay: 0.25 
        }
    );
}

function closeProjectWrapper() {
    if (!projectWrapper) return;

    // Volver a primera cara
    if (typeof morphToFirstFace === 'function') {
        morphToFirstFace();
    }

    // 1. Quitar la clase (Inicia animación de vuelta)
    document.body.classList.remove('project-open');

    // 2. Esperar a que termine la animación (800ms)
    setTimeout(() => {
        // 3. Quitar el desplazamiento manual del contenido
        mainContent.style.transform = '';

        // 4. Restaurar el scroll real del navegador
        window.scrollTo(0, savedScroll);

        // 5. Reactivar Lenis
        if (typeof lenis !== 'undefined') {
            lenis.start();
            // A veces es bueno forzar a Lenis a sincronizarse
            // lenis.scrollTo(savedScroll, { immediate: true });
        }
    }, 800);
}

// Event Listeners
if (closeProjectBtn) closeProjectBtn.addEventListener('click', closeProjectWrapper);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('project-open')) {
        closeProjectWrapper();
    }
});