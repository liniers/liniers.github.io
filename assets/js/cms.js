const DATA_URL = 'assets/json/data.json';
const DRAFT_KEY = 'portfolioCmsDraft';
const DATA_LOCAL_KEY = 'portfolioCmsData';
const THEME_KEY = 'portfolioCmsTheme';

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

const state = {
    items: [],
    selectedId: null,
    loaded: false,
    dragId: null,
    history: [],
    historyIndex: -1,
    lastDraftSave: null,
    lastSavedItems: [] // Para comparar cambios sin guardar
};

const elements = {
    itemsList: document.getElementById('itemsList'),
    form: document.getElementById('cmsForm'),
    formTitle: document.getElementById('formTitle'),
    currentId: document.getElementById('currentId'),
    searchInput: document.getElementById('searchInput'),
    filterTipo: document.getElementById('filterTipo'),
    filterOcultos: document.getElementById('filterOcultos'),
    addImageFieldBtn: document.getElementById('addImageFieldBtn'),
    browseImagesBtn: document.getElementById('browseImagesBtn'),
    browseThumbnailBtn: document.getElementById('browseThumbnailBtn'),
    clearImagesBtn: document.getElementById('clearImagesBtn'),
    imagesList: document.getElementById('imagesList'),
    thumbnailRow: document.getElementById('thumbnailRow'),
    thumbnailPreview: document.getElementById('thumbnailPreview'),
    imageFileInput: document.getElementById('imageFileInput'),
    thumbnailFileInput: document.getElementById('thumbnailFileInput'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    toast: document.getElementById('toast'),
    commentCount: document.getElementById('commentCount'),
    jsonOutput: document.getElementById('jsonOutput'),
    newItemBtn: document.getElementById('newItemBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
    saveDraftBtn: document.getElementById('saveDraftBtn'),
    loadDraftBtn: document.getElementById('loadDraftBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    saveLocalBtn: document.getElementById('saveLocalBtn'),
    loadLocalBtn: document.getElementById('loadLocalBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    copyJsonBtn: document.getElementById('copyJsonBtn')
};

const fields = {
    titulo: document.getElementById('titulo'),
    proyecto: document.getElementById('proyecto'),
    categoria: document.getElementById('categoria'),
    categoriaOther: document.getElementById('categoriaOther'),
    fecha: document.getElementById('fecha'),
    tipo: document.getElementById('tipo'),
    thumbnail: document.getElementById('thumbnail'),
    tag: document.getElementById('tag'),
    descripcion: document.getElementById('descripcion'),
    comentario: document.getElementById('comentario'),
    oculto: document.getElementById('oculto')
};

const categoriaOtherLabel = document.getElementById('categoriaOtherLabel');

let toastTimer = null;
let autoSaveTimer = null;
let lastAutoSavedData = null;

function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
}

function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
        elements.themeToggleBtn.textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        elements.themeToggleBtn.textContent = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    
    if (isDark) {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem(THEME_KEY, 'light');
        elements.themeToggleBtn.textContent = '🌙';
    } else {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem(THEME_KEY, 'dark');
        elements.themeToggleBtn.textContent = '☀️';
    }
}

function saveHistory() {
    // Guardar estado actual en historial
    const snapshot = {
        items: JSON.parse(JSON.stringify(state.items)),
        selectedId: state.selectedId
    };
    
    // Eliminar estados futuros si estamos en medio del historial
    state.history = state.history.slice(0, state.historyIndex + 1);
    
    state.history.push(snapshot);
    state.historyIndex++;
    
    // Limitar historial a 50 estados
    if (state.history.length > 50) {
        state.history.shift();
        state.historyIndex--;
    }
}

function undo() {
    if (state.historyIndex <= 0) {
        showToast('No hay más cambios para deshacer.');
        return;
    }
    
    state.historyIndex--;
    const snapshot = state.history[state.historyIndex];
    state.items = JSON.parse(JSON.stringify(snapshot.items));
    state.selectedId = snapshot.selectedId;
    
    if (state.selectedId) {
        selectItem(state.selectedId, true);
    } else {
        setFormEmpty(true);
    }
    updateJsonOutput();
    showToast('Cambio deshecho.');
}

function redo() {
    if (state.historyIndex >= state.history.length - 1) {
        showToast('No hay más cambios para rehacer.');
        return;
    }
    
    state.historyIndex++;
    const snapshot = state.history[state.historyIndex];
    state.items = JSON.parse(JSON.stringify(snapshot.items));
    state.selectedId = snapshot.selectedId;
    
    if (state.selectedId) {
        selectItem(state.selectedId, true);
    } else {
        setFormEmpty(true);
    }
    updateJsonOutput();
    showToast('Cambio rehecho.');
}

function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
}

function normalizeItem(raw) {
    // Convertir imágenes de string a objeto { path, random } si es necesario
    let imagenes = [];
    if (Array.isArray(raw.imagenes)) {
        imagenes = raw.imagenes.map((img) => {
            if (typeof img === 'string') {
                return { path: img, random: false };
            }
            return img;
        });
    }

    return {
        id: raw.id ?? null,
        titulo: raw.titulo ?? '',
        proyecto: raw.proyecto ?? raw.cliente ?? '',
        categoria: raw.categoria ?? '',
        thumbnail: raw.thumbnail ?? '',
        imagenes: imagenes,
        fecha: raw.fecha ?? '',
        tag: raw.tag ?? '',
        descripcion: raw.descripcion ?? '',
        comentario: raw.comentario ?? '',
        tipo: raw.tipo ?? 'proyecto',
        oculto: Boolean(raw.oculto)
    };
}

function getNextId() {
    const maxId = state.items.reduce((max, item) => Math.max(max, item.id || 0), 0);
    return maxId + 1;
}

async function loadData() {
    try {
        // Intentar cargar del localStorage primero
        const stored = localStorage.getItem(DATA_LOCAL_KEY);
        if (stored) {
            state.items = JSON.parse(stored);
            state.items = state.items.map(normalizeItem);
            state.loaded = true;
            // Guardar snapshot inicial
            state.lastSavedItems = JSON.parse(JSON.stringify(state.items));
            renderList();
            updateJsonOutput();
            showToast('✅ Datos cargados desde localStorage.');
            return;
        }
        
        // Si no hay en localStorage, cargar del JSON
        const response = await fetch(`${DATA_URL}?t=${Date.now()}`);
        const data = await response.json();
        state.items = data.map(normalizeItem);
        state.loaded = true;
        // Guardar snapshot inicial
        state.lastSavedItems = JSON.parse(JSON.stringify(state.items));
        renderList();
        updateJsonOutput();
        showToast('✅ JSON recargado desde archivo.');
    } catch (error) {
        console.error(error);
        showToast('❌ Error al cargar datos.');
    }
}

function renderList() {
    const search = elements.searchInput.value.trim().toLowerCase();
    const filterTipo = elements.filterTipo.value;
    const showOcultos = elements.filterOcultos.checked;

    const filtered = state.items.filter((item) => {
        const matchesSearch = [item.titulo, item.proyecto, item.categoria]
            .join(' ')
            .toLowerCase()
            .includes(search);
        const matchesTipo = !filterTipo || item.tipo === filterTipo;
        const matchesOculto = showOcultos ? true : !item.oculto;
        return matchesSearch && matchesTipo && matchesOculto;
    });

    const allowReorder = !search && !filterTipo && !showOcultos;

    elements.itemsList.innerHTML = '';
    filtered
        .sort((a, b) => (a.id || 0) - (b.id || 0))
        .forEach((item) => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.className = item.id === state.selectedId ? 'active' : '';
            li.draggable = allowReorder;

            if (!allowReorder) {
                li.classList.add('drag-disabled');
            }

            const thumbnailPath = item.thumbnail;
            let thumbnailEl = null;

            if (thumbnailPath) {
                if (thumbnailPath.endsWith('.mp4') || thumbnailPath.endsWith('.webm') || thumbnailPath.endsWith('.mov')) {
                    // Video thumbnail: mostrar primer fotograma
                    thumbnailEl = document.createElement('video');
                    thumbnailEl.className = 'item-thumbnail';
                    thumbnailEl.src = buildAssetUrl(thumbnailPath);
                    thumbnailEl.preload = 'metadata';
                } else {
                    // Image thumbnail
                    thumbnailEl = document.createElement('img');
                    thumbnailEl.className = 'item-thumbnail';
                    thumbnailEl.src = buildAssetUrl(thumbnailPath);
                    thumbnailEl.alt = item.titulo || 'Thumbnail';
                    thumbnailEl.onerror = () => {
                        thumbnailEl.style.background = '#ddd';
                    };
                }
            }

            const textContent = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'item-title';
            title.textContent = item.titulo || '(Sin título)';

            const meta = document.createElement('div');
            meta.className = 'item-meta';
            meta.textContent = `${item.proyecto || '—'} · ${item.categoria || '—'}${item.oculto ? ' · oculto' : ''}`;

            textContent.appendChild(title);
            textContent.appendChild(meta);

            if (thumbnailEl) {
                li.appendChild(thumbnailEl);
            }
            li.appendChild(textContent);
            li.addEventListener('click', () => selectItem(item.id));

            li.addEventListener('dragstart', (event) => {
                if (!allowReorder) return;
                state.dragId = item.id;
                event.dataTransfer.effectAllowed = 'move';
                li.classList.add('dragging');
            });

            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                li.classList.remove('drag-over');
                state.dragId = null;
            });

            li.addEventListener('dragover', (event) => {
                if (!allowReorder || state.dragId === null) return;
                event.preventDefault();
                li.classList.add('drag-over');
            });

            li.addEventListener('dragleave', () => {
                li.classList.remove('drag-over');
            });

            li.addEventListener('drop', (event) => {
                if (!allowReorder || state.dragId === null) return;
                event.preventDefault();
                li.classList.remove('drag-over');
                reorderItems(state.dragId, item.id);
            });

            elements.itemsList.appendChild(li);
        });
}

