/* 
 * R&B - Lógica de Control y Movimientos de Caja
 */

let listaMovimientos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Establecer fecha actual en el selector
    const elFecha = document.getElementById('fecha-caja');
    if (elFecha) {
        const hoy = new Date().toISOString().split('T')[0];
        elFecha.value = hoy;
        elFecha.addEventListener('change', cargarDatosCaja);
    }

    // 3. Cargar datos de caja y movimientos
    await cargarDatosCaja();

    // 4. Listeners para botones de acción
    document.getElementById('btn-registrar-movimiento')?.addEventListener('click', () => {
        console.log('Abrir modal de nuevo movimiento de caja');
    });

    document.getElementById('btn-cerrar-caja')?.addEventListener('click', () => {
        console.log('Iniciar proceso de arqueo y cierre de caja');
    });
});

/**
 * Carga el resumen y los movimientos de caja para la fecha seleccionada
 */
async function cargarDatosCaja() {
    const fecha = document.getElementById('fecha-caja')?.value || new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('tabla-caja-movimientos');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Error: Cliente de Supabase no configurado.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('caja_movimientos')
            .select('*, usuarios(nombre)')
            .gte('created_at', `${fecha}T00:00:00`)
            .lte('created_at', `${fecha}T23:59:59`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        listaMovimientos = data || [];
        actualizarResumenCaja(listaMovimientos);
        renderizarTablaMovimientos(listaMovimientos);

    } catch (err) {
        console.error('Error al cargar datos de caja:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar movimientos de caja.</td></tr>';
    }
}

/**
 * Calcula y actualiza las métricas superiores del panel
 */
function actualizarResumenCaja(movimientos) {
    let inicial = 0;
    let ingresos = 0;
    let egresos = 0;

    movimientos.forEach(m => {
        const monto = parseFloat(m.monto || 0);
        if (m.tipo === 'APERTURA') {
            inicial += monto;
        } else if (m.tipo === 'INGRESO' || m.tipo === 'VENTA') {
            ingresos += monto;
        } else if (m.tipo === 'EGRESO' || m.tipo === 'GASTO') {
            egresos += monto;
        }
    });

    const saldoActual = inicial + ingresos - egresos;

    const elInicial = document.getElementById('caja-monto-inicial');
    const elIngresos = document.getElementById('caja-ingresos');
    const elEgresos = document.getElementById('caja-egresos');
    const elSaldo = document.getElementById('caja-saldo-actual');

    if (elInicial) elInicial.textContent = `S/ ${inicial.toFixed(2)}`;
    if (elIngresos) elIngresos.textContent = `S/ ${ingresos.toFixed(2)}`;
    if (elEgresos) elEgresos.textContent = `S/ ${egresos.toFixed(2)}`;
    if (elSaldo) elSaldo.textContent = `S/ ${saldoActual.toFixed(2)}`;
}

/**
 * Renderiza los movimientos en la tabla HTML
 */
function renderizarTablaMovimientos(movimientos) {
    const tbody = document.getElementById('tabla-caja-movimientos');
    if (!tbody) return;

    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280;">No hay movimientos registrados para esta fecha.</td></tr>';
        return;
    }

    tbody.innerHTML = movimientos.map(m => {
        const hora = m.created_at ? new Date(m.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '-';
        const usuario = m.usuarios?.nombre || 'Sistema';
        
        let badgeTipo = `<span style="padding: 4px 8px; border-radius: 4px; background: #e5e7eb; color: #374151;">${m.tipo || 'OTRO'}</span>`;
        let colorMonto = '#111827';

        if (m.tipo === 'INGRESO' || m.tipo === 'VENTA') {
            badgeTipo = '<span style="padding: 4px 8px; border-radius: 4px; background: #d1fae5; color: #059669; font-weight: 600;">Ingreso</span>';
            colorMonto = '#16a34a';
        } else if (m.tipo === 'EGRESO' || m.tipo === 'GASTO') {
            badgeTipo = '<span style="padding: 4px 8px; border-radius: 4px; background: #fee2e2; color: #dc2626; font-weight: 600;">Egreso</span>';
            colorMonto = '#dc2626';
        } else if (m.tipo === 'APERTURA') {
            badgeTipo = '<span style="padding: 4px 8px; border-radius: 4px; background: #dbeafe; color: #2563eb; font-weight: 600;">Apertura</span>';
        }

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px;">${hora}</td>
                <td style="padding: 12px;">${badgeTipo}</td>
                <td style="padding: 12px;">${m.concepto || '-'}</td>
                <td style="padding: 12px;">${m.medio_pago || 'Efectivo'}</td>
                <td style="padding: 12px;">${usuario}</td>
                <td style="padding: 12px; font-weight: 600; color: ${colorMonto};">S/ ${parseFloat(m.monto || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}