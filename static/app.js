/**
 * @fileoverview visor_fotos - Lógica del slideshow
 * 
 * Clase Slideshow que gestiona la carga, precarga, navegación cíclica
 * y transiciones morphing entre imágenes.
 */

/**
 * Gestiona el slideshow de fotos con transiciones morphing.
 */
class Slideshow {
    /**
     * @param {Object} options
     * @param {number} [options.interval=5] - Segundos entre transiciones.
     * @param {string} [options.order='alpha'] - Orden: 'alpha' o 'random'.
     * @param {boolean} [options.preload=true] - Si true, precarga N+1 y N+2 en background.
     */
    constructor({ interval = 5, order = 'alpha', preload = true } = {}) {
        /** @type {string[]} Lista de nombres de archivos de imagen */
        this.photos = [];
        /** @type {string} Directorio de imágenes */
        this.directory = '';
        /** @type {number} Índice actual en el ciclo */
        this.currentIndex = -1;
        /** @type {number} Intervalo en segundos */
        this.interval = interval;
        /** @type {string} 'alpha' | 'random' */
        this.order = order;
        /** @type {boolean} Precarga activada */
        this.preload = preload;
        /** @type {boolean} Flag de pausa */
        this.paused = false;
        /** @type {number|null} ID del timer */
        this.timerId = null;
        /** @type {boolean} Flag de transición en curso */
        this.transitioning = false;

        // DOM references
        /** @type {HTMLImageElement} */
        this.layerA = document.getElementById('layer-a');
        /** @type {HTMLImageElement} */
        this.layerB = document.getElementById('layer-b');
        /** @type {HTMLElement} */
        this.counter = document.getElementById('counter');
        /** @type {HTMLElement} */
        this.progressFill = document.getElementById('progress-fill');
        /** @type {HTMLElement} */
        this.pauseIndicator = document.getElementById('pause-indicator');

        /** @type {boolean} true si la capa activa es A */
        this.activeIsA = true;

        // Cache de imágenes precargadas
        /** @type {Map<number, HTMLImageElement>} */
        this.preloadCache = new Map();
    }

    /**
     * Inicializa el slideshow: carga la lista de fotos y muestra la primera.
     * @param {string} directory - Ruta absoluta del directorio de imágenes.
     * @returns {Promise<void>}
     * @throws {Error} Si el servidor retorna un error.
     */
    async init(directory) {
        this.directory = directory;

        const response = await fetch(`/api/fotos?dir=${encodeURIComponent(directory)}`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || `Error ${response.status}`);
        }

        const data = await response.json();
        this.photos = data.fotos;

        if (this.photos.length === 0) {
            throw new Error('No se encontraron imágenes en el directorio');
        }

        // Shuffle si es aleatorio
        if (this.order === 'random') {
            this._shuffle(this.photos);
        }

        // Mostrar primera imagen
        this.currentIndex = 0;
        const url = this._photoUrl(0);
        await this._loadImage(this.layerA, url);
        this.layerA.classList.add('active');
        this.activeIsA = true;
        this._updateCounter();

        // Precargar siguiente
        this._preloadAhead();