function reorderItems(dragId, targetId) {
    if (dragId === targetId) return;
    const ordered = state.items.slice().sort((a, b) => (a.id || 0) - (b.id || 0));
    const dragIndex = ordered.findIndex((item) => item.id === dragId);
    const targetIndex = ordered.findIndex((item) => item.id === targetId);
    if (dragIndex < 0 || targetIndex < 0) return;

    const [dragItem] = ordered.splice(dragIndex, 1);
    ordered.splice(targetIndex, 0, dragItem);

    ordered.forEach((item, index) => {
        item.id = index + 1;
    });

    state.items = ordered;
    state.selectedId = dragItem.id;
    saveHistory();
    updateJsonOutput();
    selectItem(dragItem.id, true); // Skip unsaved check durante reordenamiento
    showToast('Orden actualizado.');
}

function selectItem(id, skipUnsavedCheck = false) {
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;

    // Verificar cambios sin guardar
    if (!skipUnsavedCheck && hasUnsavedChanges()) {
        const confirmed = confirm('Tienes cambios sin guardar. ¿Deseas continuar sin guardar?');
        if (!confirmed) return;
    }

    state.selectedId = id;
    elements.formTitle.textContent = 'Editar trabajo';
    elements.currentId.textContent = `ID: ${id}`;

    fields.titulo.value = item.titulo;
    fields.proyecto.value = item.proyecto;
    
    // Manejar categoría personalizada
    const predefinedCategories = ['Motion Graphics', 'Design System', 'Interaction Design', 'Art Direction', 'Graphic Design', 'Personal'];
    if (predefinedCategories.includes(item.categoria)) {
        fields.categoria.value = item.categoria;
        fields.categoriaOther.value = '';
        categoriaOtherLabel.style.display = 'none';
    } else {
        fields.categoria.value = '__other__';
        fields.categoriaOther.value = item.categoria;
        categoriaOtherLabel.style.display = 'block';
    }
    
    fields.fecha.value = item.fecha;
    fields.tipo.checked = item.tipo === 'random';
    fields.thumbnail.value = item.thumbnail;
    fields.tag.value = item.tag;
    fields.descripcion.value = item.descripcion;
    fields.comentario.value = item.comentario;
    fields.oculto.checked = Boolean(item.oculto);

    renderImages(item.imagenes);
    updateCommentCount();
    updateThumbnailPreview();
    renderList();
}

