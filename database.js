const { Sequelize } = require('sequelize');

module.exports = new Sequelize(process.env.db_name, process.env.db_user, process.env.db_pass, {
	dialect: 'mysql',
	host: process.env.db_host
});
