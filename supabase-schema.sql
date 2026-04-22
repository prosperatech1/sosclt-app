--- supabase-schema.sql (原始)


+++ supabase-schema.sql (修改后)
-- =====================================================
-- BANCO DE DADOS SUPABASE - SOSCLT
-- =====================================================
-- [⚠️ ATENÇÃO] Execute este SQL no Dashboard do Supabase
-- para criar as tabelas necessárias.
-- =====================================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: users (usuários do app)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    whatsapp_contact VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por WhatsApp
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_contact);

-- Comentários da tabela
COMMENT ON TABLE users IS 'Usuários cadastrados no app SOSCLT';
COMMENT ON COLUMN users.id IS 'ID único do usuário';
COMMENT ON COLUMN users.name IS 'Nome completo do usuário';
COMMENT ON COLUMN users.whatsapp_contact IS 'Número do WhatsApp para contato de emergência (ex: 5511999999999)';
COMMENT ON COLUMN users.email IS 'Email opcional do usuário';

-- =====================================================
-- TABELA: sos_records (gravações de emergência)
-- =====================================================
CREATE TABLE IF NOT EXISTS sos_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_path TEXT,
    duration NUMERIC(10, 2) NOT NULL, -- duração em segundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_via_whatsapp BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_sos_records_user_id ON sos_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_records_created_at ON sos_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_records_sent ON sos_records(sent_via_whatsapp);

-- Comentários da tabela
COMMENT ON TABLE sos_records IS 'Registros de gravações de emergência SOS';
COMMENT ON COLUMN sos_records.id IS 'ID único da gravação';
COMMENT ON COLUMN sos_records.user_id IS 'Referência ao usuário que fez a gravação';
COMMENT ON COLUMN sos_records.file_url IS 'URL pública do arquivo de áudio no Supabase Storage';
COMMENT ON COLUMN sos_records.file_path IS 'Caminho interno do arquivo no bucket';
COMMENT ON COLUMN sos_records.duration IS 'Duração da gravação em segundos';
COMMENT ON COLUMN sos_records.sent_via_whatsapp IS 'Indica se a gravação foi enviada via WhatsApp';
COMMENT ON COLUMN sos_records.metadata IS 'Metadados adicionais em formato JSON';

-- =====================================================
-- TABELA: recording_sessions (sessões ativas de gravação)
-- =====================================================
CREATE TABLE IF NOT EXISTS recording_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
    device_info JSONB
);

-- Índice para sessões ativas
CREATE INDEX IF NOT EXISTS idx_recording_sessions_active ON recording_sessions(status, user_id) WHERE status = 'active';

-- =====================================================
-- STORAGE BUCKET: sos-recordings
-- =====================================================
-- [⚠️ ATENÇÃO] Criar bucket manualmente no Dashboard do Supabase:
-- 1. Ir em Storage > New Bucket
-- 2. Nome: sos-recordings
-- 3. Public: true (para URLs públicas)
-- 4. File size limit: 50MB (ajuste conforme necessário)

-- Políticas de segurança (RLS) para o bucket
-- [⚠️ ATENÇÃO] Ajuste conforme sua política de acesso

-- Permitir upload autenticado
CREATE POLICY "Users can upload recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sos-recordings');

-- Permitir leitura pública (para compartilhar via WhatsApp)
CREATE POLICY "Recordings are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'sos-recordings');

-- Permitir delete apenas pelo dono
CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'sos-recordings');

-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Contador de gravações por usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_sos_count(p_user_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM sos_records WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- VIEW: Estatísticas de uso
-- =====================================================
CREATE OR REPLACE VIEW sos_stats AS
SELECT
    u.id as user_id,
    u.name as user_name,
    COUNT(sr.id) as total_recordings,
    COALESCE(SUM(sr.duration), 0) as total_duration_seconds,
    COALESCE(SUM(CASE WHEN sr.sent_via_whatsapp THEN 1 ELSE 0 END), 0) as sent_via_whatsapp_count,
    MIN(sr.created_at) as first_recording,
    MAX(sr.created_at) as last_recording
FROM users u
LEFT JOIN sos_records sr ON u.id = sr.user_id
GROUP BY u.id, u.name;

-- =====================================================
-- DADOS INICIAIS (opcional)
-- =====================================================
-- Inserir usuário de teste (remover em produção)
-- INSERT INTO users (id, name, whatsapp_contact, email) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'João Silva', '5511999999999', 'joao@teste.com');

-- =====================================================
-- PERMISSÕES RLS (Row Level Security)
-- =====================================================
-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_records ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus dados
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view their own recordings"
ON sos_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
ON sos_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
