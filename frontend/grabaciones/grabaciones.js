// ============================================================================
// GRABACIONES ADESLAS v2.0 - JavaScript
// ============================================================================

// ============================================================================
// CONFIGURACIÓN DE PIPEDRIVE
// ============================================================================
const CONFIG = {
    API_TOKEN: '70b5bb90941472cb81856a0d9c2dabdb209552e2',
    API_URL: 'https://api.pipedrive.com/v1',
    
    // Pipelines por producto
    PIPELINES: {
        'SALUD': 10,
        'DENTAL': 11,
        'DECESOS': 12,
        'MASCOTAS': 13
    },
    
    DEAL_FIELDS: {
        tipoPoliza: '3bbf1d7498851d89b0a1c8058bf63581284fd223',
        numSolicitud: 'e52a6275eab20be44e25ae4d0299c60d4d5f25b8',
        numPoliza: '0becdaead32abfdda6eac11a73dc89b22760725f',
        precio: '5618371c04237f61f24ef097b1038d9eec00d3df',
        numAsegurados: 'b9a7a346963c4c6ebe2ecfc9f06a6a11ed581d03',
        efecto: 'ccc79ae1430a738779b1458fca6c92a048523c31',
        descuento: '15a955b1555b507810cd34a9a22d4b03506ed1a7',
        nombreTitular: '7be436a2ba6a9716faa8297f9217eb6a399fce7b',
        dniTitular: 'ac4b5a68dd8017ad4e272a277acfa3900083ec2c',
        fechaNacTitular: 'b6e5e600603abc4ef5fa0adada3afbb8e87f2af0',
        sexoTitular: 'f30ff90ede820fd3cbe38e0d3fabcd2b340a64ec',
        parentescoTitular: 'e41ab93d2f6464a1a563f43d7e3d020414700e9f',
        direccion: '4174ce87fa81673775d04dc415ece3df77bcdba9',
        poblacion: '6c12cd4518ba4bc5b39d8a537ad1a656c8f7fcb4',
        codigoPostal: '3df0724c19951d401cac42b4bc5b1b657eb36d50',
        provincia: '59254e99faba7f7363e90a38cfe9bda47e868e56',
        iban: '96989616deb0d45af2c7ca9b4f3cb8690f1e1e21',
        frecuenciaPago: 'bec5e85fc187a079508a772b11d07bb016f09365',
        estadoCivil: '61f7204af03724e4c808716a449207cd13333983',
        nacionalidad: 'af52237fd40a2dc8c6a872d9a3189c67396560a4',
        
        asegurados: {
            2: { nombre: '2e833616277d6c808d7ed3603bd3f04afd3609d8', fecha: '5b539de7f25c08c9417808f0a733dcb04a707c2b', sexo: '2aa3a827d0f43414e25d304143f1e22024a71cf5', dni: 'a52d24d9c6544caddbb21654f8c8ce590257cbab', parentesco: '701dc45d154ab9c8a3c08169b6a0c2fe5b5da9cc' },
            3: { nombre: 'f88ec3af15607b52a5bdf445fc9bd8d97cef67b8', fecha: '4c3e7be32af9c49f65115ac32458f020f87abe95', sexo: '443faf06fdcba03275f07684fcd4d50347ed8bca', dni: '4df61a56d4d899081602208a2ee672ff1c352f94', parentesco: 'a17389a87869a3fda1f0823912c559958df58859' },
            4: { nombre: '280d8343abffec7ca1e6aafb940f61a2b46ef80a', fecha: '4faca26aa6ce50bbb0e7a018d1465f40db7348ec', sexo: '9608f329edbbad01da633e5ffca2715e75a6d3d3', dni: '0bb2899158279832e32f98cb21da2093ab3230d4', parentesco: '51c134224255000caf5abde7d72696527831006c' },
            5: { nombre: '168af5c31afff939aa5314d28b02264189318bda', fecha: 'cb7bf6cda9ce92d58dab81362e140dc88e7adee6', sexo: '9eb820b9a9eeb39e7eee7731d03f436c82eb342e', dni: '3b44f3516911d8f62879da920477eb9105ce5101', parentesco: '104e08246e9356d4a5f1d693992e8b9146585e48' },
            6: { nombre: '8864a8cd8dd30c1dd6a9b5094f865edd309ee971', fecha: 'd8e0cff68f0a054ef94518d06670786ae89b259b', sexo: '1f6d1e3f505172c97797bb71ce54bc7b75b6a250', dni: '584fd4a1af91998cab077ba221b695a0bc44cfdf', parentesco: 'c177bb9b600f3489ad846dd5c95552dea68c24a7' },
            7: { nombre: 'b962fa7a0f550efca6efb95f4b2df071491855b1', fecha: 'cd7a3694b77a3d98edfbed9cfca6d29f1470a68f', sexo: '007b3e4dc7377091d101cd0ba7566e51d4c268ec', dni: 'd15181a25f5fe0d022cb758ddf0bb0dce75bcbf4', parentesco: 'c1dcd253b93c5cae2b188d0858418c53a1548081' },
            8: { nombre: 'a269807d90f3390282e8c684728d8914fb0b5c76', fecha: 'ce5ba7401dc24812d1c06337b4223d79883b9b5a', sexo: '0c0f8813822d10e48da49bc0dbd48ed025e3d355', dni: '4c2d05767cac56e3e7a36495634fa99bf317cd77', parentesco: '7ad405d0033f87e54ab06c0ed33be992badd9edf' },
            9: { nombre: '7aec7960abb01d016e5285d23a3cff69d1fd5834', fecha: '91d398b8fc89aa9a469f962ac3730617b898d2d7', sexo: '40bd14d2bf21def6ff1a0adcbfa8b7ba0eebfa1f', dni: '82a07af17b1a2032e969ca8945c7419e3f3ad54b', parentesco: 'afcacd4f2691279fae88c765f51bb7d0eada54a9' },
            10: { nombre: '8ab7bbf3d22e06d1bff14b63f41da94f71f0f3e3', fecha: 'cfceacc4062b165c62bf3b804f14664264970168', sexo: '4ef7fb408d1198b9413e91c73d27b2c04cf14c32', dni: '95b35c31f6266c137bdefdadab44887d439fb06b', parentesco: '8ee8ce964b517a0df49084db8d2336e54a32c37b' },
            11: { nombre: 'ea4d8a1a66c36b4b1f7b9f672ac79538c9f4da5c', fecha: 'f380f6df390a61967082945115412498acbb63f9', sexo: 'fad4e3ef898234b70fffcdd696572604545a051b', dni: 'af5ca2305d55f7272635ee75c4b2297cc718e092', parentesco: '3e45007376d178607e6ca8c243675723d78a249b' },
            12: { nombre: '01a376237efefb65a127835e7958ee97227d2770', fecha: 'e24472feb836b489962831d00738b1c7534363db', sexo: '9f9f2b7d67e9d6ed70bdddf43159427ed58478dd', dni: 'aef301a8c911c9f55365369688d6b16f9cbe16a5', parentesco: 'ac52dcfaa87c961e2dd997e2fb94bd3bf83c0f22' }
        }
    },
    
    PROVINCIAS: {
        147: 'ÁLAVA', 148: 'ALBACETE', 149: 'ALICANTE', 150: 'ALMERÍA', 151: 'ASTURIAS',
        152: 'ÁVILA', 153: 'BADAJOZ', 154: 'BALEARES', 155: 'BARCELONA', 156: 'BURGOS',
        157: 'CÁCERES', 158: 'CÁDIZ', 159: 'CANTABRIA', 160: 'CASTELLÓN', 161: 'CEUTA',
        162: 'CIUDAD REAL', 163: 'CÓRDOBA', 164: 'CUENCA', 165: 'GIRONA', 166: 'GRANADA',
        167: 'GUADALAJARA', 168: 'GUIPÚZCOA', 169: 'HUELVA', 170: 'HUESCA', 171: 'JAÉN',
        172: 'LA CORUÑA', 173: 'LA RIOJA', 174: 'LAS PALMAS', 175: 'LEÓN', 176: 'LLEIDA',
        177: 'LUGO', 178: 'MADRID', 179: 'MÁLAGA', 180: 'MELILLA', 181: 'MURCIA',
        182: 'NAVARRA', 183: 'OURENSE', 184: 'PALENCIA', 185: 'PONTEVEDRA', 186: 'SALAMANCA',
        187: 'SANTA CRUZ DE TENERIFE', 188: 'SEGOVIA', 189: 'SEVILLA', 190: 'SORIA',
        191: 'TARRAGONA', 192: 'TERUEL', 193: 'TOLEDO', 194: 'VALENCIA', 195: 'VALLADOLID',
        196: 'VIZCAYA', 197: 'ZAMORA', 198: 'ZARAGOZA'
    },

    PARENTESCOS: ['CÓNYUGE', 'HIJ@', 'HERMAN@', 'ABUEL@S', 'OTRA FAMILIA', 'OTRA']
};

const PROVINCIAS_INV = {};
Object.entries(CONFIG.PROVINCIAS).forEach(([id, nombre]) => {
    PROVINCIAS_INV[nombre] = parseInt(id);
    PROVINCIAS_INV[nombre.toLowerCase()] = parseInt(id);
});

// ============================================================================
// ESTADO GLOBAL
// ============================================================================
let dealId = null;
let dealOriginal = null;
let personaOriginal = null;
let notasPropuestas = [];
let propuestaSeleccionada = null;
let pasoActual = 0;
let asegurados = [];
let esPolizaGO = false;
let esPolizaSenior = false;
let esPolizaEmpresa = false; // Si es póliza de empresa (NEGOCIO CIF, EMPRESA +5, PYME)
let tomadorEsAsegurado = true; // Si el tomador también es asegurado (false = solo paga)
let tipoProducto = 'SALUD'; // SALUD, MASCOTAS, DENTAL, DECESOS
let datosMascota = { nombre: '', tipo: '', raza: '', fechaNacimiento: '', chip: '' };
let dealYaTieneGrabacion = false; // Si el deal ya tiene una grabación previa

// Productos de empresa
const PRODUCTOS_EMPRESA = ['NEGOCIO CIF 1-4', 'NEGOCIO CIF 1-4 EXTRA 150', 'EMPRESA +5', 'EMPRESA +5 EXTRA 150', 'PYME TOTAL'];

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIALIZANDO PÁGINA ===');
    console.log('URL actual:', window.location.href);
    
    // Inicializar select de provincias para tomador persona
    const selectProvincia = document.getElementById('tomadorProvincia');
    Object.entries(CONFIG.PROVINCIAS).forEach(([id, nombre]) => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        selectProvincia.appendChild(option);
    });
    
    // Inicializar select de provincias para empresa
    const selectProvinciaEmpresa = document.getElementById('empresaProvincia');
    if (selectProvinciaEmpresa) {
        Object.entries(CONFIG.PROVINCIAS).forEach(([id, nombre]) => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            selectProvinciaEmpresa.appendChild(option);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const dealIdUrl = urlParams.get('deal') || urlParams.get('deal_id');
    console.log('Deal ID desde URL:', dealIdUrl);
    
    if (dealIdUrl) {
        console.log('Cargando deal automáticamente...');
        document.getElementById('inputDealId').value = dealIdUrl;
        cargarDeal();
    }

    const hoy = new Date();
    const primerDiaProximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    document.getElementById('fechaEfecto').value = primerDiaProximoMes.toISOString().split('T')[0];
    
    console.log('=== INICIALIZACIÓN COMPLETADA ===');
});

// ============================================================================
// FUNCIONES DE API
// ============================================================================
async function fetchAPI(endpoint, options = {}) {
    const url = `${CONFIG.API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${CONFIG.API_TOKEN}`;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        const data = await response.json();
        if (!data.success && data.error) throw new Error(data.error);
        return data.data || null;
    } catch (error) {
        console.error('Error API:', error);
        throw error;
    }
}

// ============================================================================
// CARGAR DEAL
// ============================================================================
async function cargarDeal() {
    console.log('=== FUNCIÓN cargarDeal INICIADA ===');
    dealId = document.getElementById('inputDealId').value.trim();
    console.log('Deal ID a cargar:', dealId);
    
    if (!dealId) { 
        mostrarError('Por favor, introduce un ID de Deal'); 
        console.log('Error: Deal ID vacío');
        return; 
    }

    const btn = document.getElementById('btnCargar');
    btn.innerHTML = '<div class="loader"></div><span>Cargando...</span>';
    btn.disabled = true;

    try {
        console.log('Llamando a API para deal:', dealId);
        dealOriginal = await fetchAPI(`/deals/${dealId}`);
        
        if (dealOriginal.person_id) {
            const personId = dealOriginal.person_id.value || dealOriginal.person_id;
            personaOriginal = await fetchAPI(`/persons/${personId}`);
        }

        // Traer todas las notas (hasta 500)
        let notas = [];
        try {
            const notasResponse = await fetchAPI(`/deals/${dealId}/notes?start=0&limit=500`);
            notas = notasResponse || [];
        } catch (e) {
            console.log('No se pudieron cargar notas:', e);
            notas = [];
        }
        
        // DETECTAR SI YA TIENE UNA GRABACIÓN PREVIA
        dealYaTieneGrabacion = notas.some(nota => {
            const contenido = (nota.content || '').toUpperCase();
            return contenido.includes('GRABACIÓN PÓLIZA ADESLAS') || 
                   contenido.includes('GRABACIÓN DE PÓLIZA') ||
                   contenido.includes('═══ GRABACIÓN');
        });
        console.log('¿Deal ya tiene grabación?:', dealYaTieneGrabacion);
        
        buscarPropuestasSalud(notas);
        mapearDatosBasicos();

        document.getElementById('dealInfo').classList.remove('hidden');
        document.getElementById('dealIdHeader').textContent = dealId;
        document.getElementById('dealTitle').textContent = dealOriginal.title;
        document.getElementById('paso0').classList.add('hidden');
        document.getElementById('formulario').classList.remove('hidden');
        
        pasoActual = 1;
        actualizarNavegacion();
        
        let mensaje = `Deal "${dealOriginal.title}" cargado. ${notasPropuestas.length} propuesta(s) encontrada(s).`;
        if (dealYaTieneGrabacion) {
            mensaje += ' ⚠️ Este deal YA tiene grabación - se creará nuevo deal.';
        }
        mostrarExito(mensaje);

    } catch (error) {
        mostrarError(`Error cargando deal: ${error.message}`);
    } finally {
        btn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg><span>Cargar Deal</span>';
        btn.disabled = false;
    }
}

// ============================================================================
// BUSCAR PROPUESTAS (TODOS LOS PRODUCTOS)
// ============================================================================
function buscarPropuestasSalud(notas) {
    notasPropuestas = [];
    const selector = document.getElementById('selectorPropuesta');
    selector.innerHTML = '<option value="">-- Selecciona una propuesta --</option>';

    if (!notas || notas.length === 0) {
        document.getElementById('sinPropuestas').classList.remove('hidden');
        return;
    }

    notas.forEach((nota) => {
        const contenido = nota.content || '';
        const contenidoUpper = contenido.toUpperCase();
        const fecha = nota.add_time;
        
        // === DETECTAR SI ES NOTA MULTIPRODUCTO (Campaña MásProtección) ===
        const esMultiproducto = contenidoUpper.includes('PRESUPUESTO ADESLAS') || 
                                contenidoUpper.includes('PRODUCTOS CONTRATADOS') ||
                                contenidoUpper.includes('PUNTOS CAMPAÑA');
        
        if (esMultiproducto) {
            console.log('=== NOTA MULTIPRODUCTO DETECTADA ===');
            
            // Extraer datos comunes (asegurados, puntos totales)
            const datosComunes = parsearDatosComunesMultiproducto(contenido, fecha);
            
            // Detectar cada producto presente en la nota
            const tieneDecesos = contenidoUpper.includes('⚱️ DECESOS');
            
            if (contenidoUpper.includes('🏥 SALUD:')) {
                const propuesta = parsearProductoSaludDeNota(contenido, fecha, datosComunes, tieneDecesos);
                if (propuesta && propuesta.tipoPoliza) {
                    propuesta.tipoProducto = 'SALUD';
                    propuesta.notaId = nota.id;
                    propuesta.index = notasPropuestas.length;
                    propuesta.esMultiproducto = true;
                    notasPropuestas.push(propuesta);
                    
                    const option = document.createElement('option');
                    option.value = propuesta.index;
                    const fechaStr = new Date(fecha).toLocaleDateString('es-ES');
                    option.textContent = `🏥 ${propuesta.tipoPoliza} - ${propuesta.precioMensual}€/mes | 🎁 ${datosComunes.puntosTotal.toLocaleString('es-ES')} pts (${fechaStr})`;
                    selector.appendChild(option);
                }
            }
            
            if (contenidoUpper.includes('🦷 DENTAL MAX')) {
                const propuesta = parsearProductoDentalDeNota(contenido, fecha, datosComunes);
                if (propuesta) {
                    propuesta.tipoProducto = 'DENTAL';
                    propuesta.notaId = nota.id;
                    propuesta.index = notasPropuestas.length;
                    propuesta.esMultiproducto = true;
                    notasPropuestas.push(propuesta);
                    
                    const option = document.createElement('option');
                    option.value = propuesta.index;
                    const fechaStr = new Date(fecha).toLocaleDateString('es-ES');
                    option.textContent = `🦷 DENTAL MAX - ${propuesta.precioMensual}€/mes | 🎁 ${datosComunes.puntosTotal.toLocaleString('es-ES')} pts (${fechaStr})`;
                    selector.appendChild(option);
                }
            }
            
            if (contenidoUpper.includes('⚱️ DECESOS')) {
                const propuesta = parsearProductoDecesosDeNota(contenido, fecha, datosComunes);
                if (propuesta) {
                    propuesta.tipoProducto = 'DECESOS';
                    propuesta.notaId = nota.id;
                    propuesta.index = notasPropuestas.length;
                    propuesta.esMultiproducto = true;
                    notasPropuestas.push(propuesta);
                    
                    const option = document.createElement('option');
                    option.value = propuesta.index;
                    const fechaStr = new Date(fecha).toLocaleDateString('es-ES');
                    option.textContent = `⚱️ DECESOS - ${propuesta.precioMensual}€/mes | 🎁 ${datosComunes.puntosTotal.toLocaleString('es-ES')} pts (${fechaStr})`;
                    selector.appendChild(option);
                }
            }
            
            if (contenidoUpper.includes('🐾 MASCOTAS')) {
                const propuesta = parsearProductoMascotasDeNota(contenido, fecha, datosComunes);
                if (propuesta) {
                    propuesta.tipoProducto = 'MASCOTAS';
                    propuesta.notaId = nota.id;
                    propuesta.index = notasPropuestas.length;
                    propuesta.esMultiproducto = true;
                    notasPropuestas.push(propuesta);
                    
                    const option = document.createElement('option');
                    option.value = propuesta.index;
                    const fechaStr = new Date(fecha).toLocaleDateString('es-ES');
                    option.textContent = `🐾 MASCOTAS - ${propuesta.precioMensual}€/mes | 🎁 ${datosComunes.puntosTotal.toLocaleString('es-ES')} pts (${fechaStr})`;
                    selector.appendChild(option);
                }
            }
            
        } else {
            // === FORMATO ANTIGUO (un solo producto por nota) ===
            let tipoProducto = null;
            
            if (contenidoUpper.includes('ASEGURADOS SALUD') || contenidoUpper.includes('ADESLAS COMPLETA') || 
                contenidoUpper.includes('ADESLAS GO') || contenidoUpper.includes('SENIORS') || contenidoUpper.includes('SENIOR') ||
                contenidoUpper.includes('ACTIVA') || contenidoUpper.includes('ADESLAS PLENA') ||
                contenidoUpper.includes('PLENA VITAL') || contenidoUpper.includes('PLENA PLUS') ||
                contenidoUpper.includes('EXTRA 150') || contenidoUpper.includes('EXTRA 240') ||
                contenidoUpper.includes('NEGOCIO CIF') || contenidoUpper.includes('EMPRESA') || contenidoUpper.includes('PYME')) {
                tipoProducto = 'SALUD';
            } else if (contenidoUpper.includes('MASCOTAS ADESLAS') || contenidoUpper.includes('🐾')) {
                tipoProducto = 'MASCOTAS';
            } else if (contenidoUpper.includes('DENTAL MAX') || contenidoUpper.includes('🦷')) {
                tipoProducto = 'DENTAL';
            } else if (contenidoUpper.includes('DECESOS ADESLAS') || contenidoUpper.includes('⚱️') || contenidoUpper.includes('ASEGURADOS DECESOS')) {
                tipoProducto = 'DECESOS';
            }
            
            if (tipoProducto) {
                let propuesta = null;
                
                switch(tipoProducto) {
                    case 'SALUD':
                        propuesta = parsearPropuestaSalud(contenido, nota.add_time);
                        break;
                    case 'MASCOTAS':
                        propuesta = parsearPropuestaMascotas(contenido, nota.add_time);
                        break;
                    case 'DENTAL':
                        propuesta = parsearPropuestaDental(contenido, nota.add_time);
                        break;
                    case 'DECESOS':
                        propuesta = parsearPropuestaDecesos(contenido, nota.add_time);
                        break;
                }
                
                if (propuesta) {
                    propuesta.tipoProducto = tipoProducto;
                    propuesta.notaId = nota.id;
                    propuesta.index = notasPropuestas.length;
                    propuesta.esMultiproducto = false;
                    notasPropuestas.push(propuesta);

                    const option = document.createElement('option');
                    option.value = propuesta.index;
                    const fechaStr = new Date(nota.add_time).toLocaleDateString('es-ES');
                    const icono = tipoProducto === 'SALUD' ? '🏥' : tipoProducto === 'MASCOTAS' ? '🐾' : tipoProducto === 'DENTAL' ? '🦷' : '⚱️';
                    option.textContent = `${icono} ${propuesta.tipoPoliza || tipoProducto} - ${propuesta.precioMensual || '?'}€/mes (${fechaStr})`;
                    selector.appendChild(option);
                }
            }
        }
    });

    if (notasPropuestas.length === 0) {
        document.getElementById('sinPropuestas').classList.remove('hidden');
    } else {
        document.getElementById('sinPropuestas').classList.add('hidden');
    }
}

// ============================================================================
// PARSEAR DATOS COMUNES DE NOTA MULTIPRODUCTO
// ============================================================================
function parsearDatosComunesMultiproducto(contenido, fecha) {
    const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
    
    const datos = {
        asegurados: [],
        puntosTotal: 0,
        totalMensual: 0,
        totalAnual: 0,
        fecha: fecha
    };
    
    // Extraer asegurados
    // Formato: 1. NOMBRE - 1975-10-05 - Ciudad Real (CIUDAD REAL)
    const regexAsegurado = /(\d+)\.\s*([^-\n]+?)\s*-\s*(\d{4}-\d{2}-\d{2})\s*-\s*([^(\n]+?)\s*\(([^)\n]+)\)/gi;
    let match;
    while ((match = regexAsegurado.exec(texto)) !== null) {
        const nombreCompleto = match[2].trim().toUpperCase();
        const partes = nombreCompleto.split(' ');
        datos.asegurados.push({
            numero: parseInt(match[1]),
            nombre: partes[0] || '',
            apellidos: partes.slice(1).join(' ') || '',
            fechaNacimiento: match[3],
            localidad: match[4].trim().toUpperCase(),
            provincia: match[5].trim().toUpperCase(),
            edad: calcularEdadDesdeTexto(match[3])
        });
    }
    
    // Extraer puntos totales
    const matchPuntos = texto.match(/🎁\s*PUNTOS\s*CAMPAÑA:\s*([\d.,]+)\s*pts/i);
    if (matchPuntos) {
        datos.puntosTotal = parseInt(matchPuntos[1].replace(/\./g, '').replace(',', ''));
    }
    
    // Extraer totales económicos
    const matchTotalMensual = texto.match(/Total\s*mensual:\s*([\d.,]+)\s*€/i);
    if (matchTotalMensual) {
        datos.totalMensual = parseFloat(matchTotalMensual[1].replace(',', '.'));
    }
    
    const matchTotalAnual = texto.match(/Total\s*anual:\s*([\d.,]+)\s*€/i);
    if (matchTotalAnual) {
        datos.totalAnual = parseFloat(matchTotalAnual[1].replace(',', '.'));
    }
    
    console.log('Datos comunes multiproducto:', datos);
    return datos;
}

// ============================================================================
// PARSEAR PRODUCTO SALUD DE NOTA MULTIPRODUCTO
// ============================================================================
function parsearProductoSaludDeNota(contenido, fecha, datosComunes, tieneDecesos = false) {
    const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
    
    const propuesta = {
        asegurados: datosComunes.asegurados,
        tipoPoliza: '',
        dental: '',
        puntos: 0,
        puntosTotal: datosComunes.puntosTotal,
        precioMensual: '',
        fecha: fecha,
        tomadorEsAsegurado: true,
        dtoCompania: '',
        descuento: ''
    };
    
    // Extraer tipo de póliza: 🏥 SALUD: PLENA VITAL
    const matchPoliza = texto.match(/🏥\s*SALUD:\s*([^\n]+)/i);
    if (matchPoliza) {
        propuesta.tipoPoliza = matchPoliza[1].trim().toUpperCase();
    }
    
    // Extraer dental familia
    const matchDental = texto.match(/Dental\s*Familia:\s*(S[ií]|No)/i);
    if (matchDental && matchDental[1].toLowerCase().startsWith('s')) {
        propuesta.dental = 'DENTAL FAMILIA';
    }
    
    // Extraer descuento si viene explícito en la nota
    const matchDescuento = texto.match(/Descuento[:\s]*([\d]+)\s*%/i);
    if (matchDescuento) {
        propuesta.dtoCompania = matchDescuento[1] + '%';
        propuesta.descuento = matchDescuento[1] + '%';
    }
    
    // Extraer prima y puntos del bloque SALUD
    // Buscar el bloque que empieza con 🏥 SALUD
    const bloqueMatch = texto.match(/🏥\s*SALUD:[^\n]*\n([\s\S]*?)(?=\n[🦷⚱️🐾🏠🚗🏢📺🚨═]|$)/i);
    if (bloqueMatch) {
        const bloque = bloqueMatch[1];
        
        const matchPrima = bloque.match(/Prima:\s*([\d.,]+)\s*€\/mes/i);
        if (matchPrima) {
            propuesta.precioMensual = matchPrima[1].replace(',', '.');
        }
        
        const matchPuntos = bloque.match(/Puntos:\s*([\d.,]+)\s*pts/i);
        if (matchPuntos) {
            propuesta.puntos = parseInt(matchPuntos[1].replace(/\./g, '').replace(',', ''));
        }
    }
    
    // DETECTAR DESCUENTO AUTOMÁTICAMENTE si no vino explícito
    if (!propuesta.dtoCompania) {
        if (propuesta.dental === 'DENTAL FAMILIA' && tieneDecesos) {
            // Salud + Dental + Decesos → 10%
            propuesta.dtoCompania = '10%';
            propuesta.descuento = '10%';
        } else if (propuesta.dental === 'DENTAL FAMILIA') {
            // Salud + Dental → 5%
            propuesta.dtoCompania = '5%';
            propuesta.descuento = '5%';
        }
    }
    
    console.log('Producto SALUD parseado:', propuesta);
    return propuesta;
}

