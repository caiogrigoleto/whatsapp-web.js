const { Client, Location, List, Buttons, LocalAuth, MessageMedia } = require('./index');
const qrcode = require('qrcode-terminal');
const express = require('express');

const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const getAllUsers = require('./src/db/allusers');
const insertUser = require('./src/db/insertuser');
const insertChat = require('./src/db/insertChat');
const { unLock, lock, verificaLogin, login } = require('./src/db/functions');

const axios = require('axios');

const apiUrl = 'http://voti-admin-env.eba-9qa2jj8n.us-east-1.elasticbeanstalk.com/';

const app = express();

app.use(bodyParser.json());
app.use(cors());

const secretKey = '';

app.post('/login', (req, res) => {
    // Aqui, você faria a verificação do usuário e senha no banco de dados ou sistema de autenticação
    // Vamos simular que o usuário e senha estão corretos para fins deste exemplo
    const { username, password } = req.body;

    if (username === 'usuario' && password === 'senha') {
        // Dados do usuário autenticado (pode ser obtido do banco de dados)
        const user = { id: 1, username: 'usuario' };

        // Gerar um token Bearer usando a biblioteca 'jsonwebtoken'
        jwt.sign({ user }, secretKey, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                res.status(500).json({ error: 'Erro ao gerar token' });
            } else {
                // Responder com o token Bearer
                res.json({ token });
            }
        });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Middleware para proteger as rotas que exigem autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar o token usando a biblioteca 'jsonwebtoken'
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        // Se o token for válido, permitir o acesso à próxima rota
        req.user = decoded.user;
        next();
    });
}

// Rota protegida que requer autenticação
app.get('/api/protegida', authenticateToken, (req, res) => {
    res.json({ message: 'Esta é uma rota protegida!', user: req.user });
});

// Porta em que a API irá escutar as requisições
const PORT = process.env.PORT || 3000;

// Iniciar o servidor da API
app.listen(PORT, () => {
    console.log(`Servidor da API iniciado na porta ${PORT}`);
});

app.get('/api/saudacao', (req, res) => {
    res.json({ mensagem: 'Olá, bem-vindo à minha API!' });
});

app.post('/api/enviaMsg', authenticateToken, (req, res) => {
    const number = req.body.number;
    const message = req.body.message;

    client.sendMessage(number + '@c.us', message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    })
});

