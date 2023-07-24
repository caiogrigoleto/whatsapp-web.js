const connection = require('./connection');

const insertUser = async (data) => {
  const result = await connection.query('INSERT INTO usuarios SET ?', data);
  return result;
}

module.exports = insertUser;