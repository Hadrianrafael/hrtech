/**
 * Executado uma vez na inicialização do servidor.
 * Define o fuso padrão de formatação (datas exibidas em componentes de servidor).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') process.env.TZ = process.env.APP_TIMEZONE || 'America/Sao_Paulo';
}