app.post('/api/getContact', authenticateToken, (req, res) => {
    const number = req.body.number;

    client.isRegisteredUser(number + '@c.us').then(contact => {
        res.status(200).json({
            status: true,
            response: contact
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

app.post('/api/enviaUrlMedia', authenticateToken, async (req, res) => {
    const number = req.body.number;
    const caption = req.body.caption;
    const url = req.body.url;
    const type = req.body.type;

    const media = await MessageMedia.fromUrl(url);

    client.sendMessage(number + '@c.us', media, {
        caption: caption
    }).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

app.get('/api/users/getAll', authenticateToken, async (req, res) => {
    await getAllUsers().then(query => {
        res.status(200).json({
            status: true,
            response: query[0]
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

app.post('/api/users/insert', authenticateToken, async (req, res) => {
    await insertUser(req.body).then(query => {
        console.log(req.body);
        res.status(201).json({
            status: true,
            response: "Usuario cadastrado ID: " + query[0].insertId
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});



const client = new Client({
    authStrategy: new LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        args: ['--no-sandbox'],
        headless: false
    }
});

client.initialize();

// client.on('loading_screen', (percent, message) => {
//     console.log('LOADING SCREEN', percent, message);
// });

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

client.on('message', async msg => {
    //console.log('MESSAGE RECEIVED', msg);

    if (msg.body === '!ping reply') {
        // Send a new message as a reply to the current one
        msg.reply('pong');

    }
    else if (msg.body.startsWith('!desbloquear ')) {
        //comando que desbloqueia função quando digitada
        let email = msg.body.slice(8);
        const dados = {
            contactId: msg.from
        }
        const isLogado = await verificaLogin(dados);

        if (isLogado) {

            const postData = {
                username: '',
                password: ''
            };

            const headers = {
                'Content-Type': 'application/json', // Especifica o tipo de conteúdo do corpo da requisição (JSON neste caso)
            };


            await axios.post(apiUrl + 'auth/signin', postData, { headers }).then(response => {
                let token = response.data.token;

                const putData = {
                    idLoja: 1455,
                    flgInadimplente: false,
                    flgCancelado: false,
                    flgBloqueado: false,
                    flgBloqueadoPelaRevenda: false,
                    flgModuloNfse: true,
                    flgModuloVenda: true,
                    flgModuloSATNFCeNFe: true,
                    flgModuloFinanceiro: true,
                    flgModuloCompra: true,
                    flgModuloEstoque: true,
                    flgModuloBoleto: true,
                    flgModuloMdfe: true,
                    flgModuloSped: true,
                    flgModuloEcommerce: true,
                    flgModuloMidiaIndoor: true,
                    flgModuloDelivery: true,
                    flgModuloMarketing: true,
                    flgModuloContabilidade: true,
                    flgModuloSalao: true,
                    flgModuloClinica: true,
                    flgModuloAgro: true,
                    flgModuloRestaurante: true
                }
                const headers = {
                    'Content-Type': 'application/json', // Especifica o tipo de conteúdo do corpo da requisição (JSON neste caso)
                    'Authorization': 'Bearer ' + token
                }

                axios.put(apiUrl + 'api/v1/auth/cliente', putData, { headers }).then(response => {
                    msg.reply("Cliente desbloqueado com sucesso!");
                })
            }).catch(err => {
                msg.reply(err);
            })
        } else {
            msg.reply("Você não está logado!");
        }
        // const data = {
        //     email: email
        // }

        // await unLock(data).then(query => {
        //     msg.reply("Funcionário desbloqueado com sucesso! \n");
        // }).catch(err => {
        //     msg.reply(err);
        // });
    }
    else if (msg.body.startsWith('!bloquear')) {
        //comando que bloqueia função quando digitada
        let email = msg.body.slice(8);

        const dados = {
            contactId: msg.from
        }
        const isLogado = await verificaLogin(dados);

        if (isLogado) {



            const postData = {
                username: '',
                password: ''
            };

            const headers = {
                'Content-Type': 'application/json', // Especifica o tipo de conteúdo do corpo da requisição (JSON neste caso)
            };


            await axios.post(apiUrl + 'auth/signin', postData, { headers }).then(response => {
                let token = response.data.token;

                const putData = {
                    idLoja: 1455,
                    flgInadimplente: false,
                    flgCancelado: false,
                    flgBloqueado: true,
                    flgBloqueadoPelaRevenda: true,
                    flgModuloNfse: true,
                    flgModuloVenda: true,
                    flgModuloSATNFCeNFe: true,
                    flgModuloFinanceiro: true,
                    flgModuloCompra: true,
                    flgModuloEstoque: true,
                    flgModuloBoleto: true,
                    flgModuloMdfe: true,
                    flgModuloSped: true,
                    flgModuloEcommerce: true,
                    flgModuloMidiaIndoor: true,
                    flgModuloDelivery: true,
                    flgModuloMarketing: true,
                    flgModuloContabilidade: true,
                    flgModuloSalao: true,
                    flgModuloClinica: true,
                    flgModuloAgro: true,
                    flgModuloRestaurante: true
                }
                const headers = {
                    'Content-Type': 'application/json', // Especifica o tipo de conteúdo do corpo da requisição (JSON neste caso)
                    'Authorization': 'Bearer ' + token
                }

                axios.put(apiUrl + 'api/v1/auth/cliente', putData, { headers }).then(response => {
                    msg.reply("Cliente bloqueado com sucesso!");
                })
            }).catch(err => {
                msg.reply(err);
            })
        } else {
            msg.reply("Você não está logado!");
        }
        // const data = {
        //     email: email
        // }
        // await lock(data).then(query => {
        //     msg.reply("Funcionário bloqueado com sucesso!");
        // }).catch(err => {
        //     msg.reply(err);
        // });


    } else if (msg.body === '!getu') {
        await getAllUsers().then(query => {
            msg.reply("Lista de usuários: \n" + JSON.stringify(query[0]));
        }).catch(err => {
            msg.reply(err);
        });

    } else if (msg.body.startsWith('!grava ')) {
        let mensagem = msg.body.slice(7)
        let number = msg.from;
        let timestamp = msg.timestamp;

        timestamp = new Date(timestamp * 1000);

        const chat = {
            chatId: number,
            msg: mensagem,
            timestamp: timestamp
        }

        await insertChat(chat).then(query => {
            msg.reply("Mensagem gravada com sucesso! ID Msg: " + query[0].insertId);
        }).catch(err => {
            msg.reply("Erro ao gravar mensagem: " + err);
        })
    } else if (msg.body === '!ping') {
        // Send a new message to the same chat
        client.sendMessage(msg.from, 'pong');

    } else if (msg.body.startsWith('!sendto ')) {
        // Direct send a new message to specific id
        let number = msg.body.split(' ')[1];
        let messageIndex = msg.body.indexOf(number) + number.length;
        let message = msg.body.slice(messageIndex, msg.body.length);
        number = number.includes('@c.us') ? number : `${number}@c.us`;
        let chat = await msg.getChat();
        chat.sendSeen();
        client.sendMessage(number, message);

    } else if (msg.body.startsWith('!subject ')) {
        // Change the group subject
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newSubject = msg.body.slice(9);
            chat.setSubject(newSubject);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body.startsWith('!echo ')) {
        // Replies with the same message
        msg.reply(msg.body.slice(6));
    } else if (msg.body.startsWith('!desc ')) {
        // Change the group description
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newDescription = msg.body.slice(6);
            chat.setDescription(newDescription);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body === '!leave') {
        // Leave the group
        let chat = await msg.getChat();
        if (chat.isGroup) {
            chat.leave();
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body.startsWith('!join ')) {
        const inviteCode = msg.body.split(' ')[1];
        try {
            await client.acceptInvite(inviteCode);
            msg.reply('Joined the group!');
        } catch (e) {
            msg.reply('That invite code seems to be invalid.');
        }
    } else if (msg.body === '!groupinfo') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`
                *Group Details*
                Name: ${chat.name}
                Description: ${chat.description}
                Created At: ${chat.createdAt.toString()}
                Created By: ${chat.owner.user}
                Participant count: ${chat.participants.length}
            `);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    } else if (msg.body === '!chats') {
        const chats = await client.getChats();
        client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
    } else if (msg.body === '!info') {
        let info = client.info;
        client.sendMessage(msg.from, `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.wid.user}
            Platform: ${info.platform}
        `);
    } else if (msg.body === '!mediainfo' && msg.hasMedia) {
        const attachmentData = await msg.downloadMedia();
        msg.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
    } else if (msg.body === '!quoteinfo' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();

        quotedMsg.reply(`
            ID: ${quotedMsg.id._serialized}
            Type: ${quotedMsg.type}
            Author: ${quotedMsg.author || quotedMsg.from}
            Timestamp: ${quotedMsg.timestamp}
            Has Media? ${quotedMsg.hasMedia}
        `);
    } else if (msg.body === '!resendmedia' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            const attachmentData = await quotedMsg.downloadMedia();
            client.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
        }
    } else if (msg.body === '!location') {
        msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'));
    } else if (msg.location) {
        msg.reply(msg.location);
    } else if (msg.body.startsWith('!status ')) {
        const newStatus = msg.body.split(' ')[1];
        await client.setStatus(newStatus);
        msg.reply(`Status was updated to *${newStatus}*`);
    } else if (msg.body === '!mention') {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        chat.sendMessage(`Hi @${contact.number}!`, {
            mentions: [contact]
        });
    } else if (msg.body === '!delete') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.fromMe) {
                quotedMsg.delete(true);
            } else {
                msg.reply('I can only delete my own messages');
            }
        }
    } else if (msg.body === '!pin') {
        const chat = await msg.getChat();
        await chat.pin();
    } else if (msg.body === '!archive') {
        const chat = await msg.getChat();
        await chat.archive();
    } else if (msg.body === '!mute') {
        const chat = await msg.getChat();
        // mute the chat for 20 seconds
        const unmuteDate = new Date();
        unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
        await chat.mute(unmuteDate);
    } else if (msg.body === '!typing') {
        const chat = await msg.getChat();
        // simulates typing in the chat
        chat.sendStateTyping();
    } else if (msg.body === '!recording') {
        const chat = await msg.getChat();
        // simulates recording audio in the chat
        chat.sendStateRecording();
    } else if (msg.body === '!clearstate') {
        const chat = await msg.getChat();
        // stops typing or recording in the chat
        chat.clearState();
    } else if (msg.body === '!jumpto') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            client.interface.openChatWindowAt(quotedMsg.id._serialized);
        }
    } else if (msg.body === '!buttons') {
        let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
        client.sendMessage(msg.from, button);
    } else if (msg.body === '!list') {
        let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
        let list = new List('List body', 'btnText', sections, 'Title', 'footer');
        client.sendMessage(msg.from, list);
    } else if (msg.body === '!reaction') {
        msg.react('🙏');
    } else if (msg.body === '!edit') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.fromMe) {
                quotedMsg.edit(msg.body.replace('!edit', ''));
            } else {
                msg.reply('I can only edit my own messages');
            }
        }
    } else if (msg.body === '!updatelabels') {
        const chat = await msg.getChat();
        await chat.changeLabels([0, 1]);
    } else if (msg.body === '!addlabels') {
        const chat = await msg.getChat();
        let labels = (await chat.getLabels()).map(l => l.id);
        labels.push('0');
        labels.push('1');
        await chat.changeLabels(labels);
    } else if (msg.body === '!removelabels') {
        const chat = await msg.getChat();
        await chat.changeLabels([]);
    } else if (msg.body === 'Ola' || msg.body === 'ola' || msg.body === 'olá' || msg.body === 'Olá') {
        msg.reply('Digite uma opção: \n1 - Admin \n2 - Suporte \n3 - Financeiro');
    } else if (msg.body === '2') {
        let contatc = await client.getContactById('5518996877552@c.us');
        console.log(contatc);
        client.sendMessage(msg.from, contatc);
    } else if (msg.body === '3') {
        let contatc = await client.getContactById('5518997365210@s.whatsapp.net');
        console.log(contatc);
        client.sendMessage(msg.from, contatc);
    } else if (msg.body === '1') {
        const dados = {
            contactId: msg.from
        }
        const isLogado = await verificaLogin(dados);

        if (isLogado) {
            client.sendMessage(msg.from, 'Você está logado');
        } else {
            client.sendMessage(msg.from, 'Você não está logado \nPor favor digite *!login SEU EMAIL SUA SENHA* para efetuar o login!');
        }
    } else if (msg.body.startsWith('!login ')) {
        let email = msg.body.split(' ')[1];
        let senhaIndex = msg.body.indexOf(email) + email.length;
        let senha = msg.body.slice(senhaIndex, msg.body.length);

        login(email, senha).then(() => {
            client.sendMessage(msg.from, 'Login efetuado com sucesso!');
        })

    } else {
        client.sendMessage(msg.from, "Seja Bem-Vindo ao bot da *MENTORA SOLULÇÕES* \nPara iniciar digite Olá!");
        console.log(msg.body);
    }
});

client.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // do stuff here
    }
});

client.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(after); // message after it was deleted.
    if (before) {
        console.log(before); // message before it was deleted.
    }
});

client.on('message_revoke_me', async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    console.log(msg.body); // message before it was deleted.
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if (ack == 3) {
        // The message was read
    }
});

client.on('group_join', (notification) => {
    // User has joined or been added to the group.
    console.log('join', notification);
    notification.reply('User joined.');
});

client.on('group_leave', (notification) => {
    // User has left or been kicked from the group.
    console.log('leave', notification);
    notification.reply('User left.');
});

client.on('group_update', (notification) => {
    // Group picture, subject or description has been updated.
    console.log('update', notification);
});

client.on('change_state', state => {
    console.log('CHANGE STATE', state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = true;

client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call. ${rejectCalls ? 'This call was automatically rejected by the script.' : ''}`);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

client.on('contact_changed', async (message, oldId, newId, isContact) => {
    /** The time the event occurred. */
    const eventTime = (new Date(message.timestamp * 1000)).toLocaleString();

    console.log(
        `The contact ${oldId.slice(0, -5)}` +
        `${!isContact ? ' that participates in group ' +
            `${(await client.getChatById(message.to ?? message.from)).name} ` : ' '}` +
        `changed their phone number\nat ${eventTime}.\n` +
        `Their new phone number is ${newId.slice(0, -5)}.\n`);

    /**
     * Information about the {@name message}:
     * 
     * 1. If a notification was emitted due to a group participant changing their phone number:
     * {@name message.author} is a participant's id before the change.
     * {@name message.recipients[0]} is a participant's id after the change (a new one).
     * 
     * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
     * {@name message.to} is a group chat id the event was emitted in.
     * {@name message.from} is a current user's id that got an notification message in the group.
     * Also the {@name message.fromMe} is TRUE.
     * 
     * 1.2 Otherwise:
     * {@name message.from} is a group chat id the event was emitted in.
     * {@name message.to} is @type {undefined}.
     * Also {@name message.fromMe} is FALSE.
     * 
     * 2. If a notification was emitted due to a contact changing their phone number:
     * {@name message.templateParams} is an array of two user's ids:
     * the old (before the change) and a new one, stored in alphabetical order.
     * {@name message.from} is a current user's id that has a chat with a user,
     * whos phone number was changed.
     * {@name message.to} is a user's id (after the change), the current user has a chat with.
     */
});

client.on('group_admin_changed', (notification) => {
    if (notification.type === 'promote') {
        /** 
          * Emitted when a current user is promoted to an admin.
          * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
          */
        console.log(`You were promoted by ${notification.author}`);
    } else if (notification.type === 'demote')
        /** Emitted when a current user is demoted to a regular user. */
        console.log(`You were demoted by ${notification.author}`);
});
