/* 
 * R&B - Lógica de Reportes y Estadísticas
 */

let chartInstancia = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Inicializar fechas por defecto (mes actual)
    inicializarFechas();

    // 3. Generar reporte inicial
    await generarReporte();

    // 4. Listeners para acciones
    document.getElementById('btn-generar-reporte')?.addEventListener('click', generarReporte);
    document.getElementById('tipo-reporte')?.addEventListener('change', generarReporte);
    document.getElementById('btn-exportar-excel')?.addEventListener('click', exportarExcel);
    document.getElementById('btn-exportar-pdf')?.addEventListener('click', exportarPDF);
});

/**
 * Configura las fechas por defecto (primer día del mes actual hasta hoy)
 */
function inicializarFechas() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const inputInicio = document.getElementById('reporte-fecha-inicio');
    const inputFin = document.getElementById('reporte-fecha-fin');

    if (inputInicio && !inputInicio.value) {
        inputInicio.value = primerDia.toISOString().split('T')[0];
    }
    if (inputFin && !inputFin.value) {
        inputFin.value = hoy.toISOString().split('T')[0];
    }
}

/**
 * Función principal para procesar y cargar el reporte seleccionado
 */
async function generarReporte() {
    const tipo = document.getElementById('tipo-reporte')?.value || 'ventas';
    const fechaInicio = document.getElementById('reporte-fecha-inicio')?.value;
    const fechaFin = document.getElementById('reporte-fecha-fin')?.value;

    actualizarCabeceraTabla(tipo);

    switch (tipo) {
        case 'ventas':
            await reporteVentasPorPeriodo(fechaInicio, fechaFin);
            break;
        case 'mas-vendidos':
            await reportePrendasMasVendidas(fechaInicio, fechaFin);
            break;
        case 'utilidad':
            await reporteGananciasUtilidad(fechaInicio, fechaFin);
            break;
        case 'vendedora':
            await reporteRendimientoVendedora(fechaInicio, fechaFin);
            break;
        case 'inventario':
            await reporteValorizacionInventario();
            break;
        default:
            console.warn('Tipo de reporte no reconocido:', tipo);
    }
}

/**
 * Ajusta la cabecera de la tabla según el tipo de reporte
 */
function actualizarCabeceraTabla(tipo) {
    const thead = document.getElementById('tabla-reportes-head');
    const tituloGrafico = document.getElementById('titulo-grafico');
    if (!thead) return;

    let headersHTML = '';
    let titulo = 'Vista Gráfica';

    if (tipo === 'ventas') {
        titulo = 'Evolución de Ventas por Fecha';
        headersHTML = `
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 12px;">Fecha</th>
                <th style="padding: 12px;">Transacciones</th>
                <th style="padding: 12px;">Monto Total (S/)</th>
            </tr>`;
    } else if (tipo === 'mas-vendidos') {
        titulo = 'Top Prendas con Mayor Rotación';
        headersHTML = `
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 12px;">Prenda / Producto</th>
                <th style="padding: 12px;">Unidades Vendidas</th>
                <th style="padding: 12px;">Ingreso Total (S/)</th>
            </tr>`;
    } else if (tipo === 'utilidad') {
        titulo = 'Comparativa de Ingresos vs Costos y Margen Neta';
        headersHTML = `
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 12px;">Período / Prenda</th>
                <th style="padding: 12px;">Ventas Totales</th>
                <th style="padding: 12px;">Costo de Compra</th>
                <th style="padding: 12px;">Ganancia Neta</th>
                <th style="padding: 12px;">Margen (%)</th>
            </tr>`;
    } else if (tipo === 'vendedora') {
        titulo = 'Ventas Acumuladas por Personal';
        headersHTML = `
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 12px;">Vendedora / Usuario</th>
                <th style="padding: 12px;">N° de Ventas</th>
                <th style="padding: 12px;">Total Vendido (S/)</th>
            </tr>`;
    } else if (tipo === 'inventario') {
        titulo = 'Valor Total del Stock en Almacén';
        headersHTML = `
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
                <th style="padding: 12px;">Categoría</th>
                <th style="padding: 12px;">Prendas Disponibles</th>
                <th style="padding: 12px;">Valor en Costo (S/)</th>
                <th style="padding: 12px;">Valor Estimado Venta (S/)</th>
            </tr>`;
    }

    thead.innerHTML = headersHTML;
    if (tituloGrafico) tituloGrafico.textContent = titulo;
}

