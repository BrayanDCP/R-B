/* 
 * R&B - Lógica de Gestión de Clientes
 */

let listaClientes = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar clientes desde Supabase
    await cargarClientes();

    // 3. Listeners para filtros
    document.getElementById('buscar-cliente')?.addEventListener('input', filtrarClientes);
    document.getElementById('filtro-tipo-doc')?.addEventListener('change', filtrarClientes);

    // Listener para registrar nuevo cliente
    document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => {
        console.log('Abrir modal/formulario de nuevo cliente');
    });
});

/**
 * Consulta la tabla de clientes en Supabase
 */
async function cargarClientes() {
    const tbody = document.getElementById('tabla-clientes');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .order('nombre_razon_social', { ascending: true });

        if (error) throw error;

        listaClientes = data || [];
        renderizarTablaClientes(listaClientes);

    } catch (err) {
        console.error('Error al cargar la lista de clientes:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar los clientes.</td></tr>';
    }
}

/**
 * Renderiza los registros en la tabla HTML
 */
function renderizarTablaClientes(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    if (!tbody) return;

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron clientes registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(c => {
        const documento = c.numero_documento ? `${c.tipo_documento || 'DOC'}: ${c.numero_documento}` : '-';
        const totalCompras = c.total_compras ? `S/ ${parseFloat(c.total_compras).toFixed(2)}` : 'S/ 0.00';

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-weight: 600;">${documento}</td>
                <td style="padding: 12px;">${c.nombre_razon_social || '-'}</td>
                <td style="padding: 12px;">${c.telefono || '-'}</td>
                <td style="padding: 12px;">${c.email || '-'}</td>
                <td style="padding: 12px; font-weight: 600; color: #059669;">${totalCompras}</td>
                <td style="padding: 12px;">
                    <button type="button" onclick="verHistorialCliente('${c.id}')" title="Ver Historial" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">📜</button>
                    <button type="button" onclick="editarCliente('${c.id}')" title="Editar" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">✏️</button>
                    <button type="button" onclick="eliminarCliente('${c.id}')" title="Eliminar" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra los clientes según la búsqueda ingresada
 */
function filtrarClientes() {
    const texto = document.getElementById('buscar-cliente')?.value.toLowerCase().trim() || '';
    const tipoDoc = document.getElementById('filtro-tipo-doc')?.value || '';

    const filtrados = listaClientes.filter(c => {
        const doc = c.numero_documento || '';
        const nombre = c.nombre_razon_social || '';
        const telefono = c.telefono || '';

        const matchTexto = doc.toLowerCase().includes(texto) ||
                           nombre.toLowerCase().includes(texto) ||
                           telefono.includes(texto);

        const matchTipo = !tipoDoc || c.tipo_documento === tipoDoc;

        return matchTexto && matchTipo;
    });

    renderizarTablaClientes(filtrados);
}

function verHistorialCliente(id) {
    console.log('Ver historial de compras del cliente ID:', id);
}

function editarCliente(id) {
    console.log('Editar cliente ID:', id);
}

function eliminarCliente(id) {
    console.log('Eliminar cliente ID:', id);
}