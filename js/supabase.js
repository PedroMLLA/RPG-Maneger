// Conexão com o Supabase (o servidor da V3).
//
// A URL e a chave "publishable" podem ficar aqui no código: elas foram
// feitas para ficar no site, e todo mundo que abre a página vê.
// Quem protege os dados são as regras de segurança (RLS) do banco.
//
// NUNCA coloque aqui a chave "secret" nem a senha do banco.

const SUPABASE_URL = "https://bvxdpginlbckmwvguqyn.supabase.co";
const SUPABASE_CHAVE_PUBLICA = "sb_publishable_655XCbb4frm647m8lRfG4Q_Arp5Mw1K";

// "supabase" (minúsculo) é a biblioteca carregada pelo <script> da CDN.
// createClient cria a conexão que o resto do projeto usa.
const clienteSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA);
