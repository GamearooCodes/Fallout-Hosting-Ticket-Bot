require('dotenv').config();
const { Client } = require('discord.js');
const client = new Client();
const { MessageEmbed } = require('discord.js');

cooldown = new Set();

const prefix = process.env.prefix;

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
	if (
		message.content.toLocaleLowerCase() === `${prefix}setupmsg` &&
		message.member.roles.cache.find(r => r.name === process.env.staff)
	) {
		let dmembed = new MessageEmbed().setDescription(`React To Open A Ticket.`).setColor('GREEN');
		message.channel.send(dmembed).catch(err => error(err));
	}

	if (
		message.content.toLocaleLowerCase() === `${prefix}setup` &&
		message.member.roles.cache.find(r => r.name === process.env.staff)
	) {
		try {
			const filter = m => m.author.id === message.author.id;
			message.channel.send('Please enter the message id for this ticket!');
			const msgId = (await message.channel.awaitMessages(filter, { max: 1 })).first().content;
			const fetchMsg = await message.channel.messages.fetch(msgId);
			message.channel.send('Please enter the category id for the tickets to go too!');
			const catId = (await message.channel.awaitMessages(filter, { max: 1 })).first().content;
			const catChan = client.channels.cache.get(catId);
			if (fetchMsg && catChan) {
			}
		} catch (err) {
			error(err);
		}
	}
});

client.on('messageReactionAdd', async (reaction, user) => {});

client.login(process.env.token);

async function error(err) {
	let guild = client.guilds.cache.get(process.env.guildId);
	let owner = guild.members.cache.get(process.env.botdevId);
	console.log('An Error Has Happened!');
	owner.send(`\`\`\`An Error Has happened! \n Error: ${err}\`\`\``);
}
