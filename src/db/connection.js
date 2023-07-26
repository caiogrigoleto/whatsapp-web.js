const mysql = require('mysql2/promise');

const connection = mysql.createPool(
  {
    host: 'mysql.mentorasolucoes.com.br',
    port: 3306,
    user: 'mentorasolucoe03',
    password: 'Compass2022',
    database: 'mentorasolucoe03'
  }
);

module.exports = connection;