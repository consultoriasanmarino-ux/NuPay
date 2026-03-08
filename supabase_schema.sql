-- Tabuleiro de Tabelas Nu-Pay CRM

-- 1. Tabela de Perfis (Extensão do Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'ligador')) DEFAULT 'ligador',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Leads
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT CHECK (status IN ('incompleto', 'processando', 'concluido', 'atribuido', 'arquivado')) DEFAULT 'incompleto',
  cpf TEXT UNIQUE NOT NULL,
  full_name TEXT,
  birth_date DATE,
  age INTEGER,
  phones JSONB DEFAULT '[]',
  score INTEGER,
  income DECIMAL(12,2),
  state TEXT,
  city TEXT,
  num_gov TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Admins podem ver todos os perfis" 
ON profiles FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Políticas para Leads
CREATE POLICY "Admins tem acesso total aos leads" 
ON leads FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Ligadores veem apenas seus próprios leads" 
ON leads FOR SELECT 
USING (owner_id = auth.uid());

-- Triggers para calcular idade e atualizar timestamp
CREATE OR REPLACE FUNCTION calculate_age() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL THEN
    NEW.age := date_part('year', age(NEW.birth_date));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_calculate_age
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION calculate_age();
