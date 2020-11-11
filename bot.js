require('dotenv').config();
const { Client } = require('discord.js');
const client = new Client();

client.on('ready', async () => {
	console.log('Bot Has Started!');
});

client.on('message', async message => {});

client.on('messageReactionAdd', async (reaction, user) => {});

client.login(process.env.token);
