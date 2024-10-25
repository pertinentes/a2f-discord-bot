const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletealldata')
        .setDescription('Supprimer toutes vos données 2FA du bot'),

    async execute(interaction, client) {
        const password = await client.db.get(`2fa_password_${interaction.user.id}`);

        if (!password) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas de données 2FA à supprimer.**',
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('deleteAllDataModal')
            .setTitle('Suppression de toutes les données');

        const passwordInput = new TextInputBuilder()
            .setCustomId('passwordInput')
            .setLabel("Entrez votre mot de passe")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(passwordInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        try {
            const modalSubmission = await interaction.awaitModalSubmit({ time: 60000 });
            const submittedPassword = modalSubmission.fields.getTextInputValue('passwordInput');

            if (submittedPassword !== password) {
                return modalSubmission.reply({
                    content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                    ephemeral: true
                });
            }

            await client.db.delete(`2fa_${interaction.user.id}`);
            await client.db.delete(`2fa_password_${interaction.user.id}`);

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Suppression réussie')
                .setDescription('▸ ✅ **Toutes vos données 2FA ont été supprimées avec succès du bot.**')
                .setTimestamp();

            await modalSubmission.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            await interaction.followUp('▸ ❌ **Une erreur est survenue lors de la suppression des données. Veuillez réessayer.**');
        }
    },
};
