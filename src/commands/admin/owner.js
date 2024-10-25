const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('owner')
        .setDescription('Gérer les owners du bot')
        .addSubcommand(subcommand =>
            subcommand
            .setName('add')
            .setDescription('Ajouter un utilisateur en tant que owners')
            .addUserOption(option =>
                option.setName('utilisateur')
                .setDescription('L\'utilisateur à ajouter en tant que owners')
                .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
            .setName('remove')
            .setDescription('Retirer un utilisateur en tant que owners')
            .addUserOption(option =>
                option.setName('utilisateur')
                .setDescription('L\'utilisateur à retirer en tant que owners')
                .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
            .setName('list')
            .setDescription('Afficher la liste des owners')),

    async execute(interaction, client) {
        if (!client.config.owners.includes(interaction.user.id)) {
            return interaction.reply({
                content: '▸ ❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const user = interaction.options.getUser('utilisateur');
            const owners = Array.isArray(client.config.owners) ? client.config.owners : [client.config.owners];

            if (owners.includes(user.id)) {
                return interaction.reply({
                    content: `▸ <@${user.id}> est déjà un owners.`,
                    ephemeral: true
                });
            }

            owners.push(user.id);
            client.config.owners = owners;
            await client.db.set(`owners_${user.id}`, true);

            interaction.reply({
                content: `▸ <@${user.id}> a été ajouté en tant que owners.`,
                ephemeral: true
            });
        } else if (subcommand === 'remove') {
            const user = interaction.options.getUser('utilisateur');
            const owners = Array.isArray(client.config.owners) ? client.config.owners : [client.config.owners];

            if (!owners.includes(user.id)) {
                return interaction.reply({
                    content: `▸ <@${user.id}> n'est pas un owners.`,
                    ephemeral: true
                });
            }

            const index = owners.indexOf(user.id);
            owners.splice(index, 1);
            client.config.owners = owners;
            await client.db.delete(`owners_${user.id}`);

            interaction.reply({
                content: `▸ <@${user.id}> a été retiré en tant que owners.`,
                ephemeral: true
            });
        } else if (subcommand === 'list') {
            const owners = Array.isArray(client.config.owners) ? client.config.owners : [client.config.owners];
            const ownerList = owners.map(id => `<@${id}>`).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Liste des owners')
                .setDescription(ownerList)
                .setTimestamp();

            interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    },
};