        // Iniciar timer
        this._startTimer();
    }

    /**
     * Avanza al siguiente slide con transición morphing.
     */
    showNext() {
        if (this.transitioning || this.photos.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this._transition();
    }

    /**
     * Retrocede al slide anterior con transición morphing.
     */
    showPrev() {
        if (this.transitioning || this.photos.length <= 1) return;
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this._transition();
    }

    /**
     * Pausa o reanuda el slideshow.
     */
    togglePause() {
        this.paused = !this.paused;
        this.pauseIndicator.hidden = !this.paused;

        if (this.paused) {
            this._stopTimer();
            this.progressFill.classList.remove('animating');
        } else {
            this._startTimer();
        }
    }

    /**
     * Detiene el slideshow y limpia recursos.
     */
    stop() {
        this._stopTimer();
        this.preloadCache.clear();
        this.layerA.classList.remove('active', 'morph-in', 'morph-out');
        this.layerB.classList.remove('active', 'morph-in', 'morph-out');
        this.layerA.src = '';
        this.layerB.src = '';
        this.currentIndex = -1;
        this.paused = false;
        this.pauseIndicator.hidden = true;
    }

    // ────────────────────────────────────────
    // Private methods
    // ────────────────────────────────────────

    /**
     * Ejecuta la transición morphing entre la imagen actual y la siguiente.
     * @private
     */
    _transition() {
        this.transitioning = true;
        this._stopTimer();

        const incoming = this.activeIsA ? this.layerB : this.layerA;
        const outgoing = this.activeIsA ? this.layerA : this.layerB;

        // Cargar imagen en la capa entrante
        const url = this._photoUrl(this.currentIndex);
        const cached = this.preloadCache.get(this.currentIndex);

        const applyTransition = () => {
            // Limpiar clases previas
            incoming.classList.remove('morph-in', 'morph-out', 'active');
            outgoing.classList.remove('morph-in', 'morph-out');

            // Forzar reflow para reiniciar animaciones
            void incoming.offsetWidth;

            // Aplicar animaciones
            outgoing.classList.add('morph-out');
            incoming.classList.add('morph-in');

            this.activeIsA = !this.activeIsA;
            this._updateCounter();
            this._preloadAhead();

            // Cuando termine la animación
            const onEnd = () => {
                incoming.removeEventListener('animationend', onEnd);
                outgoing.classList.remove('morph-out', 'active');
                incoming.classList.remove('morph-in');
                incoming.classList.add('active');
                this.transitioning = false;

                if (!this.paused) {
                    this._startTimer();
                }
            };
            incoming.addEventListener('animationend', onEnd);
        };

        if (cached) {
            incoming.src = cached.src;
            applyTransition();
        } else {
            this._loadImage(incoming, url).then(applyTransition);
        }
    }

    /**
     * Precarga las siguientes 2 imágenes (solo si preload está activo).
     * @private
     */
    _preloadAhead() {
        if (!this.preload) return;

        for (let offset = 1; offset <= 2; offset++) {
            const idx = (this.currentIndex + offset) % this.photos.length;
            if (!this.preloadCache.has(idx)) {
                this._preload(idx);
            }
        }

        // Limpiar cache de imágenes lejanas para evitar memory leaks
        for (const [key] of this.preloadCache) {
            const dist = Math.min(
                Math.abs(key - this.currentIndex),
                this.photos.length - Math.abs(key - this.currentIndex)
            );
            if (dist > 3) {
                this.preloadCache.delete(key);
            }
        }
    }

    /**
     * Precarga una imagen por índice.
     * @param {number} index
     * @returns {Promise<HTMLImageElement>}
     * @private
     */
    _preload(index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.preloadCache.set(index, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`⚠ No se pudo cargar: ${this.photos[index]}`);
                reject();
            };
            img.src = this._photoUrl(index);
        });
    }

    /**
     * Carga una imagen en un elemento <img>.
     *
     * NOTA: Si la imagen ya está en caché del navegador, el evento `onload`
     * puede no dispararse. Se verifica `imgEl.complete` para resolver
     * inmediatamente en ese caso.
     *
     * @param {HTMLImageElement} imgEl
     * @param {string} url
     * @returns {Promise<void>}
     * @private
     */
    _loadImage(imgEl, url) {
        return new Promise((resolve) => {
            imgEl.onload = () => resolve();
            imgEl.onerror = () => {
                console.warn(`⚠ Error cargando imagen: ${url}`);
                resolve(); // No bloquear, siguiente
            };
            imgEl.src = url;
            // Si la imagen ya está en caché y completa, onload no se dispara
            if (imgEl.complete && imgEl.naturalWidth > 0) {
                resolve();
            }
        });
    }

    /**
     * Construye la URL de una foto por índice.
     * @param {number} index
     * @returns {string}
     * @private
     */
    _photoUrl(index) {
        const filename = this.photos[index];
        return `/api/foto/${encodeURIComponent(filename)}?dir=${encodeURIComponent(this.directory)}`;
    }

    /**
     * Inicia el temporizador de avance automático con barra de progreso.
     * @private
     */
    _startTimer() {
        this._stopTimer();

        // Reset barra de progreso
        this.progressFill.classList.remove('animating');
        this.progressFill.style.width = '0%';

        // Forzar reflow y animar
        void this.progressFill.offsetWidth;
        this.progressFill.classList.add('animating');
        this.progressFill.style.transitionDuration = `${this.interval}s`;
        this.progressFill.style.width = '100%';

        this.timerId = setTimeout(() => {
            this.showNext();
        }, this.interval * 1000);
    }

    /**
     * Detiene el temporizador.
     * @private
     */
    _stopTimer() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * Actualiza el contador "N / Total".
     * @private
     */
    _updateCounter() {
        this.counter.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;
    }

    /**
     * Mezcla un array in-place (Fisher-Yates).
     * @param {Array} arr
     * @private
     */
    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}

// ==========================================================================
// Inicialización de la aplicación
// ==========================================================================

/** @type {Slideshow|null} */
let slideshow = null;

