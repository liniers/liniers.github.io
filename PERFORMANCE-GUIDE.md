# 🚀 Guía de Optimización de Performance

## Problemas Actuales Identificados
1. **Autoplay de todos los videos**: Se cargan y reproducen automáticamente al renderizar
2. **Sin lazy loading**: Todas las imágenes se cargan de una vez
3. **Todas las animaciones simultáneas**: GSAP ejecuta todas las transiciones sin priorización
4. **DOM completo visible**: No hay virtualización, todos los elementos en memoria
5. **Sin compresión de imágenes**: Las imágenes pesadas cargan a máxima resolución

## Estrategias de Optimización (Por Prioridad)

### ✅ URGENTE - Implementar Inmediatamente

#### 1. **Lazy Loading de Videos**
```javascript
// Cambiar en maquetar_inicio():
// ANTES (autoplay: true)
const video = document.createElement('video');
Object.assign(video, {
    src: `assets/img/${trabajo.thumbnail}`,
    autoplay: true,  // ❌ MALO
    loop: true,
    muted: true,
    playsInline: true
});

// DESPUÉS (lazy load)
const video = document.createElement('video');
Object.assign(video, {
    src: `assets/img/${trabajo.thumbnail}`,
    autoplay: false,  // ✅ NO cargar
    loop: true,
    muted: true,
    playsInline: true,
    loading: 'lazy'   // ✅ Espera a visibilidad
});

// Crear Intersection Observer para autoplay solo al scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.play();
            observer.unobserve(entry.target);
        }
    });
}, { rootMargin: '100px' });

observer.observe(video);
```

#### 2. **Lazy Loading de Imágenes (Intersection Observer)**
```javascript
// En maquetar_inicio(), para imágenes de fondo:
// ANTES
miniaturaCuadrada.style.backgroundImage = `url('assets/img/${trabajo.thumbnail}')`;

// DESPUÉS
if (!isVideo) {
    // Placeholder basado en color de categoría
    // La imagen real se carga cuando sea visible
    const img = new Image();
    img.src = `assets/img/${trabajo.thumbnail}`;
    
    const imgObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                miniaturaCuadrada.style.backgroundImage = `url('assets/img/${trabajo.thumbnail}')`;
                imgObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '200px' }); // Precarga 200px antes
    
    imgObserver.observe(miniaturaCuadrada);
}
```

#### 3. **Preload Selectivo (Próximos Proyectos)**
```javascript
// Agregar función para precargar thumbs cerca
function preloadNearbyThumbs(currentIndex, radius = 3) {
    const data = getCurrentData();
    for (let i = Math.max(0, currentIndex - radius); 
         i <= Math.min(data.length - 1, currentIndex + radius); i++) {
        const trabajo = data[i];
        if (trabajo.thumbnail && !trabajo.thumbnail.match(/\.(mp4|webm|ogg)$/i)) {
            const img = new Image();
            img.src = `assets/img/${trabajo.thumbnail}`;
        }
    }
}
```

#### 4. **Limitar Animaciones Simultáneas**
```javascript
// En Flip.from() - reducir stagger o usar batchSize
Flip.from(state, {
    duration: 1,
    ease: "power4.out",
    stagger: { amount: 0.5, from: "random" }, // Mejor que 0.02
    scale: true,
    simple: true,
});
```

### 📦 IMPORTANTE - Comprensión de Archivos

#### Reducir tamaño de videos:
```bash
# Para MP4 (mejor compresión):
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -acodec aac -ab 128k output.mp4

# Para WebM (aún más pequeño):
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -acodec libopus -ab 128k output.webm
```

#### Optimizar imágenes:
```bash
# JPG (con pérdida moderada):
jpegoptim -m85 image.jpg

# PNG (sin pérdida):
optipng -o2 image.png

# WebP (formato moderno):
cwebp image.png -q 80 -o image.webp
```

### 🎯 MEDIO - Optimizaciones Adicionales

#### 5. **Request Idle Callback para tareas no críticas**
```javascript
// Aplicar análisis de datos o setup complejo cuando el navegador esté inactivo
requestIdleCallback(() => {
    console.log('Tarea de bajo priority en tiempo idle');
    // analizar datos, procesar arrays, etc
});
```

#### 6. **Data URI para placeholders**
```javascript
// Generar color sólido ultra-ligero como placeholder
const colorValue = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${colorName}`).trim();

miniaturaCuadrada.style.backgroundImage = 
    `linear-gradient(135deg, ${colorValue}80, ${colorValue})`; // Placeholder suave
```

#### 7. **Virtualización para Many Items (>100 proyectos)**
```javascript
// Solo renderizar elementos en viewport + 5 items arriba/abajo
// Si tienes >100 proyectos, considerar:
// - Paginación
// - Infinite scroll con carga progresiva
// - Grid virtual (UpUp)
```

### 🔧 TÉCNICAMENTE - Implementación Completa

**Crear archivo: `assets/js/performance-utils.js`**

```javascript
// Sistema centralizado de lazy loading y caché
class MediaManager {
    constructor() {
        this.loadedImages = new Set();
        this.loadingVideos = new Set();
        this.intersectionObserver = this.createObserver();
    }
    
    createObserver() {
        return new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadMedia(entry.target);
                    }
                });
            },
            { rootMargin: '200px 0px' }
        );
    }
    
    loadMedia(element) {
        const src = element.dataset.src;
        if (!src) return;
        
        if (element.tagName === 'VIDEO') {
            this.loadVideo(element, src);
        } else if (element.tagName === 'IMG') {
            this.loadImage(element, src);
        }
        
        this.intersectionObserver.unobserve(element);
    }
    
    loadImage(img, src) {
        const tempImg = new Image();
        tempImg.onload = () => {
            img.style.backgroundImage = `url('${src}')`;
            this.loadedImages.add(src);
        };
        tempImg.src = src;
    }
    
    loadVideo(video, src) {
        video.src = src;
        video.play().catch(() => {
            // Video no se puede reproducir (probablemente móvil sin interacción)
        });
    }
    
    observe(element) {
        this.intersectionObserver.observe(element);
    }
}

// Usar globalmente
window.mediaManager = new MediaManager();
```

**Integrar en HTML:**
```html
<script src="assets/js/performance-utils.js"></script>
// Antes que script.js
```

## 📊 Comparativa de Impacto Esperado

| Optimización | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|
| Lazy loading videos | **40%** ↓ | Bajo | 🔴 ALTA |
| Lazy loading imágenes | **30%** ↓ | Bajo | 🔴 ALTA |
| Compresión archivos | **50%** ↓ | Medio | 🟠 MEDIA |
| Reducir animaciones | **20%** ↓ | Bajo | 🟠 MEDIA |
| Virtualización | **25%** ↓ | Alto | 🟡 BAJA |

## ✨ Recomendación Inmediata

1. **HOY**: Implementar lazy loading videos (5 min)
2. **HOY**: Implementar lazy loading imágenes (10 min)
3. **Esta semana**: Comprimir todos los assets (30 min)
4. **Opcional**: Virtualización si >150 proyectos

**Resultado esperado**: Carga inicial 70-80% más rápida, transiciones fluidas, 0 lag.

---

## 🔍 Verificar Performance

```javascript
// En consola del navegador:
// PerformanceObserver para medir
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`);
    }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });

// LCP (Largest Contentful Paint) - meta < 2.5s
// FID (First Input Delay) - meta < 100ms
// CLS (Cumulative Layout Shift) - meta < 0.1
```
