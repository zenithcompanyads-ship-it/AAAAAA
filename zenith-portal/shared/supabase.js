// ============================================================
//  ZENITH Portal — Configuração Supabase
//  Edite com suas credenciais do painel do Supabase
// ============================================================

const SUPABASE_URL = 'https://japfmxcdaefnjhjcxdvo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcGZteGNkYWVmbmpoamN4ZHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTczMDQsImV4cCI6MjA5MDAzMzMwNH0.LQ8JS_s5PFCbFwexo-dVrW3mStG4wG-B48Z0gobr8HM'

// Cliente Supabase (usando a lib via CDN, carregada nas páginas HTML)
function getSupabase() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
}

// ─── Clientes ───────────────────────────────────────────────

async function getClientByLogin(login, password) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('login', login.toLowerCase().trim())
    .eq('password_hash', password.trim())
    .eq('active', true)
    .single()
  if (error) return null
  return data
}

async function getAllClients() {
  const sb = getSupabase()
  const { data } = await sb
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

async function createClient(payload) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('clients')
    .insert([payload])
    .select()
    .single()
  return { data, error }
}

async function updateClient(id, payload) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

async function deleteClient(id) {
  const sb = getSupabase()
  const { error } = await sb.from('clients').delete().eq('id', id)
  return { error }
}

// ─── Campanhas ──────────────────────────────────────────────

async function getCampaignsByClient(clientId) {
  const sb = getSupabase()
  const { data } = await sb
    .from('campaigns')
    .select('*')
    .eq('client_id', clientId)
    .order('start_date', { ascending: false })
  return data || []
}

async function deleteCampaignsByClientAndPeriod(clientId, period) {
  const sb = getSupabase()
  const { error } = await sb
    .from('campaigns')
    .delete()
    .eq('client_id', clientId)
    .eq('period', period)
  return { error }
}

async function insertCampaigns(rows) {
  const sb = getSupabase()
  const { data, error } = await sb.from('campaigns').insert(rows).select()
  return { data, error }
}

// ─── Parse CSV Meta Ads ─────────────────────────────────────

function parseMetaCSV(csvText, clientId, period) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  // Remove BOM e aspas dos headers
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Split respeitando aspas
    const cols = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue }
      current += ch
    }
    cols.push(current.trim())

    const get = (key) => {
      const idx = headers.findIndex(h => h === key)
      return idx >= 0 ? (cols[idx] || '').replace(/"/g, '').trim() : ''
    }

    const startDate = get('Início dos relatórios')
    const endDate   = get('Término dos relatórios')
    if (!startDate) continue

    rows.push({
      client_id:        clientId,
      period:           period,
      start_date:       startDate,
      end_date:         endDate,
      campaign_name:    get('Nome da campanha'),
      status:           get('Veiculação da campanha') || 'active',
      results:          parseInt(get('Resultados')) || 0,
      result_type:      get('Indicador de resultados'),
      cost_per_result:  parseFloat(get('Custo por resultados')) || 0,
      budget:           parseFloat(get('Orçamento do conjunto de anúncios')) || 0,
      budget_type:      get('Tipo de orçamento do conjunto de anúncios'),
      amount_spent:     parseFloat(get('Valor usado (BRL)')) || 0,
      impressions:      parseInt(get('Impressões')) || 0,
      reach:            parseInt(get('Alcance')) || 0,
    })
  }
  return rows
}

// ─── Helpers ────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

function fmtBRL(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
