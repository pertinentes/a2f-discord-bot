module.exports = {
	name: "interactionCreate",
	async execute(client, interaction) {
		const blacklist = await client.db.get('blacklist') || []
		const bl = blacklist.some(user => user.id === interaction.user.id)

		if (bl && interaction.isChatInputCommand()) {
			return interaction.reply({
				content: "Vous êtes sur la blacklist et ne pouvez pas utiliser les commandes du bot.",
				ephemeral: true
			})
		}

		if (interaction.isChatInputCommand()) {
			const command = interaction.client.slashCommands.get(interaction.commandName)
			if (!command) {
				return interaction.reply({
					content: "Commande non reconnue.",
					ephemeral: true
				})
			}

			try {
				await command.execute(interaction, client)
			} catch (error) {
				console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error)
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: "Une erreur est survenue lors de l'exécution de cette commande.",
						ephemeral: true
					})
				} else {
					await interaction.reply({
						content: "Une erreur est survenue lors de l'exécution de cette commande.",
						ephemeral: true
					})
				}
			}
		}

		if (interaction.isAutocomplete()) {
			const command = client.slashCommands.get(interaction.commandName);
			if (!command) return;

			try {
				await command.autocomplete(interaction, client);
			} catch (error) {
				console.error(error);
			}
		}
	}
}
