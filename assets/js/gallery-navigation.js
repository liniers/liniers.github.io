// NAVEGACIÓN DE GALERÍA EN QUICK-VIEW
// Este archivo añade funcionalidad de navegación entre proyectos relacionados

// Variables globales para la navegación
let currentProjectIndex = 0;
let relatedProjects = [];
let currentProject = null;

// Helper para construir URLs de assets (usa el helper global si existe)
const resolveAssetUrl = typeof buildAssetUrl === 'function'
    ? buildAssetUrl
    : (path) => {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        let cleaned = String(path).replace(/^\.?\/*/, '');
        if (cleaned.startsWith('assets/img/')) {
            cleaned = cleaned.replace(/^assets\/img\//, '');
        }
        if (cleaned.startsWith('img/')) {
            cleaned = cleaned.replace(/^img\//, '');
        }
        return `https://pub-b7331ec578274f5fa4797ea882ba092d.r2.dev/img/${encodeURI(cleaned)}`;
    };

// Función para obtener proyectos relacionados (mismo cliente y categoría)
function getRelatedProjects(trabajo) {
    if (!trabajo) return [];
    
    // Filtrar proyectos con el mismo cliente y categoría de la fuente actual
    const related = getCurrentData().filter(t => 
        //t.cliente === trabajo.cliente && 
        t.categoria === trabajo.categoria
    );
    
    console.log(`Proyectos relacionados encontrados: ${related.length} para ${trabajo.cliente} - ${trabajo.categoria}`);
    
    return related;
}

// Función para actualizar el contador de progreso
function updateProjectCounter(currentIndex, totalProjects, currentProject) {
    const counter = document.querySelector('.project-counter');
    if (counter && totalProjects > 0 && currentProject) {
        counter.textContent = `${currentProject.categoria}. ${currentIndex + 1}/${totalProjects}`;
    }
}

// Función para actualizar los botones de navegación
function updateNavigationButtons(currentIndex, totalProjects) {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentIndex === totalProjects - 1;
    }
}

// Función para navegar entre proyectos
function navigateToProject(direction) {
    if (relatedProjects.length === 0) return;
    
    // Calcular nuevo índice
    if (direction === 'next') {
        currentProjectIndex = Math.min(currentProjectIndex + 1, relatedProjects.length - 1);
    } else if (direction === 'prev') {
        currentProjectIndex = Math.max(currentProjectIndex - 1, 0);
    }
    
    // Obtener el nuevo proyecto
    const newProject = relatedProjects[currentProjectIndex];
    
    // Actualizar el contenido del quick-view
    updateQuickViewWithProject(newProject);
    
    // Actualizar contador y botones
    updateProjectCounter(currentProjectIndex, relatedProjects.length, newProject);
    updateNavigationButtons(currentProjectIndex, relatedProjects.length);
}

// Función para actualizar el quick-view con un nuevo proyecto
function updateQuickViewWithProject(trabajo) {
    const expandedThumb = document.querySelector('.thumb-expanded');
    if (!expandedThumb) return;
    
    // Marcar el thumb del nuevo proyecto como visitado
    const newThumb = document.querySelector(`[data-work-id="${trabajo.id}"]`);
    if (newThumb && window.visitedThumbs && !window.visitedThumbs.includes(newThumb)) {
        window.visitedThumbs.push(newThumb);
        // Aplicar borderRadius al thumb visitado
        gsap.to(newThumb, {
            borderRadius: '4rem',
            duration: 0.4,
            ease: 'power2.out'
        });
    }
    
    // En el nuevo sistema, el video/imagen está directamente en expandedThumb
    const existingMedia = expandedThumb.querySelector('video, img');
    const workTitle = expandedThumb.querySelector('.work-title');
    const workDetails = expandedThumb.querySelector('.work-details');
    const workInfoEl = expandedThumb.querySelector('.work-info.expanded-info');
    
    // Fade out del contenido actual
    const videoControls = expandedThumb.querySelector('.video-controls');
    const navControls = expandedThumb.querySelector('.nav-controls');
    
    gsap.to([existingMedia, workInfoEl, videoControls, navControls].filter(el => el), {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
            // Limpiar controles de video existentes
            if (videoControls) videoControls.remove();
            if (navControls) navControls.remove();
            
            // Detectar si es vídeo o imagen
            const isVideo = /\.(mp4|webm|ogg)$/i.test(trabajo.thumbnail);
            
            if (isVideo) {
                // Actualizar video existente o crear uno nuevo
                if (existingMedia && existingMedia.tagName === 'VIDEO') {
                    existingMedia.src = resolveAssetUrl(trabajo.thumbnail);
                    existingMedia.load();
                } else {
                    if (existingMedia) existingMedia.remove();
                    const video = document.createElement('video');
                    video.src = resolveAssetUrl(trabajo.thumbnail);
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.objectFit = 'cover';
                    video.style.position = 'absolute';
                    video.style.top = '0';
                    video.style.left = '0';
                    expandedThumb.insertBefore(video, expandedThumb.firstChild);
                }
                
                // Crear nuevos controles de video
                const newVideoControls = document.createElement('div');
                newVideoControls.className = 'video-controls';
                newVideoControls.style.opacity = '0';
                newVideoControls.style.position = 'absolute';
                newVideoControls.style.bottom = '1rem';
                newVideoControls.style.left = '50%';
                newVideoControls.style.transform = 'translateX(-50%)';
                newVideoControls.style.display = 'flex';
                newVideoControls.style.gap = '0.5rem';
                newVideoControls.style.zIndex = '10';
                
                const currentVideo = expandedThumb.querySelector('video');
                
                // Botón Play/Pause
                const playPauseBtn = document.createElement('button');
                playPauseBtn.className = 'video-control-btn play-pause-btn';
                playPauseBtn.setAttribute('data-state', 'playing');
                playPauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
                playPauseBtn.style.cssText = `
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(10px);
                    border: none;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                `;
                
                playPauseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentVideo.paused) {
                        currentVideo.play();
                        playPauseBtn.setAttribute('data-state', 'playing');
                        playPauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
                    } else {
                        currentVideo.pause();
                        playPauseBtn.setAttribute('data-state', 'paused');
                        playPauseBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
                    }
                });
                
                // Botón Mute/Unmute
                const muteBtn = document.createElement('button');
                muteBtn.className = 'video-control-btn mute-btn';
                muteBtn.setAttribute('data-state', 'muted');
                muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
                muteBtn.style.cssText = playPauseBtn.style.cssText;
                
                muteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentVideo.muted = !currentVideo.muted;
                    if (currentVideo.muted) {
                        muteBtn.setAttribute('data-state', 'muted');
                        muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
                    } else {
                        muteBtn.setAttribute('data-state', 'unmuted');
                        muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
                    }
                });
                
                newVideoControls.appendChild(playPauseBtn);
                newVideoControls.appendChild(muteBtn);
                expandedThumb.appendChild(newVideoControls);
                
                gsap.to(newVideoControls, { opacity: 1, duration: 0.3, delay: 0.3 });
            } else {
                // Es una imagen
                if (existingMedia && existingMedia.tagName === 'IMG') {
                    existingMedia.src = resolveAssetUrl(trabajo.thumbnail);
                } else {
                    if (existingMedia) existingMedia.remove();
                    const img = document.createElement('img');
                    img.src = resolveAssetUrl(trabajo.thumbnail);
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.position = 'absolute';
                    img.style.top = '0';
                    img.style.left = '0';
                    expandedThumb.insertBefore(img, expandedThumb.firstChild);
                }
            }
            
            // Actualizar información del trabajo
            if (workTitle) workTitle.textContent = trabajo.titulo;
            
            // Función para actualizar work-details con descripción (soporte para .md)
            const updateWorkDetails = (targetEl, descripcion) => {
                if (!targetEl) return;
                
                if (descripcion && typeof marked !== 'undefined') {
                    if (descripcion.endsWith('.md')) {
                        fetch(resolveAssetUrl(descripcion))
                            .then(res => res.text())
                            .then(md => {
                                targetEl.innerHTML = marked.parse(md);
                            })
                            .catch(() => {
                                targetEl.textContent = 'Descripción no disponible';
                            });
                    } else {
                        targetEl.innerHTML = marked.parse(descripcion);
                    }
                } else {
                    targetEl.textContent = descripcion || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
                }
            };
            
            if (workDetails) {
                updateWorkDetails(workDetails, trabajo.descripcion);
            } else if (workInfoEl) {
                const existingDetails = workInfoEl.querySelector('.work-details');
                if (existingDetails) {
                    updateWorkDetails(existingDetails, trabajo.descripcion);
                } else {
                    const newDetails = document.createElement('p');
                    newDetails.className = 'work-details';
                    workInfoEl.appendChild(newDetails);
                    updateWorkDetails(newDetails, trabajo.descripcion);
                }
            }
            
            // Actualizar categoría
            const workCategory = expandedThumb.querySelector('.work-category');
            if (workCategory) workCategory.textContent = trabajo.categoria;
            
            // Actualizar proyecto actual
            currentProject = trabajo;
            
            // Recrear los controles de navegación
            createNavigationControls();
            
            // Fade in del nuevo contenido
            const newMedia = expandedThumb.querySelector('video, img');
            gsap.to([newMedia, workInfoEl].filter(el => el), {
                opacity: 1,
                duration: 0.3
            });
        }
    });
}

// Función para crear los controles de navegación
function createNavigationControls() {
    const expandedThumb = document.querySelector('.thumb-expanded');
    if (!expandedThumb) {
        console.warn('❌ No se encontró .thumb-expanded');
        return;
    }
    
    console.log('✅ Creando controles de navegación...');
    
    // Eliminar controles existentes si los hay
    const existingNav = expandedThumb.querySelector('.nav-controls');
    if (existingNav) {
        existingNav.remove();
        console.log('🔄 Controles existentes eliminados');
    }
    
    // Crear nuevo contenedor de navegación
    const navControls = document.createElement('div');
    navControls.className = 'nav-controls';
    navControls.style.opacity = '0';
    navControls.style.position = 'absolute';
    navControls.style.bottom = '1rem';
    navControls.style.left = '1rem';
    navControls.style.display = 'flex';
    navControls.style.alignItems = 'center';
    navControls.style.gap = '0.5rem';
    navControls.style.zIndex = '10';
    
    const buttonStyle = `
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(10px);
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    `;
    
    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-control-btn prev-btn';
    prevBtn.innerHTML = `<span class="material-symbols-outlined">chevron_left</span>`;
    prevBtn.style.cssText = buttonStyle;
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToProject('prev');
    });
    
    // Contador de progreso
    const counter = document.createElement('div');
    counter.className = 'project-counter';
    counter.textContent = '1/1';
    counter.style.cssText = `
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        color: white;
        font-size: 14px;
        padding: 0 1.5rem;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-control-btn next-btn';
    nextBtn.innerHTML = `<span class="material-symbols-outlined">chevron_right</span>`;
    nextBtn.style.cssText = buttonStyle;
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToProject('next');
    });
    
    navControls.appendChild(prevBtn);
    navControls.appendChild(counter);
    navControls.appendChild(nextBtn);
    
    expandedThumb.appendChild(navControls);
    
    console.log('✅ Controles de navegación creados y añadidos al DOM');
    
    // Animar aparición
    gsap.to(navControls, {
        opacity: 1,
        duration: 0.3,
        delay: 0.2
    });
    
    // Actualizar estado de los botones
    const currentProject = relatedProjects[currentProjectIndex];
    updateProjectCounter(currentProjectIndex, relatedProjects.length, currentProject);
    updateNavigationButtons(currentProjectIndex, relatedProjects.length);
}

// Función para inicializar la navegación cuando se abre un proyecto
function initGalleryNavigation(trabajo) {
    // Obtener proyectos relacionados
    relatedProjects = getRelatedProjects(trabajo);
    currentProject = trabajo;
    
    // Encontrar el índice del proyecto actual en la lista de relacionados
    currentProjectIndex = relatedProjects.findIndex(t => t.id === trabajo.id);
    if (currentProjectIndex === -1) {
        currentProjectIndex = 0;
    }
    
    // Esperar a que el DOM esté listo antes de crear los controles
    // Usar setTimeout para asegurar que el mediaContainer ya tiene contenido
    setTimeout(() => {
        createNavigationControls();
    }, 500);
    
    console.log(`Navegación inicializada: proyecto ${currentProjectIndex + 1} de ${relatedProjects.length}`);
}
