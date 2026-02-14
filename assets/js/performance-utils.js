// ===== SISTEMA DE LAZY LOADING Y PERFORMANCE =====

class MediaManager {
    constructor() {
        this.loadedImages = new Set();
        this.loadingVideos = new Set();
        this.preloadedSrcs = new Set();
        this.shouldPreload = true;
        
        // Crear observer para lazy load
        this.intersectionObserver = this.createIntersectionObserver();
        
        // Enviar beacon cuando el usuario se va (guardar datos de performance)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.reportMetrics();
            }
        });
    }
    
    createIntersectionObserver() {
        return new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadMedia(entry.target);
                        // NO desuscribir para que pueda reproducirse al entrar/salir viewport
                    }
                });
            },
            {
                rootMargin: '200px 0px', // Precargar 200px antes de entrar al viewport
                threshold: 0.01
            }
        );
    }
    
    loadMedia(element) {
        const src = element.dataset.src;
        if (!src || element.dataset.loaded === 'true') return;
        
        element.dataset.loaded = 'true';
        
        if (element.tagName === 'VIDEO') {
            this.loadVideo(element, src);
        } else if (element.tagName === 'IMG') {
            this.loadImage(element, src);
        } else if (element.classList.contains('thumb-image')) {
            this.loadBackgroundImage(element, src);
        }
    }
    
    loadImage(img, src) {
        // Usar un blob temporal mientras carga
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = src;
            img.style.opacity = '1';
            this.loadedImages.add(src);
        };
        
        tempImg.onerror = () => {
            console.warn(`Error loading image: ${src}`);
            img.src = ''; // Fallback
        };
        
        // Transición suave
        img.style.opacity = '0.5';
        tempImg.src = src;
    }
    
    loadBackgroundImage(element, src) {
        const tempImg = new Image();
        
        tempImg.onload = () => {
            element.style.backgroundImage = `url('${src}')`;
            element.style.opacity = '1';
            this.loadedImages.add(src);
        };
        
        tempImg.onerror = () => {
            console.warn(`Error loading background: ${src}`);
        };
        
        element.style.opacity = '0.7';
        tempImg.src = src;
    }
    
    loadVideo(video, src) {
        if (this.loadingVideos.has(src)) return; // Evitar cargas duplicadas
        
        this.loadingVideos.add(src);
        
        video.src = src;
        video.load();
        
        // Intentar reproducción (en некоторых navegadores falla sin interacción)
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Reproducción iniciada
                })
                .catch(error => {
                    // Autoplay policy bloqueó. Está bien, esperamos a hover/click
                    console.log('[Performance] Video autoplay bloqueado por política del navegador');
                });
        }
    }
    
    // Precargar específicamente próximos items
    preloadNearby(allElements, currentIndex, radius = 3) {
        if (!this.shouldPreload) return;
        
        const start = Math.max(0, currentIndex - radius);
        const end = Math.min(allElements.length - 1, currentIndex + radius);
        
        for (let i = start; i <= end; i++) {
            const element = allElements[i];
            if (!element.dataset.loaded && !this.preloadedSrcs.has(element.dataset.src)) {
                this.preloadElement(element.dataset.src);
                this.preloadedSrcs.add(element.dataset.src);
            }
        }
    }
    
    preloadElement(src) {
        if (!src || this.preloadedSrcs.has(src)) return;
        
        if (src.match(/\.(mp4|webm|ogg|mov)$/i)) {
            // Precargar video: solo el header (evita carga completa)
            const video = document.createElement('video');
            video.src = src;
            video.preload = 'metadata'; // Solo metadata, no full video
        } else {
            // Precargar imagen
            const img = new Image();
            img.src = src;
        }
    }
    
    observe(element) {
        if (element) {
            this.intersectionObserver.observe(element);
        }
    }
    
    observeMany(elements) {
        elements.forEach(el => this.observe(el));
    }
    
    // Reportar métricas de performance
    reportMetrics() {
        if (!window.performance) return;
        
        const metrics = {
            imagesLoaded: this.loadedImages.size,
            videosLoaded: this.loadingVideos.size,
            timestamp: new Date().toISOString()
        };
        
        // Aquí podrías enviar a server o Analytics
        console.log('[Performance Metrics]', metrics);
    }
    
    // Pausar videos cuando salen de viewport
    pauseOffscreenVideos() {
        const videos = document.querySelectorAll('video');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.play();
                    } else {
                        entry.target.pause();
                    }
                });
            },
            { threshold: 0 }
        );
        
        videos.forEach(video => observer.observe(video));
    }
}

// Exportar instancia global
window.mediaManager = new MediaManager();

// Inicializar pausa de videos offscreen cuando está lista la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mediaManager.pauseOffscreenVideos();
    });
} else {
    window.mediaManager.pauseOffscreenVideos();
}
