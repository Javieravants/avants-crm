-- Migración: tablas contactos y pólizas (Adeslas Ventas)
-- Fecha: 24/03/2026

CREATE TABLE IF NOT EXISTS contactos (
  id             SERIAL PRIMARY KEY,
  dni            TEXT UNIQUE,
  nombre         TEXT NOT NULL,
  telefono       TEXT,
  email          TEXT,
  agente_nombre  TEXT,
  agente_id      INT,
  estado_cliente TEXT DEFAULT 'activo',
  origen_lead    TEXT,
  creado_en      TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS polizas (
  id               SERIAL PRIMARY KEY,
  numero           TEXT UNIQUE NOT NULL,
  contacto_id      INT REFERENCES contactos(id),
  agente_nombre    TEXT,
  producto         TEXT,
  fecha_grabacion  DATE,
  fecha_efecto     DATE,
  forma_pago       TEXT,
  num_solicitud    TEXT,
  num_asegurados   INT,
  prima_anual      NUMERIC(12,2),
  beneficio        NUMERIC(12,2),
  recibo_emitido   NUMERIC(12,2),
  descuento        TEXT,
  campana          TEXT,
  carencias        TEXT,
  notas            TEXT,
  origen_lead      TEXT,
  mes_alta         TEXT,
  estado           TEXT DEFAULT 'activa',
  activa           BOOLEAN DEFAULT true,
  creado_en        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polizas_contacto ON polizas(contacto_id);
CREATE INDEX IF NOT EXISTS idx_polizas_numero ON polizas(numero);
CREATE INDEX IF NOT EXISTS idx_polizas_activa_producto ON polizas(activa, producto);
CREATE INDEX IF NOT EXISTS idx_contactos_dni ON contactos(dni);
