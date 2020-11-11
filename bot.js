require('dotenv').config();
const { Client } = require('discord.js');
const client = new Client();
const { MessageEmbed } = require('discord.js');

client.on('ready', async () => {
	console.log('Bot Has Started!');
});

client.on('message', async message => {
	if (message.author.bot) return;
	let dmembed = new MessageEmbed().setDescription(`Sorry We Don't Provide Dm Support.`).setColor('RED');
	if (message.channel.type === 'dm') {
		if (message.author.bot) return;
		return message.channel.send(dmembed);
	}
});

client.on('messageReactionAdd', async (reaction, user) => {});

client.login(process.env.token);
