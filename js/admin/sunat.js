/* 
 * R&B - Lógica de Integración con SUNAT y Comprobantes Electrónicos
 */

/**
 * Valida matemáticamente la estructura de un RUC peruano (11 dígitos)
 * @param {string} ruc 
 * @returns {boolean}
 */
function validarRUC(ruc) {
    if (!/^\d{11}$/.test(ruc)) return false;

    const prefijo = ruc.substring(0, 2);
    // Prefijos válidos habituales: 10 (Persona Natural), 20 (Jurídica), 15, 17
    if (!['10', '15', '17', '20'].includes(prefijo)) return false;

    const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
        suma += parseInt(ruc.charAt(i), 10) * factores[i];
    }

    const residuo = suma % 11;
    let digitoCalculado = 11 - residuo;

    if (digitoCalculado === 10) digitoCalculado = 0;
    if (digitoCalculado === 11) digitoCalculado = 1;

    const digitoVerificador = parseInt(ruc.charAt(10), 10);
    return digitoCalculado === digitoVerificador;
}

/**
 * Valida la estructura de un DNI peruano (8 dígitos numéricos)
 * @param {string} dni 
 * @returns {boolean}
 */
function validarDNI(dni) {
    return /^\d{8}$/.test(dni);
}

/**
 * Consulta los datos de un DNI mediante Supabase Edge Function o API de identidad
 * @param {string} dni 
 * @returns {Promise<{nombreCompleto: string, nombres: string, apellidoPaterno: string, apellidoMaterno: string}>}
 */
async function consultarDNI(dni) {
    if (!validarDNI(dni)) {
        throw new Error('El DNI ingresado no tiene un formato válido (8 dígitos).');
    }

    try {
        // Invocación a Supabase Edge Function o API externa configurada
        const { data, error } = await supabaseClient.functions.invoke('consulta-dni', {
            body: { dni }
        });

        if (error) throw error;
        if (!data || !data.exito) throw new Error(data?.mensaje || 'No se encontraron datos para el DNI.');

        return {
            nombreCompleto: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno
        };
    } catch (err) {
        console.error('Error al consultar DNI:', err);
        throw err;
    }
}

/**
 * Consulta la razón social, estado y condición de un RUC mediante Supabase Edge Function o API
 * @param {string} ruc 
 * @returns {Promise<{razonSocial: string, direccion: string, estado: string, condicion: string}>}
 */
async function consultarRUC(ruc) {
    if (!validarRUC(ruc)) {
        throw new Error('El RUC ingresado no es válido.');
    }

    try {
        const { data, error } = await supabaseClient.functions.invoke('consulta-ruc', {
            body: { ruc }
        });

        if (error) throw error;
        if (!data || !data.exito) throw new Error(data?.mensaje || 'No se encontraron datos para el RUC.');

        return {
            razonSocial: data.razonSocial,
            direccion: data.direccion || '',
            estado: data.estado || 'ACTIVO',
            condicion: data.condicion || 'HABIDO'
        };
    } catch (err) {
        console.error('Error al consultar RUC:', err);
        throw err;
    }
}

/**
 * Prepara el payload JSON normado para el envío a OSE/PSE o generación de Comprobante
 * @param {Object} ventaData
 * @returns {Object} Payload formateado para Facturación Electrónica
 */
function construirPayloadComprobante(ventaData) {
    const { tipoComprobante, serie, correlativo, cliente, items, opGravada, igv, total } = ventaData;

    // 01 = Factura, 03 = Boleta de Venta
    const tipoDocCode = tipoComprobante === 'FACTURA' ? '01' : '03';

    return {
        tipoDoc: tipoDocCode,
        serie: serie, // Ej: 'B001' o 'F001'
        correlativo: correlativo,
        fechaEmision: new Date().toISOString().split('T')[0],
        moneda: 'PEN',
        cliente: {
            tipoDoc: cliente.tipoDoc, // '1' = DNI, '6' = RUC, '0' = Sin Doc
            numDoc: cliente.numDoc,
            rznSocial: cliente.razonSocial,
            direccion: cliente.direccion || '-'
        },
        montoOpGravada: parseFloat(opGravada).toFixed(2),
        montoIgv: parseFloat(igv).toFixed(2),
        montoTotal: parseFloat(total).toFixed(2),
        montoEnLetras: numeroALetras(total),
        items: items.map(item => ({
            codigo: item.codigo || 'PRD',
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            unidadMedida: 'NIU', // Unidad de producto
            precioUnitario: parseFloat(item.precioUnitario).toFixed(2),
            subtotal: parseFloat(item.subtotal).toFixed(2),
            igv: parseFloat(item.igv || 0).toFixed(2)
        }))
    };
}

/**
 * Transforma una cifra numérica a su representación formal en texto (Soles)
 * @param {number|string} monto 
 * @returns {string} Ejemplo: "SON: CIENTO CINCUENTA Y 00/100 SOLES"
 */
function numeroALetras(monto) {
    const num = parseFloat(monto) || 0;
    const entero = Math.floor(num);
    const decimales = Math.round((num - entero) * 100);

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCOENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = {
        11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
        16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE'
    };
    const cientos = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertirGrupo(n) {
        let output = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (n === 100) return 'CIEN';
        if (c > 0) output += cientos[c] + ' ';

        const resto = n % 100;
        if (resto >= 11 && resto <= 19) {
            output += especiales[resto];
        } else {
            if (d > 0) {
                output += decenas[d] + (u > 0 ? ' Y ' : '');
            }
            if (u > 0 && resto > 19) {
                output += unidades[u];
            } else if (u > 0 && d === 0) {
                output += unidades[u];
            }
        }
        return output.trim();
    }

    let textoEntero = '';
    if (entero === 0) {
        textoEntero = 'CERO';
    } else if (entero < 1000) {
        textoEntero = convertirGrupo(entero);
    } else if (entero < 1000000) {
        const miles = Math.floor(entero / 1000);
        const restoMiles = entero % 1000;
        const textoMiles = miles === 1 ? 'MIL' : `${convertirGrupo(miles)} MIL`;
        textoEntero = `${textoMiles} ${restoMiles > 0 ? convertirGrupo(restoMiles) : ''}`.trim();
    } else {
        textoEntero = entero.toString(); // Para montos mayores simplificado
    }

    const strDecimales = decimales < 10 ? `0${decimales}` : `${decimales}`;
    return `SON: ${textoEntero} Y ${strDecimales}/100 SOLES`.toUpperCase();
}