/* 
 * R.O.S.S.Y - Lógica de Notificaciones y Alertas del Sistema
 */

let listaNotificaciones = [];
let intervaloPolling = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Asegurar la existencia del contenedor Toast en el DOM
    crearContenedorToasts();

    // 2. Cargar notificaciones del sistema si hay sesión activa
    if (typeof supabaseClient !== 'undefined') {
        await cargarNotificaciones();
        
        // Polling para revisar notificaciones/alertas cada 60 segundos
        intervaloPolling = setInterval(cargarNotificaciones, 60000);
    }

    // 3. Listeners del centro de notificaciones
    document.getElementById('btn-notificaciones')?.addEventListener('click', toggleCentroNotificaciones);
    document.getElementById('btn-marcar-todas-leidas')?.addEventListener('click', marcarTodasComoLeidas);
});

/**
 * Crea dinámicamente el contenedor flotante para alertas Toast si no existe en el DOM
 */
function crearContenedorToasts() {
    if (document.getElementById('toast-container')) return;

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
        width: 100%;
        pointer-events: none;
    `;
    document.body.appendChild(container);
}

/**
 * Muestra una notificación emergente estilo Toast
 * @param {string} mensaje - Texto descriptivo de la alerta
 * @param {'success'|'error'|'warning'|'info'} tipo - Tipo de notificación
 * @param {string} [titulo] - Título opcional
 * @param {number} [duracion=4000] - Tiempo de visualización en milisegundos
 */
function mostrarNotificacion(mensaje, tipo = 'info', titulo = '', duracion = 4000) {
    crearContenedorToasts();
    const container = document.getElementById('toast-container');

    const configEstilos = {
        success: { bg: '#10b981', color: '#ffffff', icono: '✓', border: '#059669' },
        error: { bg: '#ef4444', color: '#ffffff', icono: '✕', border: '#dc2626' },
        warning: { bg: '#f59e0b', color: '#ffffff', icono: '⚠', border: '#d97706' },
        info: { bg: '#3b82f6', color: '#ffffff', icono: 'ℹ', border: '#2563eb' }
    };

    const estilo = configEstilos[tipo] || configEstilos.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background-color: ${estilo.bg};
        color: ${estilo.color};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        pointer-events: auto;
        opacity: 0;
        transform: translateX(50px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 5px solid ${estilo.border};
        font-family: system-ui, -apple-system, sans-serif;
    `;

    toast.innerHTML = `
        <div style="font-weight: bold; font-size: 1.1rem; line-height: 1;">${estilo.icono}</div>
        <div style="flex: 1;">
            ${titulo ? `<div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">${titulo}</div>` : ''}
            <div style="font-size: 0.875rem; line-height: 1.3;">${mensaje}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: ${estilo.color}; font-size: 1.1rem; cursor: pointer; padding: 0; opacity: 0.8;">&times;</button>
    `;

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Auto-eliminar después del tiempo especificado
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

/**
 * Consulta la tabla de notificaciones desde Supabase
 */
async function cargarNotificaciones() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (!userId) return;

        const { data, error } = await supabaseClient
            .from('notificaciones')
            .select('*')
            .or(`usuario_id.eq.${userId},usuario_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        listaNotificaciones = data || [];
        actualizarBadgeNotificaciones();
        renderizarListaNotificaciones();

    } catch (err) {
        console.error('Error al cargar notificaciones:', err);
    }
}

/**
 * Actualiza el contador de notificaciones no leídas en la interfaz
 */
function actualizarBadgeNotificaciones() {
    const badge = document.getElementById('badge-notificaciones-count');
    if (!badge) return;

    const noLeidas = listaNotificaciones.filter(n => !n.leida).length;

    if (noLeidas > 0) {
        badge.textContent = noLeidas > 99 ? '99+' : noLeidas;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Renderiza el menú desplegable/centro de notificaciones
 */
function renderizarListaNotificaciones() {
    const contenedor = document.getElementById('lista-notificaciones-body');
    if (!contenedor) return;

    if (listaNotificaciones.length === 0) {
        contenedor.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 0.9rem;">No tienes notificaciones pendientes.</div>';
        return;
    }

    contenedor.innerHTML = listaNotificaciones.map(n => {
        const fecha = new Date(n.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        const estiloFondo = n.leida ? '#ffffff' : '#f0f9ff';

        return `
            <div style="padding: 12px 16px; background: ${estiloFondo}; border-bottom: 1px solid #f3f4f6; display: flex; gap: 10px; align-items: flex-start; cursor: pointer;" onclick="marcarComoLeida('${n.id}')">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.875rem; color: #1f2937;">${n.titulo || 'Notificación'}</div>
                    <div style="font-size: 0.8rem; color: #4b5563; margin-top: 2px;">${n.mensaje}</div>
                    <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">${fecha}</div>
                </div>
                ${!n.leida ? '<span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-top: 6px;"></span>' : ''}
            </div>
        `;
    }).join('');
}

/**
 * Marca una notificación específica como leída
 * @param {string} id 
 */
async function marcarComoLeida(id) {
    try {
        const { error } = await supabaseClient
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id);

        if (error) throw error;

        const item = listaNotificaciones.find(n => n.id === id);
        if (item) item.leida = true;

        actualizarBadgeNotificaciones();
        renderizarListaNotificaciones();
    } catch (err) {
        console.error('Error al marcar notificación:', err);
    }
}

/**
 * Marca todas las notificaciones de la lista como leídas
 */
async function marcarTodasComoLeidas() {
    try {
        const idsNoLeidos = listaNotificaciones.filter(n => !n.leida).map(n => n.id);
        if (idsNoLeidos.length === 0) return;

        const { error } = await supabaseClient
            .from('notificaciones')
            .update({ leida: true })
            .in('id', idsNoLeidos);

        if (error) throw error;

        listaNotificaciones.forEach(n => n.leida = true);
        actualizarBadgeNotificaciones();
        renderizarListaNotificaciones();
        mostrarNotificacion('Todas las notificaciones se marcaron como leídas.', 'info');
    } catch (err) {
        console.error('Error al marcar todas como leídas:', err);
    }
}

/**
 * Alterna la visibilidad del panel desplegable de notificaciones
 */
function toggleCentroNotificaciones() {
    const panel = document.getElementById('panel-notificaciones');
    if (!panel) return;

    const visible = panel.style.display === 'block';
    panel.style.display = visible ? 'none' : 'block';
}

/**
 * Revisa el inventario y genera alertas flotantes por productos con poco stock
 */
async function verificarAlertasStock() {
    if (typeof supabaseClient === 'undefined') return;

    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('nombre, stock, stock_minimo')
            .lte('stock', supabaseClient.raw('stock_minimo'));

        if (error) throw error;

        if (data && data.length > 0) {
            data.forEach(prod => {
                mostrarNotificacion(
                    `El producto "${prod.nombre}" tiene solo ${prod.stock} unidades en inventario.`,
                    'warning',
                    'Stock Bajo'
                );
            });
        }
    } catch (err) {
        console.error('Error al verificar alertas de stock:', err);
    }
}