/* 
 * R&B - Lógica de Registro y Control de Compras
 */

let listaCompras = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar compras registradas
    await cargarCompras();

    // 3. Listeners para búsqueda y filtros
    document.getElementById('buscar-compra')?.addEventListener('input', filtrarCompras);
    document.getElementById('fecha-inicio-compra')?.addEventListener('change', filtrarCompras);
    document.getElementById('fecha-fin-compra')?.addEventListener('change', filtrarCompras);

    // Listener para registrar nueva compra
    document.getElementById('btn-nueva-compra')?.addEventListener('click', () => {
        console.log('Abrir modal/formulario de nueva compra');
    });
});

/**
 * Consulta las compras registradas en Supabase
 */
async function cargarCompras() {
    const tbody = document.getElementById('tabla-compras');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('compras')
            .select('*, proveedores(razon_social, ruc)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        listaCompras = data || [];
        renderizarTablaCompras(listaCompras);

    } catch (err) {
        console.error('Error al cargar compras:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar la lista de compras.</td></tr>';
    }
}

/**
 * Renderiza las filas de la tabla de compras
 */
function renderizarTablaCompras(compras) {
    const tbody = document.getElementById('tabla-compras');
    if (!tbody) return;

    if (compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron compras registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = compras.map(c => {
        const proveedor = c.proveedores ? `${c.proveedores.razon_social} (${c.proveedores.ruc})` : 'Proveedor no especificado';
        const fecha = c.created_at ? new Date(c.created_at).toLocaleDateString('es-PE') : '-';

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-weight: 600;">${c.numero_comprobante || c.guia_remision || '-'}</td>
                <td style="padding: 12px;">${fecha}</td>
                <td style="padding: 12px;">${proveedor}</td>
                <td style="padding: 12px;">${c.total_prendas ?? 0} pcs</td>
                <td style="padding: 12px; font-weight: 600;">S/ ${parseFloat(c.monto_total || 0).toFixed(2)}</td>
                <td style="padding: 12px;">
                    <button type="button" onclick="verDetalleCompra('${c.id}')" title="Ver Detalle" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">👁️</button>
                    <button type="button" onclick="eliminarCompra('${c.id}')" title="Eliminar/Anular" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra la tabla de compras según los valores ingresados
 */
function filtrarCompras() {
    const texto = document.getElementById('buscar-compra')?.value.toLowerCase().trim() || '';
    const fechaInicio = document.getElementById('fecha-inicio-compra')?.value || '';
    const fechaFin = document.getElementById('fecha-fin-compra')?.value || '';

    const filtradas = listaCompras.filter(c => {
        const proveedorNom = c.proveedores?.razon_social || '';
        const proveedorRuc = c.proveedores?.ruc || '';
        const doc = c.numero_comprobante || c.guia_remision || '';

        const matchTexto = doc.toLowerCase().includes(texto) ||
                           proveedorNom.toLowerCase().includes(texto) ||
                           proveedorRuc.includes(texto);

        const fechaCompra = c.created_at ? c.created_at.split('T')[0] : '';
        const matchFechaInicio = !fechaInicio || fechaCompra >= fechaInicio;
        const matchFechaFin = !fechaFin || fechaCompra <= fechaFin;

        return matchTexto && matchFechaInicio && matchFechaFin;
    });

    renderizarTablaCompras(filtradas);
}

function verDetalleCompra(id) {
    console.log('Ver detalle de compra ID:', id);
}

function eliminarCompra(id) {
    console.log('Eliminar/Anular compra ID:', id);
}