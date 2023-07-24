const connection = require('./connection');

const insertChat = async (data) => {
  const result = await connection.query('INSERT INTO chats SET ?', data);
  return result;
}

module.exports = insertChat;