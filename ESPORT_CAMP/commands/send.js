const { ContainerBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require("discord.js");

module.exports = {
  name: "send",
  description: "Send a custom container message to a channel",

  async execute(message, args) {
    try {
      // ✅ Owners Only
      const ownerIDs = process.env.OWNER_IDS?.split(",").map(id => id.trim());
      if (!ownerIDs || !ownerIDs.includes(message.author.id)) {
        return message.reply("🚫 You are not authorized to use this command.");
      }

      // ✅ Validate args
      if (!args.length) {
        return message.reply("❌ Usage: `!send @channel Your message here`");
      }

      const channelMention = args[0];
      const content = args.slice(1).join(" ");
      if (!content) return message.reply("❌ Please provide a message to send.");

      const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(channelMention.replace(/\D/g, ""));

      if (!channel) return message.reply("❌ Invalid channel.");

      // --- Container ---
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
      );

      // --- Optional Button Example ---
      // const row = new ActionRowBuilder().addComponents(
      //   new ButtonBuilder()
      //     .setLabel("Click Me")
      //     .setStyle(ButtonStyle.Link)
      //     .setURL("https://example.com")
      // );

      // --- Send Container ---
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });

      // await channel.send({ components: [row] }); // Optional button

      await message.reply(`✅ Sent your message in ${channel}.`);
    } catch (err) {
      console.error("❌ Error executing send command:", err);
      await message.reply("⚠️ Error executing that command.");
    }
  },
};
