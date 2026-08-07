/* 
 * R.O.S.S.Y - Lógica de Auditoría y Registros de Eventos
 */

let listaAuditoria = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar registros de auditoría iniciales
    await cargarAuditoria();

    // 3. Listeners para filtros y eventos
    document.getElementById('buscar-log')?.addEventListener('input', filtrarAuditoria);
    document.getElementById('filtro-modulo-log')?.addEventListener('change', filtrarAuditoria);
    document.getElementById('fecha-log')?.addEventListener('change', filtrarAuditoria);

    // Botón de exportación
    document.getElementById('btn-exportar-auditoria')?.addEventListener('click', exportarLogsAuditoria);
});

/**
 * Consulta la tabla de logs de auditoría en Supabase
 */
async function cargarAuditoria() {
    const tbody = document.getElementById('tabla-auditoria');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('auditoria_logs')
            .select('*, usuarios(nombre, dni)')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) throw error;

        listaAuditoria = data || [];
        renderizarTablaAuditoria(listaAuditoria);

    } catch (err) {
        console.error('Error al cargar logs de auditoría:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar los registros de auditoría.</td></tr>';
    }
}

/**
 * Renderiza las filas de la tabla de auditoría en HTML
 * @param {Array} logs 
 */
function renderizarTablaAuditoria(logs) {
    const tbody = document.getElementById('tabla-auditoria');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron eventos o logs registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map(l => {
        const fechaHora = l.created_at ? new Date(l.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' }) : '-';
        const usuarioInfo = l.usuarios ? `${l.usuarios.nombre} (${l.usuarios.dni || 'S/D'})` : 'Sistema';
        
        let badgeModulo = `<span style="padding: 4px 8px; border-radius: 4px; background: #e5e7eb; color: #374151; font-size: 0.85rem;">${l.modulo || 'GENERAL'}</span>`;
        if (l.modulo === 'AUTH') {
            badgeModulo = '<span style="padding: 4px 8px; border-radius: 4px; background: #dbeafe; color: #1e40af; font-size: 0.85rem; font-weight: 600;">AUTH</span>';
        } else if (l.modulo === 'INVENTARIO') {
            badgeModulo = '<span style="padding: 4px 8px; border-radius: 4px; background: #fef3c7; color: #92400e; font-size: 0.85rem; font-weight: 600;">INVENTARIO</span>';
        } else if (l.modulo === 'VENTAS') {
            badgeModulo = '<span style="padding: 4px 8px; border-radius: 4px; background: #d1fae5; color: #065f46; font-size: 0.85rem; font-weight: 600;">VENTAS</span>';
        } else if (l.modulo === 'CAJA') {
            badgeModulo = '<span style="padding: 4px 8px; border-radius: 4px; background: #f3e8ff; color: #6b21a8; font-size: 0.85rem; font-weight: 600;">CAJA</span>';
        }

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; white-space: nowrap;">${fechaHora}</td>
                <td style="padding: 12px; font-weight: 600;">${usuarioInfo}</td>
                <td style="padding: 12px;">${badgeModulo}</td>
                <td style="padding: 12px; font-weight: 500;">${l.accion || '-'}</td>
                <td style="padding: 12px; color: #4b5563; font-size: 0.9rem;">${l.detalle || '-'}</td>
                <td style="padding: 12px; font-family: monospace; font-size: 0.85rem; color: #6b7280;">${l.ip_origen || '127.0.0.1'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra la tabla de auditoría en función de los criterios seleccionados
 */
function filtrarAuditoria() {
    const texto = document.getElementById('buscar-log')?.value.toLowerCase().trim() || '';
    const modulo = document.getElementById('filtro-modulo-log')?.value || '';
    const fecha = document.getElementById('fecha-log')?.value || '';

    const filtrados = listaAuditoria.filter(l => {
        const usuarioNom = l.usuarios?.nombre || '';
        const usuarioDni = l.usuarios?.dni || '';
        const accion = l.accion || '';
        const detalle = l.detalle || '';

        const matchTexto = accion.toLowerCase().includes(texto) ||
                           detalle.toLowerCase().includes(texto) ||
                           usuarioNom.toLowerCase().includes(texto) ||
                           usuarioDni.includes(texto);

        const matchModulo = !modulo || l.modulo === modulo;

        const fechaLog = l.created_at ? l.created_at.split('T')[0] : '';
        const matchFecha = !fecha || fechaLog === fecha;

        return matchTexto && matchModulo && matchFecha;
    });

    renderizarTablaAuditoria(filtrados);
}

/**
 * Registra formalmente una acción en el log de auditoría
 * @param {string} modulo - Módulo del sistema ('AUTH', 'INVENTARIO', 'VENTAS', 'CAJA', 'CONFIGURACION')
 * @param {string} accion - Acción corta realizada ('CREAR_PRODUCTO', 'ANULAR_VENTA', etc.)
 * @param {string} detalle - Explicación descriptiva del cambio
 */
async function registrarLogAuditoria(modulo, accion, detalle) {
    if (typeof supabaseClient === 'undefined') return;

    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const userId = sessionData?.session?.user?.id || null;

        await supabaseClient.from('auditoria_logs').insert([{
            usuario_id: userId,
            modulo: modulo,
            accion: accion,
            detalle: detalle,
            created_at: new Date().toISOString()
        }]);
    } catch (err) {
        console.error('Error al registrar evento de auditoría:', err);
    }
}

/**
 * Exporta el listado filtrado de logs en formato CSV
 */
function exportarLogsAuditoria() {
    if (listaAuditoria.length === 0) {
        alert('No hay registros de auditoría disponibles para exportar.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Fecha,Usuario,DNI,Modulo,Accion,Detalle,IP\n";

    listaAuditoria.forEach(l => {
        const fecha = l.created_at || '';
        const usuario = (l.usuarios?.nombre || 'Sistema').replace(/,/g, '');
        const dni = l.usuarios?.dni || '';
        const modulo = l.modulo || '';
        const accion = (l.accion || '').replace(/,/g, '');
        const detalle = (l.detalle || '').replace(/,/g, '');
        const ip = l.ip_origen || '127.0.0.1';

        csvContent += `"${fecha}","${usuario}","${dni}","${modulo}","${accion}","${detalle}","${ip}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_rossy_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}