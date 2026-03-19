// ============================================
// TARIFAS ADESLAS 2026 - Campaña MásProtección
// ============================================

// Mapeo de provincias a zonas
const PROVINCIA_A_ZONA = {
    'A_Coruña': 5, 'Alava': 3, 'Albacete': 4, 'Alicante': 3, 'Almeria': 4,
    'Asturias': 5, 'Avila': 5, 'Badajoz': 6, 'Baleares': 3, 'Barcelona': 2,
    'Burgos': 5, 'Caceres': 6, 'Cadiz': 4, 'Cantabria': 5, 'Castellon': 3,
    'Ceuta': 6, 'Ciudad_Real': 4, 'Cordoba': 4, 'Cuenca': 4, 'Girona': 2,
    'Granada': 4, 'Guadalajara': 4, 'Guipuzcoa': 3, 'Huelva': 4, 'Huesca': 6,
    'Jaen': 4, 'La_Rioja': 3, 'Las_Palmas': 6, 'Leon': 5, 'Lleida': 2,
    'Lugo': 5, 'Madrid': 1, 'Malaga': 4, 'Melilla': 6, 'Murcia': 3,
    'Navarra': 3, 'Ourense': 5, 'Palencia': 5, 'Pontevedra': 5, 'Salamanca': 5,
    'Santa_Cruz_de_Tenerife': 6, 'Segovia': 5, 'Sevilla': 4, 'Soria': 5,
    'Tarragona': 2, 'Teruel': 6, 'Toledo': 4, 'Valencia': 3, 'Valladolid': 5,
    'Vizcaya': 3, 'Zamora': 5, 'Zaragoza': 3
};

const PROVINCIAS_ORDENADAS = [
    'A_Coruña', 'Alava', 'Albacete', 'Alicante', 'Almeria', 'Asturias', 'Avila',
    'Badajoz', 'Baleares', 'Barcelona', 'Burgos', 'Caceres', 'Cadiz', 'Cantabria',
    'Castellon', 'Ceuta', 'Ciudad_Real', 'Cordoba', 'Cuenca', 'Girona', 'Granada',
    'Guadalajara', 'Guipuzcoa', 'Huelva', 'Huesca', 'Jaen', 'La_Rioja', 'Las_Palmas',
    'Leon', 'Lleida', 'Lugo', 'Madrid', 'Malaga', 'Melilla', 'Murcia', 'Navarra',
    'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa_Cruz_de_Tenerife',
    'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
    'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
];

