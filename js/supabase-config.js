/* 
 * R.O.S.S.Y - Configuración y Conexión con Supabase
 */

// Sustituye estos valores con las credenciales de tu proyecto en Supabase
const SUPABASE_URL = 'https://ggstnzjwqriutborhfpj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ydZo3uI9T1dQcaud6PKOkQ_Foanpo6B';

// Inicialización del cliente oficial de Supabase para disponibilidad global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);





