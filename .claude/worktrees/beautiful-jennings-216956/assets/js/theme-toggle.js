// TOGGLE DE TEMA OSCURO/CLARO

function initThemeToggle() {
    // Buscar el botón de la luna (segundo botón del header-right)
    const themeToggleBtn = document.querySelector('.header-right button:last-child');
    
    if (!themeToggleBtn) {
        console.warn('Botón de tema no encontrado');
        return;
    }
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Click en el botón de la luna
    themeToggleBtn.addEventListener('click', () => {
        toggleTheme();
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Aplicar nuevo tema
    if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Guardar preferencia
    localStorage.setItem('theme', newTheme);
    
    // Animación suave opcional
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}