// Tarifas por zona y producto
const TARIFAS = {
    'PLENA VITAL': {
        1: [[0,24,38],[25,44,50],[45,54,61.5],[55,59,94],[60,64,117],[65,69,156],[70,99,168]],
        2: [[0,24,39],[25,44,50.5],[45,54,62],[55,59,95],[60,64,121],[65,69,163],[70,99,176]],
        3: [[0,24,39.5],[25,44,51],[45,54,63],[55,59,96.5],[60,64,124],[65,69,167],[70,99,179]],
        4: [[0,24,40],[25,44,52],[45,54,64],[55,59,99],[60,64,125.5],[65,69,167.5],[70,99,180]],
        5: [[0,24,41],[25,44,53.5],[45,54,66],[55,59,101],[60,64,126],[65,69,168],[70,99,181]],
        6: [[0,24,42.5],[25,44,54],[45,54,66.5],[55,59,103],[60,64,127],[65,69,169],[70,99,182]]
    },
    'PLENA': {
        1: [[0,24,50],[25,44,60],[45,54,72],[55,59,105],[60,64,128],[65,69,166],[70,99,225]],
        2: [[0,24,51],[25,44,62],[45,54,73],[55,59,107],[60,64,130],[65,69,167],[70,99,227]],
        3: [[0,24,52],[25,44,63],[45,54,74],[55,59,109],[60,64,131],[65,69,169],[70,99,229]],
        4: [[0,24,53],[25,44,63],[45,54,74],[55,59,109],[60,64,131],[65,69,169],[70,99,229]],
        5: [[0,24,54],[25,44,65],[45,54,78],[55,59,112],[60,64,139],[65,69,175],[70,99,239]],
        6: [[0,24,55],[25,44,66],[45,54,79],[55,59,114],[60,64,140],[65,69,179],[70,99,240]]
    },
    'PLENA PLUS': {
        1: [[0,24,62],[25,44,72],[45,54,92],[55,59,149],[60,64,175],[65,69,239],[70,99,255]],
        2: [[0,24,64],[25,44,75],[45,54,94],[55,59,155],[60,64,181],[65,69,255],[70,99,259]],
        3: [[0,24,64],[25,44,76],[45,54,96],[55,59,159],[60,64,185],[65,69,259],[70,99,265]],
        4: [[0,24,66],[25,44,77],[45,54,99],[55,59,164],[60,64,196],[65,69,275],[70,99,279]],
        5: [[0,24,67],[25,44,79],[45,54,100],[55,59,166],[60,64,205],[65,69,289],[70,99,295]],
        6: [[0,24,69],[25,44,79],[45,54,105],[55,59,167],[60,64,207],[65,69,291],[70,99,297]]
    },
    'EXTRA 150': {
        1: [[0,24,90],[25,44,106],[45,54,112],[55,59,174],[60,64,206],[65,69,293],[70,99,304]],
        2: [[0,24,93],[25,44,110],[45,54,118],[55,59,180],[60,64,210],[65,69,301],[70,99,309]],
        3: [[0,24,94],[25,44,111],[45,54,119],[55,59,185],[60,64,215],[65,69,308],[70,99,319]],
        4: [[0,24,102],[25,44,120],[45,54,129],[55,59,198],[60,64,228],[65,69,320],[70,99,329]],
        5: [[0,24,102.5],[25,44,120.5],[45,54,130],[55,59,198.5],[60,64,228.8],[65,69,321],[70,99,330]],
        6: [[0,24,104],[25,44,122],[45,54,132],[55,59,203],[60,64,233],[65,69,330],[70,99,340]]
    },
    'EXTRA 240': {
        1: [[0,24,112],[25,44,138],[45,54,184],[55,59,255],[60,64,301],[65,69,429],[70,99,469]],
        2: [[0,24,115],[25,44,140.5],[45,54,190],[55,59,267],[60,64,318],[65,69,447],[70,99,482.5]],
        3: [[0,24,116.5],[25,44,143],[45,54,193],[55,59,269],[60,64,320],[65,69,450],[70,99,483]],
        4: [[0,24,120],[25,44,147],[45,54,195],[55,59,275.5],[60,64,329],[65,69,457],[70,99,495]],
        5: [[0,24,121],[25,44,149],[45,54,206],[55,59,279],[60,64,335],[65,69,458],[70,99,507]],
        6: [[0,24,121.5],[25,44,151],[45,54,209],[55,59,289],[60,64,347],[65,69,474],[70,99,522]]
    },
    'EXTRA 1M': {
        1: [[0,24,157],[25,44,190],[45,54,267],[55,59,368],[60,64,470],[65,69,590],[70,99,703]],
        2: [[0,24,163],[25,44,197],[45,54,275],[55,59,385],[60,64,490],[65,69,605],[70,99,739]],
        3: [[0,24,164],[25,44,199],[45,54,282],[55,59,388],[60,64,493],[65,69,606],[70,99,745]],
        4: [[0,24,168],[25,44,202],[45,54,285],[55,59,405],[60,64,515],[65,69,622],[70,99,763]],
        5: [[0,24,172],[25,44,206],[45,54,296],[55,59,410],[60,64,520],[65,69,623],[70,99,765]],
        6: [[0,24,173],[25,44,210],[45,54,298],[55,59,416],[60,64,550],[65,69,655],[70,99,805]]
    },
    'PLENA TOTAL': {
        1: [[0,24,83],[25,44,99],[45,54,121],[55,59,169],[60,62,207],[63,99,273]],
        2: [[0,24,85],[25,44,103],[45,54,124],[55,59,176],[60,62,217],[63,99,284]],
        3: [[0,24,86],[25,44,104],[45,54,126.5],[55,59,179],[60,62,223],[63,99,288]],
        4: [[0,24,87],[25,44,105.5],[45,54,131],[55,59,181],[60,62,227],[63,99,294]],
        5: [[0,24,87],[25,44,105.5],[45,54,131],[55,59,181],[60,62,227],[63,99,294]],
        6: [[0,24,89.5],[25,44,111],[45,54,137],[55,59,192],[60,62,247],[63,99,318]]
    },
    'PLENA VITAL TOTAL': {
        1: [[0,24,83],[25,44,99],[45,54,121],[55,59,169],[60,62,207],[63,99,273]],
        2: [[0,24,85],[25,44,103],[45,54,124],[55,59,176],[60,62,217],[63,99,284]],
        3: [[0,24,86],[25,44,104],[45,54,126.5],[55,59,179],[60,62,223],[63,99,288]],
        4: [[0,24,87],[25,44,105.5],[45,54,131],[55,59,181],[60,62,227],[63,99,294]],
        5: [[0,24,87],[25,44,105.5],[45,54,131],[55,59,181],[60,62,227],[63,99,294]],
        6: [[0,24,89.5],[25,44,111],[45,54,137],[55,59,192],[60,62,247],[63,99,318]]
    },
    'ADESLAS GO': {
        1: [[0,54,21],[55,69,37.5],[70,99,50]],
        2: [[0,54,21.5],[55,69,39],[70,99,52]],
        3: [[0,54,22],[55,69,39.5],[70,99,53]],
        4: [[0,54,22.5],[55,69,40],[70,99,53.5]],
        5: [[0,54,23],[55,69,41],[70,99,54]],
        6: [[0,54,23.5],[55,69,41.5],[70,99,54.5]]
    },
    'AUTONOMOS NIF': {
        1: [[0,24,55.5],[25,44,61],[45,54,79],[55,59,123],[60,64,153],[65,69,235],[70,99,239]],
        2: [[0,24,56.5],[25,44,63.5],[45,54,83],[55,59,127],[60,64,159],[65,69,238],[70,99,246]],
        3: [[0,24,57],[25,44,64.5],[45,54,84],[55,59,129],[60,64,160],[65,69,240],[70,99,249]],
        4: [[0,24,59],[25,44,65.5],[45,54,86.5],[55,59,134],[60,64,170],[65,69,249],[70,99,261]],
        5: [[0,24,61],[25,44,66.5],[45,54,88.5],[55,59,139],[60,64,175],[65,69,259],[70,99,265]],
        6: [[0,24,61.5],[25,44,68],[45,54,89.5],[55,59,139.5],[60,64,176],[65,69,264],[70,99,275]]
    },
    'SENIORS': {
        1: [[55,59,67.5],[60,64,86],[65,69,103],[70,74,133],[75,79,162],[80,84,170]],
        2: [[55,59,70],[60,64,88],[65,69,105],[70,74,138],[75,79,167],[80,84,175]],
        3: [[55,59,71],[60,64,89.5],[65,69,106],[70,74,140],[75,79,170],[80,84,177]],
        4: [[55,59,72],[60,64,92],[65,69,111],[70,74,145],[75,79,172],[80,84,180]],
        5: [[55,59,72],[60,64,92],[65,69,111],[70,74,145],[75,79,172],[80,84,180]],
        6: [[55,59,74],[60,64,94],[65,69,115],[70,74,150],[75,79,175],[80,84,185]]
    },
    'SENIORS TOTAL': {
        1: [[63,64,101],[65,69,138],[70,74,172],[75,84,231]],
        2: [[63,64,104],[65,69,142],[70,74,176],[75,84,239]],
        3: [[63,64,105],[65,69,144],[70,74,180],[75,84,245]],
        4: [[63,64,107],[65,69,148],[70,74,185],[75,84,252]],
        5: [[63,64,107],[65,69,148],[70,74,185],[75,84,252]],
        6: [[63,64,110],[65,69,152],[70,74,190],[75,84,260]]
    }
};