// --- DOM Elements ---
const configScreen = document.getElementById('config-screen');
const slideshowEl = document.getElementById('slideshow');
const dirInput = document.getElementById('dir-input');
const btnStart = document.getElementById('btn-start');
const errorMsg = document.getElementById('error-msg');
const intervalSlider = document.getElementById('interval-slider');
const intervalValue = document.getElementById('interval-value');
const btnAlpha = document.getElementById('btn-alpha');
const btnRandom = document.getElementById('btn-random');
const btnPreloadOn = document.getElementById('btn-preload-on');
const btnPreloadOff = document.getElementById('btn-preload-off');
const controlsOverlay = document.getElementById('controls-overlay');
const btnRecent = document.getElementById('btn-recent');
const recentDirsList = document.getElementById('recent-dirs');

const btnFavToggle = document.getElementById('btn-favorites-toggle');
const favPanel = document.getElementById('favorites-panel');
const favInput = document.getElementById('favorites-input');
const btnFavSave = document.getElementById('btn-favorites-save');
const favFeedback = document.getElementById('favorites-feedback');

// ==========================================================================
// Historial de rutas recientes y Favoritos (localStorage)
// ==========================================================================

const RECENT_KEY = 'visor_fotos_recent_dirs';
const FAV_KEY = 'visor_fotos_favorite_dirs';
const MAX_RECENT = 8;

/**
 * Carga el historial de rutas recientes desde localStorage.
 * @returns {string[]}
 */
function loadRecentDirs() {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Guarda una ruta en el historial (la mueve al inicio si ya existe).
 * @param {string} dir
 */
function saveRecentDir(dir) {
    let dirs = loadRecentDirs().filter(d => d !== dir);
    dirs.unshift(dir);
    dirs = dirs.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(dirs));
    renderRecentDirs();
}

/**
 * Elimina una ruta del historial.
 * @param {string} dir
 */
function deleteRecentDir(dir) {
    const dirs = loadRecentDirs().filter(d => d !== dir);
    localStorage.setItem(RECENT_KEY, JSON.stringify(dirs));
    renderRecentDirs();
}

/**
 * Renderiza el dropdown combinando favoritos (siempre todos) + recientes (sin duplicados).
 * Los favoritos aparecen primero marcados con ★ y no pueden borrarse desde aquí.
 */
function renderRecentDirs() {
    const favorites = loadFavorites();
    const recentOnly = loadRecentDirs().filter(d => !favorites.includes(d));
    const allDirs = [...favorites, ...recentOnly];

    // Mostrar/ocultar botón si no hay nada
    btnRecent.hidden = allDirs.length === 0;

    // Construir lista
    recentDirsList.innerHTML = '';
    allDirs.forEach(dir => {
        const isFav = favorites.includes(dir);
        const li = document.createElement('li');
        if (isFav) li.classList.add('is-favorite');

        const span = document.createElement('span');
        span.className = 'recent-path';

        // Icono estrella para favoritos
        if (isFav) {
            const star = document.createElement('em');
            star.className = 'fav-star';
            star.textContent = '★';
            span.appendChild(star);
        }
        span.appendChild(document.createTextNode(dir));

        span.addEventListener('click', () => {
            dirInput.value = dir;
            recentDirsList.hidden = true;
            hideError();
        });

        li.appendChild(span);

        // Solo los recientes (no favoritos) tienen botón de borrar
        if (!isFav) {
            const del = document.createElement('span');
            del.className = 'recent-delete';
            del.textContent = '✕ borrar';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRecentDir(dir);
            });
            li.appendChild(del);
        }

        recentDirsList.appendChild(li);
    });
}

// Toggle del dropdown
btnRecent.addEventListener('click', () => {
    recentDirsList.hidden = !recentDirsList.hidden;
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dir-input-wrapper')) {
        recentDirsList.hidden = true;
    }
});

// Inicializar
renderRecentDirs();

// Pre-cargar última ruta usada
const lastDir = loadRecentDirs()[0];
if (lastDir) dirInput.value = lastDir;

// --- Funciones de Favoritos ---

/**
 * Carga la lista de directorios favoritos desde localStorage.
 * @returns {string[]} Lista de rutas favoritas.
 */
function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Guarda el contenido actual del textarea de favoritos en localStorage,
 * elimina duplicados, y añade los favoritos al historial de recientes.
 * Muestra el feedback visual de éxito.
 */
function saveFavorites() {
    const text = favInput.value;
    const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    // Eliminar duplicados
    const uniqueFavorites = [...new Set(lines)];
    localStorage.setItem(FAV_KEY, JSON.stringify(uniqueFavorites));

    // Agregar a recientes sin duplicarlos
    const currentRecent = loadRecentDirs();
    let newRecent = [...currentRecent];
    uniqueFavorites.forEach(fav => {
        newRecent = newRecent.filter(d => d !== fav);
        newRecent.unshift(fav);
    });
    newRecent = newRecent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));

    renderRecentDirs();

    // Feedback visual
    favFeedback.hidden = false;
    favFeedback.classList.add('show');
    setTimeout(() => {
        favFeedback.classList.remove('show');
        setTimeout(() => favFeedback.hidden = true, 300);
    }, 2000);
}

