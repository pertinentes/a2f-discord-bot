const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpassword')
        .setDescription('Créer ou modifier le mot de passe pour la configuration 2FA'),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const existingPassword = await client.db.get(`2fa_password_${interaction.user.id}`);

        const passwordModal = new ModalBuilder()
            .setCustomId('passwordSetupModal')
            .setTitle(existingPassword ? 'Modification du mot de passe 2FA' : 'Création du mot de passe 2FA');

        if (existingPassword) {
            const oldPasswordInput = new TextInputBuilder()
                .setCustomId('oldPasswordInput')
                .setLabel("Entrez votre ancien mot de passe")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const newPasswordInput = new TextInputBuilder()
                .setCustomId('newPasswordInput')
                .setLabel("Entrez votre nouveau mot de passe")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const oldPasswordRow = new ActionRowBuilder().addComponents(oldPasswordInput);
            const newPasswordRow = new ActionRowBuilder().addComponents(newPasswordInput);
            passwordModal.addComponents(oldPasswordRow, newPasswordRow);
        } else {
            const newPasswordInput = new TextInputBuilder()
                .setCustomId('newPasswordInput')
                .setLabel("Créez un mot de passe unique")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const newPasswordRow = new ActionRowBuilder().addComponents(newPasswordInput);
            passwordModal.addComponents(newPasswordRow);
        }

        await interaction.showModal(passwordModal);

        try {
            const passwordSubmission = await interaction.awaitModalSubmit({ time: 120000 });

            if (existingPassword) {
                const oldPassword = passwordSubmission.fields.getTextInputValue('oldPasswordInput');
                const newPassword = passwordSubmission.fields.getTextInputValue('newPasswordInput');

                if (oldPassword !== existingPassword) {
                    return passwordSubmission.reply({
                        content: '▸ ❌ **Ancien mot de passe incorrect. Opération annulée.**',
                        ephemeral: true
                    });
                }

                await client.db.set(`2fa_password_${interaction.user.id}`, newPassword);
                await passwordSubmission.reply({
                    content: '▸ ✅ **Mot de passe modifié avec succès. RAPPEL : Assurez-vous d\'avoir sauvegardé ce nouveau mot de passe en lieu sûr, hors de Discord.**',
                    ephemeral: true
                });
            } else {
                const newPassword = passwordSubmission.fields.getTextInputValue('newPasswordInput');
                await client.db.set(`2fa_password_${interaction.user.id}`, newPassword);
                await passwordSubmission.reply({
                    content: '▸ ✅ **Mot de passe créé avec succès. RAPPEL : Assurez-vous d\'avoir sauvegardé ce mot de passe en lieu sûr, hors de Discord.**',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur lors de la création/modification du mot de passe:', error);
            await interaction.followUp('▸ ❌ **Une erreur est survenue lors de la création/modification du mot de passe. Veuillez réessayer.**');
        }
    },
};
