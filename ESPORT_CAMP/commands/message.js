const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  name: "sendm",
  description: "Send a message in a container to a specific channel.",

  async execute(message, args) {
    try {
      // ✅ Owners or Admins only
      const ownerIDs = process.env.OWNER_IDS?.split(",").map((id) => id.trim());
      if (
        !ownerIDs?.includes(message.author.id) &&
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
      ) {
        return message.reply("🚫 You are not authorized to use this command.");
      }

      // ✅ Check if a channel is mentioned
      const channel = message.mentions.channels.first();
      if (!channel)
        return message.reply(
          "⚠️ Please mention a valid channel.\nExample: `!sendm #general`"
        );

      // 🧱 Custom message (you can edit this safely)
      const customMessage = `# <a:heart1:1436704986938478593> Esport Camp 
-# ~~                                                                                               ~~
## <a:hashtag:1438235816072708228> FF Rush Hrs.
<a:pointer:1436712394553294879> **Date: 13 November**
<a:pointer:1436712394553294879> **Time: 04pm**
<a:pointer:1436712394553294879> **Mode: Battle Royale (SOLO)**
<a:pointer:1436712394553294879> **Map: BERMUDA**
<a:pointer:1436712394553294879> **Entry Fee: 10₹**
<a:pointer:1436712394553294879> **Entry Players: 40 - 48**
# <a:hashtag:1438235816072708228> Winners 
<a:green_dot:1438238159220641953> **Top 1: 30₹ + 5₹/Kill**
<a:green_dot:1438238159220641953> **Top 2: 20₹ + 5₹/Kill**
<a:green_dot:1438238159220641953> **Top 3: 10₹ + 5₹/Kill**
<a:green_dot:1438238159220641953> **For All Players: 5₹/Kill**
## <a:hashtag:1438235816072708228> Rules
<a:red_dot:1438237661478391849> **No hacks or teaming**
<a:red_dot:1438237661478391849> **Join room within 2 mins**
<a:red_dot:1438237661478391849> **Use registered IGN only**
<a:red_dot:1438237661478391849> **No join = No reward**
<a:red_dot:1438237661478391849> **Host decision final**
-# ~~                                                                                               ~~
                             <a:purple:1438345613816107121>  **[Join Now](https://docs.google.com/forms/d/e/1FAIpQLSdCLCptnrhCy9Qzvl3sUYhZ5ZMhMvVlCxyxUGVG65_J2Wgorg/viewform?usp=publish-editor)**
-# ~~                                                                                               ~~`

      // 🪟 Create the container
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(customMessage)
      );

      // 📨 Send container message
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });

      await message.reply(`✅ Message sent successfully in ${channel}.`);
    } catch (err) {
      console.error("❌ Error executing sendm:", err);
      await message.reply("⚠️ Something went wrong while sending the message.");
    }
  },
};