// Dental Familia precios
const DENTAL_FAMILIA = {
    1: 8.93, 2: 12.75, 3: 17.85, 4: 17.85, 5: 21.25, 6: 21.25
};

// Dental MAX precios (fijo)
const DENTAL_MAX_PRECIOS = {
    1: 10, 2: 10, resto: 5
};

// Mascotas precios
const MASCOTAS_PRECIOS = {
    basica: 5.85,
    completa: 24.74
};

// Tarifas empresa (formato: {edadMinima: precio} por zona)
const TARIFAS_EMPRESA = {
    "NEGOCIO CIF 1-4": {
        SIN_DENTAL: {
            1: {0: 51, 45: 59, 55: 79, 60: 97, 68: 160},
            2: {0: 52, 45: 61.5, 55: 81, 60: 105, 68: 169},
            3: {0: 53, 45: 62, 55: 82, 60: 105.5, 68: 170},
            4: {0: 54, 45: 63.5, 55: 85.5, 60: 109, 68: 179},
            5: {0: 55, 45: 65.5, 55: 90, 60: 112, 68: 185},
            6: {0: 56, 45: 66.5, 55: 91, 60: 113, 68: 186}
        },
        CON_DENTAL: {
            1: {0: 55, 45: 63.5, 55: 80.5, 60: 101.5, 68: 164.5},
            2: {0: 56.5, 45: 66, 55: 85.5, 60: 109.5, 68: 173.5},
            3: {0: 57.5, 45: 66.5, 55: 86.5, 60: 110, 68: 174.5},
            4: {0: 58.5, 45: 68, 55: 90, 60: 113.5, 68: 183.5},
            5: {0: 59.5, 45: 70, 55: 94.5, 60: 116.5, 68: 189.5},
            6: {0: 60.5, 45: 71, 55: 95.5, 60: 117.5, 68: 190.5}
        }
    },
    "NEGOCIO CIF 1-4 EXTRA": {
        SIN_DENTAL: {
            1: {0: 74.5, 45: 76.5, 55: 111, 60: 133, 68: 205},
            2: {0: 76.5, 45: 79.5, 55: 115, 60: 137, 68: 210},
            3: {0: 77.5, 45: 80, 55: 116, 60: 141, 68: 215},
            4: {0: 80, 45: 82, 55: 119, 60: 143, 68: 219},
            5: {0: 81, 45: 84, 55: 122, 60: 147, 68: 230},
            6: {0: 82, 45: 86, 55: 125, 60: 149, 68: 231}
        },
        CON_DENTAL: {
            1: {0: 79, 45: 81, 55: 115.5, 60: 137.5, 68: 209.5},
            2: {0: 81, 45: 84, 55: 119.5, 60: 141.5, 68: 214.5},
            3: {0: 82, 45: 84.5, 55: 120.5, 60: 145.5, 68: 219.5},
            4: {0: 84.5, 45: 86.5, 55: 123.5, 60: 147.5, 68: 223.5},
            5: {0: 85.5, 45: 88.5, 55: 126.5, 60: 151.5, 68: 234.5},
            6: {0: 86.5, 45: 90.5, 55: 129.5, 60: 153.5, 68: 235.5}
        }
    },
    "EMPRESA +5": {
        SIN_DENTAL: {
            1: {0: 56, 66: 89, 68: 168},
            2: {0: 58.5, 66: 92, 68: 175},
            3: {0: 59, 66: 100, 68: 193},
            4: {0: 60, 66: 101, 68: 199},
            5: {0: 61.5, 66: 102, 68: 200},
            6: {0: 62.5, 66: 103, 68: 201}
        },
        CON_DENTAL: {
            1: {0: 60.5, 66: 93.5, 68: 172.5},
            2: {0: 63, 66: 96.5, 68: 179.5},
            3: {0: 63.5, 66: 104.5, 68: 197.5},
            4: {0: 64.5, 66: 105.5, 68: 203.5},
            5: {0: 66, 66: 106.5, 68: 204.5},
            6: {0: 67, 66: 107.5, 68: 205.5}
        }
    },
    "EMPRESA +5 EXTRA": {
        SIN_DENTAL: {
            1: {0: 79, 66: 106, 68: 199},
            2: {0: 81.5, 66: 115, 68: 219},
            3: {0: 82.5, 66: 120, 68: 225},
            4: {0: 85, 66: 120.5, 68: 225.5},
            5: {0: 87, 66: 121, 68: 226},
            6: {0: 88.5, 66: 121.5, 68: 227}
        },
        CON_DENTAL: {
            1: {0: 83.5, 66: 110.5, 68: 203.5},
            2: {0: 86, 66: 119.5, 68: 223.5},
            3: {0: 87, 66: 124.5, 68: 229.5},
            4: {0: 89.5, 66: 125, 68: 230},
            5: {0: 91.5, 66: 125.5, 68: 230.5},
            6: {0: 93, 66: 126, 68: 231.5}
        }
    },
    "PYME TOTAL": {
        SIN_DENTAL: {
            1: {0: 60, 45: 72, 55: 89, 60: 125, 68: 189},
            2: {0: 62, 45: 73, 55: 95, 60: 129, 68: 199},
            3: {0: 63, 45: 75, 55: 98, 60: 135, 68: 205},
            4: {0: 65, 45: 76, 55: 99, 60: 139, 68: 209},
            5: {0: 66, 45: 79, 55: 105, 60: 139, 68: 219},
            6: {0: 67, 45: 80, 55: 110, 60: 145, 68: 225}
        },
        CON_DENTAL: {
            1: {0: 60, 45: 72, 55: 89, 60: 125, 68: 189},
            2: {0: 62, 45: 73, 55: 95, 60: 129, 68: 199},
            3: {0: 63, 45: 75, 55: 98, 60: 135, 68: 205},
            4: {0: 65, 45: 76, 55: 99, 60: 139, 68: 209},
            5: {0: 66, 45: 79, 55: 105, 60: 139, 68: 219},
            6: {0: 67, 45: 80, 55: 110, 60: 145, 68: 225}
        }
    }
};