function setFormEmpty(skipUnsavedCheck = false) {
    // Verificar cambios sin guardar
    if (!skipUnsavedCheck && hasUnsavedChanges()) {
        const confirmed = confirm('Tienes cambios sin guardar. ¿Deseas continuar sin guardar?');
        if (!confirmed) return;
    }

    state.selectedId = null;
    elements.formTitle.textContent = 'Nuevo trabajo';
    elements.currentId.textContent = 'ID: —';

    fields.titulo.value = '';
    fields.proyecto.value = '';
    fields.categoria.value = '';
    fields.categoriaOther.value = '';
    categoriaOtherLabel.style.display = 'none';
    fields.fecha.value = '';
    fields.tipo.checked = false;
    fields.thumbnail.value = '';
    fields.tag.value = '';
    fields.descripcion.value = '';
    fields.comentario.value = '';
    fields.oculto.checked = false;

    renderImages([]);
    updateCommentCount();
    updateThumbnailPreview();
    renderList();
}

function createImageRow(imageObj = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-row';

    // Extraer valores
    let path = '';
    let isRandom = false;
    if (typeof imageObj === 'string') {
        path = imageObj;
    } else if (typeof imageObj === 'object' && imageObj !== null) {
        path = imageObj.path || '';
        isRandom = imageObj.random || false;
    }

    // Crear contenedor para miniatura + input
    const inputContainer = document.createElement('div');
    inputContainer.className = 'image-input-container';

    // Miniatura
    const thumbnail = document.createElement('div');
    thumbnail.className = 'image-row-thumbnail';
    
    const updateThumbnail = (imagePath) => {
        thumbnail.innerHTML = '';
        if (!imagePath) return;
        
        const fullPath = buildAssetUrl(imagePath);
        const isVideo = /\.(mp4|webm|mov)$/i.test(imagePath);
        
        if (isVideo) {
            const video = document.createElement('video');
            video.src = fullPath;
            video.preload = 'metadata';
            video.onerror = () => {
                thumbnail.innerHTML = '<span style="font-size: 0.7rem; color: var(--muted);">❌</span>';
            };
            thumbnail.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = fullPath;
            img.alt = 'Preview';
            img.onerror = () => {
                thumbnail.innerHTML = '<span style="font-size: 0.7rem; color: var(--muted);">❌</span>';
            };
            thumbnail.appendChild(img);
        }
    };

    if (path) updateThumbnail(path);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'work/.../imagen.ext';
    input.value = path;
    
    // Actualizar miniatura al cambiar el input
    input.addEventListener('input', () => {
        updateThumbnail(input.value.trim());
    });

    inputContainer.appendChild(thumbnail);
    inputContainer.appendChild(input);

    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'checkbox';
    checkboxLabel.style.marginTop = '0';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isRandom;
    const checkboxText = document.createElement('span');
    checkboxText.textContent = 'Random';
    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(checkboxText);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-ghost';
    removeBtn.textContent = 'Quitar';
    removeBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar esta imagen?')) {
            saveHistory();
            wrapper.remove();
        }
    });

    wrapper.appendChild(inputContainer);
    wrapper.appendChild(checkboxLabel);
    wrapper.appendChild(removeBtn);
    return wrapper;
}