btnFavToggle.addEventListener('click', () => {
    const isHidden = favPanel.hidden;
    favPanel.hidden = !isHidden;
    btnFavToggle.classList.toggle('open', isHidden);
    if (isHidden) {
        // Cargar favoritos actuales en el textarea
        favInput.value = loadFavorites().join('\n');
    }
});

btnFavSave.addEventListener('click', saveFavorites);

// --- Estado ---
let selectedOrder = 'alpha';
let selectedPreload = false;
let mouseHideTimer = null;

// --- Slider de intervalo ---
intervalSlider.addEventListener('input', () => {
    intervalValue.textContent = `${intervalSlider.value}s`;
});

// --- Toggle de orden ---
btnAlpha.addEventListener('click', () => {
    selectedOrder = 'alpha';
    btnAlpha.classList.add('active');
    btnRandom.classList.remove('active');
});

btnRandom.addEventListener('click', () => {
    selectedOrder = 'random';
    btnRandom.classList.add('active');
    btnAlpha.classList.remove('active');
});

// --- Toggle de precarga ---
btnPreloadOn.addEventListener('click', () => {
    selectedPreload = true;
    btnPreloadOn.classList.add('active');
    btnPreloadOff.classList.remove('active');
});

btnPreloadOff.addEventListener('click', () => {
    selectedPreload = false;
    btnPreloadOff.classList.add('active');
    btnPreloadOn.classList.remove('active');
});

// --- Iniciar slideshow ---
btnStart.addEventListener('click', startSlideshow);
dirInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startSlideshow();
});

/**
 * Inicia el slideshow con la configuración actual.
 */
async function startSlideshow() {
    const dir = dirInput.value.trim();
    if (!dir) {
        showError('Ingresa la ruta de un directorio');
        return;
    }

    btnStart.disabled = true;
    btnStart.textContent = 'Cargando...';
    hideError();

    try {
        slideshow = new Slideshow({
            interval: parseInt(intervalSlider.value, 10),
            order: selectedOrder,
            preload: selectedPreload,
        });

        await slideshow.init(dir);

        // Guardar ruta en historial
        saveRecentDir(dir);

        // Mostrar slideshow, ocultar config
        configScreen.hidden = true;
        slideshowEl.hidden = false;
    } catch (err) {
        showError(err.message);
    } finally {
        btnStart.disabled = false;
        btnStart.textContent = 'Iniciar';
    }
}

/**
 * Vuelve a la pantalla de configuración.
 */
function backToConfig() {
    if (slideshow) {
        slideshow.stop();
        slideshow = null;
    }
    slideshowEl.hidden = true;
    configScreen.hidden = false;
    configScreen.style.animation = 'none';
    void configScreen.offsetWidth;
    configScreen.style.animation = '';
}

// --- Controles de teclado ---
document.addEventListener('keydown', (e) => {
    // Solo actuar si el slideshow está activo
    if (slideshowEl.hidden) return;

    switch (e.key) {
        case ' ':
            e.preventDefault();
            slideshow?.togglePause();
            break;
        case 'ArrowRight':
            e.preventDefault();
            slideshow?.showNext();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            slideshow?.showPrev();
            break;
        case 'f':
        case 'F':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 'Escape':
            e.preventDefault();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                backToConfig();
            }
            break;
    }
});

/**
 * Toggle fullscreen.
 */
function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen().catch(() => { });
    }
}

// --- Mostrar/ocultar controles al mover mouse ---
document.addEventListener('mousemove', () => {
    if (slideshowEl.hidden) return;

    controlsOverlay.classList.add('visible');
    document.body.style.cursor = 'default';

    clearTimeout(mouseHideTimer);
    mouseHideTimer = setTimeout(() => {
        controlsOverlay.classList.remove('visible');
        document.body.style.cursor = 'none';
    }, 2500);
});

// Ocultar cursor al inicio del slideshow
slideshowEl.addEventListener('transitionend', () => {
    if (!slideshowEl.hidden) {
        document.body.style.cursor = 'none';
    }
});

// --- Helpers ---

/**
 * Muestra mensaje de error.
 * @param {string} msg
 */
function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
}

/**
 * Oculta el mensaje de error.
 */
function hideError() {
    errorMsg.hidden = true;
}
