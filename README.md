# [P] Bot Performance Extrema

Bot de Discord focado em automação massiva e testes de carga, com interface de controle web integrada.

## Como Usar:
1. Faça o deploy em um serviço de hospedagem persistente (**Render**, **Railway**, ou **Koyeb**).
   - *Nota: Vercel não é recomendado para bots de Discord pois encerra o processo após 10s.*
2. Configure as variáveis de ambiente:
   - `TOKEN`: Token do seu bot.
   - `CLIENT_ID`: ID da aplicação do bot.
3. Acesse a URL gerada para visualizar a interface de status.
4. Use os comandos `/nuke` ou `/message_raid` no Discord.

## Requisitos:
- Node.js 18+
- Privileged Gateway Intents ativos no Discord Developer Portal.