// Productos con dental incluido (Totales)
const PRODUCTOS_DENTAL_INCLUIDO = ['PLENA TOTAL', 'PLENA VITAL TOTAL', 'SENIORS TOTAL', 'PYME TOTAL'];

// Productos empresa
const PRODUCTOS_EMPRESA = ['NEGOCIO CIF 1-4', 'NEGOCIO CIF 1-4 EXTRA', 'EMPRESA +5', 'EMPRESA +5 EXTRA', 'PYME TOTAL'];

// Productos sin descuentos
const PRODUCTOS_SIN_DESCUENTOS = ['FAMILIAR FUNCIONARIOS', 'COLECTIVO EXTRANJEROS'];

// Productos solo anual
const PRODUCTOS_SOLO_ANUAL = ['COLECTIVO EXTRANJEROS'];

// Productos Go (para puntos)
const PRODUCTOS_GO = ['ADESLAS GO'];

// Productos Asistencia Sanitaria (particulares)
const PRODUCTOS_ASISTENCIA_SANITARIA = ['PLENA VITAL', 'PLENA', 'PLENA PLUS', 'EXTRA 150', 'EXTRA 240', 'EXTRA 1M',
    'PLENA TOTAL', 'PLENA VITAL TOTAL', 'SENIORS', 'SENIORS TOTAL', 'AUTONOMOS NIF', 'AUTONOMOS EXTRA'];

