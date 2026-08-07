/* 
 * R&B - Lógica del Dashboard Administrador
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar autenticación
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar métricas e inicializar gráficos
    await cargarMetricasDashboard();
    inicializarGraficos();
});

/**
 * Consulta y actualiza los indicadores clave del Dashboard
 */
async function cargarMetricasDashboard() {
    if (typeof supabaseClient === 'undefined') return;

    try {
        // Cargar conteo de productos con stock bajo (< 3 unidades)
        const { data: stockBajo, error: errStock } = await supabaseClient
            .from('productos')
            .select('id', { count: 'exact' })
            .lt('stock', 3);

        if (!errStock && stockBajo) {
            const elStock = document.getElementById('v-stock-bajo');
            if (elStock) elStock.textContent = stockBajo.length || 0;
        }

        // Cargar total de clientes
        const { data: clientes, error: errClientes } = await supabaseClient
            .from('clientes')
            .select('id', { count: 'exact' });

        if (!errClientes && clientes) {
            const elClientes = document.getElementById('v-clientes');
            if (elClientes) elClientes.textContent = clientes.length || 0;
        }

    } catch (error) {
        console.error('Error al cargar datos del Dashboard:', error);
    }
}

/**
 * Inicializa los gráficos de Chart.js
 */
function inicializarGraficos() {
    // Gráfico 1: Ventas de la Semana
    const ctxVentas = document.getElementById('chartVentas');
    if (ctxVentas) {
        new Chart(ctxVentas, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Ventas (S/)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Gráfico 2: Prendas Más Vendidas
    const ctxTop = document.getElementById('chartTopProductos');
    if (ctxTop) {
        new Chart(ctxTop, {
            type: 'bar',
            data: {
                labels: ['Sin datos'],
                datasets: [{
                    label: 'Unidades',
                    data: [0],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}