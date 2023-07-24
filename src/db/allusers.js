const connection = require('./connection');

const getAllUsers = async () => {
  const result = await connection.query('SELECT * FROM usuarios');
  return result;
}

module.exports = getAllUsers;