// Reglas de edad (copiadas exactas del original IONOS)
const REGLAS_EDAD = {
    'PLENA VITAL': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'PLENA': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'PLENA PLUS': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'EXTRA 150': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'EXTRA 240': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'EXTRA 1M': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'ADESLAS GO': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'AUTONOMOS NIF': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'AUTONOMOS EXTRA': { min: 0, max: 69, excedeMax: 69, requiereMenores: true },
    'PLENA TOTAL': { min: 0, max: 62, excedeMax: 62, requiereMenores: true },
    'PLENA VITAL TOTAL': { min: 0, max: 62, excedeMax: 62, requiereMenores: true },
    'SENIORS': { min: 55, max: 84, excedeMax: null, requiereMenores: false },
    'SENIORS TOTAL': { min: 63, max: 84, excedeMax: null, requiereMenores: false },
    'NEGOCIO CIF 1-4': { min: 0, max: 67, excedeMax: 67, requiereMenores: true },
    'NEGOCIO CIF 1-4 EXTRA': { min: 0, max: 67, excedeMax: 67, requiereMenores: true },
    'PYME TOTAL': { min: 0, max: 67, excedeMax: 67, requiereMenores: true },
    'EMPRESA +5': { min: 0, max: 67, excedeMax: 67, requiereMenores: true },
    'EMPRESA +5 EXTRA': { min: 0, max: 67, excedeMax: 67, requiereMenores: true },
    'FAMILIAR FUNCIONARIOS': { min: 0, max: 64, excedeMax: 64, requiereMenores: true },
    'COLECTIVO EXTRANJEROS': { min: 0, max: 70, excedeMax: 70, requiereMenores: true }
};

