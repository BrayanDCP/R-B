/* 
 * R.O.S.S.Y - Lógica de Configuración General del Sistema
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión de usuario
    const session = await checkAuthSession();
    if (!session) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Cargar configuraciones del sistema
    await cargarConfiguracion();

    // 3. Listeners para formularios de configuración
    document.getElementById('form-config-empresa')?.addEventListener('submit', guardarConfigEmpresa);
    document.getElementById('form-config-comprobantes')?.addEventListener('submit', guardarConfigComprobantes);
    document.getElementById('form-config-impresion')?.addEventListener('submit', guardarConfigImpresion);
});

/**
 * Carga la configuración global guardada en la base de datos Supabase
 */
async function cargarConfiguracion() {
    if (typeof supabaseClient === 'undefined') {
        console.error('Cliente de Supabase no disponible.');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('configuracion')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Datos generales de la empresa
            setInputValue('config-razon-social', data.razon_social || 'R.O.S.S.Y');
            setInputValue('config-ruc', data.ruc || '');
            setInputValue('config-telefono', data.telefono || '');
            setInputValue('config-direccion', data.direccion || '');
            setInputValue('config-email', data.email || '');
            setInputValue('config-igv', data.porcentaje_igv || 18);

            // Series y correlativos para comprobantes
            setInputValue('config-serie-boleta', data.serie_boleta || 'B001');
            setInputValue('config-correlativo-boleta', data.correlativo_boleta || 1);
            setInputValue('config-serie-factura', data.serie_factura || 'F001');
            setInputValue('config-correlativo-factura', data.correlativo_factura || 1);

            // Personalización de Ticket de Impresión
            setInputValue('config-pie-ticket', data.pie_pagina_ticket || '¡Gracias por tu compra en R.O.S.S.Y!');
            setInputValue('config-ancho-ticket', data.ancho_ticket_mm || 80);
        }
    } catch (err) {
        console.error('Error al cargar la configuración:', err);
        alert('No se pudieron cargar los datos de configuración.');
    }
}

/**
 * Guarda o actualiza los datos comerciales de la empresa
 */
async function guardarConfigEmpresa(e) {
    e.preventDefault();

    const payload = {
        razon_social: getInputValue('config-razon-social'),
        ruc: getInputValue('config-ruc'),
        telefono: getInputValue('config-telefono'),
        direccion: getInputValue('config-direccion'),
        email: getInputValue('config-email'),
        porcentaje_igv: parseFloat(getInputValue('config-igv')) || 18,
        updated_at: new Date().toISOString()
    };

    await actualizarConfiguracion(payload, 'Datos de la empresa guardados correctamente.');
}

/**
 * Guarda la numeración de series y correlativos de boletas y facturas
 */
async function guardarConfigComprobantes(e) {
    e.preventDefault();

    const payload = {
        serie_boleta: getInputValue('config-serie-boleta'),
        correlativo_boleta: parseInt(getInputValue('config-correlativo-boleta'), 10) || 1,
        serie_factura: getInputValue('config-serie-factura'),
        correlativo_factura: parseInt(getInputValue('config-correlativo-factura'), 10) || 1,
        updated_at: new Date().toISOString()
    };

    await actualizarConfiguracion(payload, 'Configuración de comprobantes actualizada.');
}

/**
 * Guarda los ajustes de impresión para tickets térmicos POS
 */
async function guardarConfigImpresion(e) {
    e.preventDefault();

    const payload = {
        pie_pagina_ticket: getInputValue('config-pie-ticket'),
        ancho_ticket_mm: parseInt(getInputValue('config-ancho-ticket'), 10) || 80,
        updated_at: new Date().toISOString()
    };

    await actualizarConfiguracion(payload, 'Ajustes de impresión guardados.');
}

/**
 * Función auxiliar para insertar o actualizar el registro de configuración en Supabase
 */
async function actualizarConfiguracion(datos, mensajeExito) {
    try {
        const { data: registros } = await supabaseClient
            .from('configuracion')
            .select('id')
            .limit(1);

        if (registros && registros.length > 0) {
            const { error } = await supabaseClient
                .from('configuracion')
                .update(datos)
                .eq('id', registros[0].id);

            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('configuracion')
                .insert([datos]);

            if (error) throw error;
        }

        alert(mensajeExito);
    } catch (err) {
        console.error('Error al guardar configuración:', err);
        alert('Ocurrió un error al intentar guardar los cambios.');
    }
}

// Helpers de utilidad para DOM
function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}