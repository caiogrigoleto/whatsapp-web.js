const connection = require('./connection');


const unLock = async (email) => {
  const result = await connection.query('UPDATE usuarios SET status = 1 WHERE ?', email);
  return result;  
}

const lock = async (email) => {
  const result = await connection.query('UPDATE usuarios SET status = 0 WHERE ?', email);
  return result;
}

const verificaLogin = async (contactId) => {
  let now = new Date();
  const result = await connection.query('SELECT * FROM usuarios WHERE ?', contactId);
  // let dif = (now - result[0][0].ultimoAcesso);

  // console.log(dif);
  if ((now - result[0][0].ultimoAcesso) > 60000) {
    return false;
  } else {
    return true;
  }
}

const login = async (user, pass) => {
  console.log(user, pass);
  const result = await connection.query('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [user, pass]);
  if(result.length > 0) {
    await connection.query('UPDATE usuarios SET ultimoAcesso = ? WHERE email = ?', [new Date(), user]);
    return result[0];
  }
}

module.exports = {
  unLock,
  lock,
  verificaLogin,
  login
}