-- Criar tabelas PostgreSQL
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  company VARCHAR(255),
  cnpj VARCHAR(18),
  region VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  address TEXT,
  observations TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commissions DECIMAL(10,2) DEFAULT 0,
  admin_fee_rate DECIMAL(5,2) DEFAULT 5.00,
  access_enabled BOOLEAN DEFAULT FALSE,
  dashboard_token VARCHAR(255) UNIQUE,
  last_access TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  access_log TEXT DEFAULT '[]',
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_document VARCHAR(20),
  type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  description TEXT,
  terms TEXT,
  content TEXT,
  template_type VARCHAR(50) DEFAULT 'default',
  signature_link TEXT,
  link_token VARCHAR(255),
  link_expires_at TIMESTAMP,
  client_signature TEXT,
  client_ip_address VARCHAR(45),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  authorization_term_signed BOOLEAN DEFAULT FALSE,
  authorization_signed_at TIMESTAMP,
  authorization_signer_ip VARCHAR(45),
  authorization_signature TEXT,
  contract_signature TEXT,
  partner_id INTEGER,
  partner_commission DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14) NOT NULL,
  company VARCHAR(255),
  document VARCHAR(20),
  address TEXT,
  zip_code VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(2),
  asaas_customer_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'lead',
  value DECIMAL(10,2) DEFAULT 0,
  partner_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  customer_id INTEGER,
  value DECIMAL(10,2) NOT NULL,
  stage VARCHAR(50) NOT NULL DEFAULT 'prospecting',
  probability INTEGER DEFAULT 10,
  expected_close_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(10,2),
  related_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  asaas_id VARCHAR(255) UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_document VARCHAR(20) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  billing_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_code TEXT,
  is_simulation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id SERIAL PRIMARY KEY,
  insights TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  data_expedicao_rg VARCHAR(20) NOT NULL,
  titulo_eleitor VARCHAR(20) NOT NULL,
  nome_pai VARCHAR(255) NOT NULL,
  nome_mae VARCHAR(255) NOT NULL,
  estado_civil VARCHAR(50) NOT NULL,
  estado_rg VARCHAR(2) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  endereco TEXT NOT NULL,
  numero VARCHAR(10) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  telefone_residencial VARCHAR(20),
  celular VARCHAR(20) NOT NULL,
  grau_instrucao VARCHAR(100) NOT NULL,
  renda_familiar VARCHAR(100) NOT NULL,
  bancos_vinculo TEXT NOT NULL,
  placa_veiculo VARCHAR(10),
  ano_veiculo VARCHAR(4),
  referencia_1_nome VARCHAR(255) NOT NULL,
  referencia_1_telefone VARCHAR(20) NOT NULL,
  referencia_1_parentesco VARCHAR(50) NOT NULL,
  referencia_2_nome VARCHAR(255) NOT NULL,
  referencia_2_telefone VARCHAR(20) NOT NULL,
  referencia_2_parentesco VARCHAR(50) NOT NULL,
  referencia_3_nome VARCHAR(255) NOT NULL,
  referencia_3_telefone VARCHAR(20) NOT NULL,
  referencia_3_parentesco VARCHAR(50) NOT NULL,
  empresa_trabalha VARCHAR(255) NOT NULL,
  data_admissao VARCHAR(20) NOT NULL,
  renda VARCHAR(100) NOT NULL,
  ocupacao VARCHAR(100) NOT NULL,
  senha_serasa VARCHAR(255) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authorization_terms (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_document VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  signature_link TEXT,
  link_token VARCHAR(255),
  link_expires_at TIMESTAMP,
  client_signature TEXT,
  client_ip_address VARCHAR(45),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  partner_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP
);