// Configuración de descuentos (copiada exacta del original IONOS)
const CONFIG_DESCUENTOS = {
    'PLENA VITAL': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'PLENA': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'PLENA PLUS': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'EXTRA 150': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'EXTRA 240': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'EXTRA 1M': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'PLENA TOTAL': { tipoCompania: 'total', maxOpcional: 10, reparto: 0.5 },
    'PLENA VITAL TOTAL': { tipoCompania: 'total', maxOpcional: 10, reparto: 0.5 },
    'ADESLAS GO': { tipoCompania: 'go', maxOpcional: 0, reparto: 0 },
    'AUTONOMOS NIF': { tipoCompania: 'ninguno', maxOpcional: 10, reparto: 0.5 },
    'AUTONOMOS EXTRA': { tipoCompania: 'autonomoExtra', maxOpcional: 10, reparto: 0.5 },
    'SENIORS': { tipoCompania: 'plena', maxOpcional: 10, reparto: 0.5 },
    'SENIORS TOTAL': { tipoCompania: 'total', maxOpcional: 10, reparto: 0.5 },
    'NEGOCIO CIF 1-4': { tipoCompania: 'campana10', maxOpcional: 7, reparto: 1 },
    'NEGOCIO CIF 1-4 EXTRA': { tipoCompania: 'campana10', maxOpcional: 7, reparto: 1 },
    'PYME TOTAL': { tipoCompania: 'pymeTotalDto', maxOpcional: 5, reparto: 0 },
    'EMPRESA +5': { tipoCompania: 'campana10', maxOpcional: 12, reparto: 0.3333 },
    'EMPRESA +5 EXTRA': { tipoCompania: 'campana10', maxOpcional: 12, reparto: 0.3333 },
    'FAMILIAR FUNCIONARIOS': { tipoCompania: 'ninguno', maxOpcional: 0, reparto: 0 },
    'COLECTIVO EXTRANJEROS': { tipoCompania: 'ninguno', maxOpcional: 0, reparto: 0 }
};

// Comisiones base por producto (copiadas exactas del original IONOS)
const COMISIONES_BASE = {
    'PLENA VITAL': 0.25, 'PLENA': 0.25, 'PLENA PLUS': 0.25,
    'EXTRA 150': 0.25, 'EXTRA 240': 0.25, 'EXTRA 1M': 0.25,
    'PLENA TOTAL': 0.25, 'PLENA VITAL TOTAL': 0.25,
    'ADESLAS GO': 0.25,
    'AUTONOMOS NIF': 0.25, 'AUTONOMOS EXTRA': 0.25,
    'SENIORS': 0.25, 'SENIORS TOTAL': 0.25,
    'NEGOCIO CIF 1-4': 0.16, 'NEGOCIO CIF 1-4 EXTRA': 0.16,
    'PYME TOTAL': 0.16, 'EMPRESA +5': 0.16, 'EMPRESA +5 EXTRA': 0.16,
    'FAMILIAR FUNCIONARIOS': 0.07, 'COLECTIVO EXTRANJEROS': 0.07
};

// Campana meses gratis (copiada exacta del original IONOS)
const PRODUCTOS_PLURIANUALES = ['PLENA TOTAL', 'PLENA VITAL TOTAL', 'SENIORS TOTAL'];
const PRODUCTOS_ANUALES_CAMPANA = ['PLENA VITAL', 'PLENA', 'PLENA PLUS', 'EXTRA 150', 'EXTRA 240', 'EXTRA 1M', 'SENIORS', 'AUTONOMOS NIF', 'AUTONOMOS EXTRA'];
const PRODUCTOS_SIN_CAMPANA = ['EMPRESA +5', 'EMPRESA +5 EXTRA', 'PYME TOTAL', 'NEGOCIO CIF 1-4', 'NEGOCIO CIF 1-4 EXTRA', 'ADESLAS GO', 'FAMILIAR FUNCIONARIOS', 'COLECTIVO EXTRANJEROS'];

// Dental MAX precios: 10€ los 2 primeros, 5€ el resto
const DENTAL_MAX_PRECIOS_DETALLE = { primeros2: 10, resto: 5 };