// ============================================================================
// PARSEAR PRODUCTO DENTAL DE NOTA MULTIPRODUCTO
// ============================================================================
function parsearProductoDentalDeNota(contenido, fecha, datosComunes) {
    const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
    
    const propuesta = {
        asegurados: datosComunes.asegurados,
        tipoPoliza: 'DENTAL MAX',
        puntos: 0,
        puntosTotal: datosComunes.puntosTotal,
        precioMensual: '',
        fecha: fecha
    };
    
    // Buscar bloque DENTAL MAX
    const bloqueMatch = texto.match(/🦷\s*DENTAL\s*MAX[^\n]*\n([\s\S]*?)(?=\n[🏥⚱️🐾🏠🚗🏢📺🚨═]|$)/i);
    if (bloqueMatch) {
        const bloque = bloqueMatch[1];
        
        const matchPrima = bloque.match(/Prima:\s*([\d.,]+)\s*€\/mes/i);
        if (matchPrima) {
            propuesta.precioMensual = matchPrima[1].replace(',', '.');
        }
        
        const matchPuntos = bloque.match(/Puntos:\s*([\d.,]+)\s*pts/i);
        if (matchPuntos) {
            propuesta.puntos = parseInt(matchPuntos[1].replace(/\./g, '').replace(',', ''));
        }
    }
    
    console.log('Producto DENTAL parseado:', propuesta);
    return propuesta;
}

// ============================================================================
// PARSEAR PRODUCTO DECESOS DE NOTA MULTIPRODUCTO
// ============================================================================
function parsearProductoDecesosDeNota(contenido, fecha, datosComunes) {
    const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
    
    const propuesta = {
        asegurados: datosComunes.asegurados,
        tipoPoliza: 'DECESOS PLUS',
        opcionales: '',
        puntos: 0,
        puntosTotal: datosComunes.puntosTotal,
        precioMensual: '',
        fecha: fecha
    };
    
    // Buscar bloque DECESOS
    const bloqueMatch = texto.match(/⚱️\s*DECESOS[^\n]*\n([\s\S]*?)(?=\n[🏥🦷🐾🏠🚗🏢📺🚨═]|$)/i);
    if (bloqueMatch) {
        const bloque = bloqueMatch[1];
        
        const matchServicio = bloque.match(/Servicio\s*Plus:\s*([^\n]+)/i);
        if (matchServicio) {
            propuesta.opcionales = matchServicio[1].trim();
        }
        
        const matchPrima = bloque.match(/Prima:\s*([\d.,]+)\s*€\/mes/i);
        if (matchPrima) {
            propuesta.precioMensual = matchPrima[1].replace(',', '.');
        }
        
        const matchPuntos = bloque.match(/Puntos:\s*([\d.,]+)\s*pts/i);
        if (matchPuntos) {
            propuesta.puntos = parseInt(matchPuntos[1].replace(/\./g, '').replace(',', ''));
        }
    }
    
    console.log('Producto DECESOS parseado:', propuesta);
    return propuesta;
}

// ============================================================================
// PARSEAR PRODUCTO MASCOTAS DE NOTA MULTIPRODUCTO
// ============================================================================
function parsearProductoMascotasDeNota(contenido, fecha, datosComunes) {
    const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
    
    const propuesta = {
        mascota: { nombre: '', tipo: '', raza: '', fechaNacimiento: '', chip: '' },
        tipoPoliza: 'MASCOTAS',
        puntos: 0,
        puntosTotal: datosComunes.puntosTotal,
        precioMensual: '',
        fecha: fecha
    };
    
    // Detectar tipo de mascota
    const matchTipo = texto.match(/🐾\s*MASCOTAS\s*\(([^)]+)\)/i);
    if (matchTipo) {
        propuesta.tipoPoliza = `MASCOTAS ${matchTipo[1].toUpperCase()}`;
    }
    
    // Buscar bloque MASCOTAS
    const bloqueMatch = texto.match(/🐾\s*MASCOTAS[^\n]*\n([\s\S]*?)(?=\n[🏥🦷⚱️🏠🚗🏢📺🚨═]|$)/i);
    if (bloqueMatch) {
        const bloque = bloqueMatch[1];
        
        const matchPrima = bloque.match(/Prima:\s*([\d.,]+)\s*€\/mes/i);
        if (matchPrima) {
            propuesta.precioMensual = matchPrima[1].replace(',', '.');
        }
        
        const matchPuntos = bloque.match(/Puntos:\s*([\d.,]+)\s*pts/i);
        if (matchPuntos) {
            propuesta.puntos = parseInt(matchPuntos[1].replace(/\./g, '').replace(',', ''));
        }
    }
    
    console.log('Producto MASCOTAS parseado:', propuesta);
    return propuesta;
}

