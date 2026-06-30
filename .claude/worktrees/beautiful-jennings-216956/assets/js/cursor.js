// CURSOR PERSONALIZADO

let customCursor;
let cursorX = 0;
let cursorY = 0;
let isShaking = false;
let lastMoveTime = 0;
let moveCount = 0;

function initCustomCursor() {
    // Crear el cursor SVG
    customCursor = document.createElement('div');
    customCursor.id = 'custom-cursor';
    customCursor.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="77" height="71" viewBox="0 0 77 71" fill="none">
            <circle id="cursor-eye1" cx="34.3244" cy="14.3243" r="11.9369" fill="white" stroke="black" stroke-width="4.77477"/>
            <circle id="cursor-eye2" cx="14.3244" cy="36.3243" r="11.9369" fill="white" stroke="black" stroke-width="4.77477"/>
            <circle cx="34.3244" cy="14.3243" r="2.38738" fill="black"/>
            <circle cx="14.3244" cy="36.3243" r="2.38738" fill="black"/>
            <path id="cursor-path" d="M18.3875 3.88733L34.3157 53.7205L54.8875 38.8873L74.3875 69.3873" stroke="black" stroke-width="4.77477"/>
        </svg>
    `;
    document.body.appendChild(customCursor);
    
    // Ocultar cursor por defecto
    //document.body.style.cursor = 'none';
    
    // Event listeners
    document.addEventListener('mousemove', handleCursorMove);
    document.addEventListener('mousedown', handleCursorClick);
    document.addEventListener('mouseup', handleCursorRelease);
    
    // Detectar links
    const links = document.querySelectorAll('a, button, [onclick]');
    links.forEach(link => {
        link.addEventListener('mouseenter', handleLinkEnter);
        link.addEventListener('mouseleave', handleLinkLeave);
    });
}

function handleCursorMove(e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
    
    // Posicionar cursor
    gsap.to(customCursor, {
        x: cursorX - 16,
        y: cursorY - 10,
        duration: 0.15,
        ease: "power2.out"
    });
    
    // Detectar agitación rápida
    const now = Date.now();
    if (now - lastMoveTime < 50) {
        moveCount++;
        if (moveCount > 10 && !isShaking) {
            handleCursorShake();
        }
    } else {
        moveCount = 0;
    }
    lastMoveTime = now;
    
    // TODO: Añade aquí animaciones de motion path al mover
    // Ejemplo:
    // gsap.to('#cursor-path', {
    //     morphSVG: "...",
    //     duration: 0.2
    // });
}

function handleCursorClick() {
    // TODO: Añade aquí animaciones al hacer clic
    // Ejemplo:
    // gsap.to(customCursor, {
    //     scale: 0.8,
    //     duration: 0.1,
    //     ease: "power2.out"
    // });
    
    // gsap.to(['#cursor-eye1', '#cursor-eye2'], {
    //     scaleY: 0.3,
    //     duration: 0.1
    // });
    
    console.log('CURSOR CLICK - Añade animaciones aquí');
}

function handleCursorRelease() {
    // TODO: Añade aquí animaciones al soltar clic
    // Ejemplo:
    // gsap.to(customCursor, {
    //     scale: 1,
    //     duration: 0.2,
    //     ease: "elastic.out(1, 0.5)"
    // });
    
    // gsap.to(['#cursor-eye1', '#cursor-eye2'], {
    //     scaleY: 1,
    //     duration: 0.2
    // });
    
    console.log('CURSOR RELEASE - Añade animaciones aquí');
}

function handleCursorShake() {
    isShaking = true;
    
    // TODO: Añade aquí animaciones al agitar
    // Ejemplo:
    // gsap.to(customCursor, {
    //     rotation: '+=360',
    //     duration: 0.5,
    //     ease: "power2.out"
    // });
    
    // gsap.to('#cursor-path', {
    //     stroke: '#FF0000',
    //     duration: 0.3,
    //     yoyo: true,
    //     repeat: 1
    // });
    
    console.log('CURSOR SHAKE - Añade animaciones aquí');
    
    setTimeout(() => {
        isShaking = false;
        moveCount = 0;
    }, 1000);
}

function handleLinkEnter() {
    // TODO: Añade aquí animaciones al detectar link
    // Ejemplo:
    // gsap.to(customCursor, {
    //     scale: 1.3,
    //     duration: 0.3,
    //     ease: "power2.out"
    // });
    
    // gsap.to(['#cursor-eye1', '#cursor-eye2'], {
    //     fill: '#FFD700',
    //     duration: 0.3
    // });
    
    console.log('LINK HOVER - Añade animaciones aquí');
}

function handleLinkLeave() {
    // TODO: Añade aquí animaciones al salir de link
    // Ejemplo:
    // gsap.to(customCursor, {
    //     scale: 1,
    //     duration: 0.3,
    //     ease: "power2.out"
    // });
    
    // gsap.to(['#cursor-eye1', '#cursor-eye2'], {
    //     fill: 'white',
    //     duration: 0.3
    // });
    
    console.log('LINK LEAVE - Añade animaciones aquí');
}
