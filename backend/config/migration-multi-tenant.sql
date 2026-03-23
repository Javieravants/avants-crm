-- Migración: arquitectura multi-tenant
-- Fecha: 2026-03-23

-- Tabla de tenants
CREATE TABLE IF NOT EXISTS tenants (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE,
  plan          VARCHAR(30) DEFAULT 'pro',
  activo        BOOLEAN DEFAULT true,
  max_usuarios  INTEGER DEFAULT 20,
  max_contactos INTEGER DEFAULT 200000,
  pipedrive_token TEXT,
  cloudtalk_key   TEXT,
  cloudtalk_secret TEXT,
  logo_url        TEXT,
  color_primario  VARCHAR(7) DEFAULT '#009DDD',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Insertar tenant actual como #1
INSERT INTO tenants (id, nombre, slug, plan)
VALUES (1, 'Telegestion de Seguros y Soluciones Avants SL', 'avants', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Añadir tenant_id a tablas principales (DEFAULT 1 para datos existentes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE contact_history ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE persona_notas ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);
ALTER TABLE persona_documentos ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1 REFERENCES tenants(id);

-- Índices para rendimiento multi-tenant
CREATE INDEX IF NOT EXISTS idx_personas_tenant ON personas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_history_tenant ON contact_history(tenant_id);

-- Actualizar CHECK constraint de roles para incluir superadmin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rol_check;
ALTER TABLE users ADD CONSTRAINT users_rol_check CHECK (rol IN ('superadmin', 'admin', 'supervisor', 'agent'));

-- Rol superadmin para Javier
UPDATE users SET rol = 'superadmin' WHERE email = 'javier@segurosdesaludonline.es';