/**
 * Reporte 1: Ventas por Período
 */
async function reporteVentasPorPeriodo(inicio, fin) {
    const tbody = document.getElementById('tabla-reportes-body');
    if (!tbody) return;

    if (typeof supabaseClient === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Error: Cliente de Supabase no disponible.</td></tr>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('ventas')
            .select('created_at, total')
            .gte('created_at', `${inicio}T00:00:00`)
            .lte('created_at', `${fin}T23:59:59`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Agrupar por fecha
        const agrupado = {};
        (data || []).forEach(v => {
            const fecha = v.created_at ? v.created_at.split('T')[0] : 'Sin fecha';
            if (!agrupado[fecha]) {
                agrupado[fecha] = { cantidad: 0, total: 0 };
            }
            agrupado[fecha].cantidad += 1;
            agrupado[fecha].total += parseFloat(v.total || 0);
        });

        const labels = Object.keys(agrupado);
        const valores = labels.map(f => agrupado[f].total);

        renderizarGrafico('line', labels, valores, 'Ventas Diarias (S/)', '#2563eb');

        if (labels.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#6b7280;">No hay datos de ventas en este rango.</td></tr>';
            return;
        }

        tbody.innerHTML = labels.map(f => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-weight: 600;">${f}</td>
                <td style="padding: 12px;">${agrupado[f].cantidad}</td>
                <td style="padding: 12px; font-weight: 600; color: #16a34a;">S/ ${agrupado[f].total.toFixed(2)}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Error al generar reporte de ventas:', err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar datos del reporte.</td></tr>';
    }
}

/**
 * Reporte 2: Prendas Más Vendidas
 */
async function reportePrendasMasVendidas(inicio, fin) {
    const tbody = document.getElementById('tabla-reportes-body');
    if (!tbody) return;

    renderizarGrafico('bar', [], [], 'Sin datos', '#10b981');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#6b7280;">Seleccione un período para consultar prendas más vendidas.</td></tr>';
}

/**
 * Reporte 3: Ganancias y Margen de Utilidad
 */
async function reporteGananciasUtilidad(inicio, fin) {
    const tbody = document.getElementById('tabla-reportes-body');
    if (!tbody) return;

    renderizarGrafico('bar', [], [], 'Ganancia Neta (S/)', '#059669');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#6b7280;">Sin datos de utilidad en el rango seleccionado.</td></tr>';
}

/**
 * Reporte 4: Rendimiento por Vendedora
 */
async function reporteRendimientoVendedora(inicio, fin) {
    const tbody = document.getElementById('tabla-reportes-body');
    if (!tbody) return;

    renderizarGrafico('doughnut', [], [], 'Ventas por Vendedora', '#8b5cf6');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#6b7280;">Sin datos registrados para vendedoras.</td></tr>';
}

/**
 * Reporte 5: Valorización de Inventario
 */
async function reporteValorizacionInventario() {
    const tbody = document.getElementById('tabla-reportes-body');
    if (!tbody) return;

    renderizarGrafico('bar', [], [], 'Valor del Stock (S/)', '#f59e0b');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280;">Cargando valorización del almacén...</td></tr>';
}

/**
 * Renderiza o actualiza el gráfico con Chart.js
 */
function renderizarGrafico(tipo, labels, data, labelDataset, color) {
    const ctx = document.getElementById('chartReportes');
    if (!ctx) return;

    if (chartInstancia) {
        chartInstancia.destroy();
    }

    chartInstancia = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                label: labelDataset,
                data: data.length ? data : [0],
                backgroundColor: tipo === 'doughnut' ? ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] : (color + '33'),
                borderColor: color,
                borderWidth: 2,
                fill: tipo === 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: tipo === 'doughnut' }
            },
            scales: tipo !== 'doughnut' ? { y: { beginAtZero: true } } : {}
        }
    });
}

function exportarExcel() {
    console.log('Generando archivo Excel del reporte actual...');
}

function exportarPDF() {
    console.log('Generando archivo PDF del reporte actual...');
}