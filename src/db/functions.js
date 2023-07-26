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
  const result = await connection.query('SELECT * FROM users WHERE ?', contactId);
  // let dif = (now - result[0][0].ultimoAcesso);

  // console.log(dif);
  // console.log(result);
  // 300000 - 5 mins
  // 60000 - 1 min
  if ((now - result[0][0].ultimoAcesso) > 300000) {
    return false;
  } else {
    return true;
  }
}

const login = async (user, pass) => {
  console.log(user, pass);
  const result = await connection.query('SELECT * FROM users WHERE email = ? AND senha = ?', [user.trim(), pass.trim()]);
  console.log(result);
  console.log(result[0].length);
  if(result[0].length > 0) {
    await connection.query('UPDATE users SET ultimoAcesso = ? WHERE email = ?', [new Date(), user]);
    return true;
  }else{
    return false;
  }
}

module.exports = {
  unLock,
  lock,
  verificaLogin,
  login
}