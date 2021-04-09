const knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: './vote.db',
    },
    useNullAsDefault:true
  });

module.exports = knex