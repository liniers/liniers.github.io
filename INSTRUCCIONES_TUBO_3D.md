# 🎯 INSTRUCCIONES DE USO TUBO 3D

## Descripción del sistema

El código ahora tiene **DOS VERSIONES** completamente funcionales del tubo 3D que puedes cambiar fácilmente:

1. **Scroll Trigger** (por defecto activado): La animación del tubo se vincula al scroll
2. **Auto Rotate**: Rotación automática continua sin depender del scroll

---

## ⚙️ CÓMO CAMBIAR ENTRE MODOS

### Opción 1: Por Switch Simple (RECOMENDADO)

En el archivo `assets/js/script.js`, busca esta sección al inicio (línea ~27):

```javascript
// ===== SWITCH PARA TUBO 3D =====
// Cambia este valor para elegir entre dos modos:
// true = Scroll Trigger (animación vinculada al scroll)
// false = Auto Rotate (rotación automática continua)
const USE_TUBE_SCROLL_TRIGGER = true;  // ← CAMBIA ESTO
```

**Para activar Scroll Trigger:**
```javascript
const USE_TUBE_SCROLL_TRIGGER = true;
```

**Para activar Auto Rotate:**
```javascript
const USE_TUBE_SCROLL_TRIGGER = false;
```

---

## 📝 FUNCIONES DISPONIBLES

Hay tres funciones principales:

### 1. `init3DTube()` ⭐ (PRINCIPAL)
- **Ubicación**: Línea ~870
- **Propósito**: Es el router automático
- **Qué hace**: Llama a `init3DTube_ScrollTrigger()` o `init3DTube_AutoRotate()` según el valor de `USE_TUBE_SCROLL_TRIGGER`
- **Cuándo usarla**: SIEMPRE - esta es la que debe llamarse en tu código

### 2. `init3DTube_ScrollTrigger()` 
- **Ubicación**: Línea ~731
- **Propósito**: Anima el tubo vinculado al scroll del documento
- **Características**:
  - La rotación sigue el movimiento del scroll
  - Se anima mientras scrolleas por el portfolio
  - Más dinámica e interactiva

### 3. `init3DTube_AutoRotate()`
- **Ubicación**: Línea ~800
- **Propósito**: Rotación automática continua
- **Características**:
  - Gira sin parar de forma automática
  - No depende del scroll
  - Más hipnotizante visualmente

---

## 🔄 CÓMO FUNCIONA LA LIMPIEZA

Ambas funciones se limpian automáticamente entre sí:

```javascript
// LIMPIEZA AUTOMÁTICA:
// ✓ Mata ScrollTriggers previos si existen
// ✓ Mata timelines de auto-rotate si existen
// ✓ Revierte SplitText
// ✓ Limpia tweens de GSAP
```

Esto significa que puedes cambiar entre modos sin problemas.

---

## 🎬 DÓNDE SE INICIALIZA

El tubo se inicializa automáticamente en:

1. **Al cargar la página** (línea ~880)
2. **Al hacer click en botón "Random"** (línea ~655)

En ambos casos, se ejecuta `init3DTube()` que **respeta automáticamente el switch**.

---

## ✅ REQUISITOS PARA QUE FUNCIONE

### Para Scroll Trigger:
- ✓ ScrollTrigger de GSAP cargado (ya está en index.html)
- ✓ Lenis funcionando (el smooth scroll)
- ✓ Elemento `#portfolio-items` debe estar visible en viewport

### Para Auto Rotate:
- ✓ Solo necesita GSAP
- ✓ Funciona en cualquier momento

---

## 🚀 CASOS DE USO

### Usar Scroll Trigger si:
- Quieres que el tubo responda al scroll
- Te importa la interacción del usuario
- Quieres efecto más narrativo

### Usar Auto Rotate si:
- Quieres un efecto hipnotizante
- Prefieres movimiento constante
- Quieres que funcione sin scrolling

---

## 🐛 TROUBLESHOOTING

### Problema: El tubo no se ve
**Solución**: Verifica que el `.container-scroll` tenga `display: block` y `opacity > 0`

### Problema: La animación sale en blanco/negro
**Solución**: Asegúrate de que el elemento `.container-scroll` no esté oculto en CSS

### Problema: Al cambiar modo, aparecen glitches
**Solución**: Recarga la página (F5) para asegurar limpieza total

### Problema: El scroll trigger no funciona
**Solución**: Verifica que el elemento `#portfolio-items` esté en el DOM

---

## 📊 RESUMEN DE VARIABLES GLOBALES

```javascript
let tubeSplit = null;                // Estado del SplitText
let tubeAutoRotateTimeline = null;   // Timeline de auto-rotate
let tube3dScrollTrigger = null;      // ScrollTrigger instance
const USE_TUBE_SCROLL_TRIGGER = true; // SWITCH PRINCIPAL
```

---

## ⚡ QUICK START

1. Abre `assets/js/script.js`
2. Ve a línea ~27
3. Cambia `true` por `false` o viceversa
4. Guarda (Cmd+S)
5. Recarga el navegador (Cmd+R)

**¡Listo!** El tubo 3D ya cambiará de modo automáticamente.