function renderImages(images = []) {
    elements.imagesList.innerHTML = '';
    if (!images.length) {
        elements.imagesList.appendChild(createImageRow(''));
        return;
    }
    images.forEach((img) => {
        elements.imagesList.appendChild(createImageRow(img));
    });
}

function addImagePaths(paths = []) {
    if (!paths.length) return;
    const inputs = elements.imagesList.querySelectorAll('input');
    const hasSingleEmpty = inputs.length === 1 && !inputs[0].value.trim();
    if (hasSingleEmpty) {
        elements.imagesList.innerHTML = '';
    }
    paths.forEach((path) => {
        elements.imagesList.appendChild(createImageRow(path));
    });
}

function collectImages() {
    const rows = elements.imagesList.querySelectorAll('.image-row');
    const images = [];
    rows.forEach((row) => {
        const input = row.querySelector('input[type="text"]');
        const checkbox = row.querySelector('input[type="checkbox"]');
        const path = input?.value.trim() || '';
        if (path) {
            images.push({
                path,
                random: checkbox?.checked || false
            });
        }
    });
    return images;
}

function updateCommentCount() {
    const length = fields.comentario.value.length;
    elements.commentCount.textContent = `${length}/250`;
}

function updateThumbnailPreview() {
    const thumbnailPath = fields.thumbnail.value.trim();
    elements.thumbnailPreview.innerHTML = '';

    if (!thumbnailPath) return;

    const fullPath = buildAssetUrl(thumbnailPath);
    const isVideo = /\.(mp4|webm|mov)$/i.test(thumbnailPath);

    if (isVideo) {
        const video = document.createElement('video');
        video.src = fullPath;
        video.preload = 'metadata';
        elements.thumbnailPreview.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = fullPath;
        img.alt = 'Thumbnail preview';
        img.onerror = () => {
            elements.thumbnailPreview.innerHTML = '<span style="color: var(--muted); font-size: 0.9rem;">No se cargó</span>';
        };
        elements.thumbnailPreview.appendChild(img);
    }
}

