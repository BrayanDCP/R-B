/* 
 * R&B - Lógica de Gestión de Proveedores
 */

let listaProveedores = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar proveedores desde Supabase
    await cargarProveedores();

    // 3. Listeners para búsqueda y eventos
    document.getElementById('buscar-proveedor')?.addEventListener('input', filtrarProveedores);

    // Listener para registrar nuevo proveedor
    document.getElementById('btn-nuevo-proveedor')?.addEventListener('click', () => {
        console.log('Abrir modal/formulario de nuevo proveedor');
    });
});

/**
 * Consulta la tabla de proveedores en Supabase
 */
async function cargarProveedores() {
    const tbody = document.getElementById('tabla-proveedores');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('proveedores')
            .select('*')
            .order('razon_social', { ascending: true });

        if (error) throw error;

        listaProveedores = data || [];
        renderizarTablaProveedores(listaProveedores);

    } catch (err) {
        console.error('Error al cargar la lista de proveedores:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar los proveedores.</td></tr>';
    }
}

/**
 * Renderiza los registros en la tabla HTML
 */
function renderizarTablaProveedores(proveedores) {
    const tbody = document.getElementById('tabla-proveedores');
    if (!tbody) return;

    if (proveedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron proveedores registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = proveedores.map(p => {
        const ruc = p.ruc || '-';
        const razonSocial = p.razon_social || '-';
        const contacto = p.contacto || '-';
        const telefono = p.telefono || '-';
        const correoDir = [p.email, p.direccion].filter(Boolean).join(' / ') || '-';

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-weight: 600;">${ruc}</td>
                <td style="padding: 12px;">${razonSocial}</td>
                <td style="padding: 12px;">${contacto}</td>
                <td style="padding: 12px;">${telefono}</td>
                <td style="padding: 12px;">${correoDir}</td>
                <td style="padding: 12px;">
                    <button type="button" onclick="editarProveedor('${p.id}')" title="Editar" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">✏️</button>
                    <button type="button" onclick="eliminarProveedor('${p.id}')" title="Eliminar" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra los proveedores según la búsqueda ingresada
 */
function filtrarProveedores() {
    const texto = document.getElementById('buscar-proveedor')?.value.toLowerCase().trim() || '';

    const filtrados = listaProveedores.filter(p => {
        const ruc = p.ruc || '';
        const razonSocial = p.razon_social || '';
        const contacto = p.contacto || '';
        const telefono = p.telefono || '';

        return ruc.toLowerCase().includes(texto) ||
               razonSocial.toLowerCase().includes(texto) ||
               contacto.toLowerCase().includes(texto) ||
               telefono.includes(texto);
    });

    renderizarTablaProveedores(filtrados);
}

function editarProveedor(id) {
    console.log('Editar proveedor ID:', id);
}

function eliminarProveedor(id) {
    console.log('Eliminar proveedor ID:', id);
}