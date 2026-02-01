# Instrucciones para Añadir Nuevos Avatares

## Estructura del Sistema

El sistema actual soporta avatares intercambiables con animaciones master reutilizables. Hay un solo contenedor `.logo` que cambia su contenido SVG al hacer click.

---

## Pasos para Añadir un Nuevo Avatar

### 1. Crear el Template en HTML

En `index.html`, después de los templates existentes (`#avatar-svg-1`, `#avatar-svg-3`), añade:

```html
<template id="avatar-svg-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="XX" height="XX" viewBox="0 0 XX XX" fill="none">
        <!-- ELEMENTOS OBLIGATORIOS (deben tener estas clases): -->
        <g class="ojos1">
            <circle class="ojo1" cx="..." cy="..." r="..." stroke="black" stroke-width="3"/>
            <circle class="ojo2" cx="..." cy="..." r="..." stroke="black" stroke-width="3"/>
            <circle class="pupila1" cx="..." cy="..." r="..." fill="black"/>
            <circle class="pupila2" cx="..." cy="..." r="..." fill="black"/>
        </g>
        <path class="nariz" d="..." stroke="black" stroke-width="3"/>
        <path class="cigarro" d="..." stroke="black" stroke-width="3"/>
        <path class="humo" d="..." stroke="black" stroke-width="3"/>
        
        <!-- ELEMENTOS OPCIONALES: -->
        <path class="pelo" d="..." stroke="black" stroke-width="3"/>
        <g class="labios">
            <path class="labios" d="..." stroke="black" stroke-width="3"/>
        </g>
        <path class="cuello" d="..." stroke="black" stroke-width="3"/>
        
        <!-- Si necesitas morph (cara alternativa), agregar grupo .contento: -->
        <g class="contento">
            <circle id="ojo1-ref-4" cx="..." cy="..." r="..." stroke="black" stroke-width="3"/>
            <circle id="ojo2-ref-4" cx="..." cy="..." r="..." stroke="black" stroke-width="3"/>
            <circle id="pupila1-ref-4" cx="..." cy="..." r="..." fill="black"/>
            <circle id="pupila2-ref-4" cx="..." cy="..." r="..." fill="black"/>
            <path id="nariz4-ref" class="nariz4" d="..." stroke="black" stroke-width="3"/>
            <g class="cejas-4">
                <path class="ceja1" d="..." stroke="black" stroke-width="3"/>
                <path class="ceja2" d="..." stroke="black" stroke-width="3"/>
            </g>
        </g>
    </svg>
</template>
```

**Notas importantes:**
- Los IDs de referencia deben ser únicos: `#ojo1-ref-4`, `#nariz4-ref`, etc.
- Las clases pueden repetirse: `.ojo1`, `.ojo2`, `.pupila1`, `.pupila2`, `.nariz`
- El grupo `.ojos1` permite transformar todos los ojos juntos
- El cigarro y humo son opcionales (el sistema detecta si existen)

---

### 2. Actualizar JavaScript

En `svg-animations.js`:

#### A) Actualizar totalAvatars:
```javascript
const totalAvatars = 4; // Cambiar de 3 a 4 (o el número que corresponda)
```

#### B) Actualizar visibilidad inicial (línea ~9):
```javascript
gsap.set("#ojo1-ref, #ojo2-ref, #pupila1-ref, #pupila2-ref, #nariz2-ref, #nariz3-ref, #nariz4-ref, .nariz2, .nariz3, .nariz4, .cejas, .cejas-4", { visibility: "hidden" });
```

#### C) Añadir configuración en switchAvatar (después de línea ~283):
```javascript
// Ocultar elementos de referencia si es avatar-4
if (currentAvatar === 4) {
    gsap.set("#ojo1-ref-4, #ojo2-ref-4, #pupila1-ref-4, #pupila2-ref-4, #nariz4-ref, .nariz4, .cejas-4", { visibility: "hidden" });
}
```

#### D) Si necesitas morph para este avatar (opcional):

Crear funciones específicas como `morphToSecondFaceAvatar4()` siguiendo el patrón de `morphToSecondFace()` pero usando los IDs únicos del avatar 4.

---

### 3. Lógica de Saltos (Opcional)

Si quieres ocultar ciertos avatares del ciclo (como avatar-2), actualiza en `switchAvatar`:

```javascript
let nextAvatar = currentAvatar + 1;
if (nextAvatar === 2) nextAvatar = 3; // Saltar avatar-2
if (nextAvatar === 5) nextAvatar = 6; // Saltar avatar-5 (ejemplo)
if (nextAvatar > totalAvatars) nextAvatar = 1;
```

---

## Checklist Rápido

Cuando añadas avatar número **N**:

- [ ] Crear `<template id="avatar-svg-N">` en HTML
- [ ] Incluir clases obligatorias: `.ojo1`, `.ojo2`, `.pupila1`, `.pupila2`, `.nariz`
- [ ] Opcional: `.cigarro`, `.humo`, `.pelo`, `.labios`, `.cuello`
- [ ] Si tiene morph: IDs únicos `#ojo1-ref-N`, `#narizN-ref`, etc.
- [ ] Actualizar `totalAvatars = N` en JavaScript
- [ ] Añadir referencias a visibilidad inicial (línea ~9)
- [ ] Añadir bloque `if (currentAvatar === N)` en switchAvatar
- [ ] Probar haciendo click en el avatar varias veces

---

## Animaciones Automáticas

Estas animaciones se aplican automáticamente a todos los avatares:

✅ **Parpadeo (blink)**: Afecta a `.ojo1`, `.ojo2`, `.pupila1`, `.pupila2`
✅ **Respiración**: Afecta a `svg`, `.nariz`
✅ **Humo**: Solo si existe `.cigarro` y `.humo`

No necesitas configurar nada adicional para estas animaciones.

---

## Ejemplo Completo: Avatar 4 Simplificado

**HTML:**
```html
<template id="avatar-svg-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
        <g class="ojos1">
            <circle class="ojo1" cx="20" cy="15" r="6" stroke="black" stroke-width="3"/>
            <circle class="ojo2" cx="40" cy="15" r="6" stroke="black" stroke-width="3"/>
            <circle class="pupila1" cx="20" cy="15" r="1.5" fill="black"/>
            <circle class="pupila2" cx="40" cy="15" r="1.5" fill="black"/>
        </g>
        <path class="nariz" d="M30 10V35L40 33" stroke="black" stroke-width="3"/>
        <path class="cigarro" d="M45 40L60 42" stroke="black" stroke-width="3"/>
        <path class="humo" d="M5 5C10 10 15 15 20 20" stroke="black" stroke-width="3"/>
    </svg>
</template>
```

**JavaScript (svg-animations.js):**
```javascript
// Línea ~6
const totalAvatars = 4;

// Línea ~9
gsap.set("#ojo1-ref, #ojo2-ref, #pupila1-ref, #pupila2-ref, #nariz2-ref, #nariz3-ref, .nariz2, .nariz3, .cejas", { visibility: "hidden" });
```

¡Listo! El avatar 4 ya funciona con todas las animaciones.