function getFormData() {
    const categoriaValue = fields.categoria.value === '__other__' 
        ? fields.categoriaOther.value.trim() 
        : fields.categoria.value.trim();
    
    return {
        titulo: fields.titulo.value.trim(),
        proyecto: fields.proyecto.value.trim(),
        categoria: categoriaValue,
        fecha: fields.fecha.value.trim(),
        tipo: fields.tipo.checked ? 'random' : 'proyecto',
        thumbnail: fields.thumbnail.value.trim(),
        tag: fields.tag.value.trim(),
        descripcion: fields.descripcion.value.trim(),
        comentario: fields.comentario.value.trim(),
        oculto: fields.oculto.checked,
        imagenes: collectImages()
    };
}

function applyFormToState() {
    const data = getFormData();

    if (!data.titulo || !data.proyecto || !data.categoria) {
        showToast('Completa título, proyecto y categoría.');
        return null;
    }

    let updatedItem;
    if (state.selectedId) {
        const existingIndex = state.items.findIndex((item) => item.id === state.selectedId);
        if (existingIndex >= 0) {
            updatedItem = {
                ...state.items[existingIndex],
                ...data,
                id: state.selectedId
            };
            state.items[existingIndex] = updatedItem;
        }
    } else {
        updatedItem = {
            id: getNextId(),
            ...data
        };
        state.items.push(updatedItem);
        state.selectedId = updatedItem.id;
    }

    saveHistory();
    renderList();
    updateJsonOutput();
    
    // Guardar en localStorage automáticamente
    localStorage.setItem(DATA_LOCAL_KEY, JSON.stringify(state.items));
    
    // También guardar en localStorage del borrador
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    state.lastDraftSave = JSON.stringify(data);
    
    // Actualizar snapshot guardado para detectar cambios
    state.lastSavedItems = JSON.parse(JSON.stringify(state.items));
    
    // Actualizar snapshot guardado para detectar cambios
    state.lastSavedItems = JSON.parse(JSON.stringify(state.items));
    
    if (updatedItem) {
        selectItem(updatedItem.id, true); // Skip unsaved check ya que acabamos de guardar
        // Solo mostrar toast si NO es auto-guardado
        if (autoSaveTimer === null) {
            showToast('✅ Cambios guardados localmente.');
        }
    }
    return updatedItem;
}

function updateJsonOutput() {
    elements.jsonOutput.value = JSON.stringify(state.items, null, 4);
}

function downloadJson() {
    const dataStr = JSON.stringify(state.items, null, 4);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('data.json descargado.');
}

function saveJsonLocally() {
    try {
        localStorage.setItem(DATA_LOCAL_KEY, JSON.stringify(state.items));
        showToast('✅ Datos guardados localmente.');
    } catch (e) {
        showToast('❌ Error guardando: ' + e.message);
    }
}

