const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "sendm",
  description: "Send a custom message to a specified channel",
  async execute(message, args) {
    // Check permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ You don’t have permission to use this command.");
    }

    // Get mentioned channel
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply("⚠️ Please mention a valid channel.\nExample: `!sendm #general`");
    }

    // 📝 Your custom message (edit this text)
    const customMessage = "**📢 Announcement:**\nGet ready for the upcoming tournament! 🎮🔥";

    try {
      await channel.send(customMessage);
      await message.reply(`✅ Message successfully sent in ${channel}.`);
    } catch (error) {
      console.error(error);
      await message.reply("❌ Failed to send the message. Check my permissions!");
    }
  },
};
