const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes'),
    async execute(interaction, client) {
        const commands = client.slashCommands;

        const categories = {
            '2fa': '🔐',
            'admin': '🛡️',
            'misc': '🔧'
        };

        const embed = new Discord.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📚 __**Guide des Commandes**__')
            .setDescription('Voici la liste détaillée des commandes disponibles :')
            .setTimestamp()
            .setFooter({ text: "2fa bot"})

        const commandsPath = path.join(__dirname, '..');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            const emoji = categories[folder] || '📌';
            const formattedCategory = `${emoji} **${folder.charAt(0).toUpperCase() + folder.slice(1)}**`;
            
            let categoryContent = '';
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                if (command.data && command.data.name && command.data.description) {
                    categoryContent += `\`/${command.data.name}\` - ${command.data.description}\n`;
                }
            }

            if (categoryContent) {
                embed.addFields({ name: formattedCategory, value: categoryContent });
            }
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