// URLs APIs externas Decesos (Google Apps Script)
const DECESOS_API_URL = "https://script.google.com/macros/s/AKfycbzQ2IpHWOMoc3xDSGyfReVvRb0lVhLVp7FS5qetGvgbMDezarZjuLnWO50kx8QFVhUR/exec";
const DECESOS_API_PLUS_URL = "https://script.google.com/macros/s/AKfycbwzeNnmK6R_TK1pKoEgXQPX3Ablo3y_czYHvJI0VdFhZyJMRFGSDPk6-UzQ6ocSa9rG/exec";
const DECESOS_API_COMPLETO_URL = "https://script.google.com/macros/s/AKfycbx8LvVN46xldghYmAfHP0OrDcEbchHDNjedMoDthCyyrTIlx0Ud06aDNONFvinZED2X/exec";

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

// Obtener precio por edad (productos particulares con tramos [min,max,precio])
function obtenerPrecioEdad(producto, zona, edad) {
    if (!TARIFAS[producto] || !TARIFAS[producto][zona]) return null;
    const tramos = TARIFAS[producto][zona];
    for (const tramo of tramos) {
        if (edad >= tramo[0] && edad <= tramo[1]) {
            return tramo[2];
        }
    }
    return null;
}

// Obtener precio empresa (formato {edadMinima: precio})
function obtenerPrecioEmpresa(producto, zona, edad, conDental) {
    if (!TARIFAS_EMPRESA[producto]) return null;
    const tipo = conDental ? 'CON_DENTAL' : 'SIN_DENTAL';
    const tarifas = TARIFAS_EMPRESA[producto][tipo];
    if (!tarifas || !tarifas[zona]) return null;
    const edades = Object.keys(tarifas[zona]).map(Number).sort((a, b) => a - b);
    for (let i = edades.length - 1; i >= 0; i--) {
        if (edad >= edades[i]) return tarifas[zona][edades[i]];
    }
    return tarifas[zona][edades[0]];
}

// Obtener precio unificado (particulares o empresa)
function obtenerPrecio(producto, zona, edad, conDental) {
    if (TARIFAS_EMPRESA[producto]) {
        return obtenerPrecioEmpresa(producto, zona, edad, conDental || false);
    }
    return obtenerPrecioEdad(producto, zona, edad);
}

// Obtener zona desde provincia
function obtenerZonaDesdeProvincia(provincia) {
    return PROVINCIA_A_ZONA[provincia] || 4;
}

// Descuento de compania (automatico por nº asegurados)
function calcularDescuentoCompania(producto, numAseg) {
    const config = CONFIG_DESCUENTOS[producto];
    if (!config) return { pct: 0, texto: '' };
    switch (config.tipoCompania) {
        case 'plena': return numAseg >= 4 ? { pct: 10, texto: '10% (4+ asegurados)' } : { pct: 0, texto: '-' };
        case 'total':
            if (numAseg >= 5) return { pct: 15, texto: '15% (5+ asegurados)' };
            if (numAseg === 4) return { pct: 10, texto: '10% (4 asegurados)' };
            if (numAseg === 3) return { pct: 5, texto: '5% (3 asegurados)' };
            return { pct: 0, texto: '-' };
        case 'go': return numAseg >= 2 ? { pct: 10, texto: '10% (2+ asegurados)' } : { pct: 0, texto: '-' };
        case 'autonomoExtra': return numAseg >= 3 ? { pct: 10, texto: '10% (3+ asegurados)' } : { pct: 0, texto: '-' };
        case 'campana10': return { pct: 10, texto: '10% Campaña' };
        case 'pymeTotalDto': return { pct: 10, texto: '10% Campaña' };
        default: return { pct: 0, texto: '-' };
    }
}

// Comision del agente
function calcularComision(producto, primaAnual, dtoOpcional, dtoDentalMax) {
    const comisionBase = COMISIONES_BASE[producto] || 0.15;
    const config = CONFIG_DESCUENTOS[producto];
    const reparto = config ? config.reparto : 0;
    let comision = primaAnual * comisionBase;
    if (dtoOpcional > 0 && reparto > 0) {
        comision -= primaAnual * (dtoOpcional / 100) * reparto;
    }
    if (dtoDentalMax > 0) {
        comision -= primaAnual * (dtoDentalMax / 100);
    }
    return Math.max(0, comision);
}

