/* 
 * R&B - Lógica de Control de Ventas y Comprobantes
 */

let listaVentas = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar historial de ventas
    await cargarVentas();

    // 3. Listeners para filtros
    document.getElementById('buscar-venta')?.addEventListener('input', filtrarVentas);
    document.getElementById('fecha-inicio')?.addEventListener('change', filtrarVentas);
    document.getElementById('fecha-fin')?.addEventListener('change', filtrarVentas);
    document.getElementById('filtro-estado-sunat')?.addEventListener('change', filtrarVentas);
});

/**
 * Consulta las ventas registradas en Supabase
 */
async function cargarVentas() {
    const tbody = document.getElementById('tabla-ventas');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('ventas')
            .select('*, clientes(nombre_razon_social, numero_documento), usuarios(nombre)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        listaVentas = data || [];
        renderizarTablaVentas(listaVentas);

    } catch (err) {
        console.error('Error al cargar ventas:', err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar la lista de ventas.</td></tr>';
    }
}

/**
 * Renderiza la lista de ventas en la tabla
 */
function renderizarTablaVentas(ventas) {
    const tbody = document.getElementById('tabla-ventas');
    if (!tbody) return;

    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron registros de ventas.</td></tr>';
        return;
    }

    tbody.innerHTML = ventas.map(v => {
        const cliente = v.clientes ? `${v.clientes.nombre_razon_social} (${v.clientes.numero_documento})` : 'Público General';
        const vendedora = v.usuarios?.nombre || '-';
        const fecha = new Date(v.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
        
        let badgeEstado = '<span class="badge badge-warning" style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px;">Pendiente</span>';
        if (v.estado_sunat === 'aceptado') {
            badgeEstado = '<span class="badge badge-success" style="background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 4px;">Aceptado</span>';
        } else if (v.estado_sunat === 'anulado') {
            badgeEstado = '<span class="badge badge-danger" style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px;">Anulado</span>';
        }

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-weight: 600;">${v.serie_correlativo || '-'}</td>
                <td style="padding: 12px;">${fecha}</td>
                <td style="padding: 12px;">${cliente}</td>
                <td style="padding: 12px;">${vendedora}</td>
                <td style="padding: 12px; font-weight: 600;">S/ ${parseFloat(v.total || 0).toFixed(2)}</td>
                <td style="padding: 12px; color: #059669;">S/ ${parseFloat(v.utilidad || 0).toFixed(2)}</td>
                <td style="padding: 12px;">${badgeEstado}</td>
                <td style="padding: 12px;">
                    <button type="button" onclick="verDetalleVenta('${v.id}')" title="Ver Detalle" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">👁️</button>
                    <button type="button" onclick="descargarPDF('${v.id}')" title="Descargar PDF" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">📄</button>
                    <button type="button" onclick="anularVenta('${v.id}')" title="Anular" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🚫</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra las ventas según el criterio del usuario
 */
function filtrarVentas() {
    const texto = document.getElementById('buscar-venta')?.value.toLowerCase().trim() || '';
    const fechaInicio = document.getElementById('fecha-inicio')?.value || '';
    const fechaFin = document.getElementById('fecha-fin')?.value || '';
    const estadoSunat = document.getElementById('filtro-estado-sunat')?.value || '';

    const filtradas = listaVentas.filter(v => {
        const clienteNom = v.clientes?.nombre_razon_social || '';
        const clienteDoc = v.clientes?.numero_documento || '';
        const comprobante = v.serie_correlativo || '';

        const matchTexto = comprobante.toLowerCase().includes(texto) ||
                           clienteNom.toLowerCase().includes(texto) ||
                           clienteDoc.includes(texto);

        const fechaVenta = v.created_at ? v.created_at.split('T')[0] : '';
        const matchFechaInicio = !fechaInicio || fechaVenta >= fechaInicio;
        const matchFechaFin = !fechaFin || fechaVenta <= fechaFin;
        const matchEstado = !estadoSunat || v.estado_sunat === estadoSunat;

        return matchTexto && matchFechaInicio && matchFechaFin && matchEstado;
    });

    renderizarTablaVentas(filtradas);
}

function verDetalleVenta(id) {
    console.log('Ver detalle de venta ID:', id);
}

function descargarPDF(id) {
    console.log('Generando PDF para venta ID:', id);
}

function anularVenta(id) {
    console.log('Procesando anulación para venta ID:', id);
}