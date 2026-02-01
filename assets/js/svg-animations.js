// ANIMACIONES SVG

// Variables globales
let isMorphed = false;
let currentAvatar = 1;
const totalAvatars = 4;

// Configurar visibilidad inicial - ocultar elementos de referencia para morphSVG
gsap.set("#ojo1-ref, #ojo2-ref, #pupila1-ref, #pupila2-ref, #nariz2-ref, #nariz3-ref, .nariz2, .nariz3, .cejas", { visibility: "hidden" });

// Parpadeo - usa clases con scope para funcionar en todos los avatares
let tlBlink; // Variable para poder reiniciar el timeline

function createBlinkTimeline() {
    // Detener timeline anterior si existe
    if (tlBlink) tlBlink.kill();
    
    tlBlink = gsap.timeline({
        repeat: -1, 
        repeatDelay: 3
    });

    tlBlink.to(".logo .ojo1, .logo .pupila1", {
        scaleY: 0,
        transformOrigin: "50% 50%",
        duration: 0.1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1
    }, 0);

    tlBlink.to(".logo .ojo2, .logo .pupila2", {
        scaleY: 0,
        transformOrigin: "50% 50%",
        duration: 0.1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1
    }, 0);
}

// Inicializar blinks
createBlinkTimeline();


// Respiración y Humo en ciclo continuo (aplicado dinámicamente al avatar visible)

const tlBreathCycle = gsap.timeline({
    repeat: -1,
    repeatDelay: 4
});

// Función para actualizar selectores de respiración según avatar activo
function updateBreathTargets() {
    const activeSelector = '.logo';
    
    // Limpiar timeline
    tlBreathCycle.clear();
    
    // Animación de breath (respira hacia adentro)
    tlBreathCycle.to(`${activeSelector} svg`, {
        y: -4,
        rotation: 5,
        transformOrigin: "center bottom",
        duration: 1,
        ease: "back.in(1.7)"
    }, 0);

    tlBreathCycle.to(`${activeSelector} .nariz`, {
        y: -2,
        delay: 0.1,
        duration: 1,
        ease: "back.in(1.7)"
    }, 0);

    // Solo animar cigarro y humo si existen en el avatar actual
    if (document.querySelector(`${activeSelector} .cigarro`)) {
        tlBreathCycle.to(`${activeSelector} .cigarro, ${activeSelector} .humo`, {
            y: -3,
            rotation: -15,
            scaleX: 0.9,
            transformOrigin: "right center",
            delay: 0.5,
            duration: .5,
            ease: "back.in(1.7)"
        }, 0);
    }

    // Respira hacia afuera (yoyo)
    tlBreathCycle.to(`${activeSelector} svg`, {
        y: 0,
        rotation: 0,
        transformOrigin: "center bottom",
        duration: 1,
        ease: "back.out(1.7)"
    }, 1);

    tlBreathCycle.to(`${activeSelector} .nariz`, {
        y: 0,
        duration: 1,
        ease: "back.out(1.7)"
    }, 1.1);

    // Solo animar cigarro y humo si existen
    if (document.querySelector(`${activeSelector} .cigarro`)) {
        tlBreathCycle.to(`${activeSelector} .cigarro, ${activeSelector} .humo`, {
            y: 0,
            rotation: 0,
            scaleX: 1,
            transformOrigin: "right center",
            duration: 0.5,
            ease: "back.out(1.7)"
        }, 1.1);

        // Humo animado después de exhalar (a partir del segundo 2)
        tlBreathCycle.fromTo(`${activeSelector} .humo`, 
            { drawSVG: "100% 100%" }, 
            { duration: 1, drawSVG: "100% 0%", ease: "power2.out" },
            1.2
        );

        tlBreathCycle.to(`${activeSelector} .humo`, 
            { duration: 1, drawSVG: "0% 0%", ease: "power2.out" },
            "-=0.75"
        );
    }
    
    // Reiniciar timeline
    tlBreathCycle.restart();
}

// Inicializar con avatar-1
updateBreathTargets();


// Morph de cara al abrir/cerrar proyectos (solo cuando está avatar-1)