function loadJsonLocally() {
    try {
        const stored = localStorage.getItem(DATA_LOCAL_KEY);
        if (!stored) {
            showToast('No hay datos guardados localmente.');
            return;
        }
        state.items = JSON.parse(stored);
        state.selectedId = null;
        setFormEmpty(true);
        renderList();
        updateJsonOutput();
        showToast('✅ Datos cargados desde localStorage.');
    } catch (e) {
        showToast('❌ Error cargando: ' + e.message);
    }
}

function hasUnsavedChanges() {
    const currentDataStr = JSON.stringify(state.items);
    const lastSavedStr = JSON.stringify(state.lastSavedItems);
    return currentDataStr !== lastSavedStr;
}

function saveDraft() {
    const draft = getFormData();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    
    // Guardar snapshot del borrador para comparación
    state.lastDraftSave = JSON.stringify(draft);
    
    showToast('Borrador guardado.');
}

function loadDraft() {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) {
        showToast('No hay borrador guardado.');
        return;
    }
    const draft = JSON.parse(stored);
    fields.titulo.value = draft.titulo || '';
    fields.proyecto.value = draft.proyecto || '';
    fields.categoria.value = draft.categoria || '';
    fields.fecha.value = draft.fecha || '';
    fields.tipo.checked = draft.tipo === 'random';
    fields.thumbnail.value = draft.thumbnail || '';
    fields.tag.value = draft.tag || '';
    fields.descripcion.value = draft.descripcion || '';
    fields.comentario.value = draft.comentario || '';
    fields.oculto.checked = Boolean(draft.oculto);
    renderImages(Array.isArray(draft.imagenes) ? draft.imagenes : []);
    updateCommentCount();
    updateThumbnailPreview();
    showToast('Borrador cargado.');
}

function deleteCurrent() {
    if (!state.selectedId) return;
    const confirmed = confirm('¿Eliminar este trabajo?');
    if (!confirmed) return;
    saveHistory();
    state.items = state.items.filter((item) => item.id !== state.selectedId);
    state.selectedId = null;
    setFormEmpty(true); // Skip unsaved check ya que acabamos de eliminar
    updateJsonOutput();
    showToast('Trabajo eliminado.');
}

function copyJson() {
    navigator.clipboard
        .writeText(elements.jsonOutput.value)
        .then(() => showToast('JSON copiado.'))
        .catch(() => showToast('No se pudo copiar.'));
}

function scheduleAutoSave() {
    // Cancelar auto-guardado anterior
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    // Programar auto-guardado después de 1.5 segundos de inactividad
    autoSaveTimer = setTimeout(() => {
        const currentData = getFormData();
        const currentDataStr = JSON.stringify(currentData);
        
        // Solo guardar si los datos han cambiado
        if (lastAutoSavedData !== currentDataStr) {
            lastAutoSavedData = currentDataStr;
            applyFormToState();
        }
    }, 1500);
}

