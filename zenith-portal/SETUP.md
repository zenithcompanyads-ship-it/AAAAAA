# ZENITH Portal — Setup Completo

## Estrutura de arquivos
```
zenith-portal/
├── admin/
│   └── index.html        ← Seu painel admin (só você acessa)
├── portal/
│   └── index.html        ← Portal do cliente (login + relatório)
├── shared/
│   └── supabase.js       ← Config do Supabase (edite com suas keys)
└── SETUP.md              ← Este arquivo
```

---

## 1. Criar conta no Supabase (gratuito)

1. Acesse https://supabase.com e crie uma conta
2. Clique em **New Project**
3. Dê um nome (ex: `zenith-portal`) e crie uma senha forte
4. Aguarde o projeto ser criado (~1 min)

---

## 2. Criar as tabelas no Supabase

Acesse **SQL Editor** no painel do Supabase e cole este SQL:

```sql
-- Tabela de clientes
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instagram TEXT,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_letter TEXT DEFAULT 'C',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de dados de campanha (cada upload de CSV vira linhas aqui)
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  period TEXT NOT NULL,           -- 'mes' ou 'semana'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  campaign_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  results INTEGER DEFAULT 0,
  result_type TEXT,
  cost_per_result NUMERIC(10,4) DEFAULT 0,
  budget NUMERIC(10,2) DEFAULT 0,
  budget_type TEXT,
  amount_spent NUMERIC(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS para simplicidade (autenticação é feita no frontend)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;

-- Inserir admin padrão (TROQUE a senha depois)
-- A senha é armazenada como texto simples por simplicidade
-- Em produção real, use bcrypt no backend

-- Inserir cliente de exemplo (Dra. Leila)
INSERT INTO clients (name, instagram, login, password_hash, avatar_letter)
VALUES ('Dra. Leila Aqel', '@draleilaaqel', 'draleila', 'zenith2026', 'L');
```

---

## 3. Pegar as credenciais do Supabase

No painel do Supabase:
1. Vá em **Project Settings → API**
2. Copie a **Project URL** (ex: `https://xxxxx.supabase.co`)
3. Copie a **anon public key**

---

## 4. Configurar o arquivo shared/supabase.js

Abra `shared/supabase.js` e substitua:
```js
const SUPABASE_URL = 'COLE_SUA_URL_AQUI'
const SUPABASE_KEY = 'COLE_SUA_ANON_KEY_AQUI'
```

---

## 5. Hospedar os arquivos

### Opção A — Vercel (recomendado, gratuito)
1. Instale o Vercel CLI: `npm i -g vercel`
2. Na pasta `zenith-portal/`: `vercel`
3. Pronto! Você terá URLs como:
   - `seuapp.vercel.app/admin/` → seu painel
   - `seuapp.vercel.app/portal/` → portal do cliente

### Opção B — Netlify
1. Arraste a pasta `zenith-portal/` para https://app.netlify.com/drop
2. Pronto!

### Opção C — Qualquer hospedagem compartilhada
Suba os arquivos por FTP normalmente.

---

## 6. Login Admin padrão
- **URL:** `/admin/`
- **Usuário:** `admin`
- **Senha:** `zenith@admin2026`

⚠️ Troque a senha admin no arquivo `admin/index.html` antes de publicar!

---

## Fluxo de uso

1. Você acessa `/admin/` com seu login
2. Cadastra um novo cliente (nome, instagram, login, senha)
3. Faz upload dos 2 CSVs (mês e semana)
4. O sistema processa e salva no Supabase
5. O cliente acessa `/portal/` com o login/senha que você definiu
6. Ele vê o relatório completo com os dados do CSV dele
