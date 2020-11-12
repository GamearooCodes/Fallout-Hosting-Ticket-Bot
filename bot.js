require('dotenv').config();
const { Client } = require('discord.js');
const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const { MessageEmbed } = require('discord.js');
const Discord = require('discord.js');
const db = require('./database');
const fs = require('fs');
const jsdom = require('jsdom');
const { Collector } = require('discord.js');
const { JSDOM } = jsdom;
const dom = new JSDOM();
const document = dom.window.document;

const Ticket = require('./models/Ticket');
const TicketConfig = require('./models/TicketConfig');

cooldown = new Set();

const prefix = process.env.prefix;

const checksave = new Map();

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

	if (message.content.toLocaleLowerCase() === `${prefix}new`) {
		const user = message.author;

		const ticketConfig = await TicketConfig.findOne({ where: { messageId: `${process.env.it}` } });
		if (ticketConfig) {
			const findTicket = await Ticket.findOne({ where: { authorId: user.id, resolved: false } });

			if (findTicket) {
				let existing = new MessageEmbed()
					.setAuthor(message.guild.name)
					.setDescription('Error While Making The Ticket (Duplicate)')

					.setColor('RED')
					.setThumbnail(message.guild.iconURL())

					.setFooter(
						'You have a ticket already',
						'https://cdn.discordapp.com/attachments/664911476405960754/693556558130577478/Fallout_icon.png'
					);
				user.send(existing).catch(err => error(err));
			} else {
				console.log('Making A Ticket...');
				try {
					const filter2 = m => m.author.id === message.author.id;
					message.channel.send(`Please Provide A Subject!`);
					const msgId = (await message.channel.awaitMessages(filter2, { max: 1 })).first().content;
					message.channel.bulkDelete(2, true);
					let reason = msgId;

					// let reason = `To set the Subject run ${prefix}subject <subject>`;

					const staffrole = message.guild.roles.cache.find(r => r.name === process.env.staff);
					let staffid = staffrole.id;

					const channel = await message.guild.channels.create('ticket', {
						parent: await ticketConfig.getDataValue('parentId'),
						topic: `Subject: ${reason}`,
						permissionOverwrites: [
							{ deny: 'VIEW_CHANNEL', id: message.guild.id },
							{ allow: 'VIEW_CHANNEL', id: user.id },
							{ allow: 'VIEW_CHANNEL', id: staffid }
						],
						reason: `${user.tag} Had Reacted To Open this ticket!`
					});
					let infoembed = new MessageEmbed()
						.setDescription(
							`Dear, ${user} \n \n Your support ticket has been created. \n Please wait for a member of the Support Team to help you out. Below are reaction options!`
						)
						.addField('Close', `❌`)
						.addField('Send Me A Copy Of The Ticket on close!', `📩`);

					const msg = await channel.send(infoembed);
					await msg.pin();
					await msg.react('❌');
					await msg.react('📩');

					const ticket = await Ticket.create({
						authorId: user.id,
						channelId: channel.id,
						guildId: message.guild.id,
						resolved: false,
						optionsMessageId: msg.id
					});

					const ticketId = String(ticket.getDataValue('ticketId')).padStart(4, 0);
					await channel.edit({ name: `ticket-${ticketId}` });
				} catch (err) {
					error(err);
				}
			}
		} else {
			return;
		}
		message.delete();
	}
	if (message.content.toLocaleLowerCase() === `${prefix}close`) {
		const ticket = await Ticket.findOne({ where: { channelId: message.channel.id } });

		if (ticket) {
			message.channel
				.updateOverwrite(ticket.getDataValue('authorId'), {
					VIEW_CHANNEL: false
				})
				.catch(err => error(err));

			ticket.resolved = true;
			await ticket.save();

			const optionsMessageId = ticket.getDataValue('optionsMessageId');
			if (optionsMessageId) {
				if (!message.channel.name.startsWith('ticket-')) return message.reply('This isnt a ticket');

				if (message.channel.name.endsWith('-hold'))
					return message.reply("I Can't Close tickets that where placed on hold");
				let channel = message.channel;
				channel.send('Logging Channel... Please Wait.');
				setTimeout(async () => {
					let yt3 = `${message.channel.name}-closed`;
					message.channel.send('Saving Transcript... Please Wait.');

					let test = message.guild.channels.cache.find(r => r.name === 'transcripts');

					let messageCollection = new Discord.Collection();
					let channelMessages = await message.channel.messages
						.fetch({
							limit: 100
						})
						.catch(err => console.log(err));

					messageCollection = messageCollection.concat(channelMessages);

					while (channelMessages.size === 100) {
						let lastMessageId = channelMessages.lastKey();
						channelMessages = await message.channel.messages
							.fetch({ limit: 100, before: lastMessageId })
							.catch(err => console.log(err));
						if (channelMessages) messageCollection = messageCollection.concat(channelMessages);
					}
					let msgs = messageCollection.array().reverse();
					let data = await fs.readFile('./template.html', 'utf8', function (err, data) {
						if (data) {
							fs.writeFile('index.html', data, function (err, data) {});
							let guildElement = document.createElement('div');
							let guildText = document.createTextNode(message.guild.name);
							let guildImg = document.createElement('img');
							guildImg.setAttribute('src', message.guild.iconURL());
							guildImg.setAttribute('width', '150');
							guildElement.appendChild(guildImg);
							guildElement.appendChild(guildText);
							console.log(guildElement.outerHTML);
							fs.appendFile('index.html', guildElement.outerHTML, function (err, data) {});

							msgs.forEach(async msg => {
								let parentContainer = document.createElement('div');
								parentContainer.className = 'parent-container';

								let avatarDiv = document.createElement('div');
								avatarDiv.className = 'avatar-container';
								let img = document.createElement('img');
								img.setAttribute('src', msg.author.displayAvatarURL());
								img.className = 'avatar';
								avatarDiv.appendChild(img);

								parentContainer.appendChild(avatarDiv);

								let messageContainer = document.createElement('div');
								messageContainer.className = 'message-container';

								let nameElement = document.createElement('span');
								let name = document.createTextNode(
									msg.author.tag +
										' ' +
										msg.createdAt.toDateString() +
										' ' +
										msg.createdAt.toLocaleTimeString() +
										' EST'
								);
								nameElement.appendChild(name);
								messageContainer.append(nameElement);

								if (msg.content.startsWith('```')) {
									let m = msg.content.replace(/```/g, '');
									let codeNode = document.createElement('code');
									let textNode = document.createTextNode(m);
									codeNode.appendChild(textNode);
									messageContainer.appendChild(codeNode);
								} else {
									let msgNode = document.createElement('span');
									let textNode = document.createTextNode(msg.content);
									msgNode.append(textNode);
									messageContainer.appendChild(msgNode);
								}
								parentContainer.appendChild(messageContainer);
								await fs.appendFile('index.html', parentContainer.outerHTML, function (err, data) {});
							});
						} else {
							message.channel.send('opps no data');
						}
					});
					setTimeout(() => {
						const path = './index.html';
						let me2 = ticket.getDataValue('authorId');
						let member = message.guild.members.cache.get(me2);

						let check;
						if (checksave.has(me2)) check = checksave.get(me2);
						if (!checksave.has(me2)) check = false;

						if (check) {
							checksave.delete(me2);
							member.send({
								files: [
									{
										attachment: path,
										name: `${yt3}.html`
									}
								]
							});
						}

						test.send({
							files: [
								{
									attachment: path,
									name: `${yt3}.html`
								}
							]
						});
						setTimeout(() => {
							fs.unlinkSync(path);
						}, 10000);
					}, 5000);
					channel.send('Transcript Saved! Clossing....').then(() => {
						setTimeout(() => {
							// who would be able to run the cmd

							let yt = message.channel;

							let me2 = ticket.getDataValue('authorId');

							let yy = message.guild.channels.cache.find(r => r.name === process.env.logs);
							if (!yy) return message.channel.send("couldn't Find `` " + process.env.logs + '``');

							let ch = me2;

							let member = message.guild.members.cache.get(me2);

							const embed = new MessageEmbed()
								.setTitle('Ticket Closed')
								.setColor('#6441a5')
								.setAuthor(message.author.tag, message.author.avatarURL())
								.addField('Closed By:', message.author.tag)
								.addField(`${yt.name} `, `Ticket Author ${member.user.tag}`)
								.setThumbnail(member.user.avatarURL())
								.setTimestamp(message.createdTimestamp);

							yy.send(embed);

							yt.delete();
						}, 5000);
					}, 5000);
				}, 20000);
			}
		}
		return;
	}
	if (message.content.toLocaleLowerCase() === `${prefix}subject`) {
		if (!message.channel.name.startsWith('ticket-'))
			return message.channel.send('You Must be In your ticket to add a subject!');

		const filter = m => m.author.id === message.author.id;

		message.channel.send('Please enter a subject!');
		const msgId = (await message.channel.awaitMessages(filter, { max: 1 })).first().content;

		message.channel.setTopic(`Subject: ${msgId}`);
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
	const message = reaction.message;
	if (user.bot) return;
	if (reaction.emoji.name === '🎟️') {
		reaction.users.remove(user.id);
		const ticketConfig = await TicketConfig.findOne({ where: { messageId: reaction.message.id } });
		if (ticketConfig) {
			const findTicket = await Ticket.findOne({ where: { authorId: user.id, resolved: false } });

			if (findTicket) {
				let existing = new MessageEmbed()
					.setAuthor(reaction.message.guild.name)
					.setDescription('Error While Making The Ticket (Duplicate)')

					.setColor('RED')
					.setThumbnail(reaction.message.guild.iconURL())

					.setFooter(
						'You have a ticket already',
						'https://cdn.discordapp.com/attachments/664911476405960754/693556558130577478/Fallout_icon.png'
					);
				user.send(existing).catch(err => error(err));
			} else {
				console.log('Making A Ticket...');
				try {
					let reason = `To set the Subject run ${prefix}subject`;

					const staffrole = reaction.message.guild.roles.cache.find(r => r.name === process.env.staff);
					let staffid = staffrole.id;

					const channel = await reaction.message.guild.channels.create('ticket', {
						parent: await ticketConfig.getDataValue('parentId'),
						topic: `Subject: ${reason}`,
						permissionOverwrites: [
							{ deny: 'VIEW_CHANNEL', id: reaction.message.guild.id },
							{ allow: 'VIEW_CHANNEL', id: user.id },
							{ allow: 'VIEW_CHANNEL', id: staffid }
						],
						reason: `${user.tag} Had Reacted To Open this ticket!`
					});
					let infoembed = new MessageEmbed()
						.setDescription(
							`Dear, ${user} \n \n Your support ticket has been created. \n Please wait for a member of the Support Team to help you out. Below are reaction options!`
						)
						.addField('Close', `❌`)
						.addField('Send Me A Copy Of The Ticket on close!', `📩`);

					const msg = await channel.send(infoembed);
					await msg.pin();
					await msg.react('❌');
					await msg.react('📩');

					const ticket = await Ticket.create({
						authorId: user.id,
						channelId: channel.id,
						guildId: reaction.message.guild.id,
						resolved: false,
						optionsMessageId: msg.id
					});

					const ticketId = String(ticket.getDataValue('ticketId')).padStart(4, 0);
					await channel.edit({ name: `ticket-${ticketId}` });
				} catch (err) {
					error(err);
				}
			}
		} else {
			return;
		}
	}
	if (reaction.emoji.name === '❌') {
		message.reactions.removeAll();
		const ticket = await Ticket.findOne({ where: { channelId: reaction.message.channel.id } });

		if (ticket) {
			reaction.message.channel
				.updateOverwrite(ticket.getDataValue('authorId'), {
					VIEW_CHANNEL: false
				})
				.catch(err => error(err));

			ticket.resolved = true;
			await ticket.save();

			const optionsMessageId = ticket.getDataValue('optionsMessageId');
			if (reaction.message.id === optionsMessageId) {
				if (reaction.message.channel.name.endsWith('-hold'))
					return message.reply("I Can't Close tickets that where placed on hold");
				let channel = reaction.message.channel;
				channel.send('Logging Channel... Please Wait.');
				setTimeout(async () => {
					let yt3 = `${message.channel.name}-closed`;
					message.channel.send('Saving Transcript... Please Wait.');

					let test = message.guild.channels.cache.find(r => r.name === 'transcripts');

					let messageCollection = new Discord.Collection();
					let channelMessages = await message.channel.messages
						.fetch({
							limit: 100
						})
						.catch(err => console.log(err));

					messageCollection = messageCollection.concat(channelMessages);

					while (channelMessages.size === 100) {
						let lastMessageId = channelMessages.lastKey();
						channelMessages = await message.channel.messages
							.fetch({ limit: 100, before: lastMessageId })
							.catch(err => console.log(err));
						if (channelMessages) messageCollection = messageCollection.concat(channelMessages);
					}
					let msgs = messageCollection.array().reverse();
					let data = await fs.readFile('./template.html', 'utf8', function (err, data) {
						if (data) {
							fs.writeFile('index.html', data, function (err, data) {});
							let guildElement = document.createElement('div');
							let guildText = document.createTextNode(message.guild.name);
							let guildImg = document.createElement('img');
							guildImg.setAttribute('src', message.guild.iconURL());
							guildImg.setAttribute('width', '150');
							guildElement.appendChild(guildImg);
							guildElement.appendChild(guildText);
							console.log(guildElement.outerHTML);
							fs.appendFile('index.html', guildElement.outerHTML, function (err, data) {});

							msgs.forEach(async msg => {
								let parentContainer = document.createElement('div');
								parentContainer.className = 'parent-container';

								let avatarDiv = document.createElement('div');
								avatarDiv.className = 'avatar-container';
								let img = document.createElement('img');
								img.setAttribute('src', msg.author.displayAvatarURL());
								img.className = 'avatar';
								avatarDiv.appendChild(img);

								parentContainer.appendChild(avatarDiv);

								let messageContainer = document.createElement('div');
								messageContainer.className = 'message-container';

								let nameElement = document.createElement('span');
								let name = document.createTextNode(
									msg.author.tag +
										' ' +
										msg.createdAt.toDateString() +
										' ' +
										msg.createdAt.toLocaleTimeString() +
										' EST'
								);
								nameElement.appendChild(name);
								messageContainer.append(nameElement);

								if (msg.content.startsWith('```')) {
									let m = msg.content.replace(/```/g, '');
									let codeNode = document.createElement('code');
									let textNode = document.createTextNode(m);
									codeNode.appendChild(textNode);
									messageContainer.appendChild(codeNode);
								} else {
									let msgNode = document.createElement('span');
									let textNode = document.createTextNode(msg.content);
									msgNode.append(textNode);
									messageContainer.appendChild(msgNode);
								}
								parentContainer.appendChild(messageContainer);
								await fs.appendFile('index.html', parentContainer.outerHTML, function (err, data) {});
							});
						} else {
							message.channel.send('opps no data');
						}
					});
					setTimeout(() => {
						const path = './index.html';
						let me2 = ticket.getDataValue('authorId');
						let member = message.guild.members.cache.get(me2);

						let check;
						if (checksave.has(me2)) check = checksave.get(me2);
						if (!checksave.has(me2)) check = false;

						if (check) {
							checksave.delete(me2);
							member.send({
								files: [
									{
										attachment: path,
										name: `${yt3}.html`
									}
								]
							});
						}

						test.send({
							files: [
								{
									attachment: path,
									name: `${yt3}.html`
								}
							]
						});
						setTimeout(() => {
							fs.unlinkSync(path);
						}, 10000);
					}, 5000);
					channel.send('Transcript Saved! Clossing....').then(() => {
						setTimeout(() => {
							// who would be able to run the cmd

							let yt = reaction.message.channel;

							let me2 = ticket.getDataValue('authorId');

							let yy = reaction.message.guild.channels.cache.find(r => r.name === process.env.logs);
							if (!yy)
								return reaction.message.channel.send("couldn't Find `` " + process.env.logs + '``');

							let ch = me2;

							let member = reaction.message.guild.members.cache.get(me2);

							const embed = new MessageEmbed()
								.setTitle('Ticket Closed')
								.setColor('#6441a5')
								.setAuthor(message.author.tag, message.author.avatarURL())
								.addField('Closed By:', message.author.tag)
								.addField(`${yt.name} `, `Ticket Author ${member.user.tag}`)
								.setThumbnail(member.user.avatarURL())
								.setTimestamp(message.createdTimestamp);

							yy.send(embed);

							yt.delete();
						}, 5000);
					}, 5000);
				}, 20000);
			}
		}
	}
	if (reaction.emoji.name === '📩') {
		reaction.users.remove(user.id);
		const ticket2 = await Ticket.findOne({ where: { channelId: reaction.message.channel.id } });
		let me2 = ticket2.getDataValue('authorId');
		let member = message.guild.members.cache.get(me2);
		if (user.id === member.id) {
			let check = false;
			let hi = checksave.has(user.id);
			if (!hi) check = true;
			check ? save(user.id, true) : save(user.id, false);

			return check
				? message.channel.send('OK ill send you a Transcript when your ticket closes!')
				: message.channel.send('OK ill no longer send you a Transcript when your ticket closes!');
		} else {
			return message.reply('You are not the owner of this ticket.');
		}
	}
});

client.login(process.env.token);

async function error(err) {
	let guild = client.guilds.cache.get(process.env.guildId);
	let owner = guild.members.cache.get(process.env.botdevId);
	console.log(err);
	owner.send(`\`\`\`An Error Has happened! \n Error: ${err}\`\`\``);
}

async function save(user, s) {
	if (s === false) return checksave.delete(user);
	checksave.set(user, s);
}
