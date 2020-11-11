require('dotenv').config();
const { Client } = require('discord.js');
const client = new Client();
const { MessageEmbed } = require('discord.js');

cooldown = new Set();

client.on('ready', async () => {
	console.log('Bot Has Started!');
});

client.on('message', async message => {
	if (message.author.bot) return;
	let dmembed = new MessageEmbed().setDescription(`Sorry We Don't Provide Dm Support.`).setColor('RED');
	if (message.channel.type === 'dm') {
		if (cooldown.has(message.author.id)) return;
		if (message.author.bot) return;

		message.channel.send(dmembed);
		cooldown.add(message.author.id);
		setTimeout(() => {
			cooldown.delete(message.author.id);
		}, 200000);
		return;
	}
});

client.on('messageReactionAdd', async (reaction, user) => {});

client.login(process.env.token);
