require("dotenv").config();
const { Client } = require("discord.js");
const client = new Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
const emojiID = "🎟️";
const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");
const db = require("./database");
const fs = require("fs");
const jsdom = require("jsdom");
const force = new Map();
const { Collector } = require("discord.js");
const { JSDOM } = jsdom;
const version = "2.4";
const dom = new JSDOM();
const document = dom.window.document;

const Ticket = require("./models/Ticket");
const TicketConfig = require("./models/TicketConfig");

cooldown = new Set();

const prefix = process.env.prefix;

const checksave = new Map();

client.on("ready", async () => {
  console.log("Bot Has Started!");
  let bot = client;
  bot.user.setActivity(`${prefix}new to open a new ticket`);
  setInterval(async () => {
    const activities_list = [
      "Bot By: Gamearoo#0001",
      "Bot By: Gamearoo#0001",
      `-new to open a ticket`,
      "Helping Others",
      `Version: ${version}`,

      `-help For My Commands.`,
      `Helping ${bot.users.cache.size
        .toLocaleString()
        .replace(/,/g, ",")} Users.`,
    ];
    const index = Math.floor(Math.random() * (activities_list.length - 1) + 1); // generates a random number between 1 and the length of the activities array list (in this case 5).
    bot.user.setActivity(activities_list[index]);
    console.log(activities_list[index]); // sets bot's activities to one of the phrases in the arraylist.
  }, 90000);

  db.authenticate()
    .then(async () => {
      console.log("Connected to DataBase!");
      Ticket.init(db);
      TicketConfig.init(db);
      Ticket.sync();
      TicketConfig.sync();
      console.log("Completed!");
    })
    .catch((err) => error(err));
});
//anti ping system

