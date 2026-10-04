/**
 * Executado uma vez na inicialização do servidor.
 * Define o fuso padrão de formatação (datas exibidas em componentes de servidor).
 */
export async function register() {
  process.env.TZ = process.env.APP_TIMEZONE || 'America/Sao_Paulo';
}