// Meses gratis de campana
function calcularMesesGratis(producto, numAsegurados, dental) {
    if (numAsegurados === 0 || PRODUCTOS_SIN_CAMPANA.includes(producto)) {
        return { meses: 0, mesesIngreso: [], mesesTexto: '', tieneBonus: false };
    }
    let meses = 0, mesesIngreso = [], tieneBonus = false;
    if (PRODUCTOS_PLURIANUALES.includes(producto)) {
        if (numAsegurados >= 2) { meses = 3; mesesIngreso = [6, 9, 15]; }
        else { meses = 2; mesesIngreso = [6, 9]; }
    } else if (PRODUCTOS_ANUALES_CAMPANA.includes(producto)) {
        if (numAsegurados >= 2) { meses = 2; mesesIngreso = [6, 15]; }
        else { meses = 1; mesesIngreso = [6]; }
        if (dental === 'FAMILIA' || dental === 'MAX') {
            meses += 1; mesesIngreso.push(9); mesesIngreso.sort((a, b) => a - b); tieneBonus = true;
        }
    }
    return { meses, mesesIngreso, mesesTexto: mesesIngreso.length > 0 ? `meses ${mesesIngreso.join(', ')}` : '', tieneBonus };
}

// Precio Dental MAX (10€ los 2 primeros, 5€ el resto)
function precioDentalMax(numAsegurados) {
    if (numAsegurados <= 0) return 0;
    if (numAsegurados === 1) return 10;
    if (numAsegurados === 2) return 20;
    return 20 + (numAsegurados - 2) * 5;
}

// Validar edades contra reglas del producto
function validarEdades(producto, edades) {
    if (!producto || edades.length === 0) return { valido: true };
    const regla = REGLAS_EDAD[producto];
    if (!regla) return { valido: true };
    const menoresDe60 = edades.filter(e => e < 60).length;
    const fueraDeRango = edades.filter(e => e < regla.min || e > regla.max);
    const excedenMax = regla.excedeMax !== null ? edades.filter(e => e > regla.excedeMax) : [];
    if (fueraDeRango.length > 0) return { valido: false };
    if (regla.requiereMenores && excedenMax.length > 0 && menoresDe60 < 3) return { valido: false };
    return { valido: true };
}

// Validar DNI español
function validarDNI(dni) {
    if (!dni) return true;
    const dniRegex = /^[0-9]{8}[A-Za-z]$/;
    if (!dniRegex.test(dni)) return false;
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    return letras[parseInt(dni.substring(0, 8), 10) % 23] === dni.charAt(8).toUpperCase();
}

// Validar NIE español
function validarNIE(nie) {
    if (!nie) return true;
    if (!/^[XYZ][0-9]{7}[A-Za-z]$/i.test(nie)) return false;
    let n = nie.toUpperCase().replace('X', '0').replace('Y', '1').replace('Z', '2');
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    return letras[parseInt(n.substring(0, 8), 10) % 23] === nie.charAt(8).toUpperCase();
}

// Validar DNI o NIE
function validarDocumento(doc) {
    if (!doc) return { valido: true, mensaje: '' };
    doc = doc.trim().toUpperCase();
    if (/^[0-9]/.test(doc)) return validarDNI(doc) ? { valido: true, mensaje: '' } : { valido: false, mensaje: 'DNI incorrecto' };
    if (/^[XYZ]/i.test(doc)) return validarNIE(doc) ? { valido: true, mensaje: '' } : { valido: false, mensaje: 'NIE incorrecto' };
    return { valido: false, mensaje: 'Formato no válido' };
}

// Validar IBAN español
function validarIBAN(iban) {
    if (!iban) return { valido: true, mensaje: '' };
    iban = iban.replace(/\s/g, '').toUpperCase();
    if (!/^ES[0-9]{22}$/.test(iban)) return { valido: false, mensaje: 'IBAN: ES + 22 dígitos' };
    const reord = iban.substring(4) + iban.substring(0, 4);
    let num = '';
    for (let ch of reord) num += (ch >= 'A' && ch <= 'Z') ? (ch.charCodeAt(0) - 55).toString() : ch;
    let resto = 0;
    for (let i = 0; i < num.length; i++) resto = (resto * 10 + parseInt(num[i])) % 97;
    return resto === 1 ? { valido: true, mensaje: '' } : { valido: false, mensaje: 'IBAN incorrecto' };
}
