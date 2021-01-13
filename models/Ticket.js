const { DataTypes, Model } = require("sequelize");

module.exports = class Ticket extends (
  Model
) {
  static init(sequelize) {
    return super.init(
      {
        ticketId: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        channelId: {
          type: DataTypes.STRING,
        },
        guildId: {
          type: DataTypes.STRING,
        },
        resolved: {
          type: DataTypes.BOOLEAN,
        },
        optionsMessageId: {
          type: DataTypes.STRING,
        },
        authorId: {
          type: DataTypes.STRING,
        },
        department: {
          type: DataTypes.STRING,
        },
        original: {
          type: DataTypes.STRING,
        },
      },
      {
        tableName: "Tickets",
        sequelize,
      }
    );
  }
};
