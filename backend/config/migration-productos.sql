-- Migracion: Catalogo de productos — companias, categorias, productos, documentos
-- Fecha: 2026-04-05
-- REGLA 17: todo por ID dinamico, nunca hardcodear nombres

-- Companias aseguradoras
CREATE TABLE IF NOT EXISTS companias (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL DEFAULT 1,
  nombre         VARCHAR(255) NOT NULL,
  nombre_corto   VARCHAR(50),
  logo_url       TEXT,
  color          VARCHAR(7) DEFAULT '#009DDD',
  activa         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companias_tenant ON companias(tenant_id);

-- Categorias de productos por compania
CREATE TABLE IF NOT EXISTS categorias_producto (
  id             SERIAL PRIMARY KEY,
  compania_id    INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  nombre         VARCHAR(255) NOT NULL,
  descripcion    TEXT,
  icono          VARCHAR(50),
  activa         BOOLEAN DEFAULT true,
  orden          INTEGER DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_prod_compania ON categorias_producto(compania_id);

-- Productos especificos
CREATE TABLE IF NOT EXISTS productos (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL DEFAULT 1,
  compania_id         INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  categoria_id        INTEGER REFERENCES categorias_producto(id) ON DELETE SET NULL,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  resumen_coberturas  TEXT,
  comision_tipo       VARCHAR(20),
  comision_valor      DECIMAL(10,2),
  puntos_base         INTEGER DEFAULT 0,
  precio_base         DECIMAL(10,2),
  activo              BOOLEAN DEFAULT true,
  orden               INTEGER DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_tenant ON productos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_productos_compania ON productos(compania_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);

-- Documentos por categoria (aplican a todos los productos de esa categoria)
CREATE TABLE IF NOT EXISTS categoria_documentos (
  id               SERIAL PRIMARY KEY,
  categoria_id     INTEGER NOT NULL REFERENCES categorias_producto(id) ON DELETE CASCADE,
  nombre           VARCHAR(255) NOT NULL,
  descripcion      TEXT,
  archivo_url      TEXT NOT NULL,
  tipo             VARCHAR(50),
  vigente_desde    DATE,
  vigente_hasta    DATE,
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_docs_categoria ON categoria_documentos(categoria_id);

-- Documentos por producto especifico
CREATE TABLE IF NOT EXISTS producto_documentos (
  id               SERIAL PRIMARY KEY,
  producto_id      INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre           VARCHAR(255) NOT NULL,
  descripcion      TEXT,
  archivo_url      TEXT NOT NULL,
  tipo             VARCHAR(50),
  vigente_desde    DATE,
  vigente_hasta    DATE,
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_docs_producto ON producto_documentos(producto_id);

-- Asignacion agentes a companias
CREATE TABLE IF NOT EXISTS compania_agentes (
  id             SERIAL PRIMARY KEY,
  compania_id    INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  activa         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(compania_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_agentes_user ON compania_agentes(user_id);

-- Campanas de puntos por compania
CREATE TABLE IF NOT EXISTS campanas_puntos (
  id             SERIAL PRIMARY KEY,
  compania_id    INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  nombre         VARCHAR(255) NOT NULL,
  descripcion    TEXT,
  fecha_inicio   DATE,
  fecha_fin      DATE,
  activa         BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_camp_puntos_compania ON campanas_puntos(compania_id);

-- Puntos por producto en campana + bonificaciones por combinacion
CREATE TABLE IF NOT EXISTS campana_producto_puntos (
  id                     SERIAL PRIMARY KEY,
  campana_id             INTEGER NOT NULL REFERENCES campanas_puntos(id) ON DELETE CASCADE,
  producto_id            INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  puntos                 INTEGER DEFAULT 0,
  bonus_combinacion      INTEGER DEFAULT 0,
  productos_combinacion  INTEGER[] DEFAULT '{}',
  created_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_camp_prod_puntos_campana ON campana_producto_puntos(campana_id);

-- Configuracion del dialer por tenant
CREATE TABLE IF NOT EXISTS dialer_config (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   INTEGER NOT NULL DEFAULT 1 UNIQUE,
  countdown_activo            BOOLEAN DEFAULT false,
  countdown_segundos          INTEGER DEFAULT 10,
  whatsapp_auto_no_contesta   BOOLEAN DEFAULT true,
  max_intentos_dia            INTEGER DEFAULT 3,
  horario_inicio              TIME DEFAULT '09:00',
  horario_fin                 TIME DEFAULT '21:00',
  created_at                  TIMESTAMP DEFAULT NOW()
);

-- Rapeles por compania (tramos de produccion)
CREATE TABLE IF NOT EXISTS rapeles (
  id               SERIAL PRIMARY KEY,
  compania_id      INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  nombre           VARCHAR(255) NOT NULL,
  descripcion      TEXT,
  tipo             VARCHAR(50) NOT NULL DEFAULT 'produccion',
  periodicidad     VARCHAR(20) NOT NULL DEFAULT 'trimestral',
  fecha_inicio     DATE,
  fecha_fin        DATE,
  tramos           JSONB DEFAULT '[]',
  activo           BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rapeles_compania ON rapeles(compania_id);

-- Precio flexible en productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_tipo VARCHAR(20) DEFAULT 'fijo';

-- Argumentario de venta generado por IA
ALTER TABLE productos ADD COLUMN IF NOT EXISTS argumentario_venta TEXT;
