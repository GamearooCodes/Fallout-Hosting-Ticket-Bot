require('dotenv').config();
const { Client } = require('discord.js');
const client = new Client();
const { MessageEmbed } = require('discord.js');
const db = require('./database');

const Ticket = require('./models/Ticket');
const TicketConfig = require('./models/TicketConfig');

cooldown = new Set();

const prefix = process.env.prefix;

client.on('ready', async () => {
	console.log('Bot Has Started!');
	db.authenticate()
		.then(async () => {
			console.log('Connected to DataBase!');
			Ticket.init(db);
			TicketConfig.init(db);
			Ticket.sync();
			TicketConfig.sync();
			console.log('Completed!');
		})
		.catch(err => error(err));
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
			await message.channel.send('Please enter the message id for this ticket!');
			const msgId = (await message.channel.awaitMessages(filter, { max: 1 })).first().content;
			const fetchMsg = await message.channel.messages.fetch(msgId);

			message.channel.send('Please enter the category id for the tickets to go too!');
			const catId = (await message.channel.awaitMessages(filter, { max: 1 })).first().content;
			const catChan = client.channels.cache.get(catId);

			if (fetchMsg && catChan) {
				const ticketConfig = TicketConfig.create({
					messageId: msgId,
					guildId: message.guild.id,
					parentId: catChan.id
				});

				await fetchMsg.react('🎟️');

				message.channel.send(
					'Successfully added to db! Alert: Msgs will self delete. deleting them will cause the msgs above to be removed!'
				);
				setTimeout(() => {
					message.channel.bulkDelete(6, true);
				}, 5000);
			} else {
				error('Invalid fields!');
			}
		} catch (err) {
			error(err);
		}
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.emoji.name === '🎟️') {
		const ticketConfig = TicketConfig.findOne({ where: { messageId: reaction.message.id } });
		if (ticketConfig) {
			const findTicket = await Ticket.findOne({ where: { authorId: user.id, resolved: false } });
			let name = findTicket.getDataValue('channelId');
			let hi = client.channels.cache.get(name);
			let existing = new Discord.MessageEmbed()
				.setAuthor(message.guild.name)
				.setDescription('Error While Making The Ticket (Duplicate)')

				.setColor('RED')
				.setThumbnail(message.guild.iconURL())
				.addField('Channel Already Opened', hi)
				.setFooter(
					'You have a ticket already',
					'https://cdn.discordapp.com/attachments/664911476405960754/693556558130577478/Fallout_icon.png'
				);
			if (findTicket) user.send(existing);
			else {
				console.log('Making A Ticket...');
				try {
					let reason = `To set the Subject run ${prefix}subject <subject>`;
					const staffrole = client.roles.cache.find(r => r.name === process.env.staff);
					let staffid = staffrole.id;

					const channel = await reaction.message.guild.channels.create('ticket', {
						parent: ticketConfig.getDataValue('parentId'),
						topic: `Subject: ${reason}`,
						permissionOverwrites: [
							{ deny: 'VIEW_CHANNEL', id: reaction.messages.guild.id },
							{ allow: 'VIEW_CHANNEL', id: user.id },
							{ allow: 'VIEW_CHANNEL', staffid }
						],
						reason: `${user.tag} Had Reacted To Open this ticket!`
					});
					let infoembed = new Discord.MessageEmbed()
						.setDescription(
							`Dear, ${user} \n \n Your support ticket has been created. \n Please wait for a member of the Support Team to help you out. Below are reaction options!`
						)
						.addField('Close', `❌`)
						.addField('Send Me A Copy Of The Ticket on close!', `📩`);

					const msg = await message.channel.send(infoembed);
					await msg.pin();
					await msg.react('❌');
					await msg.react('📩');
					const ticket = await Ticket.create({
						authorId: user.id,
						channelId: channel.id,
						guildId: reaction.message.guild.id,
						resolved: false,
						closeMessageId: msg.id
					});
				} catch (err) {
					error(err);
				}
			}
		} else {
			return;
		}
	}
});

client.login(process.env.token);

async function error(err) {
	let guild = client.guilds.cache.get(process.env.guildId);
	let owner = guild.members.cache.get(process.env.botdevId);
	console.log('An Error Has Happened!');
	owner.send(`\`\`\`An Error Has happened! \n Error: ${err}\`\`\``);
}
