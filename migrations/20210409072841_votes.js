
exports.up = function(knex) {
    return knex.schema.createTable('votes', table => {
      table.increments();
      table.text('name');
      table.integer('tempo');
      table.timestamps(true, true);
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('votes')
};
