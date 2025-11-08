require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");

const RESULT_CHANNEL_ENV = process.env.RESULT_CHANNEL_ID;

module.exports = {
  name: "ar",
  description:
    "Add and announce Free Fire tournament results in container style (supports 1-5 players)",

  async execute(message, args, client) {
    // guard to avoid double-processing if your bot fires twice
    if (message._resultHandled) return;
    message._resultHandled = true;

    try {
      // ensure client present
      if (!client) client = message.client;
      if (!client) {
        console.error("[result.js] missing client object");
        return message.reply("⚠️ Bot internal error: client missing.");
      }

      // ensure env channel id
      if (!RESULT_CHANNEL_ENV) {
        console.error("[result.js] RESULT_CHANNEL_ID missing in .env");
        return message.reply("⚠️ Configuration error: RESULT_CHANNEL_ID missing in .env");
      }

      // minimum args check
      if (!args || args.length < 2) {
        return message.reply(
          "⚠️ Incorrect format.\nUse: `!ar @user1 <kills> <earned> [@user2 <kills> <earned> ...] <tournament_id>`"
        );
      }

      // tournament id is last arg
      const tournamentId = args[args.length - 1];
      if (!tournamentId || typeof tournamentId !== "string") {
        return message.reply("⚠️ Invalid tournament id. It should be the last argument.");
      }

      // get mentioned users reliably
      const mentions = Array.from(message.mentions.users.values()); // preserves order of mention appearance
      if (mentions.length === 0) {
        return message.reply("⚠️ Please mention at least one player (e.g. @player).");
      }

      // parse each mention's kills & earned
      const players = [];
      for (const user of mentions) {
        // find the arg index that contains this mention (<@123> or <@!123>)
        const mentionRegex = new RegExp(`^<@!?${user.id}>$`);
        const mentionArgIndex = args.findIndex((a) => mentionRegex.test(a));
        if (mentionArgIndex === -1) {
          console.warn(`[result.js] couldn't find mention token for user ${user.id}`);
          continue; // skip if not found
        }

        const killsArg = args[mentionArgIndex + 1];
        const earnedArg = args[mentionArgIndex + 2];

        const kills = killsArg ? parseInt(killsArg, 10) : NaN;
        const earned = earnedArg ? parseInt(earnedArg, 10) : NaN;

        if (Number.isNaN(kills) || Number.isNaN(earned)) {
          return message.reply(
            `⚠️ Invalid numbers for ${user.username}. Usage per player: @user <kills> <earned>`
          );
        }

        players.push({
          id: user.id,
          name: user.username,
          kills,
          earned,
        });
      }

      if (players.length === 0) {
        return message.reply("⚠️ No valid player data parsed. Make sure you mentioned users and provided numbers.");
      }

      // limit to top 5 to match your layout
      const displayPlayers = players.slice(0, 5);

      // Build message text (single-column content placed into container)
      const rankIcons = [
        "<:first:1436627726676004997>",
        "<:second:1436627921597890671>",
        "<:third:1436628038191157318>",
        "<:FourthCohort:1436628702174773290>",
        "<:five:1436639247854735370>",
      ];

      let leftColumn = "# **Esport Camp Winners**\n" + "<:white_line:1435300387551969462>".repeat(12) + "\n\n";
      // We'll build a single content string but structure it so it looks nice when rendered
      for (let i = 0; i < displayPlayers.length; i++) {
        const p = displayPlayers[i];
        leftColumn += `# ${rankIcons[i] || "🎖️"} TOP ${i + 1}\n`;
        leftColumn += `- **@${p.name}** <a:funny_white_man:1436641461948125276>\n`;
        leftColumn += `- **${p.kills}** **Kills** <a:skull:1436642170290573423>\n`;
        leftColumn += `- ₹**${p.earned}** **Earned** <a:money_money_money:1436643524752707624>\n\n`;
      }

      leftColumn += "<:white_line:1435300387551969462>".repeat(12) + `\n\n|| **Tournament ID:** \`${tournamentId}\` ||`;

      // Build the container (single TextDisplayBuilder; safe V2 usage)
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(leftColumn)
      );

      // fetch result channel (use fetch first to ensure up-to-date)
      let resultChannel = null;
      try {
        resultChannel = await client.channels.fetch(RESULT_CHANNEL_ENV);
      } catch (fetchErr) {
        console.warn("[result.js] fetch failed, falling back to cache:", fetchErr && fetchErr.message);
        resultChannel = client.channels.cache.get(RESULT_CHANNEL_ENV) || null;
      }

      if (!resultChannel) {
        console.error("[result.js] result channel not found:", RESULT_CHANNEL_ENV);
        return message.reply("⚠️ Result channel not found. Check RESULT_CHANNEL_ID in .env and bot permissions.");
      }

      // send container (no content field when using ComponentsV2)
      await resultChannel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });

      return message.reply(`✅ Successfully posted results for tournament ${tournamentId} in <#${RESULT_CHANNEL_ENV}>`);
    } catch (err) {
      // very detailed logging so you can paste this if it still fails
      console.error("⚠️ FULL ERROR in result.js:", err);
      // show the message to the user so you don't get just the generic reply
      const userMsg = err && err.message ? err.message : String(err);
      try {
        return await message.reply(`⚠️ Something went wrong: \`${userMsg}\``);
      } catch (replyErr) {
        // if even reply fails, log and return nothing (so process doesn't crash)
        console.error("[result.js] failed to reply with error message:", replyErr);
      }
    }
  },
};
