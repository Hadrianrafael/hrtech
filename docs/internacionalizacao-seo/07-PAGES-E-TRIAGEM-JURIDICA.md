# Publicação (GitHub Pages) e triagem das pendências jurídicas

Verificado em 14/10/2026. **Nada foi alterado** em configurações administrativas, e o PR #11 não foi mergeado.

## Parte 1 — GitHub Pages

### Estado atual (o que dá para comprovar)

| Item | Resultado |
| --- | --- |
| Configuração administrativa (*Settings → Pages*) | **Não legível por esta sessão**: a API `repos/.../pages` é bloqueada (HTTP 403 do proxy). O estado abaixo é **inferido dos logs**, não lido da configuração. |
| Workflows ativos | `CI`, `Platform CI`, **`Deploy to GitHub Pages`** (`.github/workflows/deploy.yml`) e **`pages-build-deployment`** (workflow dinâmico do próprio GitHub, não existe no repositório) |
| Qual usa Next.js | **`Deploy to GitHub Pages`**: roda `pnpm run check`, publica a pasta `out/` (`upload-pages-artifact` + `deploy-pages`, ambiente `github-pages`). Dispara em `push` na `main` e em `workflow_dispatch`. |
| O que o outro faz | `pages-build-deployment`: *Build with Jekyll* da **raiz do repositório** (README, docs…) e publica no mesmo ambiente `github-pages`. Não conhece o Next.js. |
| Prova de que os dois rodam | Em todos os pushes recentes na `main` (25/09 ×3, 07/10) aparecem os dois. Esse workflow dinâmico só roda quando a origem está em **"Deploy from a branch"**. |
| Quem "venceu" na última vez | 07/10: Jekyll terminou às 11:38:38 e o Next.js às 11:39:04 (**26 s depois**). Site correto por margem curta, não por garantia. |
| O PR #11 mexe nisso? | Não. Nenhum arquivo em `.github/` ou `CNAME` foi alterado. |

**Conclusão:** a origem do Pages provavelmente está em *Deploy from a branch*. Enquanto estiver assim, cada push na `main` (inclusive o merge do PR #11) dispara dois publicadores concorrentes. Se o Jekyll terminasse por último, o domínio passaria a servir a documentação do repositório em vez do site.

### Configuração correta (a alterar por você ou com sua autorização específica)

*Settings → Pages → Build and deployment → **Source: GitHub Actions*** (em vez de *Deploy from a branch*).

Impacto:
- O build Jekyll deixa de existir; só o `Deploy to GitHub Pages` publica.
- O site que está no ar **não cai** na troca; ele só muda no próximo deploy.
- Domínio personalizado e HTTPS ficam nas mesmas configurações da página (conferir **Custom domain = `hrtechsistemas.com.br`** e **Enforce HTTPS** marcado). Com origem em Actions, o arquivo `CNAME` da raiz deixa de ser usado; o domínio vem dessa configuração.
- Reversão: voltar o Source para *Deploy from a branch* (`main` / `/ (root)`).

### Sequência segura sugerida (cada passo exige sua autorização)
1. Trocar o Source para *GitHub Actions* (e conferir domínio e HTTPS).
2. Rodar manualmente *Actions → Deploy to GitHub Pages → Run workflow* na `main`: republica o **site atual** (sem as mudanças do PR) e prova que o pipeline sozinho funciona. Conferir `https://hrtechsistemas.com.br`.
3. Só então tirar o PR #11 de rascunho e fazer o merge; o deploy automático publicará a versão internacional.
4. Depois: enviar o sitemap no Search Console.

## Parte 2 — Triagem das pendências jurídicas

> Esta triagem é **técnica e minha**; **não é parecer jurídico nem presume aprovação**. A decisão sobre cada item é do dono e do advogado. A classificação indica onde eu enxergo exposição concreta.

### A. Impedem uma publicação responsável (resolver, ou aceitar o risco por escrito, antes do deploy)

| # | Pendência | Por quê |
| --- | --- | --- |
| A1 | **Base legal do tratamento não declarada** nas políticas de privacidade (LGPD art. 9 e 7; GDPR art. 13) e **prazo de guarda genérico** ("o tempo necessário"). | As versões EN/ES miram titulares na UE/EUA; a transparência mínima exige informar a base legal e o prazo. O texto precisa ser escolhido por advogado (ex.: consentimento, execução de procedimentos pré-contratuais a pedido do titular, legítimo interesse). |
| A2 | **Quem é o controlador.** O CNPJ é um CCMEI em nome de Hadrian Rafael Silva de Oliveira; as políticas dizem "HR Tech Sistemas, CNPJ …". | Os documentos legais (política, termos, rodapé) precisam identificar corretamente o responsável; é a base de todo direito de titular e de eventual contrato. Confirmar a forma de identificação (nome empresarial/nome fantasia + titular). |
| A3 | ~~Consentimento de cookies dependia do fuso horário.~~ **Corrigido tecnicamente** (PR #11): em qualquer país o Google Analytics só carrega após aceite; recusar remove os cookies controláveis. | Restam apenas as dúvidas jurídicas listadas em `08-CONSENTIMENTO-DE-COOKIES.md` e `09-CHECKLIST-ADVOGADO.md`. |
| A4 | **Nenhuma revisão jurídica dos textos** (política e termos nos 3 idiomas). | Os textos foram redigidos por mim a partir de modelos de boas práticas e do que o site faz de fato. Antes de publicar para três jurisdições, ao menos uma revisão de advogado. |

### B. Melhorias que podem ser concluídas depois (sem presumir aprovação)

| # | Pendência | Observação |
| --- | --- | --- |
| B1 | **Termos de uso:** sem lei aplicável, foro nem limitação de responsabilidade; aceite por simples navegação; "prevalece a versão em português". | Site informativo B2B, risco menor; formalizar quando houver contratação/portal. |
| B2 | **Transferências internacionais:** qual mecanismo se aplica a dados de residentes da UE/Reino Unido tratados no Brasil e pelo Google nos EUA. | Juridicamente discutível no caso de coleta direta; advogado define o texto. |
| B3 | **Representante na UE/Reino Unido** (GDPR art. 27). | Pode haver isenção para tratamento ocasional/pequeno; avaliar. |
| B4 | **EUA:** confirmar se leis estaduais (ex.: CCPA/CPRA) se aplicam e se "não vendemos nem compartilhamos dados" é suficiente. | Provavelmente abaixo dos limites; confirmar. |
| B5 | **Segmento advocacia:** conferir as referências às regras de publicidade (Provimento 205/2021 da OAB; Estatuto General de la Abogacía Española e Código Deontológico). | São afirmações factuais nas páginas; conferir por advogado de cada país (baixo esforço). |
| B6 | **Encarregado/DPO** (LGPD): hoje há canal por e-mail; confirmar se basta para agente de pequeno porte. | — |
| B7 | **Cláusula de idioma também na política de privacidade** e cláusula de alterações com aviso. | Editorial. |
| B8 | Revisão por **falantes nativos** de EN/ES (editorial, não jurídica). | Já indicado. |

**Já resolvido nesta etapa (técnico/editorial):** texto sobre cookies agora coerente com o código (`_ga`), controlador, prestadores, transferências, guarda e autoridades informados, e link "Preferências de cookies" para mudar/retirar o consentimento.