client.on("message", async (message) => {
  if (message.author.bot) return;
  let dmembed2 = new MessageEmbed()
    .setDescription(`Sorry We Don't Provide Dm Support.`)
    .setColor("RED");
  if (message.channel.type === "dm") {
    if (cooldown.has(message.author.id)) return;
    if (message.author.bot) return;

    message.channel.send(dmembed2);
    cooldown.add(message.author.id);
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, 200000);
    return;
  }
  if (message.channel.name.startsWith("ticket-")) {
    if (!message.member.roles.cache.has("499965086304043008")) return;
    if (!message.content.startsWith("-")) {
      const ticket66 = await Ticket.findOne({
        where: { channelId: message.channel.id },
      });

      if (!ticket66.staff) {
        message.channel.messages
          .fetch({ around: ticket66.optionsMessageId, limit: 1 })
          .then(async (msg) => {
            let iuser = message.guild.members.cache.get(ticket66.authorId);
            ticket66.staff = message.author.id;

            let infoembed = new MessageEmbed()
              .setDescription(
                `Dear, ${iuser} \n  Your support ticket has been created. \n A Staff Member Is Currently here to help you. \n\n Department: ${await ticket66.getDataValue(
                  "department"
                )} \n Staff: ${
                  message.author
                } \n\n Below are reaction options! `
              )
              .addField("Close", `❌`)
              .addField("Send Me A Copy Of The Ticket on close!", `📩`);
            let fecthmsg = msg.first();
            fecthmsg.edit(infoembed);
            await ticket66.save();
          });
      }
    }
  }
  let dmembed = new MessageEmbed()
    .setDescription(`Sorry We Don't Provide Dm Support.`)
    .setColor("RED");
  if (message.channel.type === "dm") {
    if (cooldown.has(message.author.id)) return;
    if (message.author.bot) return;

    message.channel.send(dmembed);
    cooldown.add(message.author.id);
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, 200000);
    return;
  }

  var args = message.content.slice(1).trim().split(" ");
  if (message.content.toLocaleLowerCase() === `${prefix}ping`) {
    let botMsg = await message.channel.send("〽️ " + "Pinging");

    let b;
    if (Math.round(client.ws.ping) >= 300) b = "true";
    if (Math.round(client.ws.ping) < 300) b = "false";

    let d;

    if (Math.round(botMsg.createdAt - message.createdAt) >= 500) d = "true";
    if (Math.round(botMsg.createdAt - message.createdAt) < 500) d = "false";

    const embed = new MessageEmbed()
      .setAuthor(client.user.tag, client.user.avatarURL())
      .setThumbnail(client.user.avatarURL())
      .setTitle("Pong!")
      .setTimestamp(message.createdTimestamp)
      .addField(
        `Bots Ping`,
        `🏓${Math.round(botMsg.createdAt - message.createdAt)}ms!🏓 `,
        false
      )
      .addField("Api Ping", `🏓${Math.round(client.ws.ping)}ms!🏓`, true)

      .setFooter(
        `Requested By: ${message.author.tag}`,
        message.author.avatarURL({ dynamic: true })
      )
      .setColor("RANDOM");

    return botMsg.edit(" ", embed);
  }
  if (message.content.toLocaleLowerCase() === `${prefix}solved`) {
    let embed = new MessageEmbed().setDescription(
      "Glad We were able to assist you 😃. React With ❌ To close Ticket!"
    );
    let msg2 = await message.channel.send(embed);
    const ticket3 = await Ticket.findOne({
      where: { channelId: message.channel.id },
    });

    ticket3.optionsMessageId = msg2.id;
    await ticket3.save();

    msg2.react("❌");
  }

  if (message.content.toLocaleLowerCase() === `${prefix}close`) {
    let embed = new MessageEmbed().setDescription(
      "Ok To close The Ticket React With ❌!"
    );
    let msg2 = await message.channel.send(embed);
    const ticket3 = await Ticket.findOne({
      where: { channelId: message.channel.id },
    });

    ticket3.optionsMessageId = msg2.id;
    await ticket3.save();

    msg2.react("❌");
    return;
  }
  if (args[0].toLocaleLowerCase() === `transfer`) {
    if (!message.channel.name.startsWith("ticket-"))
      return message.channel.send(
        "You Must be In a ticket to change the department!"
      );
    var dep = args[1];
    const role = message.guild.roles.cache.find((r) => r.name === "Staff");

    if (!message.member.roles.cache.has(role.id)) {
      return message.channel.send(
        `Sorry Currently only the staff team can transfer departments!`
      );
    }
    console.log(args);
    if (!dep) {
      return message.reply("No Department selected!");
    }

    console.log("1");
    const ticket2 = await Ticket.findOne({
      where: { channelId: message.channel.id },
    });
    console.log("2");

    if (ticket2) {
      console.log("yes");
      ticket2.department = args[1];
      await ticket2.save();

      message.channel.setTopic(`Department: ${args[1]}`);
      message.channel.messages
        .fetch({ around: ticket2.optionsMessageId, limit: 1 })
        .then(async (msg) => {
          let user = message.guild.members.cache.get(ticket2.authorId);
          let infoembed = new MessageEmbed()
            .setDescription(
              `Dear, ${user} \n  Your support ticket has been created. \n A Staff Member Is Currently here to help you. \n\n Original Department: ${
                ticket2.original
              } \n\n Department: ${await ticket2.department} \n Staff: <@${
                ticket2.staff
              }> \n\n Below are reaction options! `
            )
            .addField("Close", `❌`)
            .addField("Send Me A Copy Of The Ticket on close!", `📩`);
          let fetched = msg.first();
          fetched.edit(infoembed);
          message.channel.send(`Department Set to ${args[1]}`);
        });
    } else {
      console.log("No");
      return message.reply(`Must be a ticket i created!`);
    }
  }

  if (args[0].toLocaleLowerCase() === `stafftransfer`) {
    if (!message.channel.name.startsWith("ticket-"))
      return message.channel.send(
        "You Must be In a ticket to change the department!"
      );
    message.delete();
    var dep =
      message.guild.member(message.mentions.users.first()) ||
      message.guild.members.cache.get(args[1]) ||
      message.author;
    const role = message.guild.roles.cache.find((r) => r.name === "Staff");

    if (!message.member.roles.cache.has(role.id)) {
      return message.channel.send(
        `Sorry Currently only the staff team can transfer Staff!`
      );
    }
    console.log(args);
    if (!dep) {
      return message.reply("No Staff selected!");
    }

    console.log("1");
    const ticket44 = await Ticket.findOne({
      where: { channelId: message.channel.id },
    });
    console.log("2");

    if (ticket44) {
      console.log("yes");
      ticket44.staff = dep.id;
      await ticket44.save();

      //message.channel.setTopic(`Department: ${args[1]}`);
      message.channel.messages
        .fetch({ around: ticket44.optionsMessageId, limit: 1 })
        .then(async (msg) => {
          let user = message.guild.members.cache.get(ticket44.authorId);
          let staff1 = message.guild.members.cache.get(ticket44.staff);
          let infoembed = new MessageEmbed()
            .setDescription(
              `Dear, ${user} \n  Your support ticket has been created. \n A Staff Member Is Currently here to help you. \n\n Original Department: ${
                ticket44.original
              } \n\n Department: ${await ticket44.department} \n Staff: <@${
                ticket44.staff
              }> \n\n Below are reaction options! `
            )
            .addField("Close", `❌`)
            .addField("Send Me A Copy Of The Ticket on close!", `📩`);
          let fetched = msg.first();
          fetched.edit(infoembed);
          await message.channel.send(`Transferred To ${dep}`).then((msg) => {
            msg.delete({ timeout: 5000 });
          });
        });
    } else {
      console.log("No");
      return message.reply(`Must be a ticket i created!`);
    }
  }

  if (
    message.content.toLocaleLowerCase() === `${prefix}setup` &&
    message.member.roles.cache.find((r) => r.name === process.env.staff)
  ) {
    try {
      const filter = (m) => m.author.id === message.author.id;
      await message.channel.send(
        "Please enter the message id for this ticket!"
      );
      const msgId = (
        await message.channel.awaitMessages(filter, { max: 1 })
      ).first().content;
      const fetchMsg = await message.channel.messages.fetch(msgId);

      message.channel.send(
        "Please enter the category id for the tickets to go too!"
      );
      const catId = (
        await message.channel.awaitMessages(filter, { max: 1 })
      ).first().content;
      const catChan = client.channels.cache.get(catId);

      message.channel.send(
        "Please enter the Department for the tickets to go too!"
      );
      const department = (
        await message.channel.awaitMessages(filter, { max: 1 })
      ).first().content;

      if (fetchMsg && catChan) {
        const ticketConfig = TicketConfig.create({
          messageId: msgId,
          guildId: message.guild.id,
          parentId: catChan.id,
          department,
        });

        await fetchMsg.react("🎟️");

        message.channel.send(
          "Successfully added to db! Alert: Msgs will self delete. deleting them will cause the msgs above to be removed!"
        );
        setTimeout(() => {
          message.channel.bulkDelete(8, true);
        }, 5000);
      } else {
        error("Invalid fields!");
      }
    } catch (err) {
      error(err);
    }
  }
});

