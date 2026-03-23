-- Migración: tabla tareas para actividades pendientes
-- Fecha: 2026-03-23

CREATE TABLE IF NOT EXISTS tareas (
  id                    SERIAL PRIMARY KEY,
  persona_id            INTEGER REFERENCES personas(id),
  deal_id               INTEGER REFERENCES deals(id),
  agente_id             INTEGER REFERENCES users(id),
  tipo                  VARCHAR(30),
  titulo                VARCHAR(255),
  descripcion           TEXT,
  fecha_venc            TIMESTAMP,
  hora_venc             TIME,
  estado                VARCHAR(20) DEFAULT 'pendiente',
  pipedrive_activity_id INTEGER,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tareas_agente ON tareas(agente_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha ON tareas(fecha_venc);
CREATE INDEX IF NOT EXISTS idx_tareas_pd_act ON tareas(pipedrive_activity_id);
