/* 
 * R&B - Lógica de Gestión de Inventario
 */

let listaProductos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar datos iniciales
    await cargarCategorias();
    await cargarProductos();

    // 3. Listeners para filtros
    document.getElementById('buscar-inventario')?.addEventListener('input', filtrarTabla);
    document.getElementById('filtro-categoria')?.addEventListener('change', filtrarTabla);
    document.getElementById('filtro-stock')?.addEventListener('change', filtrarTabla);
});

/**
 * Carga las categorías disponibles en el selector
 */
async function cargarCategorias() {
    if (typeof supabaseClient === 'undefined') return;

    try {
        const { data, error } = await supabaseClient
            .from('categorias')
            .select('id, nombre');

        if (error) throw error;

        const selectCat = document.getElementById('filtro-categoria');
        if (selectCat && data) {
            data.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                selectCat.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error al cargar categorías:', err);
    }
}

/**
 * Carga la lista de productos desde Supabase
 */
async function cargarProductos() {
    const tbody = document.getElementById('tabla-productos');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*, categorias(nombre), marcas(nombre)');

        if (error) throw error;

        listaProductos = data || [];
        renderizarTabla(listaProductos);

    } catch (err) {
        console.error('Error al obtener inventario:', err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar el inventario.</td></tr>';
    }
}

/**
 * Renderiza las filas de la tabla de inventario
 */
function renderizarTabla(productos) {
    const tbody = document.getElementById('tabla-productos');
    if (!tbody) return;

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#6b7280;">No se encontraron productos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(p => {
        const categoria = p.categorias?.nombre || '-';
        const marca = p.marcas?.nombre || '-';
        const stockClass = p.stock <= 0 ? 'color: #dc2626; font-weight: bold;' : (p.stock < 3 ? 'color: #d97706; font-weight: bold;' : '');

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px;">${p.codigo || '-'}</td>
                <td style="padding: 12px; font-weight: 600;">${p.nombre || 'Sin nombre'}</td>
                <td style="padding: 12px;">${categoria}</td>
                <td style="padding: 12px;">${marca}</td>
                <td style="padding: 12px;">S/ ${parseFloat(p.precio || 0).toFixed(2)}</td>
                <td style="padding: 12px; ${stockClass}">${p.stock ?? 0}</td>
                <td style="padding: 12px;">
                    <button type="button" onclick="editarProducto('${p.id}')" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">✏️</button>
                    <button type="button" onclick="eliminarProducto('${p.id}')" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtra los productos según los criterios de búsqueda
 */
function filtrarTabla() {
    const texto = document.getElementById('buscar-inventario')?.value.toLowerCase().trim() || '';
    const catId = document.getElementById('filtro-categoria')?.value || '';
    const estadoStock = document.getElementById('filtro-stock')?.value || '';

    const filtrados = listaProductos.filter(p => {
        const matchTexto = (p.codigo && p.codigo.toLowerCase().includes(texto)) || 
                           (p.nombre && p.nombre.toLowerCase().includes(texto));
        const matchCat = catId === '' || p.categoria_id == catId;
        
        let matchStock = true;
        if (estadoStock === 'bajo') matchStock = p.stock > 0 && p.stock < 3;
        if (estadoStock === 'agotado') matchStock = p.stock <= 0;

        return matchTexto && matchCat && matchStock;
    });

    renderizarTabla(filtrados);
}

function editarProducto(id) {
    console.log('Editar producto ID:', id);
}

function eliminarProducto(id) {
    console.log('Eliminar producto ID:', id);
}