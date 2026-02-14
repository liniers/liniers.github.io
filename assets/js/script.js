
// ===== VARIABLES GLOBALES DE DATOS =====

// Fuentes de datos
let randomData = []; // Datos de random.json (pequeños proyectos)
let caseStudiesData = []; // Datos de case-studies.json (proyectos grandes)

// ===== CONFIGURACIÓN DE ASSETS REMOTOS =====
const ASSET_BASE_URL = 'https://pub-b7331ec578274f5fa4797ea882ba092d.r2.dev/img/';

function buildAssetUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    let cleaned = String(path).replace(/^\.?\/*/, '');
    if (cleaned.startsWith('assets/img/')) {
        cleaned = cleaned.replace(/^assets\/img\//, '');
    }
    if (cleaned.startsWith('img/')) {
        cleaned = cleaned.replace(/^img\//, '');
    }
    return `${ASSET_BASE_URL}${encodeURI(cleaned)}`;
}

// Función auxiliar para extraer título del thumbnail
function getTitleFromThumbnail(thumbnail) {
    // Extraer el nombre del archivo sin extensión
    const filename = thumbnail.split('/').pop(); // Último segmento
    const titleWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Quitar extensión
    return titleWithoutExt || 'Sin título';
}

// Variable para rastrear qué fuente está activa
let currentDataSource = 'random'; // 'random' o 'case-studies'

// Helper para obtener los datos de la fuente actual
function getCurrentData() {
    return currentDataSource === 'random' ? randomData : caseStudiesData;
}

// Helper para cambiar de fuente de datos
function setDataSource(source) {
    if (source === 'random' || source === 'case-studies') {
        currentDataSource = source;
        return true;
    }
    console.error('[DATA] Fuente inválida:', source);
    return false;
}

let posicionesOriginales = []; // Guardar posiciones originales de los thumbs
let vistaRandomActiva = false; // Estado para saber si estamos mostrando imágenes random

// ===== FUNCIONES DE CARGA DE DATOS =====

// Cargar ambos JSONs de forma asincrónica
async function loadAllData() {
    try {
        // Cargar random.json
        const randomResponse = await fetch('assets/json/random.json');
        randomData = await randomResponse.json();
        console.log('[DATA] random.json cargado:', randomData.length, 'items');

        // Cargar case-studies.json
        const caseStudiesResponse = await fetch('assets/json/case-studies.json');
        caseStudiesData = await caseStudiesResponse.json();
        console.log('[DATA] case-studies.json cargado:', caseStudiesData.length, 'items');

        return true;
    } catch (error) {
        console.error('[DATA] Error cargando JSONs:', error);
        return false;
    }
}

// Función para remaquetear el grid cuando cambia el dataset
function remaquetearGrid() {
    // Limpiar grid actual
    const cuadriculaTrabajos = document.querySelector("#portfolio-items .thumbs-grid");
    if (cuadriculaTrabajos) {
        cuadriculaTrabajos.innerHTML = '';
    }
    
    // Remaquetear con nuevos datos
    maquetar_inicio();
    console.log(`[DATA] Grid remaquetado con fuente: ${currentDataSource}`);
}

// Función para cambiar entre fuentes de datos
async function switchDataSource(newSource) {
    if (newSource === currentDataSource) {
        console.log('[DATA] Ya estás en la fuente:', newSource);
        return false;
    }
    
    if (!setDataSource(newSource)) {
        return false;
    }
    
    console.log(`[DATA] Cambiado a fuente: ${newSource}`);
    remaquetearGrid();
    return true;
}

// ===== SWITCH PARA TUBO 3D =====
// Cambia este valor para elegir entre dos modos:
// true = Scroll Trigger (animación vinculada al scroll)
// false = Auto Rotate (rotación automática continua)
const USE_TUBE_SCROLL_TRIGGER = true;

// ===== CONFIGURACIÓN DE DISTRIBUCIÓN =====
// Cambia este valor para elegir la estrategia de organización
// Opciones: 'random', 'byDate', 'manual', 'original'
const DISTRIBUTION_STRATEGY = 'manual';

// Si usas estrategia 'manual', define aquí el orden de IDs de proyectos
// Ejemplo: const MANUAL_ORDER = ['proyecto-1', 'proyecto-5', 'proyecto-3', ...];
const MANUAL_ORDER = [23];

// Paleta de colores para los thumbs 
const colorNames = [
    'rojo',
    'verde-oliva',
    'azul-oscuro',
    'coral',
    'amarillo-dorado',
    'azul-petroleo',
    'rojo-vino',
    'verde-bosque',
    'salmon',
    'verde-azulado'
];

// ===== SISTEMA DE DISTRIBUCIÓN DE TRABAJOS =====

// Fisher-Yates shuffle para distribución aleatoria
function randomDistribution(data) {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Distribución por fecha (más reciente primero)
function byDateDistribution(data) {
    return [...data].sort((a, b) => {
        const dateA = new Date(a.fecha || 0);
        const dateB = new Date(b.fecha || 0);
        return dateB - dateA;
    });
}

// Distribución manual según orden especificado
function manualDistribution(data, order) {
    if (!order || order.length === 0) {
        console.warn('MANUAL_ORDER está vacía, usando orden original');
        return [...data];
    }
    
    const sorted = [];
    const used = new Set();
    
    // Primero añade los que están en MANUAL_ORDER en ese orden
    order.forEach(id => {
        const trabajo = data.find(t => t.id === id);
        if (trabajo) {
            sorted.push(trabajo);
            used.add(id);
        }
    });
    
    // Luego añade los que no están en MANUAL_ORDER pero ALEATORIAMENTE
    const remaining = [];
    data.forEach(trabajo => {
        if (!used.has(trabajo.id)) {
            remaining.push(trabajo);
        }
    });
    
    // Shuffle de los restantes (Fisher-Yates)
    for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    
    // Combina: primero los de MANUAL_ORDER, luego los aleatorizados
    return [...sorted, ...remaining];
}

// Distribución original (sin cambios)
function originalDistribution(data) {
    return [...data];
}

// Organizador principal que aplica la estrategia seleccionada
function organizeWorks(data, strategy = DISTRIBUTION_STRATEGY) {
    switch(strategy.toLowerCase()) {
        case 'random':
            return randomDistribution(data);
        case 'bydate':
            return byDateDistribution(data);
        case 'manual':
            return manualDistribution(data, MANUAL_ORDER);
        case 'original':
            return originalDistribution(data);
        default:
            console.warn(`Estrategia desconocida: ${strategy}, usando 'original'`);
            return originalDistribution(data);
    }
}

// Mapeo de categorías a colores
const categoryColorMap = {
    'Art Direction': 'rojo',
    'Design Systems': 'amarillo-dorado',
    'Motion Graphics': 'azul-oscuro',
    'Experimental, Personal': 'verde-oliva',
    'Interaction Design': 'salmon',
    'Illustration, Graphic Design': 'rojo-vino',
};

const colorPalette = colorNames.map(name => getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()); 


// 1.- MAQUETAR INICIO

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
function maquetar_inicio(){ 
    // Obtener datos de la fuente actual (random por defecto)
    const trabajosData = getCurrentData();
    
    // Aplicar estrategia de distribución configurada
    const organized = organizeWorks(trabajosData);
    const cuadriculaTrabajos = document.querySelector("#portfolio-items .thumbs-grid");
    const gridConfig = getGridConfig();
    posicionesOriginales = [];

    organized.forEach((trabajo, index) => {
        const miniaturaCuadrada = document.createElement("article");
        miniaturaCuadrada.classList.add(`thumb-${index + 1}`, 'hide-image', 'reactive-scale');
        miniaturaCuadrada.dataset.workId = trabajo.id;

        const workInfo = document.createElement("div");
        workInfo.classList.add('work-info');
        miniaturaCuadrada.appendChild(workInfo);
        
        // Asignar color según la categoría
        const colorName = categoryColorMap[trabajo.categoria] || 'coral';
        const colorValue = getComputedStyle(document.documentElement).getPropertyValue(`--color-${colorName}`).trim();
        miniaturaCuadrada.style.backgroundColor = colorValue;
        
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(trabajo.thumbnail);
        
        if (isVideo) {
            const video = document.createElement('video');
            Object.assign(video, {
                src: '',  // ✅ LAZY: src vacío, se carga con IntersectionObserver
                autoplay: false,  // ✅ No autoplay, carga bajo demanda
                loop: true,
                muted: true,
                playsInline: true,
                loading: 'lazy'
            });
            video.dataset.src = buildAssetUrl(trabajo.thumbnail); // Guardar ruta para lazy load
            miniaturaCuadrada.appendChild(video);
            miniaturaCuadrada.style.position = 'relative';
            
            // ✅ Registrar con MediaManager para lazy loading
            window.mediaManager.observe(video);
        } else {
            // ✅ LAZY: No cargar imagen inmediatamente, solo guardar rutas
            miniaturaCuadrada.classList.add('thumb-image');
            miniaturaCuadrada.dataset.src = buildAssetUrl(trabajo.thumbnail);
            miniaturaCuadrada.style.backgroundColor = miniaturaCuadrada.style.backgroundColor; // Mantener color placeholder
            
            // ✅ Registrar con MediaManager para lazy loading
            window.mediaManager.observe(miniaturaCuadrada);
        }

        const workCategory = document.createElement('p');
        workCategory.classList.add('work-category');
        workCategory.textContent = trabajo.categoria;
        workInfo.appendChild(workCategory);
        
        const workTitle = document.createElement('h3');
        workTitle.classList.add('work-title', 'text-display');
        workTitle.textContent = trabajo.titulo || getTitleFromThumbnail(trabajo.thumbnail);
        workInfo.appendChild(workTitle);
        
        const position = calculateGridPosition(index, gridConfig);
        posicionesOriginales.push(position);
        
        miniaturaCuadrada.style.setProperty('grid-row', `${position.gridRow} / span ${gridConfig.thumbSpan}`);
        miniaturaCuadrada.style.setProperty('grid-column', `${position.gridColumn} / span ${gridConfig.thumbSpan}`);
        
        cuadriculaTrabajos.appendChild(miniaturaCuadrada);
    });

    // Actualizar leyenda del sidebar con categorías
    updateSidebarLegend(organized);
    
    // Inicializar interacciones y animaciones con delay para asegurar renderizado


    setTimeout(() => {
        setupThumbsHover(); // Inicializar hover de todas las thumbs con GSAP
        setupQuickView(); // Inicializar quick view
        
        // Hacer visible el body
        gsap.to('body', { opacity: 1, duration: 1, ease: 'power2.inOut'});
    }, 100);
}
// --- Fin maquetar_inicio --- \\

// Función para actualizar la leyenda del sidebar con categorías
function updateSidebarLegend(data) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Obtener categorías únicas en orden de aparición
    const categoriesSet = new Map();
    data.forEach(trabajo => {
        if (!categoriesSet.has(trabajo.categoria)) {
            categoriesSet.set(trabajo.categoria, categoryColorMap[trabajo.categoria] || 'coral');
        }
    });
    
    // Crear la lista de leyenda
    const mainFilter = sidebar.querySelector('.main-filter');
    if (mainFilter) {
        mainFilter.innerHTML = ''; // Limpiar contenido anterior
        
        categoriesSet.forEach((colorName, categoria) => {
            const colorValue = getComputedStyle(document.documentElement).getPropertyValue(`--color-${colorName}`).trim();
            const li = document.createElement('li');
            li.innerHTML = `<span class="color-bullet" style="background-color: ${colorValue};"></span><span>${categoria}</span>`;
            mainFilter.appendChild(li);
        });
    }
}


// 2.- GSAP + LENIS SETUP

const isMobileScroll = window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
let lenis;

if (!isMobileScroll) {
    lenis = new Lenis({
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

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000); // Convert time from seconds to milliseconds
    });

    // Disable lag smoothing in GSAP to prevent any delay in scroll animations
    gsap.ticker.lagSmoothing(0);
} else {
    // No-op Lenis API for mobile to avoid errors in other calls
    lenis = {
        raf: () => {},
        on: () => {},
        start: () => {},
        stop: () => {},
        scrollTo: () => {}
    };
}




// 3.- TOGGLE BOTONES VISTA RANDOM / VISTA GLOBAL

// ===== INICIALIZACIÓN DE VARIABLES DE ESTADO =====
window.vistaCategoriesActiva = false;
window.vistaAllActiva = false;
window.vistaCaseStudiesActiva = false;
window.categoryTitles = []; // Array para guardar los títulos de categoría

// ===== REFERENCIAS A BOTONES =====
const vistaAllBtn = document.getElementById('vistaRandomBtn'); // Botón "All"
const vistaCategoriesBtn = document.getElementById('vistaGlobal'); // Botón "Categories"
const vistaCaseStudiesBtn = document.getElementById('caseStudiesBtn'); // Botón "Case Studies"
const viewNavButtons = document.querySelectorAll('.views-nav button');
const viewsNavContainer = document.querySelector('.views-nav');

// Guardar referencias globales
window.viewNavButtons = {
    vistaAllBtn,
    vistaCategoriesBtn,
    vistaCaseStudiesBtn
};

// ===== SETUP: CREAR ELEMENTO DE FONDO DESLIZANTE =====
const slidingBackground = document.createElement('div');
slidingBackground.className = 'button-background-slider';
viewsNavContainer.insertBefore(slidingBackground, viewsNavContainer.firstChild);

// Asegurar que los botones estén por encima del fondo
Array.from(viewNavButtons).forEach(btn => {
    btn.style.position = 'relative';
    btn.style.zIndex = '1';
});

// ===== FUNCIÓN PARA MOVER EL FONDO DEL BOTÓN =====
function initSlidingBackground() {
    const activeButton = Array.from(viewNavButtons).find(btn => btn.classList.contains('button-active'));
    
    slidingBackground.style.width = `${activeButton.offsetWidth}px`;
    slidingBackground.style.height = `${activeButton.offsetHeight}px`;
    slidingBackground.style.left = `${activeButton.offsetLeft}px`;
    slidingBackground.style.top = `${activeButton.offsetTop}px`;
}

setTimeout(initSlidingBackground, 50);

window.toggleActiveButton = function(buttonToActivate, buttonToDeactivate) {
    console.log('[MENU DEBUG] Cambio de botón - De:', buttonToDeactivate?.textContent.trim(), 'A:', buttonToActivate?.textContent.trim());
    
    if (buttonToDeactivate && buttonToDeactivate !== buttonToActivate) { 
        buttonToDeactivate.classList.remove('button-active');
    }
    buttonToActivate.classList.add('button-active');
    buttonToActivate.style.backgroundColor = 'transparent';
    
    const currentLeft = parseFloat(slidingBackground.style.left);
    const currentWidth = parseFloat(slidingBackground.style.width);
    const targetLeft = buttonToActivate.offsetLeft;
    const targetWidth = buttonToActivate.offsetWidth;
    const targetHeight = buttonToActivate.offsetHeight;
    const targetTop = buttonToActivate.offsetTop;
    
    const goingRight = targetLeft > currentLeft;
    const tl = gsap.timeline();
    
    if (goingRight) {
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

// ===== FUNCIÓN HELPER: LIMPIAR TODAS LAS VISTAS =====
function cleanAllViews() {
    console.log('[MENU DEBUG] Limpiando todas las vistas');
    
    // Resetear flags
    window.vistaCategoriesActiva = false;
    window.vistaAllActiva = false;
    window.vistaCaseStudiesActiva = false;
    
    // Remover clases
    document.body.classList.remove('view-global', 'view-random', 'view-categories', 'view-case-studies');
    
    // Limpiar categorías
    if (window.categoryTitles && window.categoryTitles.length > 0) {
        window.categoryTitles.forEach(title => title.remove());
        window.categoryTitles = [];
    }
    
    // Matar ScrollTriggers (el texto 3D dejará de rotar y se congelará, lo cual está bien para salir)
    ScrollTrigger.getAll().forEach(st => st.kill()); 
    
    
    // Restaurar estilos body
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.minHeight = '';
    
    // Asegurar que lenis está activo después de limpiar
    lenis.start();
}

// ===== HELPERS PARA REALIZAR TRANSICIONES =====

// ===== VISTA ALL: Grid completo de random.json =====
if (vistaAllBtn) {
    vistaAllBtn.addEventListener('click', () => {
        console.log('[MENU DEBUG] Click en All (Vista grid completo)');
        
        const currentActive = Array.from(viewNavButtons).find(btn => btn.classList.contains('button-active'));
        
        if (currentActive === vistaAllBtn) return; // Ya está activo
        
        // Cambiar a random.json si no está
        if (currentDataSource !== 'random') {
            setDataSource('random');
            remaquetearGrid(); // Reconstruir grid con thumbs random
        }
        
        // Limpiar primero
        cleanAllViews();
        updateImageToggleVisibility();
        
        // Scroll a top
        window.scrollTo(0, 0);
        if (typeof lenis !== 'undefined') {
            lenis.scrollTo(0, { immediate: true });
        }
        
        init3DTube(); // Reinicializamos el tubo 3D
        
        // Activar vista All
        window.vistaAllActiva = true;
        document.body.classList.add('view-global', 'view-random');
        document.body.style.overflow = '';
        lenis.start();
        
        // Cambiar botón activo
        window.toggleActiveButton(vistaAllBtn, currentActive);
        
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
        
        // Restaurar a grid layout
        const thumbs = document.querySelectorAll('[class*="thumb-"]');
        const rootStyles = getComputedStyle(document.documentElement);
        const thumbSpan = parseInt(rootStyles.getPropertyValue('--grid-thumb-span')) || 2;
        const state = Flip.getState(thumbs);
        
        thumbs.forEach((thumb) => {
            const classList = Array.from(thumb.classList);
            const thumbClass = classList.find(c => c.startsWith('thumb-'));
            const index = parseInt(thumbClass.replace('thumb-', '')) - 1;
            
            // Reset a grid
            thumb.style.position = '';
            thumb.style.left = '';
            thumb.style.top = '';
            thumb.style.width = '';
            thumb.style.height = '';
            thumb.style.borderRadius = '';
            thumb.style.zIndex = '';
            
            if (posicionesOriginales[index]) {
                thumb.style.gridRow = `${posicionesOriginales[index].gridRow} / span ${thumbSpan}`;
                thumb.style.gridColumn = `${posicionesOriginales[index].gridColumn} / span ${thumbSpan}`;
                thumb.style.aspectRatio = '1 / 1';
            }
        });
        
        // Animar entrada con Flip
        Flip.from(state, {
            duration: 1,
            ease: "power4.out",
            // stagger: 0.005,
            scale: true,
            simple: true, 
            onComplete: () => {
                thumbs.forEach((thumb) => {
                    gsap.set(thumb, { clearProps: "transform" });
                });
                // Reinicializar quick-view después de que termine la animación
                setupQuickView();
            }
        });
    });
}

// 4.- ANIMACIÓN TEXTO TUBO 3D (ENCAPSULADA)

let tubeSplit = null; 
let tubeAutoRotateTimeline = null;
let tube3dScrollTrigger = null;

// ===== VERSIÓN CON SCROLL TRIGGER =====
function init3DTube_ScrollTrigger() {
    const containerScroll = document.querySelector(".container-scroll");
    if (!containerScroll) return;

    // 1. IMPORTANTE: Detener cualquier fade-out que esté ocurriendo en este momento
    gsap.killTweensOf(containerScroll);
    
    // Eliminar ScrollTrigger previo si existe
    if (tube3dScrollTrigger) {
        tube3dScrollTrigger.kill();
        tube3dScrollTrigger = null;
    }
    
    // Matar auto-rotate timeline si está activo
    if (tubeAutoRotateTimeline) {
        tubeAutoRotateTimeline.kill();
        tubeAutoRotateTimeline = null;
    }

    // 2. Limpieza de SplitText
    if (tubeSplit) {
        tubeSplit.revert();
        tubeSplit = null;
    }

    const width = window.innerWidth;
    const depth = -width / 30;
    const transformOrigin = `50% 50% ${depth}px`;

    // 3. Configuración CSS
    containerScroll.style.position = 'fixed';
    containerScroll.style.top = '50%';
    containerScroll.style.left = '50%';
    containerScroll.style.transform = 'translate(-50%, -50%)';
    containerScroll.style.zIndex = '0';
    containerScroll.style.pointerEvents = 'none';
    containerScroll.style.display = 'block';
    containerScroll.style.width = '100%';
    containerScroll.style.height = '100vh';

    // 4. Setup
    const linesScroll = containerScroll.querySelectorAll(".line");
    tubeSplit = new SplitText(linesScroll, { type: "chars", charsClass: "char" });
    gsap.set(linesScroll, { perspective: 700, transformStyle: "preserve-3d" });

    // 5. ScrollTrigger - usar la altura total de la página para que el tubo ruede de inicio a fin
    const tlScroll = gsap.timeline({
        scrollTrigger: {
            trigger: "#portfolio-items",
            start: "top top",
            end: "bottom bottom",
            scrub: 0,
            markers: false,
            refreshPriority: -1
        }
    });
    
    tube3dScrollTrigger = tlScroll.scrollTrigger;
    
    // Forzar refresh de ScrollTrigger después de que los elementos se hayan renderizado
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 500);

    linesScroll.forEach((line, index) => {
        const chars = line.querySelectorAll('.char');
        tlScroll.fromTo(chars,
            { rotationX: -90 },
            { rotationX: 90, stagger: 0.03, ease: "none", transformOrigin },
            index * 0.3 
        );
    });

    // 6. FADE IN
    gsap.fromTo(containerScroll, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1, ease: "power2.out" }
    );
}

// ===== VERSIÓN CON ROTACIÓN AUTOMÁTICA =====
function init3DTube_AutoRotate() {
    const containerScroll = document.querySelector(".container-scroll");
    if (!containerScroll) return;

    // 1. Detener tweens anteriores
    gsap.killTweensOf(containerScroll);
    
    // Matar ScrollTrigger si está activo
    if (tube3dScrollTrigger) {
        tube3dScrollTrigger.kill();
        tube3dScrollTrigger = null;
    }
    
    if (tubeAutoRotateTimeline) {
        tubeAutoRotateTimeline.kill();
        tubeAutoRotateTimeline = null;
    }

    // 2. Limpieza de SplitText
    if (tubeSplit) {
        tubeSplit.revert();
        tubeSplit = null;
    }

    const width = window.innerWidth;
    const depth = -width / 30;
    const transformOrigin = `50% 50% ${depth}px`;

    // 3. Configuración CSS
    containerScroll.style.position = 'fixed';
    containerScroll.style.top = '50%';
    containerScroll.style.left = '50%';
    containerScroll.style.transform = 'translate(-50%, -50%)';
    containerScroll.style.zIndex = '0';
    containerScroll.style.pointerEvents = 'none';
    containerScroll.style.display = 'block';
    containerScroll.style.width = '100%';
    containerScroll.style.height = '100vh';

    // 4. Setup
    const linesScroll = containerScroll.querySelectorAll(".line");
    tubeSplit = new SplitText(linesScroll, { type: "chars", charsClass: "char" });
    gsap.set(linesScroll, { perspective: 700, transformStyle: "preserve-3d" });

    // 5. Rotación automática continua
    tubeAutoRotateTimeline = gsap.timeline({ repeat: -1 }); // Repetir infinitamente

    linesScroll.forEach((line, index) => {
        const chars = line.querySelectorAll('.char');
        tubeAutoRotateTimeline.fromTo(chars,
            { rotationX: -90 },
            { rotationX: 90, stagger: 0.1, ease: "linear", transformOrigin, duration: 1.5 },
            index * 1  // Mayor separación entre líneas para evitar solapamiento
        );
    });

    // 6. FADE IN
    gsap.fromTo(containerScroll, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1, ease: "power2.out" }
    );
}

// ===== FUNCIÓN ROUTER QUE ELIGE AUTOMÁTICAMENTE SEGÚN EL SWITCH =====
function init3DTube() {
    if (USE_TUBE_SCROLL_TRIGGER) {
        init3DTube_ScrollTrigger();
    } else {
        init3DTube_AutoRotate();
    }
}

// Inicializar al cargar la página
init3DTube();


// 5.- TOGGLE DE IMÁGENES (Ocultar en Case Studies)

const toggleImgColor = document.querySelector('.header-right button:first-child');
let imagesVisible = false; // Empiezan ocultas

// Mostrar/ocultar el botón según la vista:
function updateImageToggleVisibility() {
    if (!toggleImgColor) return;
    if (document.body.classList.contains('view-case-studies')) {
        toggleImgColor.style.display = 'none'; // Ocultar en case studies
    } else {
        toggleImgColor.style.display = ''; // Mostrar en otras vistas
    }
}

// SVGs para el toggle (lo podría animar en el futuro)
const svgHidden = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="10" viewBox="0 0 22 10" fill="none">
                    <path d="M1.58105 0C5.20131 3.62026 8.73857 4.30318 11.6689 3.80078C14.6662 3.28685 17.1484 1.50917 18.4961 0.0332031L19.9727 1.38086C19.7084 1.67028 19.4062 1.96756 19.0723 2.26758L21.2754 5.10059L20.4863 5.71484L19.6963 6.32812L17.4961 3.5C16.6334 4.08712 15.6486 4.63007 14.5645 5.05371L15.9756 8.22949L14.1475 9.04199L12.6377 5.64551C12.4299 5.69218 12.2197 5.73499 12.0068 5.77148C10.8447 5.97073 9.62203 6.00855 8.3623 5.83398L7.69238 8.85254L5.73926 8.41895L6.41113 5.39355C5.42616 5.08336 4.42708 4.6328 3.42383 4.01758L1.74805 7.03516L0.874023 6.54883L0 6.06348L1.7793 2.85938C1.24102 2.42955 0.702549 1.94962 0.166992 1.41406L1.58105 0Z" fill="var(--color-text)"/>
                </svg>`;

const svgVisible = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="13" viewBox="0 0 22 13" fill="none">
  <path d="M1.81111 2.76126C6.22784 -0.0642495 13.1007 -1.69941 19.3951 2.78861C21.5933 4.35643 21.6503 7.55629 19.4781 9.18119C17.4232 10.7182 14.7147 12.0633 11.6236 12.357C8.50637 12.653 5.07116 11.8707 1.62849 9.26712C-0.563416 7.60929 -0.581643 4.29219 1.81111 2.76126ZM6.95271 2.58158C5.46627 3.02071 4.08922 3.67818 2.88923 4.44583C1.74653 5.17686 1.67989 6.79838 2.83552 7.6724C4.01832 8.56684 5.18509 9.20663 6.32087 9.64408C5.78925 8.84967 5.47908 7.89439 5.47908 6.86673V6.12747C5.47918 4.74176 6.04201 3.4871 6.95271 2.58158ZM13.7418 2.34134C14.8047 3.25817 15.479 4.61364 15.4791 6.12747V6.86673C15.4791 7.87182 15.1799 8.80654 14.6695 9.59037C16.0101 9.0759 17.2298 8.36505 18.2799 7.57962C19.3574 6.77356 19.3396 5.20524 18.234 4.41654C16.7599 3.36553 15.2451 2.70179 13.7418 2.34134ZM10.4771 3.49564C8.82047 3.49564 7.47746 4.83907 7.47712 6.49564C7.47712 8.15249 8.82027 9.49564 10.4771 9.49564C12.1338 9.49545 13.4771 8.15238 13.4771 6.49564C13.4768 4.83918 12.1336 3.49583 10.4771 3.49564Z" fill="var(--color-text)"/>
</svg>`;

if (toggleImgColor) {
    toggleImgColor.addEventListener('click', () => {
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
            duration: .6,
            ease: "power4.out",
            stagger: 0.02,
            scale: true,
            simple: true,
        });
        
        // Actualizar visibilidad del botón toggle de imágenes
        updateImageToggleVisibility();
        
        // Cambiar SVG del botón
        toggleImgColor.innerHTML = imagesVisible ? svgVisible : svgHidden;
    });
}


// 6.- VISTA CATEGORIES: Agrupadas por categoría (random.json)

if (vistaCategoriesBtn) {
    vistaCategoriesBtn.addEventListener('click', () => {
        console.log('[MENU DEBUG] Click en Categories');
        
        // Cambiar a random.json si no está
        if (currentDataSource !== 'random') {
            setDataSource('random');
            remaquetearGrid(); // Remaquetear con datos de random
        }
        
        // Limpiar el grid antes de reorganizar
        const cuadriculaTrabajos = document.querySelector("#portfolio-items .thumbs-grid");
        if (cuadriculaTrabajos) {
            cuadriculaTrabajos.innerHTML = '';
            maquetar_inicio(); // Volver a maquetear con datos de random
        }
        
        const thumbs = document.querySelectorAll('[class*="thumb-"]');
        
        const state = Flip.getState(thumbs);
        
        const currentActive = Array.from(viewNavButtons).find(btn => btn.classList.contains('button-active'));
        
        if (currentActive === vistaCategoriesBtn) return; // Ya está activo
        
        cleanAllViews();
        updateImageToggleVisibility();
        
        window.scrollTo(0, 0);
        if (typeof lenis !== 'undefined') {
            lenis.scrollTo(0, { immediate: true });
        }
        
        // Activar vista categories
        window.vistaCategoriesActiva = true;
        document.body.classList.add('view-global', 'view-categories');
        
        // --- DETECTAR SI ES DESKTOP O MOVIL ---
        const viewportWidth = window.innerWidth;
        const isDesktop = viewportWidth > 480;
        
        // --- LOGICA CONDICIONAL DE SCROLL ---
        if (isDesktop) {
            // DESKTOP: Bloquear scroll y centrar
            document.body.style.overflow = 'hidden'; 
            document.body.style.height = '100vh';    
            lenis.stop();   
        } else {
            // MOVIL: Permitir scroll normal
            document.body.style.overflow = ''; 
            document.body.style.height = '';    
            lenis.start();   
        }
        
        // Cambiar botón activo
        window.toggleActiveButton(vistaCategoriesBtn, currentActive);
        
        // Asegurar que el container-scroll (tubo) NO se muestre
        const containerScroll = document.querySelector('.container-scroll');
        if (containerScroll) {
            gsap.set(containerScroll, { display: 'none', opacity: 0 });
        }
        
        // Obtener categorías únicas del dataset actual
        const categorias = [...new Set(getCurrentData().map(t => t.categoria))];
        const rootStyles = getComputedStyle(document.documentElement);
        const globalViewCols = parseInt(rootStyles.getPropertyValue('--global-view-cols')) || 2;
        const globalViewRows = rootStyles.getPropertyValue('--global-view-rows').trim() === 'auto' 
            ? Math.ceil(categorias.length / globalViewCols) 
            : parseInt(rootStyles.getPropertyValue('--global-view-rows')) || 2;
        const thumbsPerRow = parseInt(rootStyles.getPropertyValue('--global-thumbs-per-row')) || 6;
        const categorySpacing = parseInt(rootStyles.getPropertyValue('--global-category-spacing')) || 60;
        const titleSpacing = parseInt(rootStyles.getPropertyValue('--global-title-spacing')) || 40;
        
        const cols = globalViewCols;
        const rows = globalViewRows;
        const viewportHeight = window.innerHeight;
        const margin = isDesktop ? 120 : 40; 
        
        const groupWidth = (viewportWidth - margin * 2) / cols;
        const thumbSpan = 1;
        
        const thumbSize = Math.min(
            (groupWidth - (isDesktop ? 100 : 40)) / thumbsPerRow,
            isDesktop ? 60 : 50
        );
        
        let currentY = margin;
        
        // Cálculos de altura por fila (Solo relevante para centrado en Desktop)
        const maxHeightPerRow = [];
        if (isDesktop) {
            for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
                let maxInRow = 0;
                categorias.forEach((cat, catIndex) => {
                    const catRow = Math.floor(catIndex / cols);
                    if (catRow === rowIndex) {
                        const thumbsInCat = getCurrentData().filter(t => t.categoria === cat).length;
                        const numRows = Math.ceil(thumbsInCat / thumbsPerRow);
                        const blockH = numRows * thumbSize;
                        maxInRow = Math.max(maxInRow, blockH);
                    }
                });
                maxHeightPerRow.push(maxInRow);
            }
        }
        
        categorias.forEach((categoria, catIndex) => {
            const thumbsEnCategoria = getCurrentData()
                .filter(trabajo => trabajo.categoria === categoria);
            
            const groupCol = catIndex % cols;
            const groupRow = Math.floor(catIndex / cols);
            const numThumbsInCat = thumbsEnCategoria.length;
            const numRows = Math.ceil(numThumbsInCat / thumbsPerRow);
            const blockHeight = numRows * thumbSize;
            
            // Cálculos de posición X
            let groupBaseX;
            if (isDesktop) {
                const totalGridWidth = cols * groupWidth;
                const gridOffsetX = (viewportWidth - totalGridWidth) / 2;
                groupBaseX = gridOffsetX + (groupCol * groupWidth) + (groupWidth / 2);
            } else {
                groupBaseX = viewportWidth / 2; 
            }
            
            // Cálculos de posición Y
            let groupBaseY;
            
            if (!isDesktop) {
                // MOVIL: Flujo vertical
                groupBaseY = currentY + blockHeight / 2 + titleSpacing;
                currentY = currentY + blockHeight + categorySpacing + titleSpacing;
            } else {
                // DESKTOP: Centrado vertical absoluto en pantalla
                const totalContentHeight = maxHeightPerRow.reduce((sum, h) => sum + h, 0) + (rows - 1) * categorySpacing;
                const availableHeight = viewportHeight - margin * 2;
                const verticalOffset = margin + (availableHeight - totalContentHeight) / 2;
                
                let yPosition = verticalOffset;
                for (let i = 0; i < groupRow; i++) {
                    yPosition += maxHeightPerRow[i] + categorySpacing;
                }
                groupBaseY = yPosition + maxHeightPerRow[groupRow] / 2;
            }
            
            const blockWidth = thumbsPerRow * thumbSize;
            const offsetX = -blockWidth / 2;
            const offsetY = -blockHeight / 2;
            
            // Crear título de categoría
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = categoria;
            categoryTitle.style.cssText = `
                position: absolute;
                left: ${groupBaseX + offsetX}px;
                top: ${groupBaseY + offsetY - titleSpacing}px;
                opacity: 0;
            `;
            document.body.appendChild(categoryTitle);
            window.categoryTitles.push(categoryTitle);
            
            gsap.to(categoryTitle, {
                opacity: 1,
                duration: 1,
                delay: 0.3,
                ease: 'power2.out'
            });
            
            thumbsEnCategoria.forEach((trabajo, thumbIndexInCat) => {
                // Encontrar el thumb por data-workId en lugar de por índice
                const thumb = document.querySelector(`[data-work-id="${trabajo.id}"]`);
                if (!thumb) {
                    console.warn(`[CATEGORIES] Thumb no encontrado para trabajo ID: ${trabajo.id}`);
                    return; // Saltar si no existe
                }
                
                const colInGroup = thumbIndexInCat % thumbsPerRow;
                const rowInGroup = Math.floor(thumbIndexInCat / thumbsPerRow);
                
                const thumbX = groupBaseX + offsetX + (colInGroup * thumbSize);
                const thumbY = groupBaseY + offsetY + (rowInGroup * thumbSize);
                
                thumb.style.position = 'absolute';
                thumb.style.left = `${thumbX}px`;
                thumb.style.top = `${thumbY}px`;
                thumb.style.zIndex = '1';
                thumb.style.width = `${thumbSize}px`;
                thumb.style.height = `${thumbSize}px`;
                thumb.style.borderRadius = ''; 
                thumb.style.gridRow = 'auto';
                thumb.style.gridColumn = 'auto';
            });
        });
        
        // Altura total solo en móvil
        if (!isDesktop) {
            const totalHeight = currentY + margin;
            document.body.style.minHeight = `${totalHeight}px`;
        }
        
        // Animar entrada Flip categories
        Flip.from(state, {
            duration: 1,
            ease: "power4.out",
            // stagger: 0.005,
            scale: true,
            simple: true,
            onComplete: () => {
                // Reinicializar quick-view después de que termine la animación
                setupQuickView();
            }
        });
    });
}

// 7.- VISTA CASE STUDIES: Grid 3 columnas (case-studies.json)

if (vistaCaseStudiesBtn) {
    vistaCaseStudiesBtn.addEventListener('click', () => {
        console.log('[MENU DEBUG] Click en Case Studies');
        
        const currentActive = Array.from(viewNavButtons).find(btn => btn.classList.contains('button-active'));
        
        if (currentActive === vistaCaseStudiesBtn) return; // Ya está activo
        
        // Cambiar a case-studies.json
        const switched = switchDataSource('case-studies');
        if (!switched) {
            console.error('[CASE STUDIES] Error al cambiar a case-studies');
            return;
        }
        
        // Limpiar vistas anteriores
        cleanAllViews();
        
        // Activar vista case studies
        window.vistaCaseStudiesActiva = true;
        document.body.classList.add('view-case-studies');
        document.body.style.overflow = '';
        lenis.start();
        
        // Actualizar visibilidad del botón (DESPUÉS de agregar la clase)
        updateImageToggleVisibility();
        
        // Cambiar botón activo
        window.toggleActiveButton(vistaCaseStudiesBtn, currentActive);
        
        // Ocultar el tubo 3D
        const containerScroll = document.querySelector('.container-scroll');
        if (containerScroll) {
            gsap.to(containerScroll, {
                opacity: 0,
                duration: 0.3,
                display: 'none'
            });
        }
        
        // Crear grid de Case Studies (3 columnas)
        const cuadriculaTrabajos = document.querySelector("#portfolio-items .thumbs-grid");
        cuadriculaTrabajos.innerHTML = ''; // Limpiar contenido anterior
        
        const caseStudies = getCurrentData();
        
        caseStudies.forEach((proyecto) => {
            // Crear artículo para cada case study
            const article = document.createElement('article');
            article.className = 'case-study-card';
            article.dataset.projectId = proyecto.id;
            
            // Thumbnail
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'case-study-card__thumbnail';
            
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(proyecto.thumbnail);
            
            if (isVideo) {
                const video = document.createElement('video');
                video.src = '';  // ✅ LAZY: src vacío
                video.autoplay = false;  // ✅ No autoplay
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.dataset.src = buildAssetUrl(proyecto.thumbnail);
                thumbnailContainer.appendChild(video);
                
                // ✅ Registrar con MediaManager
                window.mediaManager.observe(video);
            } else {
                const img = document.createElement('img');
                img.src = '';  // ✅ LAZY: src vacío
                img.alt = proyecto.titulo;
                img.dataset.src = buildAssetUrl(proyecto.thumbnail);
                thumbnailContainer.appendChild(img);
                
                // ✅ Registrar con MediaManager
                window.mediaManager.observe(img);
            }
            
            article.appendChild(thumbnailContainer);
            
            // Info: Categoría y Título
            const infoContainer = document.createElement('div');
            infoContainer.className = 'case-study-card__info';
            
            const categoria = document.createElement('p');
            categoria.className = 'case-study-card__category work-category';
            categoria.textContent = proyecto.categoria || 'Sin categoría';
            infoContainer.appendChild(categoria);
            
            const titulo = document.createElement('h3');
            titulo.className = 'case-study-card__title work-title text-display';
            titulo.textContent = proyecto.titulo;
            infoContainer.appendChild(titulo);
            
            article.appendChild(infoContainer);
            
            // Click handler: abrir el project wrapper directamente
            article.addEventListener('click', () => {
                console.log('[CASE STUDIES] Abriendo proyecto:', proyecto.titulo);
                openProjectWrapper(proyecto);
            });
            
            cuadriculaTrabajos.appendChild(article);
        });
        
        // Animar entrada con fade-in
        gsap.fromTo(cuadriculaTrabajos.querySelectorAll('.case-study-card'),
            { opacity: 0, y: 24 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 1, 
                ease: 'power4.out',
                stagger: 0.02
            }
        );
    });
}
// 8.- HOVER EFFECT - MOSTRAR IMAGEN Y WORK-INFO SIGUIENDO CURSOR

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
    
    // Obtener todos los thumbs
    const thumbs = document.querySelectorAll('[class*="thumb-"]');
    
    thumbs.forEach(thumb => {
        // Evento mouseenter en cada thumb
        thumb.addEventListener('mouseenter', (e) => {
            const workCategory = thumb.querySelector('.work-category');
            const workTitle = thumb.querySelector('.work-title');
            
            // Vista Listado, Random y Categorías: hover info sigue el cursor
            if (document.body.classList.contains('view-listado') || 
                document.body.classList.contains('view-random') ||
                document.body.classList.contains('view-categories')) {
                if (hoverCategory && workCategory) {
                    hoverCategory.textContent = workCategory.textContent;
                }
                if (hoverTitle && workTitle) {
                    hoverTitle.textContent = workTitle.textContent;
                }
                hoverInfo.classList.add('is-visible');
                hoverInfo.classList.remove('is-centered');
            }
            // Vista Clients: hover info centrado
            else if (document.body.classList.contains('view-clients')) {
                if (hoverCategory && workCategory) {
                    hoverCategory.textContent = workCategory.textContent;
                }
                if (hoverTitle && workTitle) {
                    hoverTitle.textContent = workTitle.textContent;
                }
                hoverInfo.classList.add('is-visible', 'is-centered');
                
                // Posicionar en el centro
                hoverInfo.style.left = '50%';
                hoverInfo.style.top = '50%';
                hoverInfo.style.transform = 'translate(-50%, -50%)';
            }
            
            // Guardar estado actual de imagesVisible
            const globalImagesVisible = imagesVisible;
            thumbStates.set(thumb, { globalImagesVisible });
            
            // En hover, mostrar lo opuesto a lo que está visible globalmente
            if (imagesVisible) {
                // Si imágenes están visibles → ocultar imagen (mostrar color)
                thumb.classList.add('hide-image');
                const media = thumb.querySelector('video, img');
                if (media) {
                    gsap.to(media, {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.in'
                    });
                }
            } else {
                // Si imágenes están ocultas → mostrar imagen
                thumb.classList.remove('hide-image');
                const media = thumb.querySelector('video, img');
                if (media) {
                    media.style.display = '';
                    gsap.to(media, {
                        opacity: 1,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            }
        });
        
        // Evento mousemove en cada thumb
        thumb.addEventListener('mousemove', (e) => {
            // Solo seguir cursor en vista listado, random y categorías
            if (hoverInfo && (document.body.classList.contains('view-listado') || 
                document.body.classList.contains('view-random') ||
                document.body.classList.contains('view-categories'))) {
                const offsetX = 24;
                const offsetY = -24;
                hoverInfo.style.left = `${e.clientX + offsetX}px`;
                hoverInfo.style.top = `${e.clientY + offsetY}px`;
                hoverInfo.style.transform = '';
            }
        });
        
        // Evento mouseleave en cada thumb
        thumb.addEventListener('mouseleave', (e) => {
            if (document.body.classList.contains('view-listado') || 
                document.body.classList.contains('view-random') ||
                document.body.classList.contains('view-categories') ||
                document.body.classList.contains('view-clients')) {
                hoverInfo.classList.remove('is-visible');
            }
            
            const state = thumbStates.get(thumb);
            if (state) {
                const globalImagesVisible = state.globalImagesVisible;
                const media = thumb.querySelector('video, img');
                
                // Restaurar al estado global actual
                if (globalImagesVisible) {
                    // Las imágenes deberían estar visibles globalmente
                    thumb.classList.remove('hide-image');
                    if (media) {
                        gsap.to(media, {
                            opacity: 1,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                    }
                } else {
                    // Las imágenes deberían estar ocultas globalmente
                    thumb.classList.add('hide-image');
                    if (media) {
                        gsap.to(media, {
                            opacity: 0,
                            duration: 0.3,
                            ease: 'power2.in',
                            onComplete: () => {
                                media.style.display = 'none';
                            }
                        });
                    }
                }
            }
        });
    });
}






// 9.- THEME TOGGLE CON MORPH SVG - REVISAR

const themetoggleImgColor = document.querySelector('.header-right button:last-child');

if (themetoggleImgColor) {
    const svgPath = themetoggleImgColor.querySelector('svg path');
    
    // Paths del SVG
    const moonPath = "M7 0C8.07363 0 9.09073 0.241865 10 0.673828C7.63509 1.79731 6 4.20763 6 7C6 9.79222 7.6353 12.2016 10 13.3252C9.09063 13.7573 8.07378 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0Z";
    const sunPath = "M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0Z";
    
    let isLightMode = false;
    
    themetoggleImgColor.addEventListener('click', () => {
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
let reelQuickView = null;
let reelQuickViewVideo = null;

// Exponer visitedThumbs como variable global para gallery-navigation.js
window.visitedThumbs = visitedThumbs;

// Variable para guardar la referencia al listener de quick-view
let quickViewListenerFn = null;

function ensureThumbMediaVisible(thumbElement) {
    if (!thumbElement) return;

    // Asegurar que el estado de ocultación no afecte al quick view
    thumbElement.classList.remove('hide-image');

    const media = thumbElement.querySelector('video, img');
    if (media) {
        media.style.display = '';
        media.style.opacity = '1';

        if (media.tagName === 'VIDEO') {
            if (!media.src && media.dataset && media.dataset.src) {
                media.src = media.dataset.src;
                media.load();
            }
        } else if (media.tagName === 'IMG') {
            if (!media.src && media.dataset && media.dataset.src) {
                media.src = media.dataset.src;
            }
        }
    } else if (thumbElement.classList.contains('thumb-image')) {
        const src = thumbElement.dataset ? thumbElement.dataset.src : '';
        const hasBg = thumbElement.style.backgroundImage && thumbElement.style.backgroundImage !== 'none';

        if (src && !hasBg) {
            if (window.mediaManager && typeof window.mediaManager.loadMedia === 'function') {
                window.mediaManager.loadMedia(thumbElement);
            } else {
                thumbElement.style.backgroundImage = `url('${src}')`;
                thumbElement.style.opacity = '1';
            }
        }
    }
}

function setupQuickView() {
    const cuadriculaTrabajos = document.querySelector('#portfolio-items .thumbs-grid');
    
    if (!cuadriculaTrabajos) {
        console.warn('Contenedor de thumbs no encontrado');
        return;
    }
    
    // Remover listener anterior si existe
    if (quickViewListenerFn) {
        cuadriculaTrabajos.removeEventListener('click', quickViewListenerFn);
    }
    
    // Crear nuevo listener function
    quickViewListenerFn = (e) => {
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
    };
    
    // Agregar nuevo listener
    cuadriculaTrabajos.addEventListener('click', quickViewListenerFn);
}

function abrirThumb(thumb) {
    // Activar morph de cara
    if (typeof morphToSecondFace === 'function') {
        morphToSecondFace();
    }
    
    // Obtener datos del trabajo
    const workId = thumb.dataset.workId;
    // Obtener datos de la fuente actual
    const trabajosData = getCurrentData();
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

    // Forzar visibilidad del media en quick view
    ensureThumbMediaVisible(thumbClone);
    
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
                    //borderRadius: '2rem',
                    duration: 0.6,
                    transform: 'rotateX(0deg)',
                    ease: 'power3.inOut',
                    onStart: () => {
                        setTimeout(() => {
                            mostrarControlesYInfo(thumbClone);
                            thumbClone.style.overflow = 'visible';
                        }, 400); 
                    },
                    onComplete: () => {
                        // ✅ Reproducir video automáticamente cuando se abre el quick view
                        const video = thumbClone.querySelector('video');
                        if (video && video.src) {
                            video.play().catch(err => {
                                console.log('[QuickView] Autoplay bloqueado (normal en algunos navegadores)');
                            });
                        }
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
                    },
                    onComplete: () => {
                        // ✅ Reproducir video automáticamente cuando se abre el quick view
                        const video = thumbClone.querySelector('video');
                        if (video && video.src) {
                            video.play().catch(err => {
                                console.log('[QuickView] Autoplay bloqueado (normal en algunos navegadores)');
                            });
                        }
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
                        // borderRadius: '2rem',
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
    
    // Crear work info - SOLO PARA RANDOM.JSON
    // Si es case-studies, se abre directo el wrapper sin bocadillo
    if (currentDataSource !== 'random') {
        console.log('[QUICK-VIEW] Ignorando bocadillo para case-studies (se abre wrapper directo)');
        return; // No mostrar bocadillo para case-studies
    }
    
    const workInfo = document.createElement('div');
    workInfo.className = 'work-info expanded-info';
    
    const workCategory = document.createElement('p');
    workCategory.className = 'work-category';
    workCategory.textContent = trabajo.categoria;
    
    const workTitle = document.createElement('h3');
    workTitle.className = 'work-title text-display';
    workTitle.textContent = trabajo.titulo || getTitleFromThumbnail(trabajo.thumbnail);
    
    // Crear botón de expand - SOLO SI HAY CONNECTED-PROJECT
    let expandBtn = null;
    if (trabajo['connected-project'] && trabajo['connected-project'] !== '') {
        expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn reactive-scale reactive-hover';
        expandBtn.innerHTML = '<span class="material-symbols-outlined">expand_content</span>';
        
        // Event listener para abrir el case study asociado
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Buscar el case study asociado
            const connectedId = trabajo['connected-project'];
            const caseStudy = caseStudiesData.find(cs => cs.id == connectedId);
            if (caseStudy) {
                openProjectWrapper(caseStudy);
                cerrarDetalle();
            } else {
                console.warn('[QUICK-VIEW] Case study no encontrado:', connectedId);
            }
        });
    }
    
    // Mostrar "tools" en lugar de "comentario"
    const workDetails = document.createElement('p');
    workDetails.className = 'work-details';
    
    if (trabajo.tools && trabajo.tools.length > 0) {
        // Si hay tools, mostrarlas
        workDetails.textContent = 'Tools: ' + (Array.isArray(trabajo.tools) ? trabajo.tools.join(', ') : trabajo.tools);
    } else {
        // Si no hay tools, mostrar comentario si existe, o un placeholder
        const placeholderMessages = [
            'Bonito, ¿no?',
            'Made with love.',
            '¿Te gusta? Contáctame para colaborar.',
            '¿Quieres saber más? Hablemos.',
            'Creado con amor y... café.',
            '¿Interesado en este proyecto? Envíame un mensaje.',
            'Cada proyecto tiene una historia, ¿quieres conocerla?',
            '¡Espero que te inspire!',
            '¿Quieres colaborar en algo similar? Contáctame.'
        ];
        workDetails.textContent = trabajo.comentario || placeholderMessages[Math.floor(Math.random() * placeholderMessages.length)];
    }
    
    // Agregar elementos al workInfo (orden: btn, categoría, título, detalles)
    if (expandBtn) {
        workInfo.appendChild(expandBtn);
    }
    workInfo.appendChild(workCategory);
    workInfo.appendChild(workTitle);
    workInfo.appendChild(workDetails);
    
    // Añadir work-info directamente al body
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

function openReelQuickView() {
    if (reelQuickView) return;

    if (activeThumb) {
        cerrarDetalle();
    }

    const reelSource = document.querySelector('.video-reel video source');
    const reelVideoElement = document.querySelector('.video-reel video');
    const reelSrc = reelSource ? reelSource.getAttribute('src') : (reelVideoElement?.currentSrc || reelVideoElement?.getAttribute('src'));

    if (!reelSrc) {
        console.warn('[REEL] No se encontró el src del video');
        return;
    }

    scrim.style.display = 'block';
    gsap.to(scrim, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
    });

    const container = document.createElement('div');
    container.className = 'reel-quick-view';

    const video = document.createElement('video');
    video.src = reelSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = false;
    video.playsInline = true;

    container.appendChild(video);

    const controls = createProjectVideoControls(video);
    const muteBtn = controls.querySelector('.mute-btn');
    if (muteBtn) {
        muteBtn.setAttribute('data-state', 'unmuted');
        muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
    }
    controls.style.opacity = '1';
    container.appendChild(controls);

    const closeButton = document.createElement('button');
    closeButton.className = 'close-expanded-btn reactive-scale reactive-hover';
    closeButton.innerHTML = '<span class="material-symbols-outlined">close</span>';
    closeButton.style.opacity = '1';
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeReelQuickView();
    });

    container.appendChild(closeButton);
    document.body.appendChild(container);

    reelQuickView = container;
    reelQuickViewVideo = video;

    gsap.fromTo(container, {
        opacity: 0,
        scale: 0.96
    }, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'power3.out'
    });

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
            console.log('[REEL] Autoplay bloqueado (normal en algunos navegadores)');
        });
    }
}

function closeReelQuickView() {
    if (!reelQuickView) return;

    const container = reelQuickView;
    const video = reelQuickViewVideo;

    gsap.to(container, {
        opacity: 0,
        scale: 0.96,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            if (video) {
                video.pause();
            }
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
            reelQuickView = null;
            reelQuickViewVideo = null;
        }
    });

    gsap.to(scrim, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            if (!activeThumb) {
                scrim.style.display = 'none';
            }
        }
    });
}

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
scrim.addEventListener('click', () => {
    cerrarDetalle();
    closeReelQuickView();
});

// Event listener para cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (activeThumb) {
            cerrarDetalle();
        }
        closeReelQuickView();
    }
});

const reelBtn = document.getElementById('reelBtn');
if (reelBtn) {
    reelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openReelQuickView();
    });
}

// Toggle minimizar video reel (solo deja el botón visible, pineado abajo izquierda)
const hideBtn = document.getElementById('hideBtn');
const videoReel = document.querySelector('.video-reel');

function setReelMinimized(isMinimized) {
    if (!videoReel) return;
    videoReel.classList.toggle('is-minimized', isMinimized);

    if (hideBtn) {
        const icon = hideBtn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = isMinimized ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
        }
    }
}

if (hideBtn && videoReel) {
    hideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const shouldMinimize = !videoReel.classList.contains('is-minimized');
        setReelMinimized(shouldMinimize);
    });
}



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
            video.src = buildAssetUrl(trabajo.thumbnail);
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
            img.src = buildAssetUrl(trabajo.thumbnail);
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
                fetch(buildAssetUrl(trabajo.descripcion))
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
        // Usar todas las imágenes del array (sin filtrar por random)
        const projectImages = mediaItems;
        
        if (projectImages.length > 0) {
            projectImages.forEach((mediaItem) => {
                // Obtener la ruta (puede ser string directo o objeto con path)
                const mediaPath = typeof mediaItem === 'string' ? mediaItem : mediaItem.path;
                
                const rowGrid = document.createElement('div');
                rowGrid.className = 'row-grid';

                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaPath);
                if (isVideo) {
                    const video = document.createElement('video');
                    video.src = buildAssetUrl(mediaPath);
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
                    img.src = buildAssetUrl(mediaPath);
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