-- Migracion: Power Dialer — campanas, contactos, sesiones
-- Fecha: 2026-04-03

-- Campanas de llamadas
CREATE TABLE IF NOT EXISTS campanas (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL DEFAULT 1,
  nombre           VARCHAR(255) NOT NULL,
  descripcion      TEXT,
  tipo             VARCHAR(50) DEFAULT 'manual',
  estado           VARCHAR(50) DEFAULT 'activa',
  pipeline_id      INTEGER REFERENCES pipelines(id),
  stage_id         INTEGER REFERENCES pipeline_stages(id),
  prioridad        INTEGER DEFAULT 3,
  hora_inicio      TIME DEFAULT '09:00',
  hora_fin         TIME DEFAULT '21:00',
  dias_semana      VARCHAR(20) DEFAULT '1,2,3,4,5',
  max_intentos     INTEGER DEFAULT 3,
  minutos_entre_intentos INTEGER DEFAULT 60,
  whatsapp_si_no_contesta BOOLEAN DEFAULT true,
  whatsapp_template_id    VARCHAR(255),
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanas_tenant ON campanas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campanas_estado ON campanas(estado);

-- Agentes asignados a campana
CREATE TABLE IF NOT EXISTS campana_agentes (
  id               SERIAL PRIMARY KEY,
  campana_id       INTEGER NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  max_llamadas_dia INTEGER DEFAULT 100,
  activa           BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(campana_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_campana_agentes_campana ON campana_agentes(campana_id);
CREATE INDEX IF NOT EXISTS idx_campana_agentes_user ON campana_agentes(user_id);

-- Contactos en campana
CREATE TABLE IF NOT EXISTS campana_contactos (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL DEFAULT 1,
  campana_id       INTEGER NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
  persona_id       INTEGER NOT NULL REFERENCES personas(id),
  deal_id          INTEGER REFERENCES deals(id),
  user_id          INTEGER REFERENCES users(id),
  estado           VARCHAR(50) DEFAULT 'pendiente',
  prioridad        INTEGER DEFAULT 3,
  intentos         INTEGER DEFAULT 0,
  proximo_intento  TIMESTAMP,
  ultimo_intento   TIMESTAMP,
  resultado_ultimo TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campana_contactos_campana ON campana_contactos(campana_id);
CREATE INDEX IF NOT EXISTS idx_campana_contactos_user ON campana_contactos(user_id);
CREATE INDEX IF NOT EXISTS idx_campana_contactos_estado ON campana_contactos(estado);
CREATE INDEX IF NOT EXISTS idx_campana_contactos_prioridad ON campana_contactos(prioridad, proximo_intento);
CREATE INDEX IF NOT EXISTS idx_campana_contactos_persona ON campana_contactos(persona_id);

-- Sesiones de dialer por agente
CREATE TABLE IF NOT EXISTS dialer_sesiones (
  id                     SERIAL PRIMARY KEY,
  tenant_id              INTEGER NOT NULL DEFAULT 1,
  user_id                INTEGER NOT NULL REFERENCES users(id),
  inicio                 TIMESTAMP DEFAULT NOW(),
  fin                    TIMESTAMP,
  llamadas_realizadas    INTEGER DEFAULT 0,
  llamadas_contestadas   INTEGER DEFAULT 0,
  created_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialer_sesiones_user ON dialer_sesiones(user_id);
CREATE INDEX IF NOT EXISTS idx_dialer_sesiones_activa ON dialer_sesiones(user_id, fin) WHERE fin IS NULL;