const found = new Map();

var hi33 = "true";

client.on("messageReactionAdd", async (reaction, user) => {
  const message = reaction.message;
  if (user.bot) return;
  if (reaction.emoji.name === "🎟️") {
    reaction.users.remove(user.id);
    const ticketConfig = await TicketConfig.findOne({
      where: { messageId: reaction.message.id },
    });
    if (ticketConfig) {
      const findTicket = await Ticket.findOne({
        where: { authorId: user.id, resolved: false },
      });

      if (findTicket) {
        let existing = new MessageEmbed()
          .setAuthor(reaction.message.guild.name)
          .setDescription("Error While Making The Ticket (Duplicate)")

          .setColor("RED")
          .setThumbnail(reaction.message.guild.iconURL())

          .setFooter(
            "You have a ticket already",
            "https://cdn.discordapp.com/attachments/664911476405960754/693556558130577478/Fallout_icon.png"
          );
        user.send(existing).catch((err) => error(err));
      } else {
        console.log("Making A Ticket...");
        try {
          const staffrole = reaction.message.guild.roles.cache.find(
            (r) => r.name === process.env.staff
          );
          let staffid = staffrole.id;

          const channel = await reaction.message.guild.channels.create(
            "ticket",
            {
              parent: await ticketConfig.getDataValue("parentId"),
              topic: `Department: ${await ticketConfig.getDataValue(
                "department"
              )}`,
              permissionOverwrites: [
                { deny: "VIEW_CHANNEL", id: reaction.message.guild.id },
                { allow: "VIEW_CHANNEL", id: user.id },
                { allow: "VIEW_CHANNEL", id: staffid },
              ],
              reason: `${user.tag} Had Reacted To Open this ticket!`,
            }
          );
          let infoembed = new MessageEmbed()
            .setDescription(
              `Dear, ${user} \n  Your support ticket has been created. \n Please wait for a member of the Support Team to help you out. \n\n Department: ${await ticketConfig.getDataValue(
                "department"
              )} \n Staff: No Staff Assigned! \n\n Below are reaction options! `
            )
            .addField("Close", `❌`)
            .addField("Send Me A Copy Of The Ticket on close!", `📩`);

          const msg = await channel.send(infoembed);
          await msg.pin();
          await msg.react("❌");
          await msg.react("📩");

          const ticket = await Ticket.create({
            authorId: user.id,
            channelId: channel.id,
            guildId: reaction.message.guild.id,
            resolved: false,
            optionsMessageId: msg.id,
            department: await ticketConfig.getDataValue("department"),
            original: await ticketConfig.getDataValue("department"),
          });

          const ticketId = String(ticket.getDataValue("ticketId")).padStart(
            4,
            0
          );
          await channel.edit({ name: `ticket-${ticketId}` });

          const filter3 = (m) => m.author.id === user.id;

          await channel.send(`Hello ${user}, How may we help you today?`);

          var department3 = (await channel.awaitMessages(filter3, { max: 1 }))
            .first()
            .content.toLowerCase();
          //if (department3.includes("110")) {
          //  return channel.send(`We are currently looking into this issue at this time We will let you know here when its resolved.`)
          //}
          if (department3.includes("upgrade")) {
            channel.send(
              `Ok we can assist you here. Mind stating what plan or gb you would like to upgrade to?`
            );
            var department5 = (await channel.awaitMessages(filter3, { max: 1 }))
              .first()
              .content.toLowerCase();
            if (department5) {
              channel.send(
                `Perfect Can you list the ip:port of the server you want upgraded?`
              );
              var department5 = (
                await channel.awaitMessages(filter3, { max: 1 })
              )
                .first()
                .content.toLowerCase(); //temp edits
              //let embed3 = new MessageEmbed().setDescription(
              // "Ok I have transferred this to our Support Team! Mind sharing your support pin so we can assist you? This can be found when you log into the [Client Area](https://clients.fallout-hosting.com/) on the top left corner. "
              // );
              let embed3 = new MessageEmbed().setDescription(
                "Ok I have transferred this to our Support Team!  Please Be patient. Also if all possible please supply us your account email so we can look up your account. Staff may ask for transaction info to further verify ownership of the account."
              );
              channel.send(embed3);
              return;
            }
            return;
          }

          if (department3.includes("downgrade")) {
            channel.send(
              `Ok we can assist you here. Mind stating what plan or gb you would like to Downgrade to?`
            );
            var department5 = (await channel.awaitMessages(filter3, { max: 1 }))
              .first()
              .content.toLowerCase();
            if (department5) {
              channel.send(
                `Perfect Can you list the ip:port of the server you want downgraded?`
              );
              var department6 = (
                await channel.awaitMessages(filter3, { max: 1 })
              )
                .first()
                .content.toLowerCase();
              if (department6) {
                //temp edits
                // channel.send(
                //   "Mind sharing your support pin so we can assist you? This can be found when you log into the Client Area on the top left corner."
                // );
                channel.send(
                  "If all possible please supply us your account email so we can look up your account. Staff may ask for transaction info to further verify ownership of the account."
                );
              }
              var a7 = (await channel.awaitMessages(filter3, { max: 1 }))
                .first()
                .content.toLowerCase();
              let embed3 = new MessageEmbed().setDescription(
                "Ok I have transferred this to our Support Team! They can get this completed for you!"
              );
              channel.send(embed3);
              return;
            }
            return;
          }

          if (department3.includes("ftp")) {
            channel.send(`
              ${user}, You can try watching this video: https://youtu.be/zIP5n1ruEgo - Has this helped You? (yes or no)
            `);

            var department4 = (await channel.awaitMessages(filter3, { max: 1 }))
              .first()
              .content.toLowerCase();
            if (department4.startsWith("yes")) {
              let embed = new MessageEmbed().setDescription(
                "Glad i was able to assist you 😃. React With ❌ To close Ticket!"
              );
              let msg2 = await channel.send(embed);
              const ticket3 = await Ticket.findOne({
                where: { channelId: channel.id },
              });

              ticket3.optionsMessageId = msg2.id;
              await ticket3.save();

              msg2.react("❌");
            }
            if (department4.startsWith("no")) {
              //temp edits
              // let embed = new MessageEmbed().setDescription(
              //   "Ok I have transferred this to our Support Team! Mind sharing your support pin so we can assist you? This can be found when you log into the [Client Area](https://clients.fallout-hosting.com/) on the top left corner. "
              // );
              let embed = new MessageEmbed().setDescription(
                "Ok I have transferred this to our Support Team!  Please Be patient. Also if all possible please supply us your account email so we can look up your account. Staff may ask for transaction info to further verify ownership of the account."
              );
              channel.send(embed);
            } else {
              var department5 = (
                await channel.awaitMessages(filter3, { max: 1 })
              )
                .first()
                .content.toLowerCase();
              if (department5.startsWith("yes")) {
                let embed = new MessageEmbed().setDescription(
                  "Glad i was able to assist you 😃. React With ❌ To close Ticket!"
                );
                let msg3 = await channel.send(embed);
                const ticket2 = await Ticket.findOne({
                  where: { channelId: channel.id },
                });

                ticket2.optionsMessageId = msg3.id;
                await ticket2.save();

                msg3.react("❌");
              }
              if (department5.startsWith("no")) {
                //temp edits
                // let embed = new MessageEmbed().setDescription(
                //   "Ok I have transferred this to our Support Team! Mind sharing your support pin so we can assist you? This can be found when you log into the [Client Area](https://clients.fallout-hosting.com/) on the top left corner. "
                // );
                let embed = new MessageEmbed().setDescription(
                  "Ok I have transferred this to our Support Team!  Please Be patient. Also if all possible please supply us your account email so we can look up your account. Staff may ask for transaction info to further verify ownership of the account."
                );
                channel.send(embed);
              }
            }
          } else {
            //temp edits
            // let embed = new MessageEmbed().setDescription(
            //   "Ok I have transferred this to our Support Team! Mind sharing your support pin so we can assist you? This can be found when you log into the [Client Area](https://clients.fallout-hosting.com/) on the top left corner. "
            // );
            let embed = new MessageEmbed().setDescription(
              "Ok I have transferred this to our Support Team!  Please Be patient. Also if all possible please supply us your account email so we can look up your account. Staff may ask for transaction info to further verify ownership of the account."
            );
            if (ticket.department === "ModPacks") {
              channel.send("<@239586213860868096>", embed);
            } else {
              channel.send(embed);
            }
          }
        } catch (err) {
          error(err);
        }
      }
    } else {
      return;
    }
  }
  if (reaction.emoji.name === "❌") {
    message.reactions.removeAll();

    const ticket = await Ticket.findOne({
      where: { channelId: reaction.message.channel.id },
    });

    if (ticket) {
      reaction.message.channel
        .updateOverwrite(ticket.getDataValue("authorId"), {
          VIEW_CHANNEL: false,
        })
        .then(() => {
          found.set("1", true);
        })
        .catch((err) => {
          hi33 = "false";
          found.set("1", false);
          reaction.message.channel.send(
            "Error Had Happened! Member no longer exist or Cant be found! Force Closing in 60 Seconds! Run ``-cancel 1`` to stop!"
          );
          force.set("1", "true");
          setTimeout(async () => {
            let getforce = force.get("1");
            if (getforce !== "true") return;
            let yt3 = `${message.channel.name}-closed-forced`;
            message.channel.send("Force Saving Transcript... Please Wait.");

            let test = message.guild.channels.cache.find(
              (r) => r.name === "transcripts"
            );

            let messageCollection = new Discord.Collection();
            let channelMessages = await message.channel.messages
              .fetch({
                limit: 100,
              })
              .catch((err) => console.log(err));

            messageCollection = messageCollection.concat(channelMessages);

            while (channelMessages.size === 100) {
              let lastMessageId = channelMessages.lastKey();
              channelMessages = await message.channel.messages
                .fetch({ limit: 100, before: lastMessageId })
                .catch((err) => console.log(err));
              if (channelMessages)
                messageCollection = messageCollection.concat(channelMessages);
            }
            let msgs = messageCollection.array().reverse();
            let data = await fs.readFile(
              "./template.html",
              "utf8",
              function (err, data) {
                if (data) {
                  fs.writeFile("index.html", data, function (err, data) {});
                  let guildElement = document.createElement("div");
                  let guildText = document.createTextNode(message.guild.name);
                  let guildImg = document.createElement("img");
                  guildImg.setAttribute("src", message.guild.iconURL());
                  guildImg.setAttribute("width", "150");
                  guildElement.appendChild(guildImg);
                  guildElement.appendChild(guildText);
                  console.log(guildElement.outerHTML);
                  fs.appendFile(
                    "index.html",
                    guildElement.outerHTML,
                    function (err, data) {}
                  );

                  msgs.forEach(async (msg) => {
                    let parentContainer = document.createElement("div");
                    parentContainer.className = "parent-container";

                    let avatarDiv = document.createElement("div");
                    avatarDiv.className = "avatar-container";
                    let img = document.createElement("img");
                    img.setAttribute(
                      "src",
                      msg.author.avatarURL({ dynamic: true })
                    );
                    img.className = "avatar";
                    avatarDiv.appendChild(img);

                    parentContainer.appendChild(avatarDiv);

                    let messageContainer = document.createElement("div");
                    messageContainer.className = "message-container";

                    let nameElement = document.createElement("span");
                    let name = document.createTextNode(
                      msg.author.tag +
                        " " +
                        msg.createdAt.toDateString() +
                        " " +
                        msg.createdAt.toLocaleTimeString() +
                        " EST"
                    );
                    nameElement.appendChild(name);
                    messageContainer.append(nameElement);

                    if (msg.content.startsWith("```")) {
                      let m = msg.content.replace(/```/g, "");
                      let codeNode = document.createElement("code");
                      let textNode = document.createTextNode(m);
                      codeNode.appendChild(textNode);
                      messageContainer.appendChild(codeNode);
                    } else {
                      let msgNode = document.createElement("span");
                      let textNode = document.createTextNode(msg.content);
                      msgNode.append(textNode);
                      messageContainer.appendChild(msgNode);
                    }
                    parentContainer.appendChild(messageContainer);
                    await fs.appendFile(
                      "index.html",
                      parentContainer.outerHTML,
                      function (err, data) {}
                    );
                  });
                } else {
                  message.channel.send("opps no data");
                }
              }
            );
            setTimeout(() => {
              let channel = message.channel;
              const path = "./index.html";
              let me2 = ticket.getDataValue("authorId");
              //let member = message.guild.members.cache.get(me2).catch;

              let check = false;
              // if (checksave.has(me2)) check = checksave.get(me2);
              // if (!checksave.has(me2)) check = false;

              test.send({
                files: [
                  {
                    attachment: path,
                    name: `${yt3}.html`,
                  },
                ],
              });
              setTimeout(async () => {
                let channel = message.channel;
                fs.unlinkSync(path);
              }, 10000);
            }, 5000);
            let channel22 = message.channel;
            channel22
              .send("Forced Transcript Saved! Force Clossing....")
              .then(() => {
                setTimeout(() => {
                  // who would be able to run the cmd

                  let yt = reaction.message.channel;

                  let me2 = ticket.getDataValue("authorId");

                  let yy = reaction.message.guild.channels.cache.find(
                    (r) => r.name === process.env.logs
                  );
                  if (!yy)
                    return reaction.message.channel.send(
                      "couldn't Find `` " + process.env.logs + "``"
                    );

                  let ch = me2;

                  //let member = reaction.message.guild.members.cache.get(me2);

                  const embed = new MessageEmbed()
                    .setTitle("Ticket Closed")
                    .setColor("#6441a5")
                    .setAuthor(user.tag, user.avatarURL({ dynamic: true }))
                    .addField("Closed By:", user.tag)
                    .addField(`${yt.name} `, `Ticket Author <@${me2}>`)
                    .addField(
                      `Forced Closed!`,
                      `${client.user} Had forced closed the ticket with reason: \`\` Error: No User Found or they left the server!\`\``
                    )
                    .addField(
                      "Original Department:",
                      ticket.getDataValue("original")
                    )
                    .addField(
                      "Department When Closed:",
                      ticket.getDataValue("department")
                    )
                    //.setThumbnail(member.user.avatarURL({ dynamic: true }))
                    .setTimestamp(message.createdTimestamp);

                  yy.send(embed);

                  yt.delete();
                  found.delete();
                }, 5000);
              }, 5000);
          }, 60000);
          return;
        });
      let getfound = found.get("1");
      if (!getfound) return console.log("Found!");

      if (hi33 === "true") {
        ticket.resolved = true;
        await ticket.save();

        const optionsMessageId = ticket.getDataValue("optionsMessageId");
        if (reaction.message.id === optionsMessageId) {
          if (reaction.message.channel.name.endsWith("-hold"))
            return message.reply(
              "I Can't Close tickets that where placed on hold"
            );
          let channel = reaction.message.channel;
          channel.send("Logging Channel... Please Wait.");
          setTimeout(async () => {
            let yt3 = `${message.channel.name}-closed`;
            message.channel.send("Saving Transcript... Please Wait.");

            let test = message.guild.channels.cache.find(
              (r) => r.name === "transcripts"
            );

            let messageCollection = new Discord.Collection();
            let channelMessages = await message.channel.messages
              .fetch({
                limit: 100,
              })
              .catch((err) => console.log(err));

            messageCollection = messageCollection.concat(channelMessages);

            while (channelMessages.size === 100) {
              let lastMessageId = channelMessages.lastKey();
              channelMessages = await message.channel.messages
                .fetch({ limit: 100, before: lastMessageId })
                .catch((err) => console.log(err));
              if (channelMessages)
                messageCollection = messageCollection.concat(channelMessages);
            }
            let msgs = messageCollection.array().reverse();
            let data = await fs.readFile(
              "./template.html",
              "utf8",
              function (err, data) {
                if (data) {
                  fs.writeFile("index.html", data, function (err, data) {});
                  let guildElement = document.createElement("div");
                  let guildText = document.createTextNode(
                    message.guild.name + "TEST!"
                  );
                  let guildImg = document.createElement("img");
                  guildImg.setAttribute("src", message.guild.iconURL()); //message.guild.iconURL()
                  guildImg.setAttribute("width", "150");
                  guildElement.appendChild(guildImg);
                  guildElement.appendChild(guildText);
                  console.log(guildElement.outerHTML);
                  fs.appendFile(
                    "index.html",
                    guildElement.outerHTML,
                    function (err, data) {}
                  );

                  msgs.forEach(async (msg) => {
                    let parentContainer = document.createElement("div");
                    parentContainer.className = "parent-container";

                    let avatarDiv = document.createElement("div");
                    avatarDiv.className = "avatar-container";
                    let img = document.createElement("img");
                    img.setAttribute(
                      "src",
                      msg.author.avatarURL({ dynamic: true })
                    );
                    img.className = "avatar";
                    avatarDiv.appendChild(img);

                    parentContainer.appendChild(avatarDiv);

                    let messageContainer = document.createElement("div");
                    messageContainer.className = "message-container";

                    let nameElement = document.createElement("span");
                    let name = document.createTextNode(
                      msg.author.tag +
                        " " +
                        msg.createdAt.toDateString() +
                        " " +
                        msg.createdAt.toLocaleTimeString() +
                        " EST"
                    );
                    nameElement.appendChild(name);
                    messageContainer.append(nameElement);

                    if (msg.content.startsWith("```")) {
                      let m = msg.content.replace(/```/g, "");
                      let codeNode = document.createElement("code");
                      let textNode = document.createTextNode(m);
                      codeNode.appendChild(textNode);
                      messageContainer.appendChild(codeNode);
                    } else {
                      let msgNode = document.createElement("span");
                      let textNode = document.createTextNode(msg.content);
                      msgNode.append(textNode);
                      messageContainer.appendChild(msgNode);
                    }
                    parentContainer.appendChild(messageContainer);
                    await fs.appendFile(
                      "index.html",
                      parentContainer.outerHTML,
                      function (err, data) {}
                    );
                  });
                } else {
                  message.channel.send("opps no data");
                }
              }
            );
            setTimeout(() => {
              const path = "./index.html";
              let me2 = ticket.getDataValue("authorId");
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
                      name: `${yt3}.html`,
                    },
                  ],
                });
              }

              test.send({
                files: [
                  {
                    attachment: path,
                    name: `${yt3}.html`,
                  },
                ],
              });
              setTimeout(() => {
                fs.unlinkSync(path);
              }, 10000);
            }, 5000);
            channel.send("Transcript Saved! Clossing....").then(() => {
              setTimeout(() => {
                // who would be able to run the cmd

                let yt = reaction.message.channel;

                let me2 = ticket.getDataValue("authorId");

                let yy = reaction.message.guild.channels.cache.find(
                  (r) => r.name === process.env.logs
                );
                if (!yy)
                  return reaction.message.channel.send(
                    "couldn't Find `` " + process.env.logs + "``"
                  );

                let ch = me2;

                let member = reaction.message.guild.members.cache.get(me2);

                const embed = new MessageEmbed()
                  .setTitle("Ticket Closed")
                  .setColor("#6441a5")
                  .setAuthor(user.tag, user.avatarURL({ dynamic: true }))
                  .addField("Closed By:", user.tag)
                  .addField(`${yt.name} `, `Ticket Author ${member.user.tag}`)
                  .addField(
                    "Original Department:",
                    ticket.getDataValue("original")
                  )
                  .addField(
                    "Department When Closed:",
                    ticket.getDataValue("department")
                  )
                  .setThumbnail(member.user.avatarURL({ dynamic: true }))
                  .setTimestamp(message.createdTimestamp);

                yy.send(embed);

                yt.delete();
                found.delete();
              }, 5000);
            }, 5000);
          }, 20000);
        }
      } else {
        return;
      }
    }
  }
  if (reaction.emoji.name === "✅") {
    let role = message.guild.roles.cache.get("615745929550626827");
    let member = message.guild.members.cache.get(user.id);
    if (member.roles.cache.has(role.id)) {
      member.roles.remove(role.id);
    } else {
      member.roles.add(role.id);
    }
  }
  if (reaction.emoji.name === "📩") {
    reaction.users.remove(user.id);
    const ticket2 = await Ticket.findOne({
      where: { channelId: reaction.message.channel.id },
    });
    let me2 = ticket2.getDataValue("authorId");
    let member = message.guild.members.cache.get(me2);
    if (user.id === member.id) {
      let check = false;
      let hi = checksave.has(user.id);
      if (!hi) check = true;
      check ? save(user.id, true) : save(user.id, false);

      return check
        ? message.channel.send(
            "OK ill send you a Transcript when your ticket closes!"
          )
        : message.channel.send(
            "OK ill no longer send you a Transcript when your ticket closes!"
          );
    } else {
      return message.reply("You are not the owner of this ticket.");
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