// ============================================================================
// PARSEAR PROPUESTA SALUD
// ============================================================================
function parsearPropuestaSalud(contenido, fecha) {
    try {
        const propuesta = { 
            asegurados: [], 
            tipoPoliza: '', 
            dental: '', 
            dtoCompania: '', 
            dtoContracomision: '', 
            campana: '', 
            puntos: 0,
            puntosTotal: 0,
            precioMensual: '', 
            precioAnual: '', 
            fecha: fecha, 
            tomadorEsAsegurado: true 
        };
        const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
        
        console.log('=== PARSEANDO PROPUESTA SALUD ===');
        console.log('Texto limpio (primeros 500 chars):', texto.substring(0, 500));

        // Detectar si el tomador NO es asegurado
        if (texto.includes('TOMADOR NO ES ASEGURADO') || texto.includes('👤 Tomador es asegurado: No')) {
            propuesta.tomadorEsAsegurado = false;
            console.log('=== DETECTADO: Tomador NO es asegurado ===');
        }

        // === NUEVO FORMATO (Campaña MásProtección) ===
        // Formato: 1. NOMBRE - 1975-10-05 - Ciudad Real (CIUDAD REAL)
        // O formato: 1. NOMBRE - 1975-10-05 - Provincia (LOCALIDAD)
        const regexAseguradoNuevo = /(\d+)\.\s*([^-\n]+?)\s*-\s*(\d{4}-\d{2}-\d{2})\s*-\s*([^(\n]+?)\s*\(([^)\n]+)\)/gi;
        let match;
        while ((match = regexAseguradoNuevo.exec(texto)) !== null) {
            const nombreCompleto = match[2].trim().toUpperCase();
            const partes = nombreCompleto.split(' ');
            const fechaNac = match[3]; // Ya viene en formato YYYY-MM-DD
            console.log('Asegurado nuevo formato:', nombreCompleto, fechaNac);
            propuesta.asegurados.push({
                numero: parseInt(match[1]), 
                nombre: partes[0] || '', 
                apellidos: partes.slice(1).join(' ') || '',
                fechaNacimiento: fechaNac,
                localidad: match[4].trim().toUpperCase(),
                provincia: match[5].trim().toUpperCase(),
                sexo: '', // Se detectará por nombre o se pedirá
                edad: calcularEdadDesdeTexto(fechaNac)
            });
        }
        
        // === FORMATO ANTIGUO (compatibilidad) ===
        // Formato: 1. NOMBRE - 45 años (H) - 05/10/1975 → 52.00 €
        if (propuesta.asegurados.length === 0) {
            console.log('Probando formato antiguo...');
            const regexAseguradoAntiguo = /(\d+)\.\s*([^-]+)\s*-\s*(\d+)\s*a[ñn]os?\s*\(([HM?])\)\s*-?\s*(\d{2}\/\d{2}\/\d{4})?\s*→?\s*([\d.,]+)?\s*€?/gi;
            while ((match = regexAseguradoAntiguo.exec(texto)) !== null) {
                const nombreCompleto = match[2].trim().toUpperCase();
                const partes = nombreCompleto.split(' ');
                console.log('Asegurado formato antiguo:', nombreCompleto);
                propuesta.asegurados.push({
                    numero: parseInt(match[1]), 
                    nombre: partes[0] || '', 
                    apellidos: partes.slice(1).join(' ') || '',
                    edad: match[3], 
                    sexo: match[4] === '?' ? '' : match[4],
                    fechaNacimiento: match[5] ? convertirFecha(match[5]) : '', 
                    precio: match[6] || ''
                });
            }
        }
        
        console.log('Total asegurados encontrados:', propuesta.asegurados.length);

        // === DETECTAR TIPO DE PÓLIZA ===
        // Nuevo formato: 🏥 SALUD: PLENA VITAL
        const matchPolizaNuevo = texto.match(/🏥\s*SALUD:\s*([^\n]+)/i);
        if (matchPolizaNuevo) {
            propuesta.tipoPoliza = matchPolizaNuevo[1].trim().toUpperCase();
            console.log('Póliza (nuevo formato):', propuesta.tipoPoliza);
        } else {
            // Formato antiguo: OPCIÓN 1: PLENA VITAL
            const matchPolizaAntiguo = texto.match(/OPCI[OÓ]N\s*\d+:\s*([^\n•]+)/i);
            if (matchPolizaAntiguo) {
                propuesta.tipoPoliza = matchPolizaAntiguo[1].trim().toUpperCase();
                console.log('Póliza (formato antiguo):', propuesta.tipoPoliza);
            }
        }

        // === DETECTAR DENTAL ===
        // Nuevo formato: Dental Familia: Sí/No
        const matchDentalFamilia = texto.match(/Dental\s*Familia:\s*(S[ií]|No)/i);
        if (matchDentalFamilia) {
            if (matchDentalFamilia[1].toLowerCase().startsWith('s')) {
                propuesta.dental = 'DENTAL FAMILIA';
            }
        }
        
        // También buscar Dental Max como producto separado
        if (texto.includes('🦷 DENTAL MAX')) {
            propuesta.dental = propuesta.dental ? propuesta.dental + ' + DENTAL MAX' : 'DENTAL MAX';
        }
        
        // Formato antiguo: Dental: MAX o Dental: FAMILIA
        if (!propuesta.dental) {
            const matchDentalAntiguo = texto.match(/Dental:\s*([^\n•]+)/i);
            if (matchDentalAntiguo) {
                const dentalVal = matchDentalAntiguo[1].trim().toUpperCase();
                if (dentalVal !== 'NO' && dentalVal !== 'SIN DENTAL') {
                    propuesta.dental = dentalVal;
                }
            }
        }
        console.log('Dental:', propuesta.dental);

        // === DETECTAR PUNTOS ===
        // Buscar puntos de SALUD específicamente
        const matchPuntosSalud = texto.match(/🏥\s*SALUD:[^\n]*\n[^\n]*Puntos:\s*([\d.,]+)\s*pts/i);
        if (matchPuntosSalud) {
            propuesta.puntos = parseInt(matchPuntosSalud[1].replace(/\./g, '').replace(',', ''));
        } else {
            // Buscar cualquier mención de puntos
            const matchPuntos = texto.match(/Puntos:\s*([\d.,]+)\s*pts/i);
            if (matchPuntos) {
                propuesta.puntos = parseInt(matchPuntos[1].replace(/\./g, '').replace(',', ''));
            }
        }
        
        // Total de puntos de la campaña
        const matchTotalPuntos = texto.match(/🎁\s*PUNTOS\s*CAMPAÑA:\s*([\d.,]+)\s*pts/i);
        if (matchTotalPuntos) {
            propuesta.puntosTotal = parseInt(matchTotalPuntos[1].replace(/\./g, '').replace(',', ''));
        }
        console.log('Puntos SALUD:', propuesta.puntos, '| Total campaña:', propuesta.puntosTotal);

        // === DETECTAR PRECIO ===
        // Nuevo formato: Prima: 187.20 €/mes
        const matchPrecioNuevo = texto.match(/Prima:\s*([\d.,]+)\s*€\/mes/i);
        if (matchPrecioNuevo) {
            propuesta.precioMensual = matchPrecioNuevo[1].replace(',', '.');
        } else {
            // Formato antiguo: Prima mensual: 187.20 €
            const matchPrecioAntiguo = texto.match(/Prima\s*mensual:\s*([\d.,]+)\s*€/i);
            if (matchPrecioAntiguo) propuesta.precioMensual = matchPrecioAntiguo[1].replace(',', '.');
        }
        
        // También buscar Total mensual en resumen
        if (!propuesta.precioMensual) {
            const matchTotalMensual = texto.match(/Total\s*mensual:\s*([\d.,]+)\s*€/i);
            if (matchTotalMensual) propuesta.precioMensual = matchTotalMensual[1].replace(',', '.');
        }
        console.log('Precio mensual:', propuesta.precioMensual);

        // Extraer Dto. Compañía (compatibilidad)
        const matchDtoCompania = texto.match(/Dto\.?\s*Compa[ñn][ií]a:\s*([^\n•(]+)/i);
        if (matchDtoCompania) propuesta.dtoCompania = matchDtoCompania[1].trim();

        // Extraer Dto. Opcional (contracomisión)
        const matchDtoContra = texto.match(/Dto\.?\s*Opcional:\s*([^\n•(]+)/i);
        if (matchDtoContra) propuesta.dtoContracomision = matchDtoContra[1].trim();

        // Campaña meses gratis (formato antiguo, ya no aplica)
        const matchCampana = texto.match(/Campa[ñn]a:\s*(\d+)\s*meses?\s*gratis/i);
        if (matchCampana) propuesta.campana = matchCampana[1];

        console.log('=== PROPUESTA PARSEADA ===', propuesta);
        return propuesta;
    } catch (error) {
        console.error('Error parseando propuesta salud:', error);
        return null;
    }
}

// Calcular edad desde fecha en formato YYYY-MM-DD
function calcularEdadDesdeTexto(fechaStr) {
    if (!fechaStr) return '';
    try {
        const partes = fechaStr.split('-');
        const fechaNac = new Date(partes[0], partes[1] - 1, partes[2]);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const m = hoy.getMonth() - fechaNac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
        return edad.toString();
    } catch (e) {
        return '';
    }
}

// ============================================================================
// PARSEAR PROPUESTA MASCOTAS
// ============================================================================
function parsearPropuestaMascotas(contenido, fecha) {
    try {
        const propuesta = { mascota: {}, tipoPoliza: '', precioMensual: '', precioAnual: '', fecha: fecha };
        const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');

        // Detectar si es BÁSICA o COMPLETA
        if (texto.toUpperCase().includes('COMPLETA')) {
            propuesta.tipoPoliza = 'MASCOTAS ADESLAS - COMPLETA';
        } else if (texto.toUpperCase().includes('BÁSICA') || texto.toUpperCase().includes('BASICA')) {
            propuesta.tipoPoliza = 'MASCOTAS ADESLAS - BÁSICA';
        } else {
            propuesta.tipoPoliza = 'MASCOTAS ADESLAS';
        }

        // Extraer precio
        const matchPrecioMensual = texto.match(/Prima\s*mensual:\s*([\d.,]+)\s*€/i);
        if (matchPrecioMensual) propuesta.precioMensual = matchPrecioMensual[1].replace(',', '.');

        const matchPrecioAnual = texto.match(/Prima\s*anual:\s*([\d.,]+)\s*€/i);
        if (matchPrecioAnual) propuesta.precioAnual = matchPrecioAnual[1].replace(',', '.');

        // Los datos de la mascota se rellenarán manualmente
        propuesta.mascota = {
            nombre: '',
            tipo: '', // PERRO o GATO
            raza: '',
            fechaNacimiento: '',
            chip: ''
        };

        return propuesta;
    } catch (error) {
        console.error('Error parseando propuesta mascotas:', error);
        return null;
    }
}

// ============================================================================
// PARSEAR PROPUESTA DENTAL
// ============================================================================
function parsearPropuestaDental(contenido, fecha) {
    try {
        const propuesta = { asegurados: [], tipoPoliza: 'DENTAL MAX', dtoContracomision: '', campana: '', precioMensual: '', precioAnual: '', fecha: fecha };
        const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');

        // Parsear asegurados: formato "1. NOMBRE - FECHA → PRECIO€/mes"
        const regexAsegurado = /(\d+)\.\s*([^-]+)\s*-\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s*→\s*([\d.,]+)\s*€/gi;
        let match;
        while ((match = regexAsegurado.exec(texto)) !== null) {
            const nombreCompleto = match[2].trim().toUpperCase();
            const partes = nombreCompleto.split(' ');
            let fechaNac = match[3];
            // Convertir formato YYYY-MM-DD a YYYY-MM-DD (ya está bien)
            if (fechaNac.includes('/')) {
                fechaNac = convertirFecha(fechaNac);
            }
            propuesta.asegurados.push({
                numero: parseInt(match[1]), 
                nombre: partes[0] || '', 
                apellidos: partes.slice(1).join(' ') || '',
                fechaNacimiento: fechaNac, 
                precio: match[4] || ''
            });
        }

        // Extraer descuento
        const matchDescuento = texto.match(/Descuento:\s*(\d+)%/i);
        if (matchDescuento) propuesta.dtoContracomision = matchDescuento[1] + '%';

        // Extraer campaña
        const matchCampana = texto.match(/Campa[ñn]a:\s*(\d+)\s*meses?\s*gratis/i);
        if (matchCampana) propuesta.campana = matchCampana[1];

        // Extraer precio
        const matchPrecioMensual = texto.match(/Prima\s*mensual:\s*([\d.,]+)\s*€/i);
        if (matchPrecioMensual) propuesta.precioMensual = matchPrecioMensual[1].replace(',', '.');

        return propuesta;
    } catch (error) {
        console.error('Error parseando propuesta dental:', error);
        return null;
    }
}

// ============================================================================
// PARSEAR PROPUESTA DECESOS
// ============================================================================
function parsearPropuestaDecesos(contenido, fecha) {
    try {
        const propuesta = { asegurados: [], tipoPoliza: 'DECESOS PLUS', opcionales: '', descuento: '', precioMensual: '', precioAnual: '', fecha: fecha };
        const texto = contenido.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
        
        console.log('=== PARSEANDO DECESOS ===');

        // Buscar primero todos los asegurados con formato: "1. Nombre - FECHA - Localidad"
        const regexAsegurado = /(\d+)\.\s*([^-\n]+)\s*-\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*([^\n]+)/gi;
        
        let matchAseg;
        const aseguradosTemp = [];
        while ((matchAseg = regexAsegurado.exec(texto)) !== null) {
            aseguradosTemp.push({
                numero: parseInt(matchAseg[1]),
                nombreCompleto: matchAseg[2].trim().toUpperCase(),
                fechaNacimiento: matchAseg[3],
                localidad: matchAseg[4].trim().toUpperCase()
            });
        }
        
        console.log('Asegurados encontrados (temp):', aseguradosTemp.length);
        
        // Buscar capitales y primas
        const regexCapital = /Capital:\s*([\d.,]+)\s*€[^P]*Prima:\s*([\d.,]+)\s*€/gi;
        const capitales = [];
        let matchCap;
        while ((matchCap = regexCapital.exec(texto)) !== null) {
            capitales.push({ capital: matchCap[1], prima: matchCap[2] });
        }
        
        console.log('Capitales encontrados:', capitales.length);
        
        // Combinar asegurados con capitales (los que están DESPUÉS del bloque de asegurados de la opción)
        // Buscamos los asegurados que están en el bloque "Asegurados Decesos:" de la opción seleccionada
        const bloqueOpcion = texto.match(/OPCI[OÓ]N\s*\d+[^]*?Prima\s*mensual/i);
        if (bloqueOpcion) {
            const textoOpcion = bloqueOpcion[0];
            console.log('Bloque opción encontrado');
            
            // Re-ejecutar regex en el bloque de la opción
            const regexAsegOpcion = /(\d+)\.\s*([^-\n]+)\s*-\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*([^\n]+)/gi;
            const regexCapOpcion = /Capital:\s*([\d.,]+)\s*€[^P]*Prima:\s*([\d.,]+)\s*€/gi;
            
            const asegOpcion = [];
            let m;
            while ((m = regexAsegOpcion.exec(textoOpcion)) !== null) {
                asegOpcion.push({
                    numero: parseInt(m[1]),
                    nombreCompleto: m[2].trim().toUpperCase(),
                    fechaNacimiento: m[3],
                    localidad: m[4].trim().toUpperCase()
                });
            }
            
            const capOpcion = [];
            while ((m = regexCapOpcion.exec(textoOpcion)) !== null) {
                capOpcion.push({ capital: m[1], prima: m[2] });
            }
            
            // Combinar
            asegOpcion.forEach((aseg, idx) => {
                const partes = aseg.nombreCompleto.split(' ');
                propuesta.asegurados.push({
                    numero: aseg.numero,
                    nombre: partes[0] || '',
                    apellidos: partes.slice(1).join(' ') || '',
                    fechaNacimiento: convertirFecha(aseg.fechaNacimiento),
                    localidad: aseg.localidad,
                    capital: capOpcion[idx]?.capital || '',
                    precio: capOpcion[idx]?.prima || ''
                });
            });
        } else {
            // Fallback: usar todos los asegurados encontrados
            aseguradosTemp.forEach((aseg, idx) => {
                const partes = aseg.nombreCompleto.split(' ');
                propuesta.asegurados.push({
                    numero: aseg.numero,
                    nombre: partes[0] || '',
                    apellidos: partes.slice(1).join(' ') || '',
                    fechaNacimiento: convertirFecha(aseg.fechaNacimiento),
                    localidad: aseg.localidad,
                    capital: capitales[idx]?.capital || '',
                    precio: capitales[idx]?.prima || ''
                });
            });
        }
        
        console.log('Total asegurados decesos final:', propuesta.asegurados.length);
        propuesta.asegurados.forEach(a => console.log('  -', a.nombre, a.apellidos, a.fechaNacimiento));

        // Extraer opcionales
        const matchOpcionales = texto.match(/Opcionales:\s*([^\n•]+)/i);
        if (matchOpcionales) propuesta.opcionales = matchOpcionales[1].trim();

        // Extraer descuento
        const matchDescuento = texto.match(/Descuento:\s*(\d+)%/i);
        if (matchDescuento) propuesta.descuento = matchDescuento[1] + '%';

        // Extraer precio
        const matchPrecioMensual = texto.match(/Prima\s*mensual:\s*([\d.,]+)\s*€/i);
        if (matchPrecioMensual) propuesta.precioMensual = matchPrecioMensual[1].replace(',', '.');

        return propuesta;
    } catch (error) {
        console.error('Error parseando propuesta decesos:', error);
        return null;
    }
}

function convertirFecha(fechaStr) {
    const partes = fechaStr.split('/');
    if (partes.length === 3) return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    return '';
}

// ============================================================================
// SELECCIONAR PROPUESTA
// ============================================================================
function seleccionarPropuesta() {
    const selector = document.getElementById('selectorPropuesta');
    const index = selector.value;

    if (index === '') {
        propuestaSeleccionada = null;
        document.getElementById('resumenPropuesta').classList.add('hidden');
        return;
    }

    propuestaSeleccionada = notasPropuestas[parseInt(index)];
    tipoProducto = propuestaSeleccionada.tipoProducto || 'SALUD';
    
    console.log('=== PROPUESTA SELECCIONADA ===');
    console.log('Tipo producto:', tipoProducto);
    console.log('Propuesta:', propuestaSeleccionada);
    
    document.getElementById('resumenPropuesta')?.classList.remove('hidden');
    const resumenPoliza = document.getElementById('resumenPoliza');
    if (resumenPoliza) resumenPoliza.textContent = propuestaSeleccionada.tipoPoliza || '-';
    const resumenPrecio = document.getElementById('resumenPrecio');
    if (resumenPrecio) resumenPrecio.textContent = propuestaSeleccionada.precioMensual ? `${propuestaSeleccionada.precioMensual}€/mes` : '-';
    
    // Puntos campaña MásProtección
    const puntosContainer = document.getElementById('resumenPuntosContainer');
    const resumenPuntos = document.getElementById('resumenPuntos');
    const puntosCampanaInput = document.getElementById('puntosCampana');
    if (puntosContainer) {
        if (propuestaSeleccionada.puntos) {
            puntosContainer.classList.remove('hidden');
            if (resumenPuntos) resumenPuntos.textContent = parseInt(propuestaSeleccionada.puntos).toLocaleString('es-ES') + ' pts';
            if (puntosCampanaInput) puntosCampanaInput.value = propuestaSeleccionada.puntos;
        } else {
            puntosContainer.classList.add('hidden');
            if (puntosCampanaInput) puntosCampanaInput.value = '';
        }
    }
    
    // Mostrar/ocultar campo dental según producto
    const dentalContainer = document.getElementById('resumenDentalContainer');
    const resumenDental = document.getElementById('resumenDental');
    const dentalInput = document.getElementById('dental');
    if (tipoProducto === 'SALUD') {
        if (dentalContainer) dentalContainer.classList.remove('hidden');
        if (resumenDental) resumenDental.textContent = propuestaSeleccionada.dental || '-';
        if (dentalInput) dentalInput.value = propuestaSeleccionada.dental || '';
    } else {
        if (dentalContainer) dentalContainer.classList.add('hidden');
    }
    
    // Descuentos en resumen
    const dtoCompaniaContainer = document.getElementById('resumenDtoCompaniaContainer');
    const dtoContraContainer = document.getElementById('resumenDtoContraContainer');
    const descuentosRow = document.getElementById('resumenDescuentosRow');
    
    const dtoCompania = propuestaSeleccionada.dtoCompania || '';
    const dtoContra = propuestaSeleccionada.dtoContracomision || propuestaSeleccionada.descuento || '';
    
    // Mostrar/ocultar según producto
    if (tipoProducto === 'MASCOTAS' || tipoProducto === 'DECESOS') {
        if (dtoCompaniaContainer) dtoCompaniaContainer.classList.add('hidden');
    } else {
        if (dtoCompaniaContainer) dtoCompaniaContainer.classList.remove('hidden');
    }
    
    // Actualizar valores en resumen
    const resumenDtoCompania = document.getElementById('resumenDtoCompania');
    const resumenDtoContra = document.getElementById('resumenDtoContra');
    if (resumenDtoCompania) resumenDtoCompania.textContent = dtoCompania || '-';
    if (resumenDtoContra) resumenDtoContra.textContent = dtoContra || '-';
    
    // Mostrar fila de descuentos si hay alguno
    if (dtoCompania || dtoContra) {
        if (descuentosRow) descuentosRow.classList.remove('hidden');
    } else {
        if (descuentosRow) descuentosRow.classList.add('hidden');
    }

    // Cargar descuentos en campos
    const dtoCompaniaInput = document.getElementById('dtoCompania');
    const dtoContraInput = document.getElementById('dtoContracomision');
    if (dtoCompaniaInput) dtoCompaniaInput.value = dtoCompania;
    if (dtoContraInput) dtoContraInput.value = dtoContra;

    const tipoPolizaInput = document.getElementById('tipoPoliza');
    const importeInput = document.getElementById('importe');
    if (tipoPolizaInput) tipoPolizaInput.value = propuestaSeleccionada.tipoPoliza || '';
    if (importeInput) importeInput.value = propuestaSeleccionada.precioMensual || '';

    // Detectar tipo de póliza para cuestionario (solo SALUD)
    const tipoPolizaUpper = (propuestaSeleccionada.tipoPoliza || '').toUpperCase().trim();
    
    // Póliza GO: sin cuestionario
    esPolizaGO = tipoProducto !== 'SALUD' || tipoPolizaUpper === 'ADESLAS GO' || tipoPolizaUpper === 'GO' || tipoPolizaUpper.startsWith('ADESLAS GO ');
    
    // Póliza SENIOR: cuestionario especial de 26 preguntas
    esPolizaSenior = tipoProducto === 'SALUD' && (tipoPolizaUpper.includes('SENIOR') || tipoPolizaUpper === 'SENIORS' || tipoPolizaUpper === 'SENIORS_TOTAL');
    
    // Póliza EMPRESA: tomador es empresa (CIF), no persona física
    esPolizaEmpresa = PRODUCTOS_EMPRESA.some(p => tipoPolizaUpper.includes(p) || tipoPolizaUpper.startsWith(p.split(' ')[0]));
    
    // Tomador es asegurado: por defecto true, false si viene de la propuesta
    tomadorEsAsegurado = propuestaSeleccionada.tomadorEsAsegurado !== false;
    
    console.log('Tipo póliza:', tipoPolizaUpper, '| GO:', esPolizaGO, '| SENIOR:', esPolizaSenior, '| EMPRESA:', esPolizaEmpresa, '| Tomador es asegurado:', tomadorEsAsegurado);
    
    // Cargar datos según tipo de producto
    if (tipoProducto === 'MASCOTAS') {
        datosMascota = propuestaSeleccionada.mascota || { nombre: '', tipo: '', raza: '', fechaNacimiento: '', chip: '' };
        asegurados = [{ id: 1, numero: 1, esTomador: true, cuestionario: crearCuestionarioVacio() }]; // Tomador para mascotas
    } else {
        cargarAseguradosDePropuesta();
    }
    
    // Mostrar/ocultar secciones según producto
    actualizarVistaPorProducto();
    
    // Habilitar botón guion para productos sin cuestionario (solo GO y productos no-SALUD)
    // EMPRESA y TOMADOR NO ASEGURADO: SÍ tienen cuestionario para los asegurados
    if (tipoProducto !== 'SALUD' || esPolizaGO) {
        habilitarBotonGuion(true);
    }
}

// ============================================================================
// ACTUALIZAR VISTA SEGÚN TIPO DE PRODUCTO
// ============================================================================
function actualizarVistaPorProducto() {
    // Obtener elementos
    const seccionAsegurados = document.getElementById('seccionAsegurados');
    const seccionMascota = document.getElementById('seccionMascota');
    const seccionCuestionario = document.getElementById('seccionCuestionario');
    const tituloPaso3 = document.getElementById('tituloPaso3');
    
    // Campos del paso 1
    const tipoPolizaSelectorDiv = document.getElementById('tipoPolizaSelectorDiv');
    const tipoPolizaInputDiv = document.getElementById('tipoPolizaInputDiv');
    const puntosCampanaDiv = document.getElementById('puntosCampanaDiv');
    const dentalDiv = document.getElementById('dentalDiv');
    const dtoCompaniaDiv = document.getElementById('dtoCompaniaDiv');
    const resumenDentalContainer = document.getElementById('resumenDentalContainer');
    
    // Navegación
    const navPaso3 = document.getElementById('navPaso3');
    const navPaso4 = document.getElementById('navPaso4');
    
    console.log('Actualizando vista para producto:', tipoProducto);
    
    // Crear sección mascota si no existe
    if (!seccionMascota && tipoProducto === 'MASCOTAS') {
        crearSeccionMascota();
    }
    
    // Configurar campos según producto
    if (tipoProducto === 'MASCOTAS') {
        // Mostrar input de tipo póliza (solo lectura)
        if (tipoPolizaSelectorDiv) tipoPolizaSelectorDiv.classList.add('hidden');
        if (tipoPolizaInputDiv) {
            tipoPolizaInputDiv.classList.remove('hidden');
            document.getElementById('tipoPolizaInput').value = propuestaSeleccionada?.tipoPoliza || 'MASCOTAS ADESLAS';
        }
        // Ocultar campos no aplicables
        if (puntosCampanaDiv) puntosCampanaDiv.classList.add('hidden');
        if (dentalDiv) dentalDiv.classList.add('hidden');
        if (dtoCompaniaDiv) dtoCompaniaDiv.classList.add('hidden');
        if (resumenDentalContainer) resumenDentalContainer.classList.add('hidden');
        
        // Actualizar navegación
        if (navPaso3) navPaso3.innerHTML = '<span>🐾</span><span class="hidden sm:inline font-medium">Mascota</span>';
        if (navPaso4) navPaso4.classList.add('hidden');
        
        // Mostrar sección mascota, ocultar otras
        if (seccionAsegurados) seccionAsegurados.classList.add('hidden');
        if (seccionCuestionario) seccionCuestionario.classList.add('hidden');
        if (document.getElementById('seccionMascota')) {
            document.getElementById('seccionMascota').classList.remove('hidden');
        }
        if (tituloPaso3) tituloPaso3.textContent = '🐾 Datos de la Mascota';
        
    } else if (tipoProducto === 'DENTAL') {
        // Mostrar input de tipo póliza
        if (tipoPolizaSelectorDiv) tipoPolizaSelectorDiv.classList.add('hidden');
        if (tipoPolizaInputDiv) {
            tipoPolizaInputDiv.classList.remove('hidden');
            document.getElementById('tipoPolizaInput').value = propuestaSeleccionada?.tipoPoliza || 'DENTAL MAX';
        }
        // Mostrar campos aplicables
        if (puntosCampanaDiv) puntosCampanaDiv.classList.remove('hidden');
        if (dentalDiv) dentalDiv.classList.add('hidden');
        if (dtoCompaniaDiv) dtoCompaniaDiv.classList.add('hidden');
        if (resumenDentalContainer) resumenDentalContainer.classList.add('hidden');
        
        // Actualizar navegación
        if (navPaso3) navPaso3.innerHTML = '<span>🦷</span><span class="hidden sm:inline font-medium">Asegurados</span>';
        if (navPaso4) navPaso4.classList.add('hidden');
        
        // Mostrar info de descuento máximo
        const maxDtoInfo = document.getElementById('maxDtoInfo');
        if (maxDtoInfo) maxDtoInfo.textContent = '(máx. 5%)';
        
        // Mostrar asegurados sin cuestionario
        if (seccionAsegurados) seccionAsegurados.classList.remove('hidden');
        if (seccionCuestionario) seccionCuestionario.classList.add('hidden');
        if (document.getElementById('seccionMascota')) {
            document.getElementById('seccionMascota').classList.add('hidden');
        }
        if (tituloPaso3) tituloPaso3.textContent = '🦷 Asegurados Dental';
        
    } else if (tipoProducto === 'DECESOS') {
        // Mostrar input de tipo póliza - siempre DECESOS PLUS
        if (tipoPolizaSelectorDiv) tipoPolizaSelectorDiv.classList.add('hidden');
        if (tipoPolizaInputDiv) {
            tipoPolizaInputDiv.classList.remove('hidden');
            document.getElementById('tipoPolizaInput').value = 'DECESOS PLUS';
        }
        // Ocultar campos no aplicables
        if (puntosCampanaDiv) puntosCampanaDiv.classList.add('hidden');
        if (dentalDiv) dentalDiv.classList.add('hidden');
        if (dtoCompaniaDiv) dtoCompaniaDiv.classList.add('hidden');
        if (resumenDentalContainer) resumenDentalContainer.classList.add('hidden');
        
        // Limpiar info de descuento máximo
        const maxDtoInfo = document.getElementById('maxDtoInfo');
        if (maxDtoInfo) maxDtoInfo.textContent = '';
        
        // Actualizar navegación
        if (navPaso3) navPaso3.innerHTML = '<span>⚱️</span><span class="hidden sm:inline font-medium">Asegurados</span>';
        if (navPaso4) navPaso4.classList.add('hidden');
        
        // Mostrar asegurados sin cuestionario
        if (seccionAsegurados) seccionAsegurados.classList.remove('hidden');
        if (seccionCuestionario) seccionCuestionario.classList.add('hidden');
        if (document.getElementById('seccionMascota')) {
            document.getElementById('seccionMascota').classList.add('hidden');
        }
        if (tituloPaso3) tituloPaso3.textContent = '⚱️ Asegurados Decesos';
        
    } else {
        // SALUD - Mostrar todo normal
        if (tipoPolizaSelectorDiv) tipoPolizaSelectorDiv.classList.remove('hidden');
        if (tipoPolizaInputDiv) tipoPolizaInputDiv.classList.add('hidden');
        if (puntosCampanaDiv) puntosCampanaDiv.classList.remove('hidden');
        if (dentalDiv) dentalDiv.classList.remove('hidden');
        if (dtoCompaniaDiv) dtoCompaniaDiv.classList.remove('hidden');
        if (resumenDentalContainer) resumenDentalContainer.classList.remove('hidden');
        
        // Actualizar navegación
        if (navPaso3) navPaso3.innerHTML = '<span>👥</span><span class="hidden sm:inline font-medium">Asegurados</span>';
        if (navPaso4) {
            navPaso4.classList.remove('hidden');
            if (esPolizaGO) {
                navPaso4.classList.add('hidden');
            }
        }
        
        // Mostrar asegurados y cuestionario
        // EMPRESA y TOMADOR NO ASEGURADO: Los asegurados SÍ tienen cuestionario
        // Solo GO no tiene cuestionario
        if (seccionAsegurados) seccionAsegurados.classList.remove('hidden');
        if (seccionCuestionario) {
            if (esPolizaGO) {
                seccionCuestionario.classList.add('hidden');
            } else {
                seccionCuestionario.classList.remove('hidden');
            }
        }
        if (document.getElementById('seccionMascota')) {
            document.getElementById('seccionMascota').classList.add('hidden');
        }
        if (tituloPaso3) {
            if (esPolizaEmpresa) {
                tituloPaso3.textContent = '👥 Empleados Asegurados';
            } else {
                tituloPaso3.textContent = '👥 Asegurados';
            }
        }
    }
    
    // Renderizar según producto
    if (tipoProducto === 'MASCOTAS') {
        renderizarMascota();
    } else {
        renderizarAsegurados();
        // Cuestionario para SALUD siempre, excepto GO
        if (tipoProducto === 'SALUD' && !esPolizaGO) {
            renderizarCuestionarios();
        }
    }
    
    // === PÓLIZA DE EMPRESA ===
    // Cambiar formulario de tomador a datos de empresa
    const tomadorPersona = document.getElementById('tomadorPersona');
    const tomadorEmpresa = document.getElementById('tomadorEmpresa');
    const paso2Titulo = document.getElementById('paso2Titulo');
    
    console.log('=== ACTUALIZANDO VISTA ===');
    console.log('esPolizaEmpresa:', esPolizaEmpresa);
    console.log('tomadorPersona existe:', !!tomadorPersona);
    console.log('tomadorEmpresa existe:', !!tomadorEmpresa);
    
    if (esPolizaEmpresa) {
        console.log('=== PÓLIZA EMPRESA: Mostrando formulario empresa ===');
        if (tomadorPersona) tomadorPersona.classList.add('hidden');
        if (tomadorEmpresa) tomadorEmpresa.classList.remove('hidden');
        if (paso2Titulo) paso2Titulo.textContent = 'Datos de la Empresa (Tomador)';
    } else {
        if (tomadorPersona) tomadorPersona.classList.remove('hidden');
        if (tomadorEmpresa) tomadorEmpresa.classList.add('hidden');
        if (paso2Titulo) {
            if (!tomadorEsAsegurado) {
                paso2Titulo.textContent = 'Datos del Tomador (solo paga)';
            } else {
                paso2Titulo.textContent = 'Datos del Tomador';
            }
        }
    }
    
    // Mostrar/ocultar aviso de tomador no asegurado
    const avisoTomadorNoAsegurado = document.getElementById('avisoTomadorNoAsegurado');
    if (avisoTomadorNoAsegurado) {
        if (!tomadorEsAsegurado && !esPolizaEmpresa) {
            avisoTomadorNoAsegurado.classList.remove('hidden');
        } else {
            avisoTomadorNoAsegurado.classList.add('hidden');
        }
    }
}

// ============================================================================
// CREAR SECCIÓN MASCOTA DINÁMICAMENTE
// ============================================================================
function crearSeccionMascota() {
    const paso3Content = document.getElementById('paso3Content');
    if (!paso3Content) return;
    
    // Crear div para mascota si no existe
    let seccionMascota = document.getElementById('seccionMascota');
    if (!seccionMascota) {
        seccionMascota = document.createElement('div');
        seccionMascota.id = 'seccionMascota';
        seccionMascota.className = 'hidden';
        paso3Content.appendChild(seccionMascota);
    }
}

// ============================================================================
// RENDERIZAR DATOS DE MASCOTA
// ============================================================================
function renderizarMascota() {
    let seccionMascota = document.getElementById('seccionMascota');
    if (!seccionMascota) {
        crearSeccionMascota();
        seccionMascota = document.getElementById('seccionMascota');
    }
    if (!seccionMascota) return;
    
    seccionMascota.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span class="flex items-center justify-center w-8 h-8 bg-amber-500 text-white rounded-full text-sm">3</span>
                🐾 Datos de la Mascota
            </h2>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la mascota <span class="text-red-500">*</span></label>
                    <input type="text" id="mascotaNombre" value="${datosMascota.nombre || ''}" 
                        onchange="datosMascota.nombre = this.value.toUpperCase(); this.value = this.value.toUpperCase();"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" placeholder="Ej: TOBY">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo <span class="text-red-500">*</span></label>
                    <select id="mascotaTipo" onchange="datosMascota.tipo = this.value;" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">-- Seleccionar --</option>
                        <option value="PERRO" ${datosMascota.tipo === 'PERRO' ? 'selected' : ''}>🐕 Perro</option>
                        <option value="GATO" ${datosMascota.tipo === 'GATO' ? 'selected' : ''}>🐈 Gato</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Raza <span class="text-red-500">*</span></label>
                    <input type="text" id="mascotaRaza" value="${datosMascota.raza || ''}" 
                        onchange="datosMascota.raza = this.value.toUpperCase(); this.value = this.value.toUpperCase();"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" placeholder="Ej: LABRADOR">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento <span class="text-red-500">*</span></label>
                    <input type="date" id="mascotaFechaNac" value="${datosMascota.fechaNacimiento || ''}" 
                        onchange="datosMascota.fechaNacimiento = this.value;"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número de Chip <span class="text-red-500">*</span> <span class="text-xs text-gray-500">(15 dígitos)</span></label>
                    <input type="text" id="mascotaChip" value="${datosMascota.chip || ''}" 
                        maxlength="15"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '').substring(0, 15); datosMascota.chip = this.value; validarChipMascota(this);"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ej: 941000012345678">
                    <p id="chipValidacion" class="text-xs mt-1 hidden"></p>
                </div>
            </div>
        </div>
    `;
}

function cargarAseguradosDePropuesta() {
    if (!propuestaSeleccionada || !propuestaSeleccionada.asegurados.length) return;

    // Guardar DNIs existentes de Pipedrive antes de sobrescribir
    const dnisExistentes = {};
    const F = CONFIG.DEAL_FIELDS;
    
    // DNI del tomador
    dnisExistentes[1] = (dealOriginal[F.dniTitular] || '').toUpperCase();
    
    // DNI de asegurados 2-12
    for (let i = 2; i <= 12; i++) {
        if (F.asegurados[i]) {
            dnisExistentes[i] = (dealOriginal[F.asegurados[i].dni] || '').toUpperCase();
        }
    }

    asegurados = [];
    
    // CASO 1: PÓLIZA DE EMPRESA
    // Tomador = Empresa (sin cuestionario, se rellena en paso 2)
    // Asegurados = Empleados (todos con cuestionario, incluido el titular/primero)
    if (esPolizaEmpresa) {
        console.log('=== EMPRESA: Todos los asegurados son empleados CON cuestionario ===');
        propuestaSeleccionada.asegurados.forEach((aseg, idx) => {
            const numAseg = idx + 1;
            asegurados.push({
                id: Date.now() + idx, 
                numero: numAseg, 
                nombre: aseg.nombre, 
                apellidos: aseg.apellidos,
                nif: dnisExistentes[numAseg] || '',
                fechaNacimiento: aseg.fechaNacimiento, 
                sexo: aseg.sexo, 
                parentesco: '',
                esTomador: false, // El tomador es la empresa, no una persona
                esTitular: idx === 0, // El primero es el titular de la póliza
                cuestionario: crearCuestionarioVacio()
            });
        });
    } 
    // CASO 2: TOMADOR NO ES ASEGURADO (póliza particular)
    // Tomador = Persona que paga (sin cuestionario, se rellena en paso 2)
    // Asegurados = Todas las personas de la propuesta (todos con cuestionario)
    else if (!tomadorEsAsegurado) {
        console.log('=== TOMADOR NO ES ASEGURADO: Todos los de la propuesta son asegurados CON cuestionario ===');
        propuestaSeleccionada.asegurados.forEach((aseg, idx) => {
            const numAseg = idx + 1;
            asegurados.push({
                id: Date.now() + idx, 
                numero: numAseg, 
                nombre: aseg.nombre, 
                apellidos: aseg.apellidos,
                nif: dnisExistentes[numAseg] || '',
                fechaNacimiento: aseg.fechaNacimiento, 
                sexo: aseg.sexo, 
                parentesco: '',
                esTomador: false, // El tomador solo paga, no es asegurado
                cuestionario: crearCuestionarioVacio()
            });
        });
    } 
    // CASO 3: PÓLIZA NORMAL (tomador SÍ es asegurado)
    // Tomador = Primera persona (con cuestionario)
    // Resto = Asegurados adicionales (con cuestionario)
    else {
        console.log('=== PÓLIZA NORMAL: Primer asegurado es el tomador ===');
        propuestaSeleccionada.asegurados.forEach((aseg, idx) => {
            if (idx === 0) {
                // Rellenar datos del tomador en paso 2
                const tomNombre = document.getElementById('tomadorNombre');
                const tomApellidos = document.getElementById('tomadorApellidos');
                const tomFechaNac = document.getElementById('tomadorFechaNac');
                const tomSexo = document.getElementById('tomadorSexo');
                const tomNif = document.getElementById('tomadorNif');
                
                if (tomNombre) tomNombre.value = aseg.nombre || '';
                if (tomApellidos) tomApellidos.value = aseg.apellidos || '';
                if (tomFechaNac) tomFechaNac.value = aseg.fechaNacimiento || '';
                if (aseg.sexo && tomSexo) tomSexo.value = aseg.sexo;
                if (dnisExistentes[1] && tomNif) tomNif.value = dnisExistentes[1];
                
                asegurados.push({ id: 1, numero: 1, esTomador: true, cuestionario: crearCuestionarioVacio() });
            } else {
                const numAseg = idx + 1;
                asegurados.push({
                    id: Date.now() + idx, numero: numAseg, nombre: aseg.nombre, apellidos: aseg.apellidos,
                    nif: dnisExistentes[numAseg] || '',
                    fechaNacimiento: aseg.fechaNacimiento, sexo: aseg.sexo, parentesco: '',
                    esTomador: false, cuestionario: crearCuestionarioVacio()
                });
            }
        });
    }

    renderizarAsegurados();
    renderizarCuestionarios();
}

// ============================================================================
// MAPEAR DATOS BÁSICOS
// ============================================================================
function mapearDatosBasicos() {
    const F = CONFIG.DEAL_FIELDS;
    const deal = dealOriginal;
    const person = personaOriginal;
    const getField = (key) => deal[key] || '';

    document.getElementById('agente').value = deal.user_id?.name || '';
    document.getElementById('solicitud').value = getField(F.numSolicitud);
    document.getElementById('poliza').value = getField(F.numPoliza);
    if (getField(F.tipoPoliza)) document.getElementById('tipoPoliza').value = getField(F.tipoPoliza);
    if (getField(F.precio)) document.getElementById('importe').value = getField(F.precio);
    if (getField(F.efecto)) document.getElementById('fechaEfecto').value = getField(F.efecto);
    if (getField(F.frecuenciaPago)) document.getElementById('frecuenciaPago').value = getField(F.frecuenciaPago);

    const nombreCompleto = getField(F.nombreTitular) || person?.name || deal.title || '';
    const partes = nombreCompleto.toUpperCase().split(' ');
    document.getElementById('tomadorNombre').value = partes[0] || '';
    document.getElementById('tomadorApellidos').value = partes.slice(1).join(' ') || '';
    document.getElementById('tomadorNif').value = (getField(F.dniTitular) || '').toUpperCase();
    document.getElementById('tomadorFechaNac').value = getField(F.fechaNacTitular) || '';
    document.getElementById('tomadorTelefono').value = person?.phone?.[0]?.value || '';
    document.getElementById('tomadorEmail').value = person?.email?.[0]?.value || '';
    document.getElementById('tomadorDireccion').value = (getField(F.direccion) || '').toUpperCase();
    document.getElementById('tomadorCP').value = getField(F.codigoPostal) || '';
    document.getElementById('tomadorLocalidad').value = (getField(F.poblacion) || '').toUpperCase();
    document.getElementById('tomadorNacionalidad').value = (getField(F.nacionalidad) || 'ESPAÑOLA').toUpperCase();
    
    // TAMBIÉN CARGAR EN CAMPOS DE EMPRESA (para pólizas de empresa)
    // Teléfono y email del contacto van a los campos de empresa
    const empresaTelefono = document.getElementById('empresaTelefono');
    const empresaEmail = document.getElementById('empresaEmail');
    const empresaContacto = document.getElementById('empresaContacto');
    
    if (empresaTelefono) empresaTelefono.value = person?.phone?.[0]?.value || '';
    if (empresaEmail) empresaEmail.value = person?.email?.[0]?.value || '';
    if (empresaContacto) empresaContacto.value = person?.name || '';
    
    // Dirección, CP, Localidad compartidos
    const tomadorDireccionEmp = document.getElementById('tomadorDireccion');
    const tomadorCPEmp = document.getElementById('tomadorCP');
    const tomadorLocalidadEmp = document.getElementById('tomadorLocalidad');
    
    // Ya se cargaron arriba, pero los campos son compartidos
    
    // Estado civil - convertir código a valor si es necesario
    const estadoCivilValue = getField(F.estadoCivil);
    if (estadoCivilValue) {
        document.getElementById('tomadorEstadoCivil').value = estadoCivilValue;
    }
    
    // Sexo del titular - convertir código numérico a H/M
    const sexoTitularValue = getField(F.sexoTitular);
    if (sexoTitularValue) {
        // Pipedrive puede guardar como código (275=H, 276=M) o como texto
        let sexoFinal = sexoTitularValue;
        if (sexoTitularValue === '275' || sexoTitularValue === 275) sexoFinal = 'H';
        else if (sexoTitularValue === '276' || sexoTitularValue === 276) sexoFinal = 'M';
        document.getElementById('tomadorSexo').value = sexoFinal;
    }

    const provinciaValue = deal[F.provincia];
    if (provinciaValue) {
        const provinciaNombre = typeof provinciaValue === 'number' ? CONFIG.PROVINCIAS[provinciaValue] : 
                                (CONFIG.PROVINCIAS[parseInt(provinciaValue)] || provinciaValue);
        if (provinciaNombre) document.getElementById('tomadorProvincia').value = provinciaNombre.toUpperCase();
    }

    const iban = getField(F.iban);
    if (iban) document.getElementById('tomadorIBAN').value = formatearIBAN(iban);

    if (asegurados.length === 0) {
        asegurados = [{ id: 1, numero: 1, esTomador: true, cuestionario: crearCuestionarioVacio() }];

        for (let i = 2; i <= 12; i++) {
            const campos = F.asegurados[i];
            const nombreAseg = getField(campos.nombre);
            if (nombreAseg) {
                const partesNombre = nombreAseg.toUpperCase().split(' ');
                
                // Convertir sexo de código a H/M
                let sexoAseg = getField(campos.sexo);
                if (sexoAseg === '275' || sexoAseg === 275) sexoAseg = 'H';
                else if (sexoAseg === '276' || sexoAseg === 276) sexoAseg = 'M';
                
                asegurados.push({
                    id: i, numero: i, 
                    nombre: partesNombre[0] || '', 
                    apellidos: partesNombre.slice(1).join(' ') || '',
                    nif: (getField(campos.dni) || '').toUpperCase(), 
                    fechaNacimiento: getField(campos.fecha) || '',
                    sexo: sexoAseg || '', 
                    parentesco: getField(campos.parentesco) || '', 
                    esTomador: false, 
                    cuestionario: crearCuestionarioVacio()
                });
            }
        }
        renderizarAsegurados();
        renderizarCuestionarios();
    }
}

function crearCuestionarioVacio() {
    return {
        edad: '', peso: '', estatura: '',
        p1_enfermedades: '', p1_detalle: '', p2_secuelas: '', p2_detalle: '',
        p3_intervenciones: '', p3_detalle: '', p4_ultimaVisita: '', p4_motivo: '',
        p5_defectoFisico: '', p5_detalle: '', p6_traumatismos: '', p6_detalle: '',
        p7_tratamiento: '', p7_detalle: '', p8_estudioFuturo: '', p8_detalle: '',
        p9_hospitalizacion: '', p9_detalle: '', p10_fumador: '', p10_detalle: '',
        p11_alcohol: '', p11_detalle: '', p12_estupefacientes: '', p12_detalle: '',
        // Campos adicionales para SENIOR
        senior_enfermedad_general: '', // Pregunta principal: ¿ha padecido enfermedad?
        senior_corazon: '', senior_corazon_detalle: '',
        senior_rinon: '', senior_rinon_detalle: '',
        senior_vascular: '', senior_vascular_detalle: '',
        senior_nervioso: '', senior_nervioso_detalle: '',
        senior_diabetes: '', senior_diabetes_tipo: '',
        senior_tiroides: '', senior_tiroides_detalle: '',
        senior_hipertension: '', senior_tension1: '', senior_tension2: '',
        senior_colesterol: '',
        senior_epoc: '', senior_fev1: '',
        senior_respiratorio: '', senior_respiratorio_detalle: '',
        senior_digestivo: '', senior_digestivo_detalle: '',
        senior_ocular: '', senior_ocular_detalle: '',
        senior_locomotor: '', senior_locomotor_detalle: '',
        senior_tumoral: '', senior_tumoral_detalle: '',
        senior_psiquiatrico: '', senior_psiquiatrico_detalle: '',
        senior_infeccioso: '', senior_infeccioso_detalle: '',
        senior_otras: '', senior_otras_detalle: '',
        senior_discapacidad: '', senior_discapacidad_detalle: '',
        senior_baja: '', senior_baja_detalle: ''
    };
}

// ============================================================================
// RENDERIZAR ASEGURADOS
// ============================================================================
function renderizarAsegurados() {
    const container = document.getElementById('listaAsegurados');
    container.innerHTML = '';

    asegurados.forEach((aseg, index) => {
        const div = document.createElement('div');
        div.className = `p-4 border-2 rounded-xl mb-4 ${aseg.esTomador ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`;
        
        if (aseg.esTomador) {
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm bg-blue-600">1</span>
                        Tomador (Asegurado Principal)
                    </h3>
                </div>
                <div class="p-3 bg-blue-100 rounded-lg">
                    <p class="font-medium">${document.getElementById('tomadorNombre').value} ${document.getElementById('tomadorApellidos').value}</p>
                    <p class="text-sm text-blue-700">DNI: ${document.getElementById('tomadorNif').value || 'Sin rellenar'} | Nac: ${document.getElementById('tomadorFechaNac').value || 'Sin rellenar'}</p>
                </div>`;
        } else {
            div.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm bg-indigo-500">${index + 1}</span>
                        Asegurado ${aseg.numero}
                    </h3>
                    <button onclick="eliminarAsegurado(${aseg.id})" class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" value="${aseg.nombre || ''}" onchange="actualizarAsegurado(${aseg.id}, 'nombre', this.value.toUpperCase())" class="w-full px-3 py-2 border border-gray-300 rounded-lg ${aseg.nombre ? 'campo-cargado' : ''}"></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                        <input type="text" value="${aseg.apellidos || ''}" onchange="actualizarAsegurado(${aseg.id}, 'apellidos', this.value.toUpperCase())" class="w-full px-3 py-2 border border-gray-300 rounded-lg ${aseg.apellidos ? 'campo-cargado' : ''}"></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">DNI/NIE *</label>
                        <input type="text" value="${aseg.nif || ''}" oninput="this.value = this.value.toUpperCase()" onchange="actualizarAsegurado(${aseg.id}, 'nif', this.value.toUpperCase()); validarDNI(this)" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento *</label>
                        <input type="date" value="${aseg.fechaNacimiento || ''}" onchange="actualizarAsegurado(${aseg.id}, 'fechaNacimiento', this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-lg ${aseg.fechaNacimiento ? 'campo-cargado' : ''}"></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                        <select onchange="actualizarAsegurado(${aseg.id}, 'sexo', this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Seleccionar...</option>
                            <option value="H" ${aseg.sexo === 'H' ? 'selected' : ''}>Hombre</option>
                            <option value="M" ${aseg.sexo === 'M' ? 'selected' : ''}>Mujer</option>
                        </select></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Parentesco *</label>
                        <select onchange="actualizarAsegurado(${aseg.id}, 'parentesco', this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Seleccionar...</option>
                            ${CONFIG.PARENTESCOS.map(p => `<option value="${p}" ${aseg.parentesco === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select></div>
                </div>`;
        }
        container.appendChild(div);
    });
    const numAsegElem = document.getElementById('numAsegurados');
    if (numAsegElem) numAsegElem.textContent = asegurados.length;
}

function actualizarAsegurado(id, campo, valor) {
    const aseg = asegurados.find(a => a.id === id);
    if (aseg) aseg[campo] = valor;
}

function añadirAsegurado() {
    if (asegurados.length >= 12) { mostrarError('Máximo 12 asegurados permitidos'); return; }
    const maxNumero = Math.max(...asegurados.map(a => a.numero));
    asegurados.push({ id: Date.now(), numero: maxNumero + 1, nombre: '', apellidos: '', nif: '', fechaNacimiento: '', sexo: '', parentesco: '', esTomador: false, cuestionario: crearCuestionarioVacio() });
    renderizarAsegurados();
    renderizarCuestionarios();
}

function eliminarAsegurado(id) {
    asegurados = asegurados.filter(a => a.id !== id);
    asegurados.forEach((a, idx) => { a.numero = idx + 1; });
    renderizarAsegurados();
    renderizarCuestionarios();
}

// ============================================================================
// RENDERIZAR CUESTIONARIOS
// ============================================================================
function renderizarCuestionarios() {
    const container = document.getElementById('listaCuestionarios');
    container.innerHTML = '';

    asegurados.forEach((aseg, index) => {
        const nombre = aseg.esTomador ? `${document.getElementById('tomadorNombre').value} ${document.getElementById('tomadorApellidos').value}` : `${aseg.nombre} ${aseg.apellidos}`;
        const fechaNac = aseg.esTomador ? document.getElementById('tomadorFechaNac').value : aseg.fechaNacimiento;
        const c = aseg.cuestionario;
        const edadCalculada = calcularEdad(fechaNac);
        
        // Validar campos
        const pesoVacio = !c.peso;
        const estaturaVacia = !c.estatura;

        const div = document.createElement('div');
        div.className = 'p-6 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl mb-6';
        
        // Cabecera común
        let html = `
            <h3 class="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-200 flex items-center gap-3">
                <span class="w-10 h-10 bg-gradient-to-br ${esPolizaSenior ? 'from-purple-500 to-pink-600' : 'from-blue-500 to-indigo-600'} text-white rounded-xl flex items-center justify-center font-bold">${index + 1}</span>
                ${nombre || 'SIN NOMBRE'}
                ${esPolizaSenior ? '<span class="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">SENIOR</span>' : ''}
            </h3>
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                    <input type="number" value="${c.edad || edadCalculada}" onchange="actualizarCuestionario(${aseg.id}, 'edad', this.value); validarCuestionarioVisual();" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Años"></div>
                <div><label class="block text-sm font-medium ${pesoVacio ? 'text-red-600' : 'text-gray-700'} mb-1">Peso (kg) ${pesoVacio ? '*' : ''}</label>
                    <input type="number" id="peso_${aseg.id}" value="${c.peso}" onchange="actualizarCuestionario(${aseg.id}, 'peso', this.value); calcularIMC(${aseg.id}); validarCuestionarioVisual();" class="w-full px-3 py-2 border ${pesoVacio ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg" placeholder="Kg"></div>
                <div><label class="block text-sm font-medium ${estaturaVacia ? 'text-red-600' : 'text-gray-700'} mb-1">Altura (cm) ${estaturaVacia ? '*' : ''}</label>
                    <input type="number" id="estatura_${aseg.id}" value="${c.estatura}" onchange="actualizarCuestionario(${aseg.id}, 'estatura', this.value); calcularIMC(${aseg.id}); validarCuestionarioVisual();" class="w-full px-3 py-2 border ${estaturaVacia ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg" placeholder="cm"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">IMC</label>
                    <div id="imc_${aseg.id}" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-center font-bold">-</div></div>
            </div>
            <div class="space-y-3">`;
        
        if (esPolizaSenior) {
            // CUESTIONARIO SENIOR (26 preguntas)
            html += generarCuestionarioSenior(aseg.id, c);
        } else {
            // CUESTIONARIO NORMAL (12 preguntas)
            html += generarCuestionarioNormal(aseg.id, c);
        }
        
        html += `</div>`;
        div.innerHTML = html;
        container.appendChild(div);
    });
    
    // Calcular IMC para todos los asegurados
    asegurados.forEach(aseg => {
        calcularIMC(aseg.id);
    });
    
    // Validar y actualizar botón
    validarCuestionarioVisual();
}

// Cuestionario normal (12 preguntas)
function generarCuestionarioNormal(asegId, c) {
    const p4Incompleta = !c.p4_ultimaVisita || !c.p4_motivo;
    
    return `
        ${generarPregunta(asegId, 1, '¿Padece o ha padecido alguna enfermedad en los últimos 5 años?', 'p1_enfermedades', c.p1_enfermedades, c.p1_detalle)}
        ${generarPregunta(asegId, 2, '¿Le ha dejado alguna lesión o secuelas?', 'p2_secuelas', c.p2_secuelas, c.p2_detalle)}
        ${generarPregunta(asegId, 3, '¿Ha sido intervenido o ingresado en hospital?', 'p3_intervenciones', c.p3_intervenciones, c.p3_detalle)}
        <div class="mb-3 p-3 ${p4Incompleta ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'} rounded-lg border">
            <p class="text-sm font-medium ${p4Incompleta ? 'text-red-700' : 'text-gray-700'} mb-2">
                <span class="inline-flex items-center justify-center w-6 h-6 ${p4Incompleta ? 'bg-red-500' : 'bg-blue-600'} text-white text-xs rounded-full mr-2">4</span>
                Última visita al médico ${p4Incompleta ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
            </p>
            <div class="grid grid-cols-2 gap-4 ml-8">
                <div><label class="block text-xs ${!c.p4_ultimaVisita ? 'text-red-600' : 'text-gray-600'} mb-1">Fecha * (ej: ENERO 2024)</label>
                    <input type="text" value="${c.p4_ultimaVisita || ''}" placeholder="MES AÑO o fecha aproximada" oninput="actualizarCuestionario(${asegId}, 'p4_ultimaVisita', this.value.toUpperCase()); validarCuestionarioVisual();" class="w-full px-3 py-2 border ${!c.p4_ultimaVisita ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg"></div>
                <div><label class="block text-xs ${!c.p4_motivo ? 'text-red-600' : 'text-gray-600'} mb-1">Motivo *</label>
                    <input type="text" value="${c.p4_motivo || ''}" placeholder="Revisión, resfriado..." oninput="actualizarCuestionario(${asegId}, 'p4_motivo', this.value.toUpperCase()); validarCuestionarioVisual();" class="w-full px-3 py-2 border ${!c.p4_motivo ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg"></div>
            </div>
        </div>
        ${generarPregunta(asegId, 5, '¿Defecto físico, deformidad o lesión congénita?', 'p5_defectoFisico', c.p5_defectoFisico, c.p5_detalle)}
        ${generarPregunta(asegId, 6, '¿Traumatismo o accidente?', 'p6_traumatismos', c.p6_traumatismos, c.p6_detalle)}
        ${generarPregunta(asegId, 7, '¿Tratamiento médico actual?', 'p7_tratamiento', c.p7_tratamiento, c.p7_detalle)}
        ${generarPregunta(asegId, 8, '¿Estudio o tratamiento previsto?', 'p8_estudioFuturo', c.p8_estudioFuturo, c.p8_detalle)}
        ${generarPregunta(asegId, 9, '¿Hospitalización prevista?', 'p9_hospitalizacion', c.p9_hospitalizacion, c.p9_detalle)}
        ${generarPregunta(asegId, 10, '¿Es o ha sido fumador?', 'p10_fumador', c.p10_fumador, c.p10_detalle)}
        ${generarPregunta(asegId, 11, '¿Consume alcohol habitualmente?', 'p11_alcohol', c.p11_alcohol, c.p11_detalle)}
        ${generarPregunta(asegId, 12, '¿Consume o ha consumido estupefacientes?', 'p12_estupefacientes', c.p12_estupefacientes, c.p12_detalle)}
    `;
}

// Cuestionario SENIOR (26 preguntas según PDF)
function generarCuestionarioSenior(asegId, c) {
    // Si contesta NO a la pregunta general, no mostrar las 17 enfermedades específicas
    const mostrarEnfermedades = c.senior_enfermedad_general === 'SÍ';
    
    let html = `
        <div class="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p class="text-purple-800 font-medium text-sm">📋 Cuestionario de Salud SENIOR - Responda todas las preguntas</p>
        </div>
        
        <!-- PREGUNTA PRINCIPAL: ¿Ha padecido alguna enfermedad? -->
        <div class="mb-3 p-4 rounded-lg border-2 ${!c.senior_enfermedad_general ? 'bg-red-50 border-red-300' : 'bg-purple-50 border-purple-300'}">
            <p class="text-base font-bold ${!c.senior_enfermedad_general ? 'text-red-700' : 'text-purple-800'} mb-3">
                ¿Padece o ha padecido alguna enfermedad en los últimos 5 años?
                ${!c.senior_enfermedad_general ? '<span class="text-red-500 text-xs ml-2">(obligatorio)</span>' : ''}
            </p>
            <div class="flex gap-4">
                <label class="flex items-center cursor-pointer px-6 py-3 rounded-lg border-2 ${c.senior_enfermedad_general === 'NO' ? 'border-green-500 bg-green-100' : 'border-gray-200 bg-white'}">
                    <input type="radio" name="aseg${asegId}_senior_enfermedad_general" value="NO" ${c.senior_enfermedad_general === 'NO' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_enfermedad_general', 'NO')" class="w-5 h-5 text-green-600"><span class="ml-2 font-bold text-lg">No</span></label>
                <label class="flex items-center cursor-pointer px-6 py-3 rounded-lg border-2 ${c.senior_enfermedad_general === 'SÍ' ? 'border-orange-500 bg-orange-100' : 'border-gray-200 bg-white'}">
                    <input type="radio" name="aseg${asegId}_senior_enfermedad_general" value="SÍ" ${c.senior_enfermedad_general === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_enfermedad_general', 'SÍ')" class="w-5 h-5 text-orange-600"><span class="ml-2 font-bold text-lg">Sí</span></label>
            </div>
        </div>`;
    
    // Solo mostrar las 17 enfermedades si contestó SÍ
    if (mostrarEnfermedades) {
        html += `
        <div class="ml-4 pl-4 border-l-4 border-purple-300">
            <div class="mb-3 p-2 bg-purple-100 rounded-lg">
                <p class="font-bold text-purple-700 text-sm">En caso afirmativo, ¿concretamente alguna de estas?</p>
            </div>
            
            ${generarPreguntaSenior(asegId, 1, 'Problemas de corazón (infarto, angina, arritmia, otros)', 'senior_corazon', c.senior_corazon, c.senior_corazon_detalle)}
            ${generarPreguntaSenior(asegId, 2, 'Enfermedad de riñón o urológica (insuficiencia renal, creatinina elevada, próstata)', 'senior_rinon', c.senior_rinon, c.senior_rinon_detalle)}
            ${generarPreguntaSenior(asegId, 3, 'Problemas vasculares (trombosis, embolia)', 'senior_vascular', c.senior_vascular, c.senior_vascular_detalle)}
            ${generarPreguntaSenior(asegId, 4, 'Enfermedad del sistema nervioso (ictus, párkinson, esclerosis múltiple, epilepsia)', 'senior_nervioso', c.senior_nervioso, c.senior_nervioso_detalle)}
            
            <!-- Diabetes con tipo -->
            <div class="mb-3 p-3 rounded-lg border ${!c.senior_diabetes ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
                <p class="text-sm font-medium ${!c.senior_diabetes ? 'text-red-700' : 'text-gray-700'} mb-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 ${!c.senior_diabetes ? 'bg-red-500' : 'bg-purple-600'} text-white text-xs rounded-full mr-2">5</span>
                    Diabetes ${!c.senior_diabetes ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
                </p>
                <div class="flex gap-4 ml-8">
                    <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${c.senior_diabetes === 'NO' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_diabetes" value="NO" ${c.senior_diabetes === 'NO' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_diabetes', 'NO')" class="w-4 h-4 text-green-600"><span class="ml-2 font-medium">No</span></label>
                    <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${c.senior_diabetes === 'SÍ' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_diabetes" value="SÍ" ${c.senior_diabetes === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_diabetes', 'SÍ')" class="w-4 h-4 text-orange-600"><span class="ml-2 font-medium">Sí</span></label>
                </div>
                ${c.senior_diabetes === 'SÍ' ? `<div class="ml-8 mt-3 flex gap-4">
                    <label class="flex items-center cursor-pointer px-3 py-2 rounded-lg border-2 ${c.senior_diabetes_tipo === 'TIPO1' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_diabetes_tipo" value="TIPO1" ${c.senior_diabetes_tipo === 'TIPO1' ? 'checked' : ''} onchange="actualizarCuestionario(${asegId}, 'senior_diabetes_tipo', 'TIPO1'); validarCuestionarioVisual();" class="w-4 h-4"><span class="ml-2">Tipo 1</span></label>
                    <label class="flex items-center cursor-pointer px-3 py-2 rounded-lg border-2 ${c.senior_diabetes_tipo === 'TIPO2' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_diabetes_tipo" value="TIPO2" ${c.senior_diabetes_tipo === 'TIPO2' ? 'checked' : ''} onchange="actualizarCuestionario(${asegId}, 'senior_diabetes_tipo', 'TIPO2'); validarCuestionarioVisual();" class="w-4 h-4"><span class="ml-2">Tipo 2</span></label>
                </div>` : ''}
            </div>
            
            ${generarPreguntaSenior(asegId, 6, 'Enfermedad del tiroides o sistema endocrino', 'senior_tiroides', c.senior_tiroides, c.senior_tiroides_detalle)}
            
            <!-- Hipertensión con mediciones -->
            <div class="mb-3 p-3 rounded-lg border ${!c.senior_hipertension ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
                <p class="text-sm font-medium ${!c.senior_hipertension ? 'text-red-700' : 'text-gray-700'} mb-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 ${!c.senior_hipertension ? 'bg-red-500' : 'bg-purple-600'} text-white text-xs rounded-full mr-2">7</span>
                    Hipertensión arterial ${!c.senior_hipertension ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
                </p>
                <div class="flex gap-4 ml-8">
                    <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${c.senior_hipertension === 'NO' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_hipertension" value="NO" ${c.senior_hipertension === 'NO' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_hipertension', 'NO')" class="w-4 h-4 text-green-600"><span class="ml-2 font-medium">No</span></label>
                    <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${c.senior_hipertension === 'SÍ' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_hipertension" value="SÍ" ${c.senior_hipertension === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_hipertension', 'SÍ')" class="w-4 h-4 text-orange-600"><span class="ml-2 font-medium">Sí</span></label>
                </div>
                ${c.senior_hipertension === 'SÍ' ? `<div class="ml-8 mt-3 grid grid-cols-2 gap-4">
                    <div><label class="block text-xs text-gray-600 mb-1">Penúltima medición</label>
                        <input type="text" value="${c.senior_tension1 || ''}" placeholder="Ej: 140/90" oninput="actualizarCuestionario(${asegId}, 'senior_tension1', this.value.toUpperCase()); validarCuestionarioVisual();" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></div>
                    <div><label class="block text-xs text-gray-600 mb-1">Última medición</label>
                        <input type="text" value="${c.senior_tension2 || ''}" placeholder="Ej: 135/85" oninput="actualizarCuestionario(${asegId}, 'senior_tension2', this.value.toUpperCase()); validarCuestionarioVisual();" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></div>
                </div>` : ''}
            </div>
            
            ${generarPreguntaSeniorSimple(asegId, 8, 'Colesterol elevado (superior a 220 mg/dl)', 'senior_colesterol', c.senior_colesterol)}
            
            <!-- EPOC con FEV1 -->
            <div class="mb-3 p-3 rounded-lg border ${!c.senior_epoc ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
                <p class="text-sm font-medium ${!c.senior_epoc ? 'text-red-700' : 'text-gray-700'} mb-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 ${!c.senior_epoc ? 'bg-red-500' : 'bg-purple-600'} text-white text-xs rounded-full mr-2">9</span>
                    EPOC, bronquitis crónica, enfisema ${!c.senior_epoc ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
                </p>
                <div class="flex gap-4 ml-8">
                    <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${c.senior_epoc === 'NO' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_epoc" value="NO" ${c.senior_epoc === 'NO' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_epoc', 'NO')" class="w-4 h-4 text-green-600"><span class="ml-2 font-medium">No</span></label>
                    <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${c.senior_epoc === 'SÍ' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
                        <input type="radio" name="aseg${asegId}_senior_epoc" value="SÍ" ${c.senior_epoc === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, 'senior_epoc', 'SÍ')" class="w-4 h-4 text-orange-600"><span class="ml-2 font-medium">Sí</span></label>
                </div>
                ${c.senior_epoc === 'SÍ' ? `<div class="ml-8 mt-3">
                    <label class="block text-xs text-gray-600 mb-1">Dato FEV1 de última espirometría</label>
                    <input type="text" value="${c.senior_fev1 || ''}" placeholder="Ej: 80%" oninput="actualizarCuestionario(${asegId}, 'senior_fev1', this.value.toUpperCase()); validarCuestionarioVisual();" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>` : ''}
            </div>
            
            ${generarPreguntaSenior(asegId, 10, 'Otras enfermedades respiratorias (asma, apnea del sueño)', 'senior_respiratorio', c.senior_respiratorio, c.senior_respiratorio_detalle)}
            ${generarPreguntaSenior(asegId, 11, 'Enfermedad digestiva o del hígado (hepatitis, cirrosis, Crohn)', 'senior_digestivo', c.senior_digestivo, c.senior_digestivo_detalle)}
            ${generarPreguntaSenior(asegId, 12, 'Enfermedad ocular (catarata, glaucoma, enfermedad de retina)', 'senior_ocular', c.senior_ocular, c.senior_ocular_detalle)}
            ${generarPreguntaSenior(asegId, 13, 'Enfermedad del aparato locomotor (artritis, artrosis, hernia discal)', 'senior_locomotor', c.senior_locomotor, c.senior_locomotor_detalle)}
            ${generarPreguntaSenior(asegId, 14, 'Enfermedad tumoral o cancerosa', 'senior_tumoral', c.senior_tumoral, c.senior_tumoral_detalle)}
            ${generarPreguntaSenior(asegId, 15, 'Enfermedad psiquiátrica (depresión, esquizofrenia, anorexia)', 'senior_psiquiatrico', c.senior_psiquiatrico, c.senior_psiquiatrico_detalle)}
            ${generarPreguntaSenior(asegId, 16, 'Enfermedad infecciosa', 'senior_infeccioso', c.senior_infeccioso, c.senior_infeccioso_detalle)}
            ${generarPreguntaSenior(asegId, 17, 'Otras enfermedades', 'senior_otras', c.senior_otras, c.senior_otras_detalle)}
        </div>`;
    }
    
    // SECCIÓN: Hábitos y situación actual (siempre se muestra)
    html += `
        <div class="mb-4 mt-6 p-2 bg-slate-100 rounded-lg">
            <p class="font-bold text-slate-700 text-sm">Hábitos y situación actual</p>
        </div>
        
        ${generarPregunta(asegId, 18, '¿Consume o ha consumido más de 5 unidades de alcohol al día?', 'p11_alcohol', c.p11_alcohol, c.p11_detalle)}
        ${generarPregunta(asegId, 19, '¿Es o ha sido fumador?', 'p10_fumador', c.p10_fumador, c.p10_detalle)}
        ${generarPregunta(asegId, 20, '¿Consume o ha consumido estupefacientes o drogas?', 'p12_estupefacientes', c.p12_estupefacientes, c.p12_detalle)}
        ${generarPregunta(asegId, 21, '¿Se encuentra bajo control médico o siguiendo tratamiento?', 'p7_tratamiento', c.p7_tratamiento, c.p7_detalle)}
        ${generarPregunta(asegId, 22, '¿Ha sido hospitalizado, operado o sometido a estudio/tratamiento?', 'p3_intervenciones', c.p3_intervenciones, c.p3_detalle)}
        ${generarPregunta(asegId, 23, '¿Ha sufrido algún traumatismo o accidente?', 'p6_traumatismos', c.p6_traumatismos, c.p6_detalle)}
        ${generarPreguntaSenior(asegId, 24, '¿Tiene reconocida o solicitada discapacidad o invalidez?', 'senior_discapacidad', c.senior_discapacidad, c.senior_discapacidad_detalle)}
        ${generarPreguntaSenior(asegId, 25, '¿Ha estado de baja laboral más de 3 semanas en los últimos 5 años?', 'senior_baja', c.senior_baja, c.senior_baja_detalle)}
    `;
    
    return html;
}

// Generar pregunta SENIOR con detalle
function generarPreguntaSenior(asegId, numero, pregunta, campo, valor, detalle) {
    const sinResponder = !valor;
    const faltaDetalle = valor === 'SÍ' && !detalle;
    const campoDetalle = `${campo}_detalle`;
    
    return `
        <div class="mb-3 p-3 rounded-lg border ${sinResponder ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
            <p class="text-sm font-medium ${sinResponder ? 'text-red-700' : 'text-gray-700'} mb-2">
                <span class="inline-flex items-center justify-center w-6 h-6 ${sinResponder ? 'bg-red-500' : 'bg-purple-600'} text-white text-xs rounded-full mr-2">${numero}</span>
                ${pregunta} ${sinResponder ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
            </p>
            <div class="flex gap-4 ml-8">
                <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${valor === 'NO' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                    <input type="radio" name="aseg${asegId}_${campo}" value="NO" ${valor === 'NO' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, '${campo}', 'NO')" class="w-4 h-4 text-green-600"><span class="ml-2 font-medium">No</span></label>
                <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${valor === 'SÍ' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
                    <input type="radio" name="aseg${asegId}_${campo}" value="SÍ" ${valor === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, '${campo}', 'SÍ')" class="w-4 h-4 text-orange-600"><span class="ml-2 font-medium">Sí</span></label>
            </div>
            ${valor === 'SÍ' ? `<div class="ml-8 mt-3">
                <input type="text" value="${detalle || ''}" placeholder="Especifique..." 
                    onkeyup="guardarDetalleInstant(${asegId}, '${campoDetalle}', this.value)"
                    onblur="guardarDetalleFinal(${asegId}, '${campoDetalle}', this.value)" 
                    class="w-full px-3 py-2 border ${faltaDetalle ? 'border-red-500 bg-red-50' : 'border-orange-300 bg-orange-50'} rounded-lg">
            </div>` : ''}
        </div>`;
}

// Generar pregunta SENIOR simple (sin detalle)
function generarPreguntaSeniorSimple(asegId, numero, pregunta, campo, valor) {
    const sinResponder = !valor;
    
    return `
        <div class="mb-3 p-3 rounded-lg border ${sinResponder ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
            <p class="text-sm font-medium ${sinResponder ? 'text-red-700' : 'text-gray-700'} mb-2">
                <span class="inline-flex items-center justify-center w-6 h-6 ${sinResponder ? 'bg-red-500' : 'bg-purple-600'} text-white text-xs rounded-full mr-2">${numero}</span>
                ${pregunta} ${sinResponder ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
            </p>
            <div class="flex gap-4 ml-8">
                <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${valor === 'NO' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                    <input type="radio" name="aseg${asegId}_${campo}" value="NO" ${valor === 'NO' ? 'checked' : ''} onchange="actualizarCuestionario(${asegId}, '${campo}', 'NO'); validarCuestionarioVisual();" class="w-4 h-4 text-green-600"><span class="ml-2 font-medium">No</span></label>
                <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${valor === 'SÍ' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
                    <input type="radio" name="aseg${asegId}_${campo}" value="SÍ" ${valor === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionario(${asegId}, '${campo}', 'SÍ'); validarCuestionarioVisual();" class="w-4 h-4 text-orange-600"><span class="ml-2 font-medium">Sí</span></label>
            </div>
        </div>`;
}

function generarPregunta(asegId, numero, pregunta, campo, valor, detalle) {
    const sinResponder = !valor;
    const faltaDetalle = valor === 'SÍ' && !detalle; // Siempre obligatorio si dice SÍ
    // CORREGIDO: Usar el nombre del campo base + _detalle, no el número de pregunta
    const campoBase = campo.replace('p', '').replace('_', '');
    const campoDetalle = campo.includes('_') ? campo.replace(/_[^_]+$/, '_detalle') : `${campo.split('_')[0]}_detalle`;
    // Usar el patrón correcto: p10_detalle, p11_detalle, etc.
    const campoDetalleReal = `${campo.replace(/_.*/, '')}_detalle`;
    
    return `
        <div class="mb-3 p-3 rounded-lg border ${sinResponder ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}">
            <p class="text-sm font-medium ${sinResponder ? 'text-red-700' : 'text-gray-700'} mb-2">
                <span class="inline-flex items-center justify-center w-6 h-6 ${sinResponder ? 'bg-red-500' : 'bg-blue-600'} text-white text-xs rounded-full mr-2">${numero}</span>
                ${pregunta} ${sinResponder ? '<span class="text-red-500 text-xs">(obligatorio)</span>' : ''}
            </p>
            <div class="flex gap-4 ml-8">
                <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${valor === 'NO' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                    <input type="radio" name="aseg${asegId}_${campo}" value="NO" ${valor === 'NO' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, '${campo}', 'NO')" class="w-4 h-4 text-green-600"><span class="ml-2 font-medium">No</span></label>
                <label class="flex items-center cursor-pointer px-4 py-2 rounded-lg border-2 ${valor === 'SÍ' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
                    <input type="radio" name="aseg${asegId}_${campo}" value="SÍ" ${valor === 'SÍ' ? 'checked' : ''} onchange="actualizarCuestionarioYRenderizar(${asegId}, '${campo}', 'SÍ')" class="w-4 h-4 text-orange-600"><span class="ml-2 font-medium">Sí</span></label>
            </div>
            ${valor === 'SÍ' ? `<div class="ml-8 mt-3">
                <input type="text" id="detalle_${asegId}_${campo}" value="${detalle || ''}" 
                    placeholder="Especifique... (obligatorio)" 
                    onkeyup="guardarDetalleInstant(${asegId}, '${campoDetalleReal}', this.value)"
                    onblur="guardarDetalleFinal(${asegId}, '${campoDetalleReal}', this.value)" 
                    class="w-full px-3 py-2 border ${faltaDetalle ? 'border-red-500 bg-red-50' : 'border-orange-300 bg-orange-50'} rounded-lg">
            </div>` : ''}
        </div>`;
}

// Guardar mientras escribe y validar
function guardarDetalleInstant(asegId, campo, valor) {
    const aseg = asegurados.find(a => a.id === asegId);
    if (aseg) {
        aseg.cuestionario[campo] = valor.toUpperCase();
        // Validar cada vez que escribe
        validarCuestionarioVisual();
    }
}

// Guardar y validar cuando sale del campo
function guardarDetalleFinal(asegId, campo, valor) {
    const aseg = asegurados.find(a => a.id === asegId);
    if (aseg) {
        aseg.cuestionario[campo] = valor.toUpperCase();
        console.log('Detalle final guardado:', campo, '=', valor.toUpperCase());
        validarCuestionarioVisual();
    }
}

function actualizarCuestionario(id, campo, valor) {
    const aseg = asegurados.find(a => a.id === id);
    if (aseg) aseg.cuestionario[campo] = valor;
}

function actualizarCuestionarioYRenderizar(id, campo, valor) {
    actualizarCuestionario(id, campo, valor);
    
    // Si cambia a NO, limpiar el detalle
    if (valor === 'NO') {
        const numPregunta = campo.match(/p(\d+)_/);
        if (numPregunta) {
            actualizarCuestionario(id, `p${numPregunta[1]}_detalle`, '');
        }
    }
    
    // Re-renderizar para mostrar/ocultar campo detalle
    renderizarCuestionarios();
    
    // Validar después del renderizado
    setTimeout(() => validarCuestionarioVisual(), 100);
}

// ============================================================================
// VALIDACIÓN VISUAL DEL CUESTIONARIO
// ============================================================================
function validarCuestionarioVisual() {
    // Productos sin cuestionario: siempre válido
    if (esPolizaGO || tipoProducto !== 'SALUD') {
        habilitarBotonGuion(true);
        return true;
    }
    
    let todoCompleto = true;
    let errores = [];
    
    asegurados.forEach((aseg, idx) => {
        // Si el asegurado NO tiene cuestionario (ej: tomador no asegurado en empresa), saltar
        if (!aseg.cuestionario) return;
        
        const c = aseg.cuestionario;
        const num = idx + 1;
        
        // Campos básicos obligatorios
        if (!c.peso) { todoCompleto = false; errores.push(`Aseg.${num}: Peso`); }
        if (!c.estatura) { todoCompleto = false; errores.push(`Aseg.${num}: Altura`); }
        
        // VALIDACIÓN IMC (18 - 29.50)
        if (c.peso && c.estatura) {
            const estaturaM = parseFloat(c.estatura) / 100;
            const imc = parseFloat(c.peso) / (estaturaM * estaturaM);
            if (imc < 18 || imc > 29.50) {
                todoCompleto = false;
                errores.push(`Aseg.${num}: IMC fuera de rango (${imc.toFixed(2)})`);
            }
        }
        
        if (esPolizaSenior) {
            // VALIDACIÓN CUESTIONARIO SENIOR
            
            // Pregunta principal obligatoria
            if (!c.senior_enfermedad_general) { todoCompleto = false; errores.push(`Aseg.${num}: ¿Enfermedad?`); }
            
            // Si contestó SÍ a la pregunta general, solo validar que los SÍ específicos tengan detalle
            // NO exigimos respuesta a todas las 17 enfermedades
            if (c.senior_enfermedad_general === 'SÍ') {
                // Solo validar detalles si marcaron SÍ en esa enfermedad específica
                if (c.senior_corazon === 'SÍ' && !c.senior_corazon_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Corazón detalle`); }
                if (c.senior_rinon === 'SÍ' && !c.senior_rinon_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Riñón detalle`); }
                if (c.senior_vascular === 'SÍ' && !c.senior_vascular_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Vascular detalle`); }
                if (c.senior_nervioso === 'SÍ' && !c.senior_nervioso_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Nervioso detalle`); }
                if (c.senior_diabetes === 'SÍ' && !c.senior_diabetes_tipo) { todoCompleto = false; errores.push(`Aseg.${num}: Diabetes tipo`); }
                if (c.senior_tiroides === 'SÍ' && !c.senior_tiroides_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Tiroides detalle`); }
                if (c.senior_hipertension === 'SÍ' && (!c.senior_tension1 || !c.senior_tension2)) { todoCompleto = false; errores.push(`Aseg.${num}: Hipertensión tensiones`); }
                if (c.senior_epoc === 'SÍ' && !c.senior_fev1) { todoCompleto = false; errores.push(`Aseg.${num}: EPOC FEV1`); }
                if (c.senior_respiratorio === 'SÍ' && !c.senior_respiratorio_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Respiratorio detalle`); }
                if (c.senior_digestivo === 'SÍ' && !c.senior_digestivo_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Digestivo detalle`); }
                if (c.senior_ocular === 'SÍ' && !c.senior_ocular_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Ocular detalle`); }
                if (c.senior_locomotor === 'SÍ' && !c.senior_locomotor_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Locomotor detalle`); }
                if (c.senior_tumoral === 'SÍ' && !c.senior_tumoral_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Tumoral detalle`); }
                if (c.senior_psiquiatrico === 'SÍ' && !c.senior_psiquiatrico_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Psiquiátrico detalle`); }
                if (c.senior_infeccioso === 'SÍ' && !c.senior_infeccioso_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Infeccioso detalle`); }
                if (c.senior_otras === 'SÍ' && !c.senior_otras_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Otras detalle`); }
            }
            
            // Preguntas de discapacidad y baja laboral (siempre obligatorias)
            if (!c.senior_discapacidad) { todoCompleto = false; errores.push(`Aseg.${num}: Discapacidad`); }
            if (!c.senior_baja) { todoCompleto = false; errores.push(`Aseg.${num}: Baja laboral`); }
            if (c.senior_discapacidad === 'SÍ' && !c.senior_discapacidad_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Discapacidad detalle`); }
            if (c.senior_baja === 'SÍ' && !c.senior_baja_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Baja detalle`); }
            
            // Preguntas de hábitos (siempre obligatorias)
            if (!c.p10_fumador) { todoCompleto = false; errores.push(`Aseg.${num}: Fumador`); }
            if (!c.p11_alcohol) { todoCompleto = false; errores.push(`Aseg.${num}: Alcohol`); }
            if (!c.p12_estupefacientes) { todoCompleto = false; errores.push(`Aseg.${num}: Estupefacientes`); }
            if (!c.p7_tratamiento) { todoCompleto = false; errores.push(`Aseg.${num}: Tratamiento`); }
            if (!c.p3_intervenciones) { todoCompleto = false; errores.push(`Aseg.${num}: Hospitalizado`); }
            if (!c.p6_traumatismos) { todoCompleto = false; errores.push(`Aseg.${num}: Traumatismo`); }
            
            // Si responde SÍ a hábitos, debe especificar
            if (c.p10_fumador === 'SÍ' && !c.p10_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Fumador detalle`); }
            if (c.p11_alcohol === 'SÍ' && !c.p11_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Alcohol detalle`); }
            if (c.p12_estupefacientes === 'SÍ' && !c.p12_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Estupefacientes detalle`); }
            if (c.p7_tratamiento === 'SÍ' && !c.p7_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Tratamiento detalle`); }
            if (c.p3_intervenciones === 'SÍ' && !c.p3_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Hospitalizado detalle`); }
            if (c.p6_traumatismos === 'SÍ' && !c.p6_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: Traumatismo detalle`); }
            
        } else {
            // VALIDACIÓN CUESTIONARIO NORMAL
            if (!c.p1_enfermedades) { todoCompleto = false; errores.push(`Aseg.${num}: P1`); }
            if (!c.p2_secuelas) { todoCompleto = false; errores.push(`Aseg.${num}: P2`); }
            if (!c.p3_intervenciones) { todoCompleto = false; errores.push(`Aseg.${num}: P3`); }
            if (!c.p4_ultimaVisita) { todoCompleto = false; errores.push(`Aseg.${num}: P4 fecha`); }
            if (!c.p4_motivo) { todoCompleto = false; errores.push(`Aseg.${num}: P4 motivo`); }
            if (!c.p5_defectoFisico) { todoCompleto = false; errores.push(`Aseg.${num}: P5`); }
            if (!c.p6_traumatismos) { todoCompleto = false; errores.push(`Aseg.${num}: P6`); }
            if (!c.p7_tratamiento) { todoCompleto = false; errores.push(`Aseg.${num}: P7`); }
            if (!c.p8_estudioFuturo) { todoCompleto = false; errores.push(`Aseg.${num}: P8`); }
            if (!c.p9_hospitalizacion) { todoCompleto = false; errores.push(`Aseg.${num}: P9`); }
            if (!c.p10_fumador) { todoCompleto = false; errores.push(`Aseg.${num}: P10`); }
            if (!c.p11_alcohol) { todoCompleto = false; errores.push(`Aseg.${num}: P11`); }
            if (!c.p12_estupefacientes) { todoCompleto = false; errores.push(`Aseg.${num}: P12`); }
            
            // Si responde SÍ, debe especificar
            if (c.p1_enfermedades === 'SÍ' && !c.p1_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P1 detalle`); }
            if (c.p2_secuelas === 'SÍ' && !c.p2_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P2 detalle`); }
            if (c.p3_intervenciones === 'SÍ' && !c.p3_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P3 detalle`); }
            if (c.p5_defectoFisico === 'SÍ' && !c.p5_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P5 detalle`); }
            if (c.p6_traumatismos === 'SÍ' && !c.p6_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P6 detalle`); }
            if (c.p7_tratamiento === 'SÍ' && !c.p7_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P7 detalle`); }
            if (c.p8_estudioFuturo === 'SÍ' && !c.p8_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P8 detalle`); }
            if (c.p9_hospitalizacion === 'SÍ' && !c.p9_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P9 detalle`); }
            if (c.p10_fumador === 'SÍ' && !c.p10_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P10 detalle`); }
            if (c.p11_alcohol === 'SÍ' && !c.p11_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P11 detalle`); }
            if (c.p12_estupefacientes === 'SÍ' && !c.p12_detalle) { todoCompleto = false; errores.push(`Aseg.${num}: P12 detalle`); }
        }
    });
    
    habilitarBotonGuion(todoCompleto);
    
    // Mostrar errores en consola para debugging
    if (!todoCompleto) {
        console.log('=== VALIDACIÓN INCOMPLETA ===');
        console.log('Errores:', errores);
    }
    // Actualizar contador de errores
    const contadorEl = document.getElementById('contadorErrores');
    if (contadorEl) {
        if (errores.length > 0) {
            const resumen = errores.slice(0, 5).join(', ');
            const mas = errores.length > 5 ? ` (+${errores.length - 5} más)` : '';
            contadorEl.textContent = `⚠️ ${errores.length} faltan: ${resumen}${mas}`;
            contadorEl.className = 'px-4 py-2 rounded-lg font-bold text-xs bg-orange-100 text-orange-800';
        } else {
            contadorEl.textContent = '✅ Cuestionario completo';
            contadorEl.className = 'px-4 py-2 rounded-lg font-bold text-sm bg-green-100 text-green-800';
        }
        contadorEl.classList.remove('hidden');
    }
    
    return todoCompleto;
}

function habilitarBotonGuion(habilitar) {
    const btnGuion = document.getElementById('btnGuion');
    if (btnGuion) {
        if (habilitar) {
            btnGuion.disabled = false;
            btnGuion.classList.remove('opacity-50', 'cursor-not-allowed', 'from-gray-400', 'to-gray-500');
            btnGuion.classList.add('from-green-500', 'to-emerald-600', 'hover:from-green-600', 'hover:to-emerald-700');
        } else {
            btnGuion.disabled = true;
            btnGuion.classList.add('opacity-50', 'cursor-not-allowed', 'from-gray-400', 'to-gray-500');
            btnGuion.classList.remove('from-green-500', 'to-emerald-600', 'hover:from-green-600', 'hover:to-emerald-700');
        }
    }
}

// ============================================================================
// VALIDACIONES
// ============================================================================
function validarDNIFormato(valor) {
    valor = valor.toUpperCase().trim();
    if (!valor) return false;
    
    // DNI español
    const matchDNI = valor.match(/^(\d{8})([A-Z])$/);
    if (matchDNI) {
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        return letras[parseInt(matchDNI[1]) % 23] === matchDNI[2];
    }
    
    // NIE
    const matchNIE = valor.match(/^([XYZ])(\d{7})([A-Z])$/);
    if (matchNIE) {
        let numero = matchNIE[2];
        if (matchNIE[1] === 'X') numero = '0' + numero;
        else if (matchNIE[1] === 'Y') numero = '1' + numero;
        else if (matchNIE[1] === 'Z') numero = '2' + numero;
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        return letras[parseInt(numero) % 23] === matchNIE[3];
    }
    
    return false;
}

function validarIBANFormato(valor) {
    valor = valor.replace(/\s/g, '').toUpperCase();
    if (!valor || valor.length !== 24 || !valor.startsWith('ES')) return false;
    
    const reordenado = valor.slice(4) + valor.slice(0, 4);
    let numerico = '';
    for (const char of reordenado) {
        numerico += (char >= 'A' && char <= 'Z') ? (char.charCodeAt(0) - 55).toString() : char;
    }
    
    let resto = 0;
    for (let i = 0; i < numerico.length; i++) {
        resto = (resto * 10 + parseInt(numerico[i])) % 97;
    }
    
    return resto === 1;
}

function validarDNI(input) {
    const valor = input.value.toUpperCase().trim();
    if (!valor) { input.classList.remove('campo-valido', 'campo-invalido'); return; }

    let valido = false;
    const matchDNI = valor.match(/^(\d{8})([A-Z])$/);
    if (matchDNI) {
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        valido = letras[parseInt(matchDNI[1]) % 23] === matchDNI[2];
    }
    const matchNIE = valor.match(/^([XYZ])(\d{7})([A-Z])$/);
    if (matchNIE) {
        let numero = matchNIE[2];
        if (matchNIE[1] === 'X') numero = '0' + numero;
        else if (matchNIE[1] === 'Y') numero = '1' + numero;
        else if (matchNIE[1] === 'Z') numero = '2' + numero;
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        valido = letras[parseInt(numero) % 23] === matchNIE[3];
    }

    if (valido) { input.classList.add('campo-valido'); input.classList.remove('campo-invalido'); }
    else if (valor.length >= 9) { input.classList.add('campo-invalido'); input.classList.remove('campo-valido'); }
}

function formatearIBAN(valor) {
    if (!valor) return '';
    const limpio = valor.replace(/\s/g, '').toUpperCase();
    return limpio.match(/.{1,4}/g)?.join(' ') || limpio;
}

function formatearIBANInput(input) {
    input.value = formatearIBAN(input.value.replace(/\s/g, '').toUpperCase());
    validarIBAN(input);
}

function validarIBAN(input) {
    const valor = input.value.replace(/\s/g, '').toUpperCase();
    const validacionEl = document.getElementById('ibanValidacion');
    
    if (!valor) { input.classList.remove('campo-valido', 'campo-invalido'); validacionEl.classList.add('hidden'); return false; }
    if (valor.length !== 24 || !valor.startsWith('ES')) {
        input.classList.add('campo-invalido'); input.classList.remove('campo-valido');
        validacionEl.textContent = '❌ El IBAN debe tener 24 caracteres y empezar por ES';
        validacionEl.className = 'mt-2 text-sm text-red-600'; validacionEl.classList.remove('hidden');
        return false;
    }

    const reordenado = valor.slice(4) + valor.slice(0, 4);
    let numerico = '';
    for (const char of reordenado) numerico += (char >= 'A' && char <= 'Z') ? (char.charCodeAt(0) - 55).toString() : char;
    
    let resto = 0;
    for (let i = 0; i < numerico.length; i++) resto = (resto * 10 + parseInt(numerico[i])) % 97;
    
    if (resto === 1) {
        input.classList.add('campo-valido'); input.classList.remove('campo-invalido');
        validacionEl.textContent = '✅ IBAN válido'; validacionEl.className = 'mt-2 text-sm text-green-600';
    } else {
        input.classList.add('campo-invalido'); input.classList.remove('campo-valido');
        validacionEl.textContent = '❌ IBAN inválido'; validacionEl.className = 'mt-2 text-sm text-red-600';
    }
    validacionEl.classList.remove('hidden');
    return resto === 1;
}

// ============================================================================
// VALIDAR DESCUENTO CONTRACOMISIÓN
// ============================================================================
function validarDescuentoContra() {
    const input = document.getElementById('dtoContracomision');
    if (!input) return;
    
    // Extraer número del descuento
    const valor = input.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const descuento = parseFloat(valor) || 0;
    
    // Límite según producto
    let maxDescuento = 100; // Por defecto sin límite
    let mensaje = '';
    
    if (tipoProducto === 'DENTAL') {
        maxDescuento = 5;
        mensaje = '(máx. 5%)';
    }
    
    // Actualizar info de máximo
    const maxInfo = document.getElementById('maxDtoInfo');
    if (maxInfo) {
        maxInfo.textContent = mensaje;
    }
    
    // Validar
    if (descuento > maxDescuento) {
        input.classList.add('campo-invalido');
        input.classList.remove('campo-valido');
        mostrarError(`El descuento máximo para ${tipoProducto} es ${maxDescuento}%`);
        input.value = maxDescuento + '%';
    } else if (descuento > 0) {
        input.classList.add('campo-valido');
        input.classList.remove('campo-invalido');
        // Formatear con %
        if (!input.value.includes('%')) {
            input.value = descuento + '%';
        }
    }
}

// ============================================================================
// VALIDAR CHIP MASCOTA (15 DÍGITOS)
// ============================================================================
function validarChipMascota(input) {
    const valor = input.value;
    const validacionEl = document.getElementById('chipValidacion');
    
    if (!validacionEl) return;
    
    if (valor.length === 15) {
        input.classList.add('campo-valido');
        input.classList.remove('campo-invalido', 'campo-error');
        validacionEl.textContent = '✅ Chip válido (15 dígitos)';
        validacionEl.className = 'text-xs mt-1 text-green-600';
        validacionEl.classList.remove('hidden');
    } else if (valor.length > 0) {
        input.classList.add('campo-invalido');
        input.classList.remove('campo-valido');
        validacionEl.textContent = `❌ Faltan ${15 - valor.length} dígitos`;
        validacionEl.className = 'text-xs mt-1 text-red-600';
        validacionEl.classList.remove('hidden');
    } else {
        input.classList.remove('campo-valido', 'campo-invalido');
        validacionEl.classList.add('hidden');
    }
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}

function calcularIMC(asegId) {
    const pesoInput = document.getElementById(`peso_${asegId}`);
    const estaturaInput = document.getElementById(`estatura_${asegId}`);
    const imcDiv = document.getElementById(`imc_${asegId}`);
    
    if (!pesoInput || !estaturaInput || !imcDiv) return;
    
    const peso = parseFloat(pesoInput.value);
    const estatura = parseFloat(estaturaInput.value);
    
    if (!peso || !estatura || estatura <= 0) {
        imcDiv.textContent = '-';
        imcDiv.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-center font-bold';
        return;
    }
    
    // IMC = peso (kg) / altura (m)²
    const estaturaM = estatura / 100;
    const imc = peso / (estaturaM * estaturaM);
    const imcRedondeado = imc.toFixed(2);
    
    // Validar rango 18 - 29.50
    if (imc >= 18 && imc <= 29.50) {
        imcDiv.textContent = `✅ ${imcRedondeado}`;
        imcDiv.className = 'w-full px-3 py-2 border-2 border-green-500 rounded-lg bg-green-100 text-green-800 text-center font-bold';
    } else {
        imcDiv.textContent = `❌ ${imcRedondeado}`;
        imcDiv.className = 'w-full px-3 py-2 border-2 border-red-500 rounded-lg bg-red-100 text-red-800 text-center font-bold';
    }
}

// ============================================================================
// NAVEGACIÓN
// ============================================================================
function irAPaso(paso) {
    // Si es póliza GO y el paso es 4 (cuestionario), saltar directo al guion
    if (esPolizaGO && paso === 4) {
        mostrarGuion();
        return;
    }
    
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`paso${i}`).classList.add('hidden');
        document.getElementById(`navPaso${i}`).classList.remove('bg-blue-600', 'text-white', 'shadow');
        document.getElementById(`navPaso${i}`).classList.add('bg-gray-100', 'text-gray-600');
    }
    document.getElementById(`paso${paso}`).classList.remove('hidden');
    document.getElementById(`navPaso${paso}`).classList.add('bg-blue-600', 'text-white', 'shadow');
    document.getElementById(`navPaso${paso}`).classList.remove('bg-gray-100', 'text-gray-600');
    pasoActual = paso;
    actualizarNavegacion();
    
    // Ocultar paso 4 en navegación si es GO
    if (esPolizaGO) {
        document.getElementById('navPaso4').classList.add('hidden');
    } else {
        document.getElementById('navPaso4').classList.remove('hidden');
    }
}

function pasoSiguiente() { 
    // Validar campos obligatorios antes de continuar
    if (!validarPasoActual()) {
        return;
    }
    
    // Si es GO o producto sin cuestionario y estamos en paso 3, ir directo al guion
    if ((esPolizaGO || tipoProducto !== 'SALUD') && pasoActual === 3) {
        mostrarGuion();
        return;
    }
    if (pasoActual < 4) irAPaso(pasoActual + 1); 
}

// ============================================================================
// VALIDAR CAMPOS OBLIGATORIOS POR PASO
// ============================================================================
function validarPasoActual() {
    let errores = [];
    
    // Limpiar estilos de error anteriores
    document.querySelectorAll('.campo-error').forEach(el => el.classList.remove('campo-error'));
    
    if (pasoActual === 1) {
        // Paso 1: Datos de póliza
        validarCampo('fechaEfecto', 'Fecha Efecto', errores);
        validarCampo('importe', 'Importe', errores);
        validarCampo('agente', 'Agente', errores);
        
        // Tipo de póliza según producto
        if (tipoProducto === 'SALUD') {
            validarCampo('tipoPoliza', 'Tipo de Póliza', errores);
        }
    }
    
    if (pasoActual === 2) {
        // Paso 2: Datos del tomador
        if (esPolizaEmpresa) {
            // Validación para empresa
            validarCampo('empresaRazonSocial', 'Razón Social', errores);
            validarCampo('empresaCif', 'CIF', errores);
            validarCampo('empresaTelefono', 'Teléfono', errores);
            validarCampo('empresaProvincia', 'Provincia', errores);
        } else {
            // Validación para persona física
            validarCampo('tomadorNombre', 'Nombre', errores);
            validarCampo('tomadorApellidos', 'Apellidos', errores);
            validarCampo('tomadorNif', 'DNI/NIE', errores);
            validarCampo('tomadorFechaNac', 'Fecha Nacimiento', errores);
            validarCampo('tomadorSexo', 'Sexo', errores);
            validarCampo('tomadorTelefono', 'Teléfono', errores);
            
            // Validar DNI/NIE formato correcto
            const dniInput = document.getElementById('tomadorNif');
            if (dniInput && dniInput.value && !validarDNIFormato(dniInput.value)) {
                errores.push('DNI/NIE inválido');
                dniInput.classList.add('campo-error');
            }
        }
        
        validarCampo('tomadorEmail', 'Email', errores);
        validarCampo('tomadorDireccion', 'Dirección', errores);
        validarCampo('tomadorCP', 'C.P.', errores);
        validarCampo('tomadorLocalidad', 'Localidad', errores);
        validarCampo('tomadorProvincia', 'Provincia', errores);
        validarCampo('tomadorIBAN', 'IBAN', errores);
        
        // Validar IBAN formato correcto
        const ibanInput = document.getElementById('tomadorIBAN');
        if (ibanInput && ibanInput.value && !validarIBANFormato(ibanInput.value)) {
            errores.push('IBAN inválido');
            ibanInput.classList.add('campo-error');
        }
    }
    
    if (pasoActual === 3) {
        if (tipoProducto === 'MASCOTAS') {
            // Validar datos de mascota
            validarCampo('mascotaNombre', 'Nombre mascota', errores);
            validarCampo('mascotaTipo', 'Tipo mascota', errores);
            validarCampo('mascotaRaza', 'Raza', errores);
            validarCampo('mascotaFechaNac', 'Fecha nac. mascota', errores);
            validarCampo('mascotaChip', 'Chip', errores);
        } else {
            // Validar asegurados (Salud, Dental, Decesos)
            asegurados.forEach((aseg, idx) => {
                if (!aseg.esTomador) {
                    const prefix = `aseg_${aseg.id}_`;
                    if (!aseg.nombre) { 
                        errores.push(`Aseg.${idx+1}: Nombre`); 
                        marcarCampoError(prefix + 'nombre');
                    }
                    if (!aseg.apellidos) { 
                        errores.push(`Aseg.${idx+1}: Apellidos`); 
                        marcarCampoError(prefix + 'apellidos');
                    }
                    if (!aseg.nif) { 
                        errores.push(`Aseg.${idx+1}: DNI`); 
                        marcarCampoError(prefix + 'nif');
                    } else if (!validarDNIFormato(aseg.nif)) {
                        errores.push(`Aseg.${idx+1}: DNI inválido`);
                        marcarCampoError(prefix + 'nif');
                    }
                    if (!aseg.fechaNacimiento) { 
                        errores.push(`Aseg.${idx+1}: Fecha nac.`); 
                        marcarCampoError(prefix + 'fechaNac');
                    }
                    if (!aseg.sexo) { 
                        errores.push(`Aseg.${idx+1}: Sexo`); 
                        marcarCampoError(prefix + 'sexo');
                    }
                }
            });
        }
    }
    
    if (errores.length > 0) {
        mostrarError(`Campos obligatorios sin rellenar: ${errores.join(', ')}`);
        return false;
    }
    
    return true;
}

function validarCampo(id, nombre, errores) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const valor = el.value?.trim() || '';
    if (!valor) {
        errores.push(nombre);
        el.classList.add('campo-error');
    } else {
        el.classList.remove('campo-error');
    }
}

function marcarCampoError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('campo-error');
}

function pasoAnterior() {
    if (pasoActual > 1) irAPaso(pasoActual - 1);
    else {
        document.getElementById('paso0').classList.remove('hidden');
        document.getElementById('formulario').classList.add('hidden');
        document.getElementById('dealInfo').classList.add('hidden');
        document.getElementById('resumenPropuesta').classList.add('hidden');
        pasoActual = 0;
    }
}

function actualizarNavegacion() {
    document.getElementById('btnAnteriorTexto').textContent = pasoActual === 1 ? 'Cambiar Deal' : 'Anterior';
    
    // Si es GO o producto sin cuestionario, mostrar botón guion en paso 3
    const sinCuestionario = esPolizaGO || tipoProducto !== 'SALUD';
    
    if (sinCuestionario && pasoActual === 3) {
        document.getElementById('btnSiguiente').classList.add('hidden');
        document.getElementById('btnGuion').classList.remove('hidden');
    } else if (pasoActual === 4) { 
        document.getElementById('btnSiguiente').classList.add('hidden'); 
        document.getElementById('btnGuion').classList.remove('hidden'); 
    } else { 
        document.getElementById('btnSiguiente').classList.remove('hidden'); 
        document.getElementById('btnGuion').classList.add('hidden'); 
    }
}

// ============================================================================
// GUION
// ============================================================================
function mostrarGuion() {
    document.getElementById('guionTexto').textContent = generarTextoGuion();
    document.getElementById('modalGuion').classList.remove('hidden');
}

function cerrarGuion() { document.getElementById('modalGuion').classList.add('hidden'); }

function copiarGuion() {
    navigator.clipboard.writeText(document.getElementById('guionTexto').textContent).then(() => mostrarExito('Guion copiado al portapapeles'));
}

function formatearFechaES(fecha) {
    if (!fecha) return '';
    const partes = fecha.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function generarTextoGuion() {
    const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tomador = {
        nombre: document.getElementById('tomadorNombre').value.toUpperCase(),
        apellidos: document.getElementById('tomadorApellidos').value.toUpperCase(),
        nif: document.getElementById('tomadorNif').value.toUpperCase(),
        sexo: document.getElementById('tomadorSexo').value === 'H' ? 'HOMBRE' : 'MUJER',
        telefono: document.getElementById('tomadorTelefono').value,
        email: document.getElementById('tomadorEmail').value,
        direccion: document.getElementById('tomadorDireccion').value.toUpperCase(),
        cp: document.getElementById('tomadorCP').value,
        localidad: document.getElementById('tomadorLocalidad').value.toUpperCase(),
        provincia: document.getElementById('tomadorProvincia').value.toUpperCase(),
        iban: document.getElementById('tomadorIBAN').value.toUpperCase()
    };
    const puntosCampana = document.getElementById('puntosCampana')?.value || propuestaSeleccionada?.puntos || '0';
    const poliza = {
        tipo: tipoProducto === 'SALUD' ? document.getElementById('tipoPoliza').value : document.getElementById('tipoPolizaInput').value,
        importe: document.getElementById('importe').value,
        frecuencia: document.getElementById('frecuenciaPago').value,
        efecto: formatearFechaES(document.getElementById('fechaEfecto').value),
        puntos: puntosCampana,
        solicitud: document.getElementById('solicitud').value,
        numPoliza: document.getElementById('poliza').value,
        dental: document.getElementById('dental')?.value || propuestaSeleccionada?.dental || ''
    };
    const agente = document.getElementById('agente').value;
    const dtoCompania = document.getElementById('dtoCompania')?.value || '';
    const dtoContra = document.getElementById('dtoContracomision')?.value || '';

    // Lista de asegurados con NIF
    const listaAsegurados = asegurados.map((aseg, idx) => {
        if (aseg.esTomador) {
            return `${tomador.nombre} ${tomador.apellidos} con NIF ${tomador.nif}`;
        } else {
            return `${aseg.nombre?.toUpperCase() || ''} ${aseg.apellidos?.toUpperCase() || ''} con NIF ${aseg.nif?.toUpperCase() || ''}`;
        }
    }).join(', ');

    let guion = `════════════════════════════════════════════════════════════════════
              GUION DE GRABACIÓN DE PÓLIZA ADESLAS
════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  📋 DATOS DE LA PÓLIZA                                          │
├─────────────────────────────────────────────────────────────────┤
│  SOLICITUD: ${poliza.solicitud || '___'}                        
│  PÓLIZA: ${poliza.numPoliza || '___'}                           
│  PRODUCTO: ${poliza.tipo}${poliza.dental ? ` + ${poliza.dental}` : ''}
│  PRECIO: ${poliza.importe}€/${poliza.frecuencia}                
│  FECHA EFECTO: ${poliza.efecto}                                  
│  🎁 PUNTOS CAMPAÑA: ${poliza.puntos ? poliza.puntos.toLocaleString('es-ES') + ' pts' : '-'}
│  DTO. COMPAÑÍA: ${dtoCompania || '-'}                           
│  DTO. CONTRA: ${dtoContra || '-'}                               
│  AGENTE: ${agente}                                              
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  👤 DATOS DEL TOMADOR                                           │
├─────────────────────────────────────────────────────────────────┤
│  NOMBRE: ${tomador.nombre} ${tomador.apellidos}                 
│  DNI/NIE: ${tomador.nif}                                        
│  SEXO: ${tomador.sexo}                                          
│  TELÉFONO: ${tomador.telefono}                                  
│  EMAIL: ${tomador.email}                                        
│  DIRECCIÓN: ${tomador.direccion}                                
│  CP: ${tomador.cp} - ${tomador.localidad} (${tomador.provincia})
│  IBAN: ${tomador.iban}                                          
└─────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
                    📢 INICIO DE LA GRABACIÓN
════════════════════════════════════════════════════════════════════

"Le informamos que esta conversación será grabada en garantía del 
servicio que se va a prestar. Sus datos serán grabados en nuestros 
sistemas. Siempre que lo desee podrá acceder a ellos, rectificarlos 
o cancelarlos. Por favor conteste Sí o No a las preguntas que voy a 
realizarle para dejar hoy mismo contratada su póliza. 
Hoy es ${fechaHoy}."

────────────────────────────────────────────────────────────────────
❓ PREGUNTA 1 - CONFIRMACIÓN TOMADOR
────────────────────────────────────────────────────────────────────

"¿Confirma usted que es ${tomador.nombre} ${tomador.apellidos} con NIF ${tomador.nif}, 
y que actúa como Tomador del seguro que estamos contratando?"

⏸️ ESPERAR RESPUESTA: SÍ / NO

────────────────────────────────────────────────────────────────────
❓ PREGUNTA 2 - DATOS BANCARIOS
────────────────────────────────────────────────────────────────────

"¿El BANCO por el que pasaremos los recibos del seguro que está 
contratando es IBAN ${tomador.iban}, con una frecuencia de pago ${poliza.frecuencia}?"

⏸️ ESPERAR RESPUESTA: SÍ / NO

`;

    // SECCIÓN ESPECÍFICA SEGÚN PRODUCTO
    if (tipoProducto === 'MASCOTAS') {
        // GUION MASCOTAS
        guion += `────────────────────────────────────────────────────────────────────
❓ PREGUNTA 3 - DATOS DE LA MASCOTA
────────────────────────────────────────────────────────────────────

"¿Confirma que la mascota que vamos a asegurar tiene los siguientes datos?"

🐾 Nombre: ${datosMascota.nombre || '___'}
🐾 Tipo: ${datosMascota.tipo || '___'}
🐾 Raza: ${datosMascota.raza || '___'}
🐾 Fecha de nacimiento: ${formatearFechaES(datosMascota.fechaNacimiento) || '___'}
🐾 Número de chip: ${datosMascota.chip || '___'}

⏸️ ESPERAR RESPUESTA: SÍ / NO

────────────────────────────────────────────────────────────────────
❓ PREGUNTA 4 - PRODUCTO
────────────────────────────────────────────────────────────────────

"La póliza que estamos contratando es ${poliza.tipo}, con un importe de 
${poliza.importe}€ ${poliza.frecuencia}${poliza.puntos && poliza.puntos !== '0' ? `. Con esta contratación obtiene ${parseInt(poliza.puntos).toLocaleString('es-ES')} puntos de la campaña MásProtección` : ''}."

⏸️ ESPERAR CONFIRMACIÓN
`;
    } else if (tipoProducto === 'DENTAL') {
        // GUION DENTAL
        if (asegurados.length === 1) {
            // Solo el tomador
            guion += `────────────────────────────────────────────────────────────────────
❓ PREGUNTA 3 - PRODUCTO
────────────────────────────────────────────────────────────────────

"La póliza DENTAL que estamos contratando es ${poliza.tipo}, con un importe de 
${poliza.importe}€ ${poliza.frecuencia}${poliza.puntos && poliza.puntos !== '0' ? `. Con esta contratación obtiene ${parseInt(poliza.puntos).toLocaleString('es-ES')} puntos de la campaña MásProtección` : ''}."

⏸️ ESPERAR CONFIRMACIÓN
`;
        } else {
            // Varios asegurados
            const listaAseguradosDental = asegurados.map((aseg, idx) => {
                if (aseg.esTomador) {
                    return `${tomador.nombre} ${tomador.apellidos} (${formatearFechaES(document.getElementById('tomadorFechaNac')?.value) || 'SIN FECHA'})`;
                } else {
                    return `${aseg.nombre?.toUpperCase() || ''} ${aseg.apellidos?.toUpperCase() || ''} (${formatearFechaES(aseg.fechaNacimiento) || 'SIN FECHA'})`;
                }
            }).join(', ');
            
            guion += `────────────────────────────────────────────────────────────────────
❓ PREGUNTA 3 - ASEGURADOS DENTAL
────────────────────────────────────────────────────────────────────

"¿Confirma que las siguientes personas desean figurar como asegurados 
de la póliza DENTAL que se está contratando?"

${listaAseguradosDental}

⏸️ ESPERAR RESPUESTA: SÍ / NO

────────────────────────────────────────────────────────────────────
❓ PREGUNTA 4 - PRODUCTO
────────────────────────────────────────────────────────────────────

"La póliza que estamos contratando es ${poliza.tipo}, con un importe de 
${poliza.importe}€ ${poliza.frecuencia}${poliza.puntos && poliza.puntos !== '0' ? `. Con esta contratación obtiene ${parseInt(poliza.puntos).toLocaleString('es-ES')} puntos de la campaña MásProtección` : ''}."

⏸️ ESPERAR CONFIRMACIÓN
`;
        }
    } else if (tipoProducto === 'DECESOS') {
        // GUION DECESOS
        let listaAseguradosDecesos = '';
        asegurados.forEach((aseg, idx) => {
            const nombre = aseg.esTomador ? `${tomador.nombre} ${tomador.apellidos}` : `${aseg.nombre?.toUpperCase() || ''} ${aseg.apellidos?.toUpperCase() || ''}`;
            const fechaNac = aseg.esTomador ? document.getElementById('tomadorFechaNac')?.value : aseg.fechaNacimiento;
            const capital = aseg.capital || propuestaSeleccionada?.asegurados[idx]?.capital || '';
            listaAseguradosDecesos += `   ${idx + 1}. ${nombre} - Fecha nac: ${formatearFechaES(fechaNac) || '___'}${capital ? ` - Capital: ${capital}€` : ''}\n`;
        });
        
        guion += `────────────────────────────────────────────────────────────────────
❓ PREGUNTA 3 - ASEGURADOS DECESOS
────────────────────────────────────────────────────────────────────

"¿Confirma que las siguientes personas desean figurar como asegurados 
de la póliza de DECESOS que se está contratando?"

${listaAseguradosDecesos}
⏸️ ESPERAR RESPUESTA: SÍ / NO

────────────────────────────────────────────────────────────────────
❓ PREGUNTA 4 - PRODUCTO
────────────────────────────────────────────────────────────────────

"La póliza que estamos contratando es ${poliza.tipo}, con un importe de 
${poliza.importe}€ ${poliza.frecuencia}."

⏸️ ESPERAR CONFIRMACIÓN
`;
    } else {
        // GUION SALUD (con asegurados y cuestionario)
        guion += `────────────────────────────────────────────────────────────────────
❓ PREGUNTA 3 - ASEGURADOS
────────────────────────────────────────────────────────────────────

"¿Confirma que las siguientes personas: ${listaAsegurados} 
desean figurar como asegurados de la póliza que se está contratando?"

⏸️ ESPERAR RESPUESTA: SÍ / NO

────────────────────────────────────────────────────────────────────
❓ PREGUNTA 4 - PRODUCTO
────────────────────────────────────────────────────────────────────

"La póliza que estamos contratando es ${poliza.tipo}${poliza.dental ? ` con ${poliza.dental}` : ''}, con un importe de 
${poliza.importe}€ ${poliza.frecuencia}${poliza.puntos && poliza.puntos !== '0' ? `. Con esta contratación obtiene ${parseInt(poliza.puntos).toLocaleString('es-ES')} puntos de la campaña MásProtección` : ''}."

⏸️ ESPERAR CONFIRMACIÓN
`;

        // Solo incluir cuestionario de salud si NO es póliza GO
        if (!esPolizaGO) {
        if (esPolizaSenior) {
            // GUION CUESTIONARIO SENIOR
            guion += `
════════════════════════════════════════════════════════════════════
                    📋 CUESTIONARIO DE SALUD SENIOR
         (Realizar a cada asegurado por separado)
════════════════════════════════════════════════════════════════════
`;
            asegurados.forEach((aseg, index) => {
                const nombre = aseg.esTomador ? `${tomador.nombre} ${tomador.apellidos}` : `${aseg.nombre?.toUpperCase() || ''} ${aseg.apellidos?.toUpperCase() || ''}`;
                const c = aseg.cuestionario;
                
                guion += `
▸ ASEGURADO ${index + 1}: ${nombre}
────────────────────────────────────────────────────────────────────

"¿Cuál es su edad, peso y estatura?"
→ Respuesta: ${c.edad} años, ${c.peso} kg, ${c.estatura} cm

"¿Padece o ha padecido alguna enfermedad en los últimos 5 años?"
→ Respuesta: ${c.senior_enfermedad_general || '___'}
`;
                // Solo incluir enfermedades específicas si contestó SÍ
                if (c.senior_enfermedad_general === 'SÍ') {
                    guion += `
   En caso afirmativo, ¿concretamente alguna de estas?:
   
   1. Problemas de corazón: ${c.senior_corazon || '___'}${c.senior_corazon_detalle ? ` - ${c.senior_corazon_detalle}` : ''}
   2. Enfermedad de riñón o urológica: ${c.senior_rinon || '___'}${c.senior_rinon_detalle ? ` - ${c.senior_rinon_detalle}` : ''}
   3. Problemas vasculares: ${c.senior_vascular || '___'}${c.senior_vascular_detalle ? ` - ${c.senior_vascular_detalle}` : ''}
   4. Enfermedad del sistema nervioso: ${c.senior_nervioso || '___'}${c.senior_nervioso_detalle ? ` - ${c.senior_nervioso_detalle}` : ''}
   5. Diabetes: ${c.senior_diabetes || '___'}${c.senior_diabetes === 'SÍ' ? ` - ${c.senior_diabetes_tipo || ''}` : ''}
   6. Enfermedad del tiroides: ${c.senior_tiroides || '___'}${c.senior_tiroides_detalle ? ` - ${c.senior_tiroides_detalle}` : ''}
   7. Hipertensión arterial: ${c.senior_hipertension || '___'}${c.senior_hipertension === 'SÍ' ? ` - Tensiones: ${c.senior_tension1 || ''} / ${c.senior_tension2 || ''}` : ''}
   8. Colesterol elevado (>220 mg/dl): ${c.senior_colesterol || '___'}
   9. EPOC, bronquitis crónica, enfisema: ${c.senior_epoc || '___'}${c.senior_epoc === 'SÍ' ? ` - FEV1: ${c.senior_fev1 || ''}` : ''}
   10. Otras enfermedades respiratorias: ${c.senior_respiratorio || '___'}${c.senior_respiratorio_detalle ? ` - ${c.senior_respiratorio_detalle}` : ''}
   11. Enfermedad digestiva o del hígado: ${c.senior_digestivo || '___'}${c.senior_digestivo_detalle ? ` - ${c.senior_digestivo_detalle}` : ''}
   12. Enfermedad ocular: ${c.senior_ocular || '___'}${c.senior_ocular_detalle ? ` - ${c.senior_ocular_detalle}` : ''}
   13. Enfermedad del aparato locomotor: ${c.senior_locomotor || '___'}${c.senior_locomotor_detalle ? ` - ${c.senior_locomotor_detalle}` : ''}
   14. Enfermedad tumoral o cancerosa: ${c.senior_tumoral || '___'}${c.senior_tumoral_detalle ? ` - ${c.senior_tumoral_detalle}` : ''}
   15. Enfermedad psiquiátrica: ${c.senior_psiquiatrico || '___'}${c.senior_psiquiatrico_detalle ? ` - ${c.senior_psiquiatrico_detalle}` : ''}
   16. Enfermedad infecciosa: ${c.senior_infeccioso || '___'}${c.senior_infeccioso_detalle ? ` - ${c.senior_infeccioso_detalle}` : ''}
   17. Otras enfermedades: ${c.senior_otras || '___'}${c.senior_otras_detalle ? ` - ${c.senior_otras_detalle}` : ''}
`;
                }
                
                guion += `
"¿Consume o ha consumido más de 5 unidades de alcohol al día?"
→ Respuesta: ${c.p11_alcohol || '___'}${c.p11_detalle ? ` - ${c.p11_detalle}` : ''}

"¿Es o ha sido fumador?"
→ Respuesta: ${c.p10_fumador || '___'}${c.p10_detalle ? ` - ${c.p10_detalle}` : ''}

"¿Consume o ha consumido estupefacientes o drogas?"
→ Respuesta: ${c.p12_estupefacientes || '___'}${c.p12_detalle ? ` - ${c.p12_detalle}` : ''}

"¿Se encuentra bajo control médico o siguiendo algún tratamiento?"
→ Respuesta: ${c.p7_tratamiento || '___'}${c.p7_detalle ? ` - ${c.p7_detalle}` : ''}

"¿Ha sido hospitalizado, operado o sometido a estudio/tratamiento?"
→ Respuesta: ${c.p3_intervenciones || '___'}${c.p3_detalle ? ` - ${c.p3_detalle}` : ''}

"¿Ha sufrido algún traumatismo o accidente?"
→ Respuesta: ${c.p6_traumatismos || '___'}${c.p6_detalle ? ` - ${c.p6_detalle}` : ''}

"¿Tiene reconocida o solicitada discapacidad o invalidez?"
→ Respuesta: ${c.senior_discapacidad || '___'}${c.senior_discapacidad_detalle ? ` - ${c.senior_discapacidad_detalle}` : ''}

"¿Ha estado de baja laboral más de 3 semanas en los últimos 5 años?"
→ Respuesta: ${c.senior_baja || '___'}${c.senior_baja_detalle ? ` - ${c.senior_baja_detalle}` : ''}

`;
            });
        } else {
            // GUION CUESTIONARIO NORMAL
            guion += `
════════════════════════════════════════════════════════════════════
                    📋 CUESTIONARIO DE SALUD
         (Realizar a cada asegurado por separado)
════════════════════════════════════════════════════════════════════
`;

            asegurados.forEach((aseg, index) => {
                const nombre = aseg.esTomador ? `${tomador.nombre} ${tomador.apellidos}` : `${aseg.nombre?.toUpperCase() || ''} ${aseg.apellidos?.toUpperCase() || ''}`;
                const c = aseg.cuestionario;
                
                guion += `
▸ ASEGURADO ${index + 1}: ${nombre}
────────────────────────────────────────────────────────────────────

1. "¿Cuál es su edad, peso y estatura?"
   → Respuesta: ${c.edad} años, ${c.peso} kg, ${c.estatura} cm

2. "¿Padece o ha padecido alguna enfermedad en los últimos cinco años?"
   → Respuesta: ${c.p1_enfermedades || '___'}${c.p1_detalle ? ` - ${c.p1_detalle}` : ''}

3. "¿Le ha dejado alguna lesión o secuelas las enfermedades que ha padecido hasta el momento?"
   → Respuesta: ${c.p2_secuelas || '___'}${c.p2_detalle ? ` - ${c.p2_detalle}` : ''}

4. "¿Ha sido intervenido en alguna ocasión, o ha estado ingresado en algún centro hospitalario?"
   → Respuesta: ${c.p3_intervenciones || '___'}${c.p3_detalle ? ` - ${c.p3_detalle}` : ''}

5. "¿En qué fecha y por qué motivo acudió al médico por última vez?"
   → Fecha: ${c.p4_ultimaVisita || '___'}
   → Motivo: ${c.p4_motivo || '___'}

6. "¿Padece o ha padecido algún defecto físico, deformidad, incapacidad o lesión congénita?"
   → Respuesta: ${c.p5_defectoFisico || '___'}${c.p5_detalle ? ` - ${c.p5_detalle}` : ''}

7. "¿Ha sufrido algún traumatismo o accidente?"
   → Respuesta: ${c.p6_traumatismos || '___'}${c.p6_detalle ? ` - ${c.p6_detalle}` : ''}

8. "¿Se encuentra en la actualidad bajo control médico o siguiendo alguna clase de tratamiento?"
   → Respuesta: ${c.p7_tratamiento || '___'}${c.p7_detalle ? ` - ${c.p7_detalle}` : ''}

9. "Según lo que conoce de su actual estado de salud, ¿le consta que transcurrido un año habrá de hacerse algún estudio o tratamiento?"
   → Respuesta: ${c.p8_estudioFuturo || '___'}${c.p8_detalle ? ` - ${c.p8_detalle}` : ''}

10. "¿Necesitará dentro de ese plazo ingresar en un hospital?"
    → Respuesta: ${c.p9_hospitalizacion || '___'}${c.p9_detalle ? ` - ${c.p9_detalle}` : ''}

11. "¿Es o ha sido fumador?"
    → Respuesta: ${c.p10_fumador || '___'}${c.p10_detalle ? ` - ${c.p10_detalle}` : ''}

12. "¿Consume o ha consumido habitualmente bebidas alcohólicas?"
    → Respuesta: ${c.p11_alcohol || '___'}${c.p11_detalle ? ` - ${c.p11_detalle}` : ''}

13. "¿Consume o ha consumido estupefacientes?"
    → Respuesta: ${c.p12_estupefacientes || '___'}${c.p12_detalle ? ` - ${c.p12_detalle}` : ''}

`;
            });
        }
    } // Fin del if (!esPolizaGO)
    } // Fin del else SALUD

    guion += `════════════════════════════════════════════════════════════════════
                    ✅ CIERRE DE LA GRABACIÓN
════════════════════════════════════════════════════════════════════

"De acuerdo Sr/a. ${tomador.apellidos}, le informo que ya queda CONTRATADA su 
póliza en ADESLAS. Dicha póliza entrará en vigor el día ${poliza.efecto}. 
En el plazo aproximado de una semana posterior al alta, recibirá en 
su domicilio toda la documentación relativa a la CONTRATACIÓN que 
acaba de efectuar. Desde el momento que acceda a las condiciones del 
contrato, dispone de 14 días para resolverlo en el caso de no estar 
de acuerdo con las condiciones establecidas.

El responsable del tratamiento de los datos personales que acaba de 
facilitar es SegurCaixa Adeslas, S.A. de Seguros.

Por último, le indicamos que podrá ejercer sus derechos de acceso, 
rectificación, supresión, oposición, limitación del tratamiento y 
portabilidad, así como retirar el consentimiento prestado, 
dirigiéndose por correo postal a SegurCaixaAdeslas adjuntando copia 
de su DNI o de un documento identificativo equivalente, dirigido a: 
'Tramitación Derechos de Privacidad' en el Paseo de la Castellana 
259C - 6ª Planta - Torre de Cristal, 28046 Madrid.

Puede consultar más información sobre la política de protección de 
datos de SegurCaixa Adeslas en las condiciones generales de la póliza 
o en la siguiente página web: www.segurcaixaadeslas.es/es/proteccion-de-datos.

Salvo manifestación contraria, ¿está de acuerdo?"

⏸️ ESPERAR RESPUESTA: SÍ / NO

"¡Bienvenido a Adeslas!"

════════════════════════════════════════════════════════════════════
`;
    return guion;
}

// ============================================================================
// GENERAR PDF
// ============================================================================
function generarPDF() {
    // Verificar que jsPDF está disponible
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error('jsPDF no está cargado');
        throw new Error('La librería PDF no está disponible. Recarga la página.');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const tomador = {
        nombre: document.getElementById('tomadorNombre').value.toUpperCase(),
        apellidos: document.getElementById('tomadorApellidos').value.toUpperCase(),
        nif: document.getElementById('tomadorNif').value.toUpperCase()
    };
    
    const poliza = {
        tipo: document.getElementById('tipoPoliza').value,
        importe: document.getElementById('importe').value,
        efecto: formatearFechaES(document.getElementById('fechaEfecto').value),
        frecuencia: document.getElementById('frecuenciaPago').value
    };
    
    // Obtener descuentos
    const dtoCompania = document.getElementById('dtoCompania')?.value || '';
    const dtoContracomision = document.getElementById('dtoContracomision')?.value || '';
    const puntosCampana = document.getElementById('puntosCampana')?.value || propuestaSeleccionada?.puntos || '0';
    
    // ===== CABECERA =====
    doc.setFillColor(0, 82, 165); // Azul Adeslas
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('GRABACIÓN DE PÓLIZA', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text('ADESLAS', 105, 26, { align: 'center' });
    
    // Fecha en cabecera
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('es-ES'), 195, 10, { align: 'right' });
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    let y = 40;
    
    // ===== DATOS DEL TOMADOR =====
    doc.setFillColor(240, 240, 240);
    doc.rect(10, y - 5, 190, 45, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 82, 165);
    doc.text('DATOS DEL TOMADOR', 15, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nombre: ${tomador.nombre} ${tomador.apellidos}`, 15, y); y += 7;
    doc.text(`DNI/NIE: ${tomador.nif}`, 15, y); y += 7;
    doc.text(`Póliza: ${poliza.tipo}`, 15, y); 
    doc.text(`Asegurados: ${asegurados.length}`, 120, y); y += 7;
    doc.text(`Prima: ${poliza.importe}€ / ${poliza.frecuencia}`, 15, y);
    doc.text(`Fecha Efecto: ${poliza.efecto}`, 120, y); y += 12;
    
    // ===== PUNTOS CAMPAÑA Y DESCUENTOS =====
    if (dtoCompania || dtoContracomision || (puntosCampana && puntosCampana !== '0')) {
        doc.setFillColor(255, 243, 205); // Amarillo claro
        doc.rect(10, y - 5, 190, 22, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(180, 83, 9); // Naranja oscuro
        doc.text('CAMPAÑA Y DESCUENTOS', 15, y);
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        let descuentosTexto = [];
        if (puntosCampana && puntosCampana !== '0') descuentosTexto.push(`🎁 ${parseInt(puntosCampana).toLocaleString('es-ES')} pts`);
        if (dtoCompania) descuentosTexto.push(`Dto. Compañía: ${dtoCompania}`);
        if (dtoContracomision) descuentosTexto.push(`Dto. Contracomisión: ${dtoContracomision}`);
        
        doc.text(descuentosTexto.join('   |   '), 15, y);
        y += 15;
    } else {
        y += 5;
    }
    
    // ===== LÍNEA SEPARADORA =====
    doc.setDrawColor(0, 82, 165);
    doc.setLineWidth(0.5);
    doc.line(10, y, 200, y);
    y += 10;
    
    // ===== GUION DE GRABACIÓN =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 82, 165);
    doc.text('GUION DE GRABACIÓN', 15, y);
    y += 10;
    
    // Usar Helvetica para mejor legibilidad (más grande)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    
    const guion = generarTextoGuion();
    const lineas = guion.split('\n');
    
    lineas.forEach(linea => {
        // Salto de página si es necesario
        if (y > 280) {
            doc.addPage();
            // Mini cabecera en páginas siguientes
            doc.setFillColor(0, 82, 165);
            doc.rect(0, 0, 210, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('GRABACIÓN DE PÓLIZA - ' + tomador.apellidos, 105, 7, { align: 'center' });
            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            y = 20;
        }
        
        // Detectar líneas de título/sección (con ═══)
        if (linea.includes('═══')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(0, 82, 165);
        } else if (linea.startsWith('"') || linea.includes('ESPERAR RESPUESTA')) {
            // Texto para leer en voz alta
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
        }
        
        // Dividir líneas largas
        if (linea.length > 90) {
            const partes = doc.splitTextToSize(linea, 180);
            partes.forEach(parte => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(parte, 15, y);
                y += 5;
            });
        } else {
            doc.text(linea || ' ', 15, y);
            y += 5;
        }
    });
    
    // ===== PIE DE PÁGINA EN ÚLTIMA PÁGINA =====
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')} - Seguros de Salud Online`, 105, 290, { align: 'center' });
    
    return doc;
}

