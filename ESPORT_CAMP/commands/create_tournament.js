const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const dataFile = path.join(__dirname, "../tournaments.json");

function getTournamentCount() {
  try {
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ count: 0 }));
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return data.count || 0;
  } catch {
    return 0;
  }
}

function incrementTournamentCount() {
  const current = getTournamentCount();
  const updated = current + 1;
  fs.writeFileSync(dataFile, JSON.stringify({ count: updated }, null, 2));
  return updated;
}

module.exports = {
  name: "ct",
  description: "Create a Free Fire tournament announcement.",

  async execute(message, args) {
    try {
      // ✅ Owners Only
      const ownerIDs = process.env.OWNER_IDS?.split(",").map((id) => id.trim());
      if (!ownerIDs || !ownerIDs.includes(message.author.id)) {
        return message.reply("🚫 You are not authorized to use this command.");
      }

      // ✅ Validate Arguments
      if (!args || args.length < 2) {
        return message.reply(
          "❌ Usage: `!ct <time> <mode> [players] [entryFee] [today|tom]`\n" +
            "Examples:\n" +
            "`!ct 10am br`\n`!ct 2pm cs 50p 15₹ tom`"
        );
      }

      const formUrl = process.env.FORM_URL;
      const channelIds = process.env.CHANNEL_IDS?.split(",").map((id) => id.trim());

      if (!formUrl || !channelIds?.length)
        return message.reply("⚠️ Missing `FORM_URL` or `CHANNEL_IDS` in `.env` file.");

      // --- Parse args ---
      const rawTime = args[0];
      const rawMode = args[1]?.toLowerCase();

      let players = null;
      let entryFee = null;
      let dayArg = "today";

      // Loop args after mode
      for (let i = 2; i < args.length; i++) {
        const arg = args[i].toLowerCase();
        if (arg.endsWith("p") && !isNaN(arg.replace("p", ""))) {
          players = arg.replace("p", "");
        } else if (arg.includes("₹") || /^\d+$/.test(arg)) {
          entryFee = arg.includes("₹") ? arg : `${arg}₹`;
        } else if (["tom", "tomorrow", "today"].includes(arg)) {
          dayArg = arg;
        }
      }

      // --- Check for missing ---
      if (!players)
        return message.reply(
          "⚠️ Please include player count, e.g. `45p`. Example: `!ct 10am br 45p 10₹ tom`"
        );
      if (!entryFee) entryFee = "10₹";

      // --- Mode ---
      const modeText =
        rawMode === "br"
          ? "Battle Royale (SOLO)"
          : rawMode === "cs"
          ? "Clash Squad (SQUAD)"
          : "Custom Match";

      // --- Date ---
      const dateObj = new Date();
      if (dayArg === "tom" || dayArg === "tomorrow")
        dateObj.setDate(dateObj.getDate() + 1);
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
      });

      const randomID = Math.floor(100000 + Math.random() * 900000);
      const tournamentNumber = incrementTournamentCount();

      // --- Tournament Text ---
      const tournamentText = `# Free Fire Tournament

<:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462>
<a:dot:1435228089478025329> **Date: ${formattedDate}**
<a:pointer:1436712394553294879> **Time: ${rawTime}**
<a:dot:1435228089478025329> **Mode: ${modeText}**
<a:pointer:1436712394553294879> **Map: BERMUDA**
<a:pointer:1436712394553294879> **Entry Fee: ${entryFee}**
<a:dot:1435228089478025329> **Entry Players: ${players}**
# Winners 
<:arrow:1436788719880503437> **Top 1: 30₹ + 4₹/Kill**
<:arrow:1436788719880503437> **Top 2: 20₹ + 4₹/Kill**
<:arrow:1436788719880503437> **Top 3: 10₹ + 4₹/Kill**
<:line:1436705708602294282> **Last Zero Kills Player Will Get 1 Chance To Play 4v4 CS ! Winning Team Will Get 6₹/Player**
<:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462>
**Your tournament ID:** ||${randomID}||
<:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462><:white_line:1435300387551969462>`;

      // --- Container ---
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(tournamentText)
      );

      // --- Join Button ---
      const joinButton = new ButtonBuilder()
        .setLabel("Join Tournament")
        .setStyle(ButtonStyle.Link)
        .setURL(formUrl);
      const row = new ActionRowBuilder().addComponents(joinButton);

      // --- Send Message to Channels ---
      let sentCount = 0;
      for (const id of channelIds) {
        const ch = message.client.channels.cache.get(id);
        if (!ch) continue;

        try {
          await ch.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
          await ch.send({ components: [row] });
          sentCount++;
        } catch (err) {
          console.warn(`⚠️ Failed to send to channel ${id}:`, err.message);
        }
      }

      // ✅ Reply with summary
      await message.reply(
        `✅ **Tournament Created**\n` +
          `📅 **Created Tournament ${tournamentNumber}** on **${formattedDate}**\n\n` +
          `🏷️ **Tournament ID:** ${randomID}\n` +
          `🎮 **Mode:** ${modeText}\n` +
          `👥 **Players:** ${players}\n` +
          `🕒 **Time:** ${rawTime}\n` +
          `💰 **Entry Fee:** ${entryFee}\n\n` +
          `📢 Sent to **${sentCount} channel(s)** successfully.`
      );
    } catch (err) {
      console.error("❌ Error executing create_tournament:", err);
      await message.reply("⚠️ Error executing that command.");
    }
  },
};
