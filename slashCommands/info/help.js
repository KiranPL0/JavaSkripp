const {
  Client,
  Interaction,
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");

module.exports = {
  name: "help",
  description: "Get some help.",
  usage: "[command name]",
  options: [
    {
      name: "cmdname",
      description: "The name of the command you want help for.",
      type: "STRING",
      required: false,
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  run: async (client, interaction) => {
    if (interaction.options.getString("cmdname")) {
      const embed = new MessageEmbed();
      const cmd =
        client.slashCommands.get(interaction.options.getString("cmdname")) ||
        client.slashCommands.find((c) =>
          c.aliases?.includes(
            interaction.options.getString("cmdname").toLowerCase()
          )
        );
      if (!cmd) {
        return interaction.reply({
          embeds: [
            embed
              .setColor(interaction.color)
              .setDescription(
                `No information found for command **${args.toLowerCase()}**`
              )
              .setTitle("Uh oh!")
              .setFooter({
                text: client.user.username,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
              })
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }
      if (cmd.name) embed.addField("**Command name**", `\`${cmd.name}\``);
      if (cmd.name)
        embed.setTitle(`Detailed Information about:\`${cmd.name}\``);
      if (cmd.description)
        embed.addField("**Description**", `\`${cmd.description}\``);
      if (cmd.aliases)
        embed.addField(
          "**Aliases**",
          `\`${cmd.aliases.map((a) => `${a}`).join("`, `")}\``
        );
      if (cmd.usage) {
        embed.addField("**Usage**", `\`.${cmd.name} ${cmd.usage}\``);
        embed.setFooter({
          text: "Syntax: <> = required, [] = optional",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });
      } else {
        embed.addField("**Usage**", `\`${interaction.prefix}${cmd.name}\``);
        embed.setFooter({
          text: client.user.username,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });
      }
      return interaction.reply({
        embeds: [embed.setColor(interaction.color).setTimestamp()],
      });
    } else {
      const directories = [
        ...new Set(client.slashCommands.map((cmd) => cmd.directory)),
      ];

      /**
       *
       * @param {String} str
       * @returns string
       */
      const formatString = (str) =>
        `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;

      const categories = directories.map((dir) => {
        const getCommands = client.slashCommands
          .filter((cmd) => cmd.directory === dir)
          .map((cmd) => {
            return {
              name: cmd.name || "???",
              description: cmd.description || "no description for this command",
            };
          });

        return {
          directory: formatString(dir),
          commands: getCommands,
        };
      });

      const embed = new MessageEmbed()
        .setTitle("I heard you needed some help.")
        .setDescription(
          "Please choose a category using the dropdown menu below. If you want to see information about a specific command, use `/help [command name]`."
        )
        .setColor(interaction.color)
        .setFooter({
          text: client.user.username,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      /**
       *
       * @param {Boolean} state
       * @returns MessageActionRow
       */
      const components = (state) => [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("help-menu")
            .setPlaceholder("Category...")
            .setDisabled(state)
            .addOptions(
              categories.map((cmd) => {
                return {
                  label: cmd.directory,
                  value: cmd.directory.toLowerCase(),
                  description: `Commands from the ${cmd.directory} category`,
                };
              })
            )
        ),
      ];

      await interaction.reply({
        embeds: [embed],
        components: components(false),
        fetchReply: true,
        ephemeral: true,
      });

      const filter = (int) => int.user.id === interaction.user.id;

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: "SELECT_MENU",
        time: 30 * 1000,
      });

      collector.on("collect", (int) => {
        const [directory] = int.values;
        const category = categories.find(
          (x) => x.directory.toLowerCase() === directory
        );

        const categoryEmbed = new MessageEmbed()
          .setTitle(`${formatString(directory)} commands`)
          .setDescription(
            `Here is a list of commands from the ${directory} category.`
          )
          .addFields(
            category.commands.map((cmd) => {
              return {
                name: `\`${cmd.name}\``,
                value: cmd.description,
                inline: true,
              };
            })
          )
          .setColor(interaction.color)
          .setFooter({
            text: client.user.username,
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        int.update({ embeds: [categoryEmbed] });
      });

      collector.on("end", () => {
        interaction.editReply({
          content: "You ran out of time! Do /help again.",
          components: components(true),
        });
      });
    }
  },
};