// Función para descargar PDF localmente
function descargarPDF() {
    try {
        const pdf = generarPDF();
        const nombrePDF = `Grabacion_${document.getElementById('tomadorApellidos').value.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Método alternativo: crear enlace y forzar descarga
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombrePDF;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        mostrarExito('✅ PDF descargado: ' + nombrePDF);
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarError('Error generando PDF: ' + error.message);
    }
}

// ============================================================================
// VALIDAR CUESTIONARIO OBLIGATORIO
// ============================================================================
function validarCuestionarioCompleto() {
    if (esPolizaGO) return { valido: true }; // GO no tiene cuestionario
    
    const errores = [];
    
    asegurados.forEach((aseg, idx) => {
        const c = aseg.cuestionario;
        const numAseg = idx + 1;
        
        // Campos obligatorios básicos
        if (!c.peso) errores.push(`Asegurado ${numAseg}: Falta PESO`);
        if (!c.estatura) errores.push(`Asegurado ${numAseg}: Falta ESTATURA`);
        
        if (esPolizaSenior) {
            // =============================================
            // VALIDACIÓN CUESTIONARIO SENIOR
            // =============================================
            
            // Pregunta principal obligatoria
            if (!c.senior_enfermedad_general) errores.push(`Asegurado ${numAseg}: ¿Ha padecido enfermedad?`);
            
            // Si contestó SÍ a la pregunta general, validar detalles de las que marcó SÍ
            if (c.senior_enfermedad_general === 'SÍ') {
                if (c.senior_corazon === 'SÍ' && !c.senior_corazon_detalle) errores.push(`Asegurado ${numAseg}: Corazón - Especifique`);
                if (c.senior_rinon === 'SÍ' && !c.senior_rinon_detalle) errores.push(`Asegurado ${numAseg}: Riñón - Especifique`);
                if (c.senior_vascular === 'SÍ' && !c.senior_vascular_detalle) errores.push(`Asegurado ${numAseg}: Vascular - Especifique`);
                if (c.senior_nervioso === 'SÍ' && !c.senior_nervioso_detalle) errores.push(`Asegurado ${numAseg}: Nervioso - Especifique`);
                if (c.senior_diabetes === 'SÍ' && !c.senior_diabetes_tipo) errores.push(`Asegurado ${numAseg}: Diabetes - Especifique tipo`);
                if (c.senior_tiroides === 'SÍ' && !c.senior_tiroides_detalle) errores.push(`Asegurado ${numAseg}: Tiroides - Especifique`);
                if (c.senior_hipertension === 'SÍ' && (!c.senior_tension1 || !c.senior_tension2)) errores.push(`Asegurado ${numAseg}: Hipertensión - Tensiones`);
                if (c.senior_epoc === 'SÍ' && !c.senior_fev1) errores.push(`Asegurado ${numAseg}: EPOC - FEV1`);
                if (c.senior_respiratorio === 'SÍ' && !c.senior_respiratorio_detalle) errores.push(`Asegurado ${numAseg}: Respiratorio - Especifique`);
                if (c.senior_digestivo === 'SÍ' && !c.senior_digestivo_detalle) errores.push(`Asegurado ${numAseg}: Digestivo - Especifique`);
                if (c.senior_ocular === 'SÍ' && !c.senior_ocular_detalle) errores.push(`Asegurado ${numAseg}: Ocular - Especifique`);
                if (c.senior_locomotor === 'SÍ' && !c.senior_locomotor_detalle) errores.push(`Asegurado ${numAseg}: Locomotor - Especifique`);
                if (c.senior_tumoral === 'SÍ' && !c.senior_tumoral_detalle) errores.push(`Asegurado ${numAseg}: Tumoral - Especifique`);
                if (c.senior_psiquiatrico === 'SÍ' && !c.senior_psiquiatrico_detalle) errores.push(`Asegurado ${numAseg}: Psiquiátrico - Especifique`);
                if (c.senior_infeccioso === 'SÍ' && !c.senior_infeccioso_detalle) errores.push(`Asegurado ${numAseg}: Infeccioso - Especifique`);
                if (c.senior_otras === 'SÍ' && !c.senior_otras_detalle) errores.push(`Asegurado ${numAseg}: Otras - Especifique`);
            }
            
            // Preguntas de discapacidad y baja laboral (siempre obligatorias)
            if (!c.senior_discapacidad) errores.push(`Asegurado ${numAseg}: ¿Discapacidad?`);
            if (!c.senior_baja) errores.push(`Asegurado ${numAseg}: ¿Baja laboral?`);
            if (c.senior_discapacidad === 'SÍ' && !c.senior_discapacidad_detalle) errores.push(`Asegurado ${numAseg}: Discapacidad - Especifique`);
            if (c.senior_baja === 'SÍ' && !c.senior_baja_detalle) errores.push(`Asegurado ${numAseg}: Baja - Especifique`);
            
            // Preguntas de hábitos (siempre obligatorias en SENIOR)
            if (!c.p10_fumador) errores.push(`Asegurado ${numAseg}: ¿Fumador?`);
            if (!c.p11_alcohol) errores.push(`Asegurado ${numAseg}: ¿Alcohol?`);
            if (!c.p12_estupefacientes) errores.push(`Asegurado ${numAseg}: ¿Estupefacientes?`);
            if (!c.p7_tratamiento) errores.push(`Asegurado ${numAseg}: ¿Tratamiento?`);
            if (!c.p3_intervenciones) errores.push(`Asegurado ${numAseg}: ¿Hospitalizado?`);
            if (!c.p6_traumatismos) errores.push(`Asegurado ${numAseg}: ¿Traumatismo?`);
            
            // Si responde SÍ a hábitos, debe especificar
            if (c.p10_fumador === 'SÍ' && !c.p10_detalle) errores.push(`Asegurado ${numAseg}: Fumador - Especifique`);
            if (c.p11_alcohol === 'SÍ' && !c.p11_detalle) errores.push(`Asegurado ${numAseg}: Alcohol - Especifique`);
            if (c.p12_estupefacientes === 'SÍ' && !c.p12_detalle) errores.push(`Asegurado ${numAseg}: Estupefacientes - Especifique`);
            if (c.p7_tratamiento === 'SÍ' && !c.p7_detalle) errores.push(`Asegurado ${numAseg}: Tratamiento - Especifique`);
            if (c.p3_intervenciones === 'SÍ' && !c.p3_detalle) errores.push(`Asegurado ${numAseg}: Hospitalizado - Especifique`);
            if (c.p6_traumatismos === 'SÍ' && !c.p6_detalle) errores.push(`Asegurado ${numAseg}: Traumatismo - Especifique`);
            
        } else {
            // =============================================
            // VALIDACIÓN CUESTIONARIO NORMAL
            // =============================================
            
            // Preguntas obligatorias (Sí/No) - TODAS deben tener respuesta
            if (!c.p1_enfermedades) errores.push(`Asegurado ${numAseg}: Pregunta 1 sin responder`);
            if (!c.p2_secuelas) errores.push(`Asegurado ${numAseg}: Pregunta 2 sin responder`);
            if (!c.p3_intervenciones) errores.push(`Asegurado ${numAseg}: Pregunta 3 sin responder`);
            if (!c.p4_ultimaVisita || !c.p4_motivo) errores.push(`Asegurado ${numAseg}: Pregunta 4 incompleta`);
            if (!c.p5_defectoFisico) errores.push(`Asegurado ${numAseg}: Pregunta 5 sin responder`);
            if (!c.p6_traumatismos) errores.push(`Asegurado ${numAseg}: Pregunta 6 sin responder`);
            if (!c.p7_tratamiento) errores.push(`Asegurado ${numAseg}: Pregunta 7 sin responder`);
            if (!c.p8_estudioFuturo) errores.push(`Asegurado ${numAseg}: Pregunta 8 sin responder`);
            if (!c.p9_hospitalizacion) errores.push(`Asegurado ${numAseg}: Pregunta 9 sin responder`);
            if (!c.p10_fumador) errores.push(`Asegurado ${numAseg}: Pregunta 10 sin responder`);
            if (!c.p11_alcohol) errores.push(`Asegurado ${numAseg}: Pregunta 11 sin responder`);
            if (!c.p12_estupefacientes) errores.push(`Asegurado ${numAseg}: Pregunta 12 sin responder`);
            
            // Si respondió SÍ, debe especificar SIEMPRE
            if (c.p1_enfermedades === 'SÍ' && !c.p1_detalle) errores.push(`Asegurado ${numAseg}: P1 - Especifique`);
            if (c.p2_secuelas === 'SÍ' && !c.p2_detalle) errores.push(`Asegurado ${numAseg}: P2 - Especifique`);
            if (c.p3_intervenciones === 'SÍ' && !c.p3_detalle) errores.push(`Asegurado ${numAseg}: P3 - Especifique`);
            if (c.p5_defectoFisico === 'SÍ' && !c.p5_detalle) errores.push(`Asegurado ${numAseg}: P5 - Especifique`);
            if (c.p6_traumatismos === 'SÍ' && !c.p6_detalle) errores.push(`Asegurado ${numAseg}: P6 - Especifique`);
            if (c.p7_tratamiento === 'SÍ' && !c.p7_detalle) errores.push(`Asegurado ${numAseg}: P7 - Especifique`);
            if (c.p8_estudioFuturo === 'SÍ' && !c.p8_detalle) errores.push(`Asegurado ${numAseg}: P8 - Especifique`);
            if (c.p9_hospitalizacion === 'SÍ' && !c.p9_detalle) errores.push(`Asegurado ${numAseg}: P9 - Especifique`);
            if (c.p10_fumador === 'SÍ' && !c.p10_detalle) errores.push(`Asegurado ${numAseg}: P10 - Especifique`);
            if (c.p11_alcohol === 'SÍ' && !c.p11_detalle) errores.push(`Asegurado ${numAseg}: P11 - Especifique`);
            if (c.p12_estupefacientes === 'SÍ' && !c.p12_detalle) errores.push(`Asegurado ${numAseg}: P12 - Especifique`);
        }
    });
    
    return { 
        valido: errores.length === 0, 
        errores: errores 
    };
}

// ============================================================================
// GUARDAR EN PIPEDRIVE
// ============================================================================
let guardandoEnProceso = false; // Control anti-duplicados

async function guardarEnPipedrive() {
    // CONTROL ANTI-DUPLICADOS
    if (guardandoEnProceso) {
        console.log('⚠️ Ya hay un guardado en proceso, ignorando click');
        mostrarError('Ya se está guardando. Por favor espera...');
        return;
    }
    guardandoEnProceso = true;
    
    console.log('=== BOTÓN GUARDAR PULSADO ===');
    console.log('tipoProducto:', tipoProducto);
    console.log('esPolizaGO:', esPolizaGO);
    
    // Validar cuestionario - SOLO MOSTRAR AVISO, NO BLOQUEAR
    if (tipoProducto === 'SALUD' && !esPolizaGO) {
        console.log('=== VALIDANDO CUESTIONARIO ===');
        console.log('esPolizaSenior:', esPolizaSenior);
        console.log('esPolizaEmpresa:', esPolizaEmpresa);
        console.log('Número de asegurados:', asegurados.length);
        
        const validacion = validarCuestionarioCompleto();
        console.log('Resultado validación:', validacion);
        
        if (!validacion.valido) {
            console.log('⚠️ Cuestionario incompleto, pero se permite guardar:', validacion.errores.length, 'errores');
            // NO BLOQUEAR - solo mostrar aviso en consola
            // El cuestionario se guardará con lo que tenga rellenado
        } else {
            console.log('✅ Validación OK');
        }
    } else {
        console.log('Sin validación de cuestionario (GO o no SALUD)');
    }

    const btn = document.getElementById('btnGuardar');
    const btnTextoOriginal = btn.innerHTML;
    btn.innerHTML = '<div class="loader"></div><span>Guardando...</span>';
    btn.disabled = true;

    // Variables para el resultado
    let dealGuardado = false;
    let notaGuardada = false;
    let pdfDescargado = false;
    let pdfSubido = false;
    let dealIdFinal = dealId;
    let errorMensaje = '';

    try {
        console.log('=== INICIANDO GUARDADO ===');
        console.log('Deal ID original:', dealId);
        console.log('Tipo producto:', tipoProducto);
        console.log('¿Deal ya tiene grabación?:', dealYaTieneGrabacion);
        
        const F = CONFIG.DEAL_FIELDS;
        const pipelineDestino = CONFIG.PIPELINES[tipoProducto] || CONFIG.PIPELINES['SALUD'];
        
        // OBTENER DNI PARA VERIFICACIÓN ANTI-DUPLICADOS
        const dniTitular = document.getElementById('tomadorNif')?.value?.toUpperCase()?.trim() || '';
        const chipMascota = document.getElementById('mascotaChip')?.value?.trim() || '';
        
        // VERIFICAR SI YA EXISTE UN DEAL GANADO CON ESTE DNI/CHIP Y PRODUCTO
        if (dniTitular || chipMascota) {
            console.log('Verificando duplicados para DNI:', dniTitular, 'Chip:', chipMascota);
            
            try {
                // Buscar deals ganados en el pipeline de este producto
                const searchParam = dniTitular || chipMascota;
                const dealsExistentes = await fetchAPI(`/deals/search?term=${encodeURIComponent(searchParam)}&status=won&limit=50`);
                
                if (dealsExistentes?.items) {
                    const dealDuplicado = dealsExistentes.items.find(item => {
                        const deal = item.item;
                        // Verificar si es del mismo pipeline y está ganado
                        return deal.pipeline_id === pipelineDestino && 
                               deal.status === 'won' &&
                               deal.id !== parseInt(dealId); // Excluir el deal actual
                    });
                    
                    if (dealDuplicado) {
                        console.log('⚠️ DEAL DUPLICADO ENCONTRADO:', dealDuplicado);
                        mostrarError(`⚠️ YA EXISTE UN DEAL GANADO para este cliente en ${tipoProducto}.\n\nDeal ID: ${dealDuplicado.item.id}\nTítulo: ${dealDuplicado.item.title}\n\nSi necesitas crear otro, contacta con supervisión.`);
                        guardandoEnProceso = false;
                        btn.innerHTML = btnTextoOriginal;
                        btn.disabled = false;
                        return;
                    }
                }
            } catch (e) {
                console.log('Error buscando duplicados (continuamos):', e);
                // Continuamos aunque falle la verificación
            }
        }
        
        // NUEVA LÓGICA: Crear nuevo deal SOLO si ya tiene grabación previa
        let crearNuevoDeal = dealYaTieneGrabacion;
        
        console.log('¿Crear nuevo deal?:', crearNuevoDeal);
        
        // Preparar datos del deal
        let nombreCompleto;
        let tipoPoliza;
        
        if (esPolizaEmpresa) {
            // Para empresas, usar razón social como nombre
            nombreCompleto = document.getElementById('empresaRazonSocial')?.value?.toUpperCase() || '';
        } else {
            nombreCompleto = `${document.getElementById('tomadorNombre').value} ${document.getElementById('tomadorApellidos').value}`.toUpperCase();
        }
        tipoPoliza = tipoProducto === 'SALUD' ? document.getElementById('tipoPoliza').value : document.getElementById('tipoPolizaInput')?.value || tipoProducto;
        
        // OBTENER EL USER_ID DEL AGENTE ORIGINAL (no el que está logueado)
        const agenteOriginalId = dealOriginal?.user_id?.id || dealOriginal?.user_id?.value || dealOriginal?.user_id;
        console.log('Agente original del deal:', agenteOriginalId, dealOriginal?.user_id?.name);
        
        const dealData = {};
        
        // Si es nuevo deal (porque el original ya tiene grabación)
        if (crearNuevoDeal) {
            dealData.title = `${nombreCompleto} - ${tipoProducto}`;
            dealData.pipeline_id = pipelineDestino;
            dealData.status = 'won'; // Marcar como ganado
            dealData.won_time = new Date().toISOString();
            
            // ASIGNAR AL AGENTE ORIGINAL, NO AL QUE ESTÁ LOGUEADO
            if (agenteOriginalId) {
                dealData.user_id = agenteOriginalId;
            }
            
            // Vincular a la misma persona/organización
            if (dealOriginal?.person_id) {
                dealData.person_id = typeof dealOriginal.person_id === 'object' 
                    ? dealOriginal.person_id.value 
                    : dealOriginal.person_id;
            }
            if (dealOriginal?.org_id) {
                dealData.org_id = typeof dealOriginal.org_id === 'object' 
                    ? dealOriginal.org_id.value 
                    : dealOriginal.org_id;
            }
        } else {
            // Si es el deal original, marcarlo como ganado
            dealData.status = 'won';
            dealData.won_time = new Date().toISOString();
        }
        
        // Datos de póliza
        dealData[F.tipoPoliza] = tipoPoliza;
        dealData[F.numSolicitud] = document.getElementById('solicitud').value;
        dealData[F.numPoliza] = document.getElementById('poliza').value;
        dealData[F.precio] = document.getElementById('importe')?.value || '';
        dealData[F.efecto] = document.getElementById('fechaEfecto')?.value || '';
        dealData[F.frecuenciaPago] = document.getElementById('frecuenciaPago')?.value || '';
        dealData[F.numAsegurados] = asegurados.length.toString();
        const puntosCampanaVal = document.getElementById('puntosCampana')?.value || propuestaSeleccionada?.puntos || '0';
        dealData[F.descuento] = puntosCampanaVal && puntosCampanaVal !== '0' ? `${parseInt(puntosCampanaVal).toLocaleString('es-ES')} PUNTOS CAMPAÑA` : '';
        dealData.value = parseFloat(document.getElementById('importe')?.value) || 0;
        dealData.currency = 'EUR';

        // Datos del tomador (persona o empresa)
        if (esPolizaEmpresa) {
            // Empresa: guardar CIF como DNI del titular, razón social como nombre
            dealData[F.nombreTitular] = nombreCompleto;
            dealData[F.dniTitular] = document.getElementById('empresaCif')?.value?.toUpperCase() || '';
            // No hay fecha nacimiento ni sexo para empresas
            dealData[F.direccion] = document.getElementById('tomadorDireccion')?.value?.toUpperCase() || '';
            dealData[F.codigoPostal] = document.getElementById('tomadorCP')?.value || '';
            dealData[F.poblacion] = document.getElementById('tomadorLocalidad')?.value?.toUpperCase() || '';
            
            const provinciaEmpresa = document.getElementById('empresaProvincia')?.value;
            if (provinciaEmpresa && PROVINCIAS_INV[provinciaEmpresa.toUpperCase()]) {
                dealData[F.provincia] = PROVINCIAS_INV[provinciaEmpresa.toUpperCase()];
            }
        } else {
            // Persona física
            dealData[F.nombreTitular] = nombreCompleto;
            dealData[F.dniTitular] = document.getElementById('tomadorNif')?.value?.toUpperCase() || '';
            dealData[F.fechaNacTitular] = document.getElementById('tomadorFechaNac')?.value || '';
            
            const sexo = document.getElementById('tomadorSexo')?.value;
            if (sexo) dealData[F.sexoTitular] = sexo;

            dealData[F.direccion] = document.getElementById('tomadorDireccion')?.value?.toUpperCase() || '';
            dealData[F.codigoPostal] = document.getElementById('tomadorCP')?.value || '';
            dealData[F.poblacion] = document.getElementById('tomadorLocalidad')?.value?.toUpperCase() || '';
            dealData[F.nacionalidad] = document.getElementById('tomadorNacionalidad')?.value?.toUpperCase() || '';
            dealData[F.estadoCivil] = document.getElementById('tomadorEstadoCivil')?.value || '';

            const provincia = document.getElementById('tomadorProvincia')?.value;
            if (provincia && PROVINCIAS_INV[provincia.toUpperCase()]) {
                dealData[F.provincia] = PROVINCIAS_INV[provincia.toUpperCase()];
            }
        }

        dealData[F.iban] = document.getElementById('tomadorIBAN')?.value?.replace(/\s/g, '') || '';

        // Asegurados - diferentes según tipo de póliza
        if (esPolizaEmpresa) {
            // EMPRESA: El tomador es la empresa, los empleados van en asegurados 2-12
            // El primer empleado (aseg.numero=1) va al campo asegurados[2]
            asegurados.forEach((aseg, index) => {
                const campoNumero = index + 2; // Mapear: empleado 1 -> campo 2, empleado 2 -> campo 3, etc.
                if (F.asegurados[campoNumero]) {
                    const campos = F.asegurados[campoNumero];
                    dealData[campos.nombre] = `${aseg.nombre || ''} ${aseg.apellidos || ''}`.trim().toUpperCase();
                    dealData[campos.dni] = aseg.nif?.toUpperCase() || '';
                    dealData[campos.fecha] = aseg.fechaNacimiento || '';
                    if (aseg.sexo) dealData[campos.sexo] = aseg.sexo;
                    if (aseg.parentesco) dealData[campos.parentesco] = aseg.parentesco;
                }
            });
            
            // También guardar el primer empleado como "titular" para búsquedas
            if (asegurados.length > 0) {
                const primerEmpleado = asegurados[0];
                dealData[F.nombreTitular] = `${primerEmpleado.nombre || ''} ${primerEmpleado.apellidos || ''}`.trim().toUpperCase();
                dealData[F.dniTitular] = primerEmpleado.nif?.toUpperCase() || '';
                dealData[F.fechaNacTitular] = primerEmpleado.fechaNacimiento || '';
                if (primerEmpleado.sexo) dealData[F.sexoTitular] = primerEmpleado.sexo;
            }
        } else {
            // PERSONA FÍSICA: Asegurados 2-12 (el 1 es el tomador que ya se guardó arriba)
            asegurados.forEach((aseg) => {
                if (!aseg.esTomador && F.asegurados[aseg.numero]) {
                    const campos = F.asegurados[aseg.numero];
                    dealData[campos.nombre] = `${aseg.nombre || ''} ${aseg.apellidos || ''}`.trim().toUpperCase();
                    dealData[campos.dni] = aseg.nif?.toUpperCase() || '';
                    dealData[campos.fecha] = aseg.fechaNacimiento || '';
                    if (aseg.sexo) dealData[campos.sexo] = aseg.sexo;
                    if (aseg.parentesco) dealData[campos.parentesco] = aseg.parentesco;
                }
            });
        }

        console.log('Datos a guardar:', dealData);

        // 1. Crear nuevo deal o actualizar existente
        let resultDeal;
        if (crearNuevoDeal) {
            console.log('Paso 1: Creando NUEVO deal en pipeline', pipelineDestino);
            resultDeal = await fetchAPI('/deals', { 
                method: 'POST', 
                body: JSON.stringify(dealData) 
            });
            console.log('Resultado crear deal:', resultDeal);
            dealIdFinal = resultDeal?.id || resultDeal?.data?.id;
            if (!dealIdFinal) {
                throw new Error('No se pudo crear el deal - sin ID devuelto');
            }
            console.log('Nuevo deal creado con ID:', dealIdFinal);
            
            // IMPORTANTE: Actualizar para evitar duplicados si vuelven a pulsar
            dealOriginal = resultDeal;
            dealId = dealIdFinal;
            dealYaTieneGrabacion = true;
        } else {
            console.log('Paso 1: Actualizando deal existente...', dealId);
            resultDeal = await fetchAPI(`/deals/${dealId}`, { 
                method: 'PUT', 
                body: JSON.stringify(dealData) 
            });
            console.log('Deal actualizado OK:', resultDeal);
            dealIdFinal = dealId;
            dealYaTieneGrabacion = true;
        }
        dealGuardado = true;

        // 2. Generar nota estructurada
        console.log('Paso 2: Creando nota estructurada en deal', dealIdFinal);
        const notaEstructurada = generarNotaEstructurada();
        console.log('Longitud nota:', notaEstructurada.length, 'caracteres');
        console.log('Inicio nota:', notaEstructurada.substring(0, 300));
        
        const resultNota = await fetchAPI('/notes', {
            method: 'POST',
            body: JSON.stringify({ 
                content: notaEstructurada, 
                deal_id: parseInt(dealIdFinal),
                pinned_to_deal_flag: 1 
            })
        });
        console.log('Resultado crear nota:', resultNota);
        
        const notaId = resultNota?.id || resultNota?.data?.id;
        if (!notaId) {
            console.error('Error: Nota no creada, resultado:', resultNota);
            throw new Error('No se pudo crear la nota en Pipedrive');
        }
        console.log('✅ Nota creada OK, ID:', notaId);
        notaGuardada = true;

        // 3. Generar PDF - PRIMERO DESCARGAR LOCAL, LUEGO SUBIR
        console.log('Paso 3: Generando PDF...');
        let pdfDescargado = false;
        let pdfSubido = false;
        
        try {
            if (window.jspdf && window.jspdf.jsPDF) {
                const pdf = generarPDF();
                const pdfBlob = pdf.output('blob');
                const nombrePDF = `Grabacion_${tipoProducto}_${document.getElementById('tomadorApellidos').value.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}_${dealIdFinal}.pdf`;
                
                // PRIMERO: Descargar localmente SIEMPRE
                try {
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = nombrePDF;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    pdfDescargado = true;
                    console.log('✅ PDF descargado localmente:', nombrePDF);
                } catch (dlError) {
                    console.error('❌ Error descargando PDF local:', dlError);
                }
                
                // SEGUNDO: Subir a Pipedrive
                try {
                    const formData = new FormData();
                    formData.append('file', pdfBlob, nombrePDF);
                    formData.append('deal_id', parseInt(dealIdFinal));

                    console.log('Subiendo PDF a Pipedrive...');
                    
                    const uploadUrl = `${CONFIG.API_URL}/files?api_token=${CONFIG.API_TOKEN}`;
                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.success) {
                        pdfSubido = true;
                        console.log('✅ PDF subido a Pipedrive, ID:', uploadResult.data?.id);
                    } else {
                        console.error('❌ Error subiendo PDF:', uploadResult.error);
                    }
                } catch (uploadError) {
                    console.error('❌ Error subiendo PDF:', uploadError);
                }
            }
        } catch (pdfError) {
            console.error('Error generando PDF:', pdfError);
        }

        // 4. Mostrar resultado con detalles CLAROS
        const agenteNombre = dealOriginal?.user_id?.name || 'Agente';
        
        let mensajeExito = `🎉 ¡GRABACIÓN COMPLETADA!\n\n`;
        mensajeExito += `📋 Deal ID: ${dealIdFinal}\n`;
        mensajeExito += `👤 Agente: ${agenteNombre}\n`;
        mensajeExito += `📦 Producto: ${tipoProducto}\n`;
        mensajeExito += `💰 Estado: GANADO ✅\n\n`;
        
        mensajeExito += `--- Estado del guardado ---\n`;
        mensajeExito += dealGuardado ? '✅ Deal guardado correctamente\n' : '❌ Deal NO guardado\n';
        mensajeExito += notaGuardada ? '✅ Nota creada en Pipedrive\n' : '❌ Nota NO creada\n';
        mensajeExito += pdfDescargado ? '✅ PDF descargado localmente\n' : '⚠️ PDF no descargado\n';
        mensajeExito += pdfSubido ? '✅ PDF subido a Pipedrive\n' : '⚠️ PDF no subido a Pipedrive\n';
        
        if (crearNuevoDeal) {
            mensajeExito += `\n📌 Se creó un NUEVO deal porque el original ya tenía grabación.`;
        }
        
        mostrarExito(mensajeExito);
        
        // DESHABILITAR BOTÓN GUARDAR para evitar duplicados
        btn.innerHTML = '✅ GUARDADO';
        btn.disabled = true;
        btn.classList.add('bg-green-500');
        btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        
        // Mantener variable de bloqueo activa
        // guardandoEnProceso = true; // NO liberamos el bloqueo
        
        cerrarGuion();

    } catch (error) {
        console.error('=== ERROR GUARDANDO ===');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        
        // Mostrar qué se guardó y qué no
        let mensajeError = `❌ Error: ${error.message}\n\n`;
        mensajeError += `Estado del guardado:\n`;
        mensajeError += dealGuardado ? '✅ Deal guardado\n' : '❌ Deal NO guardado\n';
        mensajeError += notaGuardada ? '✅ Nota guardada\n' : '❌ Nota NO guardada\n';
        mensajeError += pdfDescargado ? '✅ PDF descargado\n' : '❌ PDF NO descargado\n';
        
        mostrarError(mensajeError);
        
        // Solo liberar el bloqueo si hubo error
        btn.innerHTML = btnTextoOriginal;
        btn.disabled = false;
        guardandoEnProceso = false;
    }
    // NO hay finally - el botón queda bloqueado si se guardó correctamente
}

// ============================================================================
// GENERAR NOTA ESTRUCTURADA (PARSEABLE PARA FUTURO CRM)
// ============================================================================
function generarNotaEstructurada() {
    const fecha = new Date().toLocaleDateString('es-ES');
    
    // Datos del tomador (persona o empresa)
    let tomador;
    
    if (esPolizaEmpresa) {
        // Datos de empresa
        tomador = {
            tipo: 'EMPRESA',
            razonSocial: document.getElementById('empresaRazonSocial')?.value?.toUpperCase() || '',
            cif: document.getElementById('empresaCif')?.value?.toUpperCase() || '',
            telefono: document.getElementById('empresaTelefono')?.value || '',
            email: document.getElementById('empresaEmail')?.value || '',
            contacto: document.getElementById('empresaContacto')?.value?.toUpperCase() || '',
            cargo: document.getElementById('empresaCargo')?.value?.toUpperCase() || '',
            actividad: document.getElementById('empresaActividad')?.value?.toUpperCase() || '',
            direccion: document.getElementById('tomadorDireccion')?.value?.toUpperCase() || '',
            cp: document.getElementById('tomadorCP')?.value || '',
            localidad: document.getElementById('tomadorLocalidad')?.value?.toUpperCase() || '',
            provincia: document.getElementById('empresaProvincia')?.value?.toUpperCase() || '',
            iban: document.getElementById('tomadorIBAN')?.value?.replace(/\s/g, '') || ''
        };
    } else {
        // Datos de persona física
        tomador = {
            tipo: 'PERSONA',
            nombre: document.getElementById('tomadorNombre').value.toUpperCase(),
            apellidos: document.getElementById('tomadorApellidos').value.toUpperCase(),
            nif: document.getElementById('tomadorNif').value.toUpperCase(),
            fechaNac: document.getElementById('tomadorFechaNac').value,
            sexo: document.getElementById('tomadorSexo').value,
            telefono: document.getElementById('tomadorTelefono').value,
            email: document.getElementById('tomadorEmail').value,
            direccion: document.getElementById('tomadorDireccion').value.toUpperCase(),
            cp: document.getElementById('tomadorCP').value,
            localidad: document.getElementById('tomadorLocalidad').value.toUpperCase(),
            provincia: document.getElementById('tomadorProvincia').value.toUpperCase(),
            nacionalidad: document.getElementById('tomadorNacionalidad')?.value?.toUpperCase() || 'ESPAÑOLA',
            estadoCivil: document.getElementById('tomadorEstadoCivil')?.value || '',
            iban: document.getElementById('tomadorIBAN').value.replace(/\s/g, '')
        };
    }
    
    const tipoPoliza = tipoProducto === 'SALUD' ? document.getElementById('tipoPoliza').value : document.getElementById('tipoPolizaInput')?.value || tipoProducto;
    const dtoCompania = document.getElementById('dtoCompania')?.value || '';
    const dtoContra = document.getElementById('dtoContracomision')?.value || '';
    const puntosCampana = document.getElementById('puntosCampana')?.value || propuestaSeleccionada?.puntos || '0';
    const dental = document.getElementById('dental')?.value || propuestaSeleccionada?.dental || '';
    
    // Productos que pueden tener dental (solo SALUD)
    const productoConDental = tipoProducto === 'SALUD';
    // Productos que pueden tener descuento compañía (SALUD, DENTAL)
    const productoConDescuento = tipoProducto === 'SALUD' || tipoProducto === 'DENTAL';
    
    const importe = document.getElementById('importe').value;
    const frecuencia = document.getElementById('frecuenciaPago').value;
    const primaAnual = (parseFloat(importe)||0) * (frecuencia==='MENSUAL'?12:frecuencia==='TRIMESTRAL'?4:frecuencia==='SEMESTRAL'?2:1);

    let nota = `
<h2>════════════════════════════════════</h2>
<h2>🏥 GRABACIÓN PÓLIZA ADESLAS</h2>
<h2>════════════════════════════════════</h2>
<br>
<b>📋 DATOS PÓLIZA</b><br>
- Tipo: ${tipoProducto}${esPolizaEmpresa ? ' (EMPRESA)' : ''} | Producto: ${tipoPoliza}<br>
- Precio: ${importe}€/${frecuencia} | Anual: ${primaAnual.toFixed(2)}€<br>
- Efecto: ${formatearFechaES(document.getElementById('fechaEfecto').value)} | Agente: ${document.getElementById('agente').value || '-'}<br>
- Solicitud: ${document.getElementById('solicitud').value || '-'} | Póliza: ${document.getElementById('poliza').value || '-'}<br>
${productoConDescuento ? `- Descuento compañía: ${dtoCompania || '-'} | Contra: ${dtoContra || '-'}<br>` : ''}
${productoConDental ? `- Dental: ${dental || 'Sin dental'}<br>` : ''}
- 🎁 Puntos campaña: ${puntosCampana ? parseInt(puntosCampana).toLocaleString('es-ES') + ' pts' : '-'}<br>
- Fecha grabación: ${fecha}<br>
<br>
`;

    // Sección TOMADOR según si es empresa o persona
    if (esPolizaEmpresa) {
        nota += `<b>🏢 TOMADOR (EMPRESA)</b><br>
- Razón Social: ${tomador.razonSocial}<br>
- CIF: ${tomador.cif}<br>
- Teléfono: ${tomador.telefono} | Email: ${tomador.email}<br>
- Contacto: ${tomador.contacto} (${tomador.cargo})<br>
- Actividad: ${tomador.actividad}<br>
- Dirección: ${tomador.direccion}, ${tomador.cp} ${tomador.localidad}, ${tomador.provincia}<br>
- IBAN: ${tomador.iban}<br>
`;
    } else {
        const tituloTomador = !tomadorEsAsegurado ? '👤 TOMADOR (SOLO PAGA - NO ASEGURADO)' : '👤 TOMADOR';
        nota += `<b>${tituloTomador}</b><br>
- Nombre: ${tomador.nombre} ${tomador.apellidos}<br>
- DNI: ${tomador.nif} | Fecha nac: ${formatearFechaES(tomador.fechaNac)} | Sexo: ${tomador.sexo}<br>
- Teléfono: ${tomador.telefono} | Email: ${tomador.email}<br>
- Dirección: ${tomador.direccion}, ${tomador.cp} ${tomador.localidad}, ${tomador.provincia}<br>
- IBAN: ${tomador.iban}<br>
- Estado civil: ${tomador.estadoCivil} | Nacionalidad: ${tomador.nacionalidad}<br>
<b>LOCALIDAD:</b> ${tomador.localidad}<br>
<b>PROVINCIA:</b> ${tomador.provincia}<br>
<b>NACIONALIDAD:</b> ${tomador.nacionalidad}<br>
<b>ESTADO CIVIL:</b> ${tomador.estadoCivil}<br>
<b>IBAN:</b> ${tomador.iban}<br>
`;
    }

    // Sección específica según producto
    if (tipoProducto === 'MASCOTAS') {
        nota += `
<br>
<b>🐾 MASCOTA</b><br>
<b>NOMBRE:</b> ${datosMascota.nombre || '-'}<br>
<b>TIPO:</b> ${datosMascota.tipo || '-'}<br>
<b>RAZA:</b> ${datosMascota.raza || '-'}<br>
<b>FECHA NAC:</b> ${formatearFechaES(datosMascota.fechaNacimiento) || '-'}<br>
<b>CHIP:</b> ${datosMascota.chip || '-'}<br>
`;
    } else {
        // SALUD, DENTAL, DECESOS - tienen asegurados
        const tituloAsegurados = esPolizaEmpresa ? 'EMPLEADOS ASEGURADOS' : 'ASEGURADOS';
        nota += `
<br>
<h3>─── ${tituloAsegurados} (${asegurados.length}) ───</h3>
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 12px;">
<tr style="background-color: #009DDD; color: white;">
<th>#</th><th>NOMBRE</th><th>APELLIDOS</th><th>DNI</th><th>FECHA NAC</th><th>SEXO</th>
</tr>
`;
        asegurados.forEach((aseg, idx) => {
            if (aseg.esTomador && !esPolizaEmpresa) {
                // Tomador como asegurado (solo en pólizas particulares)
                nota += `<tr><td>${idx + 1}</td><td>${tomador.nombre}</td><td>${tomador.apellidos}</td><td>${tomador.nif}</td><td>${formatearFechaES(tomador.fechaNac)}</td><td>${tomador.sexo}</td></tr>\n`;
            } else {
                // Asegurado normal (o empleado en empresa)
                nota += `<tr><td>${idx + 1}</td><td>${aseg.nombre?.toUpperCase() || '-'}</td><td>${aseg.apellidos?.toUpperCase() || '-'}</td><td>${aseg.nif?.toUpperCase() || '-'}</td><td>${formatearFechaES(aseg.fechaNacimiento) || '-'}</td><td>${aseg.sexo || '-'}</td></tr>\n`;
            }
        });
        nota += `</table>`;
        
        // Cuestionario de salud (SALUD y no GO - EMPRESA SÍ tiene cuestionario)
        if (tipoProducto === 'SALUD' && !esPolizaGO) {
            nota += `
<br>
<b>❤️ CUESTIONARIO SALUD${esPolizaSenior ? ' SENIOR' : ''}</b><br>
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 12px;">
<tr style="background-color: #009DDD; color: white;">
<th>PREGUNTA</th>`;
            
            // Cabecera con nombres de asegurados
            asegurados.forEach((a, i) => {
                const nombre = a.esTomador ? tomador.nombre.split(' ')[0] : (a.nombre?.split(' ')[0] || `ASEG${i+1}`);
                nota += `<th>${nombre}</th>`;
            });
            nota += `</tr>\n`;
            
            // Peso/Altura
            nota += `<tr><td><b>Peso/Altura</b></td>`;
            asegurados.forEach(a => {
                const peso = a.cuestionario?.peso || '-';
                const altura = a.cuestionario?.estatura || '-';
                nota += `<td>${peso} kg / ${altura} cm</td>`;
            });
            nota += `</tr>\n`;
            
            if (esPolizaSenior) {
                // =============================================
                // CUESTIONARIO SENIOR COMPLETO
                // =============================================
                
                // Pregunta principal
                nota += `<tr><td><b>¿Ha padecido enfermedad?</b></td>`;
                asegurados.forEach(a => nota += `<td>${a.cuestionario?.senior_enfermedad_general || '-'}</td>`);
                nota += `</tr>\n`;
                
                // Enfermedades específicas (solo si alguno contestó SÍ)
                const preguntasSenior = [
                    { key: 'senior_corazon', det: 'senior_corazon_detalle', label: 'Corazón' },
                    { key: 'senior_rinon', det: 'senior_rinon_detalle', label: 'Riñón/urológica' },
                    { key: 'senior_vascular', det: 'senior_vascular_detalle', label: 'Vascular' },
                    { key: 'senior_nervioso', det: 'senior_nervioso_detalle', label: 'Sistema nervioso' },
                    { key: 'senior_diabetes', det: 'senior_diabetes_tipo', label: 'Diabetes' },
                    { key: 'senior_tiroides', det: 'senior_tiroides_detalle', label: 'Tiroides' },
                    { key: 'senior_hipertension', det: null, label: 'Hipertensión', extra: (c) => c.senior_hipertension === 'SÍ' ? `${c.senior_tension1 || ''}/${c.senior_tension2 || ''}` : '' },
                    { key: 'senior_colesterol', det: null, label: 'Colesterol >220' },
                    { key: 'senior_epoc', det: 'senior_fev1', label: 'EPOC/bronquitis' },
                    { key: 'senior_respiratorio', det: 'senior_respiratorio_detalle', label: 'Respiratorio' },
                    { key: 'senior_digestivo', det: 'senior_digestivo_detalle', label: 'Digestivo/hígado' },
                    { key: 'senior_ocular', det: 'senior_ocular_detalle', label: 'Ocular' },
                    { key: 'senior_locomotor', det: 'senior_locomotor_detalle', label: 'Locomotor' },
                    { key: 'senior_tumoral', det: 'senior_tumoral_detalle', label: 'Tumoral' },
                    { key: 'senior_psiquiatrico', det: 'senior_psiquiatrico_detalle', label: 'Psiquiátrico' },
                    { key: 'senior_infeccioso', det: 'senior_infeccioso_detalle', label: 'Infeccioso' },
                    { key: 'senior_otras', det: 'senior_otras_detalle', label: 'Otras enfermedades' }
                ];
                
                preguntasSenior.forEach(p => {
                    nota += `<tr><td><b>${p.label}</b></td>`;
                    asegurados.forEach(a => {
                        const c = a.cuestionario || {};
                        const resp = c[p.key] || '-';
                        const detalle = p.det ? (c[p.det] || '') : (p.extra ? p.extra(c) : '');
                        if (detalle) {
                            nota += `<td style="background-color: #fff3cd;">${resp}<br><i style="font-size:10px;">${detalle}</i></td>`;
                        } else {
                            nota += `<td>${resp}</td>`;
                        }
                    });
                    nota += `</tr>\n`;
                });
                
                // Discapacidad y baja
                nota += `<tr><td><b>Discapacidad/invalidez</b></td>`;
                asegurados.forEach(a => {
                    const c = a.cuestionario || {};
                    const resp = c.senior_discapacidad || '-';
                    const det = c.senior_discapacidad_detalle || '';
                    nota += det ? `<td style="background-color: #fff3cd;">${resp}<br><i style="font-size:10px;">${det}</i></td>` : `<td>${resp}</td>`;
                });
                nota += `</tr>\n`;
                
                nota += `<tr><td><b>Baja laboral >3 semanas</b></td>`;
                asegurados.forEach(a => {
                    const c = a.cuestionario || {};
                    const resp = c.senior_baja || '-';
                    const det = c.senior_baja_detalle || '';
                    nota += det ? `<td style="background-color: #fff3cd;">${resp}<br><i style="font-size:10px;">${det}</i></td>` : `<td>${resp}</td>`;
                });
                nota += `</tr>\n`;
                
                // Preguntas de hábitos (comunes con cuestionario normal)
                const preguntasHabitos = [
                    { key: 'p10_fumador', det: 'p10_detalle', label: 'Fumador' },
                    { key: 'p11_alcohol', det: 'p11_detalle', label: 'Alcohol >5 unidades' },
                    { key: 'p12_estupefacientes', det: 'p12_detalle', label: 'Estupefacientes' },
                    { key: 'p7_tratamiento', det: 'p7_detalle', label: 'Tratamiento actual' },
                    { key: 'p3_intervenciones', det: 'p3_detalle', label: 'Hospitalizado/operado' },
                    { key: 'p6_traumatismos', det: 'p6_detalle', label: 'Traumatismo/accidente' }
                ];
                
                preguntasHabitos.forEach(p => {
                    nota += `<tr><td><b>${p.label}</b></td>`;
                    asegurados.forEach(a => {
                        const c = a.cuestionario || {};
                        const resp = c[p.key] || '-';
                        const det = c[p.det] || '';
                        if (det) {
                            nota += `<td style="background-color: #fff3cd;">${resp}<br><i style="font-size:10px;">${det}</i></td>`;
                        } else {
                            nota += `<td>${resp}</td>`;
                        }
                    });
                    nota += `</tr>\n`;
                });
                
            } else {
                // =============================================
                // CUESTIONARIO NORMAL
                // =============================================
                const preguntas = [
                    { key: 'p1_enfermedades', detKey: 'p1_detalle', label: '1. Enfermedad últimos 5 años' },
                    { key: 'p2_secuelas', detKey: 'p2_detalle', label: '2. Secuelas accidente/enfermedad' },
                    { key: 'p3_intervenciones', detKey: 'p3_detalle', label: '3. Intervenciones quirúrgicas' },
                    { key: 'p4_ultimaVisita', detKey: 'p4_motivo', label: '4. Última visita médico' },
                    { key: 'p5_defectoFisico', detKey: 'p5_detalle', label: '5. Defecto físico/psíquico' },
                    { key: 'p6_traumatismos', detKey: 'p6_detalle', label: '6. Traumatismos' },
                    { key: 'p7_tratamiento', detKey: 'p7_detalle', label: '7. Tratamiento actual' },
                    { key: 'p8_estudioFuturo', detKey: 'p8_detalle', label: '8. Estudio/intervención futura' },
                    { key: 'p9_hospitalizacion', detKey: 'p9_detalle', label: '9. Hospitalización prevista' },
                    { key: 'p10_fumador', detKey: 'p10_detalle', label: '10. Fumador' },
                    { key: 'p11_alcohol', detKey: 'p11_detalle', label: '11. Consumo alcohol' },
                    { key: 'p12_estupefacientes', detKey: 'p12_detalle', label: '12. Estupefacientes' }
                ];
                
                preguntas.forEach(p => {
                    nota += `<tr><td><b>${p.label}</b></td>`;
                    asegurados.forEach(a => {
                        const resp = a.cuestionario?.[p.key] || '-';
                        const detalle = a.cuestionario?.[p.detKey] || '';
                        if (detalle) {
                            nota += `<td style="background-color: #fff3cd;">${resp}<br><i style="font-size:10px;">${detalle}</i></td>`;
                        } else {
                            nota += `<td>${resp}</td>`;
                        }
                    });
                    nota += `</tr>\n`;
                });
            }
            nota += `</table>`;
        }
    }
    
    nota += `
<br>
<br><b>════════════════════════════════════</b><br>
<i>Grabado con Avants Suite · ${fecha}</i>
`;
    
    return nota;
}

// ============================================================================
// MENSAJES
// ============================================================================
function mostrarError(mensaje) {
    const el = document.getElementById('mensajeError');
    document.getElementById('mensajeErrorTexto').textContent = mensaje;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 8000);
}

function ocultarError() { document.getElementById('mensajeError').classList.add('hidden'); }

function mostrarExito(mensaje) {
    const el = document.getElementById('mensajeExito');
    document.getElementById('mensajeExitoTexto').textContent = mensaje;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

// ============================================================================
// NAVEGACIÓN CON TAB EN CUESTIONARIO
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Configurar navegación con Tab y Enter en el cuestionario
    document.addEventListener('keydown', function(e) {
        const target = e.target;
        
        // Solo procesar en el paso 4 (cuestionario)
        if (pasoActual !== 4) return;
        
        // Si es Enter en un botón Sí/No, pasar al siguiente campo
        if (e.key === 'Enter' && target.classList.contains('btn-si-no')) {
            e.preventDefault();
            // Buscar el siguiente campo de entrada o botón
            const allInputs = Array.from(document.querySelectorAll('#seccionCuestionario input:not([type="hidden"]), #seccionCuestionario select, #seccionCuestionario button.btn-si-no'));
            const currentIndex = allInputs.indexOf(target);
            if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
                const nextInput = allInputs[currentIndex + 1];
                nextInput.focus();
                if (nextInput.select) nextInput.select();
            }
        }
        
        // Si es Tab en un campo de detalle, ir al siguiente grupo de preguntas
        if (e.key === 'Tab' && !e.shiftKey) {
            const cuestionarioSection = target.closest('.cuestionario-asegurado');
            if (cuestionarioSection) {
                // Buscar todos los campos del cuestionario en orden
                const campos = cuestionarioSection.querySelectorAll('input, select, button.btn-si-no');
                const camposArray = Array.from(campos);
                const currentIndex = camposArray.indexOf(target);
                
                // Si estamos en el último campo de este asegurado, ir al siguiente asegurado
                if (currentIndex === camposArray.length - 1) {
                    const todosLosAsegurados = document.querySelectorAll('.cuestionario-asegurado');
                    const aseguradosArray = Array.from(todosLosAsegurados);
                    const currentAsegIndex = aseguradosArray.indexOf(cuestionarioSection);
                    
                    if (currentAsegIndex < aseguradosArray.length - 1) {
                        e.preventDefault();
                        const siguienteAseg = aseguradosArray[currentAsegIndex + 1];
                        const primerCampo = siguienteAseg.querySelector('input, select, button.btn-si-no');
                        if (primerCampo) {
                            primerCampo.focus();
                            // Scroll al siguiente asegurado
                            siguienteAseg.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }
            }
        }
    });
    
    // Hacer que los botones Sí/No sean focuseables
    document.querySelectorAll('.btn-si-no').forEach(btn => {
        btn.setAttribute('tabindex', '0');
    });
});

// ============================================================================
// GUARDAR EN CRM (Avants Suite)
// Añadido para integración con BD del CRM — no modifica funciones existentes
// ============================================================================
async function guardarEnCRM() {
    const btn = document.getElementById('btnGuardarCRM');
    if (!btn) return;
    const btnOriginal = btn.innerHTML;
    btn.innerHTML = '<div class="loader"></div><span>Guardando en CRM...</span>';
    btn.disabled = true;

    let token = null;
    try { token = window.parent?.localStorage?.getItem('token') || localStorage.getItem('token'); }
    catch(e) { token = localStorage.getItem('token'); }

    if (!token) {
        mostrarError('No estás logueado en el CRM. Abre la grabación desde el CRM.');
        btn.innerHTML = btnOriginal; btn.disabled = false; return;
    }

    try {
        const tipoPolizaVal = tipoProducto === 'SALUD'
            ? document.getElementById('tipoPoliza')?.value
            : document.getElementById('tipoPolizaInput')?.value;

        const guionTexto = document.getElementById('guionTexto')?.textContent || '';

        const aseguradosData = asegurados.map(a => ({
            nombre: a.nombre||'', apellidos: a.apellidos||'', dni: a.nif||'',
            fechaNac: a.fechaNac||'', sexo: a.sexo||'', parentesco: a.parentesco||'',
            cuestionario: a.cuestionario||{}
        }));

        const mascotaData = tipoProducto === 'MASCOTAS' ? {
            nombre: document.getElementById('mascotaNombre')?.value||'',
            tipo: document.getElementById('mascotaTipo')?.value||'',
            raza: document.getElementById('mascotaRaza')?.value||'',
            chip: document.getElementById('mascotaChip')?.value||''
        } : null;

        const body = {
            deal_id: dealId ? parseInt(dealId) : null,
            compania: 'ADESLAS',
            producto: tipoPolizaVal || tipoProducto,
            tipo_producto: tipoProducto.toLowerCase(),
            n_solicitud: document.getElementById('solicitud')?.value||null,
            n_poliza: document.getElementById('poliza')?.value||null,
            fecha_efecto: document.getElementById('fechaEfecto')?.value||null,
            forma_pago: document.getElementById('frecuenciaPago')?.value||'MENSUAL',
            prima_mensual: parseFloat(document.getElementById('importe')?.value)||0,
            dental: document.getElementById('dental')?.value||null,
            estado: 'grabado',
            datos_titular: {
                nombre: document.getElementById('tomadorNombre')?.value||'',
                apellidos: document.getElementById('tomadorApellidos')?.value||'',
                dni: document.getElementById('tomadorNif')?.value||'',
                iban: document.getElementById('tomadorIBAN')?.value||''
            },
            asegurados_data: aseguradosData,
            datos_mascota: mascotaData,
            script_grabacion: guionTexto,
            pipedrive_deal_id: dealId ? parseInt(dealId) : null
        };

        const res = await fetch('/api/grabaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            mostrarExito('Guardado en CRM — Póliza ID: ' + (data.id || data.poliza_id || 'OK'));
            btn.innerHTML = '✅ Guardado en CRM';
            btn.classList.remove('bg-[#10b981]');
            btn.classList.add('bg-gray-400');
            // Generar PDF automáticamente si está disponible
            generarPDFGrabacion();
        } else {
            mostrarError('Error CRM: ' + (data.error || 'desconocido'));
            btn.innerHTML = btnOriginal; btn.disabled = false;
        }
    } catch(e) {
        mostrarError('Error conexión CRM: ' + e.message);
        btn.innerHTML = btnOriginal; btn.disabled = false;
    }
}

// === GENERAR PDF DE GRABACIÓN CON PLANTILLA PROFESIONAL ===
async function generarPDFGrabacion() {
    if (typeof PDFPropuesta === 'undefined') return; // Solo si está cargado desde CRM

    const tipoPolizaVal = tipoProducto === 'SALUD'
        ? document.getElementById('tipoPoliza')?.value
        : document.getElementById('tipoPolizaInput')?.value;

    const nombreTomador = esPolizaEmpresa
        ? document.getElementById('empresaRazonSocial')?.value || ''
        : `${document.getElementById('tomadorNombre')?.value||''} ${document.getElementById('tomadorApellidos')?.value||''}`.trim();

    const aseguradosList = asegurados.map((a, i) => {
        if (a.esTomador && !esPolizaEmpresa) {
            return {
                nombre: nombreTomador,
                edad: a.fechaNac ? calcularEdad(a.fechaNac) : null,
                sexo: document.getElementById('tomadorSexo')?.value || '',
                precio: ''
            };
        }
        return {
            nombre: `${a.nombre||''} ${a.apellidos||''}`.trim(),
            edad: a.fechaNacimiento ? calcularEdad(a.fechaNacimiento) : null,
            sexo: a.sexo || '',
            precio: ''
        };
    });

    const importe = document.getElementById('importe')?.value || '0';
    const frecuencia = document.getElementById('frecuenciaPago')?.value || 'MENSUAL';
    const multiplicador = frecuencia==='MENSUAL'?12:frecuencia==='TRIMESTRAL'?4:frecuencia==='SEMESTRAL'?2:1;

    try {
        await PDFPropuesta.download({
            referencia: `GRB-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
            fecha: new Date().toLocaleDateString('es-ES'),
            clienteNombre: nombreTomador,
            clienteDNI: document.getElementById('tomadorNif')?.value || document.getElementById('empresaCif')?.value || '',
            clienteTelefono: document.getElementById('tomadorTelefono')?.value || document.getElementById('empresaTelefono')?.value || '',
            clienteEmail: document.getElementById('tomadorEmail')?.value || document.getElementById('empresaEmail')?.value || '',
            clienteDireccion: `${document.getElementById('tomadorDireccion')?.value||''}, ${document.getElementById('tomadorCP')?.value||''} ${document.getElementById('tomadorLocalidad')?.value||''}`.trim(),
            agente: document.getElementById('agente')?.value || '',
            asegurados: aseguradosList,
            productos: [{
                nombre: tipoPolizaVal || tipoProducto,
                precioMensual: parseFloat(importe).toFixed(2).replace('.',','),
                detalle: [
                    document.getElementById('dental')?.value || '',
                    document.getElementById('dtoCompania')?.value ? `Dto: ${document.getElementById('dtoCompania').value}` : ''
                ].filter(Boolean).join(' · ')
            }],
            totalMensual: parseFloat(importe).toFixed(2).replace('.',','),
            totalAnual: (parseFloat(importe) * multiplicador).toFixed(2).replace('.',','),
            descuentos: {
                compania: document.getElementById('dtoCompania')?.value || '',
                opcional: document.getElementById('dtoContracomision')?.value || ''
            },
            puntos: parseInt(document.getElementById('puntosCampana')?.value || propuestaSeleccionada?.puntos || 0) || 0
        });
    } catch(e) {
        console.warn('Error generando PDF grabación:', e);
    }
}
