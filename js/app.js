/* 
 * R.O.S.S.Y - Lógica Global y Control de Interfaz
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar verificación de sesión
    checkAppSession();

    // Configurar escuchadores globales si existen en la vista actual
    setupGlobalEventListeners();
});

/**
 * Verifica el estado de autenticación al cargar cualquier página
 */
async function checkAppSession() {
    // Si la función de autenticación existe en auth.js, verificamos la sesión activamente
    if (typeof checkAuthSession === 'function') {
        const session = await checkAuthSession();
        const currentPath = window.location.pathname;

        // Si el usuario está autenticado y está en la pantalla de Login (index.html)
        if (session && (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/'))) {
            // Redirige por defecto al inicio de vendedora
            window.location.href = 'views/vendedora/inicio.html';
        }

        // Si NO está autenticado y no está en la pantalla de login, redirige al login
        if (!session && !currentPath.endsWith('index.html') && currentPath !== '/' && !currentPath.endsWith('/')) {
            window.location.href = '../../index.html';
        }
    }
}

/**
 * Registra eventos globales compartidos en la interfaz
 */
function setupGlobalEventListeners() {
    // Gestión del menú lateral / inferior si existe en la vista actual
    const navItems = document.querySelectorAll('.mobile-nav-item');
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }
}

/**
 * Utilidad global para mostrar alertas o notificaciones breves en pantalla
 * @param {string} message - Texto del mensaje
 * @param {string} type - 'error' | 'success' | 'info'
 */
function showNotification(message, type = 'info') {
    let alertBox = document.getElementById('global-notification');
    
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'global-notification';
        document.body.appendChild(alertBox);
    }

    alertBox.className = `error-message ${type === 'success' ? 'success-message' : ''}`;
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}