-- ========================================================
-- SetGear (CineCore 95) - Supabase SQL Schema
-- ========================================================

-- 1. Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Proprietários / Locadoras
CREATE TABLE IF NOT EXISTS proprietarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL
);

-- 3. Perfis de Usuários (Multi-usuário & Roles: admin, operador, visualizador)
CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    cargo VARCHAR(50) DEFAULT 'operador', -- 'admin', 'operador', 'visualizador'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela Master de Equipamentos (Suporte a Malas e Containers Inteligentes)
CREATE TABLE IF NOT EXISTS equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    proprietario_id UUID REFERENCES proprietarios(id) ON DELETE SET NULL,
    qr_code_id VARCHAR(100) UNIQUE NOT NULL,
    e_container BOOLEAN DEFAULT FALSE,
    container_pai_id UUID REFERENCES equipamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Relacionamento de Kits (Componentes e Acessórios Vincular)
CREATE TABLE IF NOT EXISTS kit_componentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipamento_pai_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
    equipamento_filho_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
    quantidade INT DEFAULT 1
);

-- 6. Projetos e Membros da Equipe de Filmagem
CREATE TABLE IF NOT EXISTS projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projeto_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
    funcao_no_set VARCHAR(100) -- ex: '1º Assistente de Câmera', 'Gaffer', 'Estafa'
);

-- 7. Diárias e Instâncias de Status dos Itens
CREATE TABLE IF NOT EXISTS diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
    data_diaria DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planejada', -- 'planejada', 'em_andamento', 'finalizada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diaria_itens_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diaria_id UUID REFERENCES diarias(id) ON DELETE CASCADE,
    equipamento_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
    status_carga VARCHAR(50) DEFAULT 'nao_requer', -- 'nao_requer', 'pendente', 'carregando', '100_porcento'
    status_locacao VARCHAR(50) DEFAULT 'pendente_base', -- 'pendente_base', 'no_carro_ida', 'no_set', 'pendente_wrap', 'no_carro_volta'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(diaria_id, equipamento_id)
);

-- Dados de Exemplo para Teste Inicial
INSERT INTO categorias (nome) VALUES 
('Câmeras & Corpos'), ('Lentes & Cine Primes'), ('Baterias & Energia'), ('Suportes & Grips'), ('Containers & Cases')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO proprietarios (nome) VALUES 
('Locadora CineRent SP'), ('Equipamento Próprio (Gaffer)'), ('Produtora CineCore')
ON CONFLICT DO NOTHING;