function attachEvents() {
    elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        applyFormToState();
    });

    elements.newItemBtn.addEventListener('click', setFormEmpty);
    elements.reloadBtn.addEventListener('click', loadData);

    elements.addImageFieldBtn.addEventListener('click', () => {
        elements.imagesList.appendChild(createImageRow());
    });

    elements.browseImagesBtn.addEventListener('click', () => {
        elements.imageFileInput.click();
    });

    elements.imageFileInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        const paths = files.map((file) => `work/${file.name}`);
        addImagePaths(paths);
        event.target.value = '';
        showToast(`${files.length} imagen(es) añadidas.`);
    });

    elements.clearImagesBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar todas las imágenes?')) {
            saveHistory();
            renderImages([]);
            showToast('Imágenes eliminadas.');
        }
    });

    elements.browseThumbnailBtn.addEventListener('click', () => {
        elements.thumbnailFileInput.click();
    });

    elements.thumbnailFileInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const path = `work/${file.name}`;
        fields.thumbnail.value = path;
        event.target.value = '';
        updateThumbnailPreview();
        showToast('Thumbnail seleccionado.');
    });

    elements.loadDraftBtn.addEventListener('click', loadDraft);
    elements.downloadBtn.addEventListener('click', downloadJson);
    
    // Botón para cargar JSON desde archivo
    const loadJsonBtn = document.getElementById('loadJsonBtn');
    if (loadJsonBtn) {
        loadJsonBtn.addEventListener('click', () => {
            document.getElementById('jsonFileInput').click();
        });
    }
    
    document.getElementById('jsonFileInput').addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    state.items = data.map(normalizeItem);
                    state.selectedId = null;
                    state.lastSavedItems = JSON.parse(JSON.stringify(state.items));
                    localStorage.setItem(DATA_LOCAL_KEY, JSON.stringify(state.items));
                    setFormEmpty(true);
                    renderList();
                    updateJsonOutput();
                    saveHistory();
                    showToast('✅ JSON cargado correctamente.');
                } else {
                    showToast('❌ El JSON debe ser un array.');
                }
            } catch (error) {
                showToast('❌ Error al parsear JSON: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
    
    // Botones para guardar/cargar datos locales
    const saveLocalBtn = document.getElementById('saveLocalBtn');
    const loadLocalBtn = document.getElementById('loadLocalBtn');
    
    if (saveLocalBtn) {
        saveLocalBtn.addEventListener('click', saveJsonLocally);
    }
    
    if (loadLocalBtn) {
        loadLocalBtn.addEventListener('click', loadJsonLocally);
    }
    
    // Auto-guardado automático en campos principales
    const autoSaveFields = [
        fields.titulo, fields.proyecto, fields.categoria, fields.fecha,
        fields.tipo, fields.thumbnail, fields.tag, fields.descripcion,
        fields.comentario, fields.oculto, fields.categoriaOther
    ];
    
    autoSaveFields.forEach(field => {
        if (field) {
            field.addEventListener('input', scheduleAutoSave);
            field.addEventListener('change', scheduleAutoSave);
        }
    });
    
    // Auto-guardado para imágenes
    elements.imagesList.addEventListener('input', scheduleAutoSave);
    elements.imagesList.addEventListener('change', scheduleAutoSave);
    elements.deleteBtn.addEventListener('click', deleteCurrent);
    elements.copyJsonBtn.addEventListener('click', copyJson);
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    elements.searchInput.addEventListener('input', renderList);
    elements.filterTipo.addEventListener('change', renderList);
    elements.filterOcultos.addEventListener('change', renderList);

    fields.comentario.addEventListener('input', updateCommentCount);
    fields.thumbnail.addEventListener('input', updateThumbnailPreview);
    
    // Mostrar/ocultar campo de categoría personalizada
    fields.categoria.addEventListener('change', () => {
        if (fields.categoria.value === '__other__') {
            categoriaOtherLabel.style.display = 'block';
            fields.categoriaOther.focus();
        } else {
            categoriaOtherLabel.style.display = 'none';
            fields.categoriaOther.value = '';
        }
    });

    // Drag & Drop para imágenes
    const imagesSection = document.querySelector('.images-section');
    if (imagesSection) {
        imagesSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            imagesSection.classList.add('drag-hover');
        });

        imagesSection.addEventListener('dragleave', (e) => {
            if (e.target === imagesSection) {
                imagesSection.classList.remove('drag-hover');
            }
        });

        imagesSection.addEventListener('drop', (e) => {
            e.preventDefault();
            imagesSection.classList.remove('drag-hover');
            
            const files = Array.from(e.dataTransfer.files || []);
            if (!files.length) return;
            
            const imageFiles = files.filter(file => 
                file.type.startsWith('image/') || file.type.startsWith('video/')
            );
            
            if (imageFiles.length === 0) {
                showToast('No se encontraron archivos de imagen o video.');
                return;
            }
            
            const paths = imageFiles.map((file) => `work/${file.name}`);
            addImagePaths(paths);
            showToast(`${imageFiles.length} imagen(es) añadidas.`);
        });
    }

    // Ctrl+Z y Ctrl+Y para undo/redo
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
            e.preventDefault();
            redo();
        }
    });
}

attachEvents();
initTheme();
loadData();
setFormEmpty();

// Guardar estado inicial en historial después de cargar
window.addEventListener('load', () => {
    setTimeout(() => {
        if (state.loaded) {
            saveHistory();
        }
    }, 100);
});