// Función para morph a segunda cara (se llama al abrir proyecto)
function morphToSecondFace() {
    if (isMorphed || currentAvatar !== 1) return; // Solo funciona con avatar-1
    
    // Morph a segunda cara
    gsap.to(".logo svg", {
        right: 2,
        duration: 0.5,
        ease: "power2.out",
    });

    gsap.to(".logo .nariz", {
        morphSVG: "#nariz2-ref",
        duration: 0.5,
        ease: "power2.out"
    });
    
    // Mover todo el grupo de ojos una sola vez
    gsap.to(".logo .ojos1", {
        x: -12,
        y: 8,
        duration: 0.5,
        ease: "power2.out"
    });
    
    // Morph de forma individual
    gsap.to(".logo .ojo1", {
        morphSVG: "#ojo1-ref",
        duration: 0.5,
        ease: "power2.out"
    });
    gsap.to(".logo .ojo2", {
        morphSVG: "#ojo2-ref",
        duration: 0.5,
        ease: "power2.out"
    });
    gsap.to(".logo .pupila1", {
        morphSVG: "#pupila1-ref",
        duration: 0.5,
        ease: "power2.out"
    });
    gsap.to(".logo .pupila2", {
        morphSVG: "#pupila2-ref",
        duration: 0.5,
        ease: "power2.out"
    });
    
    gsap.fromTo(".logo .cejas", {
        visibility: "visible",
        opacity: 0,
        y: 4,
    }, { 
        delay: 0.25,
        visibility: "visible",
        opacity: 1, 
        y: 0,
        duration: .3,
        ease: "back.out(2.5)"
    });
    
    gsap.to(".logo .cigarro, .logo .humo", {
        opacity: 0,
        duration: 0.3
    });
    
    isMorphed = true;
}

// Función para volver a primera cara (se llama al cerrar proyecto)
function morphToFirstFace() {
    if (!isMorphed || currentAvatar !== 1) return; // Solo funciona con avatar-1
    
    // Volver a cara original
    gsap.to(".logo svg", {
        right: 8,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "right"
    });

    gsap.to(".logo .nariz", {
        morphSVG: ".logo .nariz",
        duration: 0.5,
        ease: "power2.out"
    });
    
    // Resetear posición del grupo de ojos
    gsap.to(".logo .ojos1", {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
    });
    
    // Morph de vuelta a formas originales
    gsap.to(".logo .ojo1", {
        morphSVG: ".logo .ojo1",
        duration: 0.5,
        ease: "power2.out"
    });
    gsap.to(".logo .ojo2", {
        morphSVG: ".logo .ojo2",
        duration: 0.5,
        ease: "power2.out"
    });
    gsap.to(".logo .pupila1", {
        morphSVG: ".logo .pupila1",
        duration: 0.5,
        ease: "power2.out"
    });
    gsap.to(".logo .pupila2", {
        morphSVG: ".logo .pupila2",
        duration: 0.5,
        ease: "power2.out"
    });
    
    gsap.to(".logo .cejas", {
        visibility: "hidden",
        duration: 0
    });
    
    gsap.to(".logo .cigarro, .logo .humo", {
        opacity: 1,
        duration: 0.3
    });
    
    isMorphed = false;
}


// Sistema de múltiples avatares

// Función para cambiar entre avatares
function switchAvatar() {
    // Determinar siguiente avatar
    let nextAvatar = currentAvatar + 1;
    if (nextAvatar > totalAvatars) nextAvatar = 1;
    
    // Obtener el contenedor .logo
    const logoContainer = document.querySelector('.logo');
    
    // Obtener el template del siguiente avatar
    const template = document.querySelector(`#avatar-svg-${nextAvatar}`);
    const svgContent = template.content.cloneNode(true);
    
    // Reemplazar el contenido del .logo
    logoContainer.innerHTML = '';
    logoContainer.appendChild(svgContent);
    
    // Actualizar avatar actual
    currentAvatar = nextAvatar;
    
    // Re-configurar visibilidad de elementos de referencia si es avatar-1
    if (currentAvatar === 1) {
        gsap.set("#ojo1-ref, #ojo2-ref, #pupila1-ref, #pupila2-ref, #nariz2-ref, .nariz2, .cejas", { visibility: "hidden" });
    }
    // Ocultar elementos de referencia si es avatar-3
    if (currentAvatar === 3) {
        gsap.set("#nariz3-ref, .nariz3", { visibility: "hidden" });
    }
    
    // Actualizar animaciones de respiración para el nuevo avatar
        // Reiniciar blinks con el nuevo avatar
        createBlinkTimeline();
    updateBreathTargets();
}


// Event listener para doble-click en .logo para cambiar avatar
document.addEventListener('DOMContentLoaded', () => {
    const logoContainers = document.querySelectorAll('.logo');
    logoContainers.forEach(logo => {
        logo.addEventListener('click', switchAvatar);
    });
});
