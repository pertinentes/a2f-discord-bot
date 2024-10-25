const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Supprimer une application 2FA'),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const password = await client.db.get(`2fa_password_${interaction.user.id}`);
        if (!password) {
            return interaction.reply({
                content: '▸ ❌ **Vous devez d\'abord configurer un mot de passe avec la commande /setpassword.**',
                ephemeral: true
            });
        }

        const passwordModal = new ModalBuilder()
            .setCustomId('passwordModal')
            .setTitle('Vérification du mot de passe');

        const passwordInput = new TextInputBuilder()
            .setCustomId('passwordInput')
            .setLabel("Entrez votre mot de passe")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const passwordRow = new ActionRowBuilder().addComponents(passwordInput);
        passwordModal.addComponents(passwordRow);

        await interaction.showModal(passwordModal);

        try {
            const passwordSubmission = await interaction.awaitModalSubmit({ time: 60000 });
            const submittedPassword = passwordSubmission.fields.getTextInputValue('passwordInput');

            if (submittedPassword !== password) {
                return passwordSubmission.reply({
                    content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                    ephemeral: true
                });
            }

            const userApps = client.db.get(`2fa_${interaction.user.id}`) || [];
            
            if (userApps.length === 0) {
                return passwordSubmission.reply({
                    content: '▸ ℹ️ **Vous n\'avez aucune application 2FA configurée.**',
                    ephemeral: true
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('appSelect')
                .setPlaceholder('Choisissez une application à supprimer')
                .addOptions(userApps.map(app => ({
                    label: app.name,
                    value: app.name
                })));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await passwordSubmission.reply({
                content: 'Choisissez l\'application à supprimer :',
                components: [row],
                ephemeral: true
            });

            const filter = i => i.customId === 'appSelect' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                const selectedApp = i.values[0];

                const confirmModal = new ModalBuilder()
                    .setCustomId('confirmModal')
                    .setTitle('Confirmation de suppression');

                const confirmPasswordInput = new TextInputBuilder()
                    .setCustomId('confirmPasswordInput')
                    .setLabel("Entrez à nouveau votre mot de passe")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const confirmRow = new ActionRowBuilder().addComponents(confirmPasswordInput);
                confirmModal.addComponents(confirmRow);

                await i.showModal(confirmModal);

                try {
                    const confirmSubmission = await interaction.awaitModalSubmit({ time: 60000 });
                    const confirmedPassword = confirmSubmission.fields.getTextInputValue('confirmPasswordInput');

                    if (confirmedPassword !== password) {
                        return confirmSubmission.reply({
                            content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                            ephemeral: true
                        });
                    }

                    const updatedApps = userApps.filter(app => app.name !== selectedApp);
                    await client.db.set(`2fa_${interaction.user.id}`, updatedApps);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Application 2FA supprimée')
                        .setDescription(`▸ ✅ **L'application "${selectedApp}" a été supprimée avec succès.**`)
                        .setTimestamp();

                    await confirmSubmission.reply({ embeds: [successEmbed], ephemeral: true });
                    collector.stop();
                } catch (error) {
                    console.error('Erreur lors de la confirmation:', error);
                    await interaction.followUp('▸ ❌ **Une erreur est survenue. Veuillez réessayer.**');
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp('▸ ⏱️ **Le temps de sélection est écoulé. Opération annulée.**');
                }
            });

        } catch (error) {
            console.error('Erreur lors de la vérification du mot de passe:', error);
            await interaction.followUp('▸ ❌ **Une erreur est survenue. Veuillez réessayer.**');
        }
    },
};
