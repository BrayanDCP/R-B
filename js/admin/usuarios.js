/* 
 * R&B - Lógica de Gestión de Usuarios y Personal
 */

let listaUsuarios = [];
let usuarioSeleccionadoId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario y rol de administrador
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar listado inicial de usuarios
    await cargarUsuarios();

    // 3. Listeners de búsqueda y filtros
    document.getElementById('input-buscar-usuario')?.addEventListener('input', filtrarUsuarios);
    document.getElementById('select-filtro-rol')?.addEventListener('change', filtrarUsuarios);

    // 4. Listeners para modal y formularios
    document.getElementById('btn-nuevo-usuario')?.addEventListener('click', abrirModalNuevoUsuario);
    document.getElementById('form-usuario')?.addEventListener('submit', guardarUsuario);
});

/**
 * Consulta la lista de usuarios desde la base de datos Supabase
 */
async function cargarUsuarios() {
    const tbody = document.getElementById('tabla-usuarios-body');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        listaUsuarios = data || [];
        renderizarTablaUsuarios(listaUsuarios);

    } catch (err) {
        console.error('Error al cargar usuarios:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar la lista de usuarios.</td></tr>';
    }
}

/**
 * Renderiza la lista de usuarios en la tabla HTML
 * @param {Array} usuarios 
 */
function renderizarTablaUsuarios(usuarios) {
    const tbody = document.getElementById('tabla-usuarios-body');
    if (!tbody) return;

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron usuarios registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = usuarios.map(u => {
        const estadoBadge = u.activo
            ? '<span style="padding: 4px 8px; border-radius: 4px; background: #d1fae5; color: #059669; font-weight: 600;">Activo</span>'
            : '<span style="padding: 4px 8px; border-radius: 4px; background: #fee2e2; color: #dc2626; font-weight: 600;">Inactivo</span>';

        const rolBadge = u.rol === 'ADMIN'
            ? '<span style="padding: 4px 8px; border-radius: 4px; background: #dbeafe; color: #2563eb; font-weight: 600;">Administrador</span>'
            : '<span style="padding: 4px 8px; border-radius: 4px; background: #f3f4f6; color: #374151;">Vendedora</span>';

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-weight: 600;">${u.nombre || '-'}</td>
                <td style="padding: 12px;">${u.email || '-'}</td>
                <td style="padding: 12px;">${u.dni || '-'}</td>
                <td style="padding: 12px;">${rolBadge}</td>
                <td style="padding: 12px;">${estadoBadge}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="editarUsuario('${u.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 4px;">
                        Editar
                    </button>
                    <button onclick="toggleEstadoUsuario('${u.id}', ${u.activo})" style="background: ${u.activo ? '#ef4444' : '#10b981'}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        ${u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra los usuarios localmente por texto de búsqueda y rol
 */
function filtrarUsuarios() {
    const texto = document.getElementById('input-buscar-usuario')?.value.toLowerCase().trim() || '';
    const rol = document.getElementById('select-filtro-rol')?.value || 'TODOS';

    const filtrados = listaUsuarios.filter(u => {
        const coincideTexto = (u.nombre || '').toLowerCase().includes(texto) ||
                              (u.email || '').toLowerCase().includes(texto) ||
                              (u.dni || '').includes(texto);

        const coincideRol = rol === 'TODOS' || u.rol === rol;

        return coincideTexto && coincideRol;
    });

    renderizarTablaUsuarios(filtrados);
}

/**
 * Prepara el modal para registrar un nuevo usuario
 */
function abrirModalNuevoUsuario() {
    usuarioSeleccionadoId = null;
    const form = document.getElementById('form-usuario');
    if (form) form.reset();

    const titulo = document.getElementById('modal-usuario-titulo');
    if (titulo) titulo.textContent = 'Nuevo Usuario';

    const modal = document.getElementById('modal-usuario');
    if (modal) modal.style.display = 'flex';
}

/**
 * Prepara el modal con los datos del usuario a editar
 * @param {string} id 
 */
function editarUsuario(id) {
    const usuario = listaUsuarios.find(u => u.id === id);
    if (!usuario) return;

    usuarioSeleccionadoId = id;

    const inputNombre = document.getElementById('usuario-nombre');
    const inputEmail = document.getElementById('usuario-email');
    const inputDNI = document.getElementById('usuario-dni');
    const selectRol = document.getElementById('usuario-rol');

    if (inputNombre) inputNombre.value = usuario.nombre || '';
    if (inputEmail) inputEmail.value = usuario.email || '';
    if (inputDNI) inputDNI.value = usuario.dni || '';
    if (selectRol) selectRol.value = usuario.rol || 'VENDEDOR';

    const titulo = document.getElementById('modal-usuario-titulo');
    if (titulo) titulo.textContent = 'Editar Usuario';

    const modal = document.getElementById('modal-usuario');
    if (modal) modal.style.display = 'flex';
}

/**
 * Guarda o actualiza los datos del usuario en Supabase
 * @param {Event} e 
 */
async function guardarUsuario(e) {
    e.preventDefault();

    const nombre = document.getElementById('usuario-nombre')?.value.trim();
    const email = document.getElementById('usuario-email')?.value.trim();
    const dni = document.getElementById('usuario-dni')?.value.trim();
    const rol = document.getElementById('usuario-rol')?.value;

    if (!nombre || !email) {
        alert('Por favor complete los campos obligatorios (Nombre y Correo).');
        return;
    }

    try {
        if (usuarioSeleccionadoId) {
            // Edición de usuario existente
            const { error } = await supabaseClient
                .from('usuarios')
                .update({ nombre, email, dni, rol, updated_at: new Date().toISOString() })
                .eq('id', usuarioSeleccionadoId);

            if (error) throw error;
        } else {
            // Creación de nuevo usuario
            const { error } = await supabaseClient
                .from('usuarios')
                .insert([{ nombre, email, dni, rol, activo: true }]);

            if (error) throw error;
        }

        cerrarModalUsuario();
        await cargarUsuarios();

    } catch (err) {
        console.error('Error al guardar usuario:', err);
        alert('Ocurrió un error al guardar los datos del usuario.');
    }
}

/**
 * Alterna el estado activo/inactivo de un usuario
 * @param {string} id 
 * @param {boolean} estadoActual 
 */
async function toggleEstadoUsuario(id, estadoActual) {
    const confirmacion = confirm(`¿Está seguro de que desea ${estadoActual ? 'desactivar' : 'activar'} a este usuario?`);
    if (!confirmacion) return;

    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .update({ activo: !estadoActual, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        await cargarUsuarios();

    } catch (err) {
        console.error('Error al cambiar estado del usuario:', err);
        alert('No se pudo cambiar el estado del usuario.');
    }
}

/**
 * Cierra el modal de formulario de usuario
 */
function cerrarModalUsuario() {
    const modal = document.getElementById('modal-usuario');
    if (modal) modal.style.display = 'none';
}