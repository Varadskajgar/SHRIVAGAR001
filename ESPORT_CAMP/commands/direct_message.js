const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  MessageFlags 
} = require("discord.js");

module.exports = {
  name: 'dm',
  description: 'Send DM messages in Container style with image',

  async execute(message, args, client) {
    if (!args.length) return message.reply('Please provide arguments.');

    const commandType = args[0].toLowerCase();

    // Help command
    if (commandType === 'help') {
      return message.channel.send(`
**DM Command Help:**

1. **!dm dn @user <tournament_id>** - Registration approved but pending payment
2. **!dm free <tournament_id> @user** - Free tournament registration approved
3. **!dm p @user <tournament_id>** - Payment received confirmation
4. **!dm @user <custom message>** - Send any custom DM
      `);
    }

    try {
      let user, tournamentId, customMessage;

      if (['dn', 'free', 'p'].includes(commandType)) {
        // Get the mentioned user or fetch by ID
        user = message.mentions.users.first() || await client.users.fetch(args[1]);

        // Determine tournament ID (skip the mention if present)
        tournamentId = message.mentions.users.first() ? args[2] : args[1];

        if (!user || !tournamentId) 
          return message.reply('⚠️ User or tournament ID missing.');
      } else {
        // Custom message mode
        user = message.mentions.users.first() || await client.users.fetch(args[0]);

        // Everything after the user mention is the custom message
        customMessage = message.mentions.users.first() ? args.slice(1).join(' ') : args.slice(1).join(' ');

        if (!user || !customMessage) 
          return message.reply('⚠️ User or message missing.');
      }

      // --- Messages templates ---
      const messages = {
        dn: `**# Esport Camp Here 🤍**\n\n**Hello {user},**\n**Your Registration For Tournament ID ||\`${tournamentId}\`|| Is Approved But Still Pending For Payment.**\n**You Can Pay Through QR And Send Screenshot In Ticket **\n**https://cdn.discordapp.com/attachments/1394948887449571368/1436604342294679674/IMG_20251108_120217.jpg **`,
        free: `**# Esport Camp Here 🤍 **\n\n**Hello {user},**\n**Your registration for FREE tournament ID ||\`${tournamentId}\`|| is approved!**\n**You will receive your ID and password 15 min before the match.**\n\n**Rules:**\n1. **Follow all rules**\n2. **Be online 10 mins before start**\n3. **No cheating**`,
        p: `**# Esport Camp Here 🤍 **\n\n**Hello {user},**\n**Your payment for tournament ID ||\`${tournamentId}\`|| has been successfully received!**\n**You will get your ID/password 15 min before the match.**\n\n**Rules:**\n1. **Follow all rules**\n2. **Be online 10 mins before start**\n3. **No cheating**`,
        ir: `**# Esport Camp Here 🤍 **\n\n**Hello {user},**\n**${customMessage}**`
      };

      // Build container text
      let containerText = '';
      if (['dn', 'free', 'p'].includes(commandType)) {
        containerText = messages[commandType].replace(/{user}/g, `<@${user.id}>`);
      } else {
        containerText = messages.ir.replace(/{user}/g, `<@${user.id}>`);
      }

      // --- Build Container ---
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(containerText)
      );

      // --- Send DM with container ---
      await user.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      return message.reply(`✅ Message sent to ${user.tag} successfully.`);

    } catch (err) {
      console.error(err);
      return message.reply('⚠️ Failed to send DM. Make sure the bot shares a server with the user and DMs are open.');
    }
  },
};
