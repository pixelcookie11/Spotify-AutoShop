// Dependencies
const express = require('express')
const helmet = require("helmet");
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
// require('dotenv').config()
const btcpay = require('btcpay')
const Discord = require('discord.js');
const bot = new Discord.Client();
var nodemailer = require('nodemailer');
var mysql = require('mysql');
// Setup said dependencies

var transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
           user: process.env.USER,
           pass: process.env.PASS
       }
   });

bot.on('ready', () => {
    console.log(`Logged into Discord as ${bot.user.tag}!`);
});
const keypair = btcpay.crypto.load_keypair(new Buffer.from(process.env.PRIVATEKEY, 'hex'))
const client = new btcpay.BTCPayClient(process.env.BTCPAY_URL, keypair, {
    merchant: process.env.MERCHANT_ID
})
const app = express()
const port = process.env.API_PORT
app.use(express.json());
app.use(express.static('public'))
app.use(helmet());
var con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.DATABASE
});
con.connect();
app.set('trust proxy', 1);
const limiter = rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: '429'
});
app.use('/', limiter);
const email_regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Actual routes and such
app.post('/api/check/invoice', async (req, res) => {
    var invoice = await client.get_invoice(req.body.id)


    if (invoice.status == 'complete') {
        var sql = `SELECT ADDRESS,LINK FROM \`hits_spotify\` WHERE COUNTRY = ${con.escape(invoice.buyer.country)} AND INVITES_LEFT > 0 ORDER BY RAND() LIMIT 1`
        con.query(sql, async function (err, result) {
            await post()
            async function post() {
                var password = Math.random().toString(36).substring(2)
                var response = await fetch('https://ghostbin.com/paste/new', {
                    method: 'POST',
                    body: `text=Hello! Thank you for purchasing from us. Activating your Spotify is easy. First, click the link below to get to the sign up page. Then, enter the address provided. That's it! Make sure to not join Family Mix.\n Link: ${result[0].LINK}\n Address: ${result[0].ADDRESS}\nSomething wrong? Don't hesitate to contact support! https://${process.env.FRONTEND_SHOP_URL}/support&title=Thank you for purchasing from us! ID: ${invoice.id}&password=${password}`,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                })
                const embed = new Discord.MessageEmbed()
                    .setTitle('New transcation!')
                    .setURL(`https://${process.env.FRONTEND_SHOP_URL}/invoices/` + invoice.id)
                    .addField('Invoice ID', invoice.id)
                    .addField('Paste Link', response.url)
                    .addField('Buyer Country', invoice.buyer.country)
                    .addField('Price Fiat', "$" + invoice.price + " " + invoice.currency)
                    .addField('Price Crypto', invoice.cryptoInfo[0].price + " " + invoice.cryptoInfo[0].cryptoCode)
                    .setColor('#00b0f4')
                    .setTimestamp();
                bot.channels.cache.get(process.env.LOGGING_CHANNEL_ID).send(embed)

                if (invoice.buyer.email == null) {
                    var sql = `INSERT INTO \`transactions\` (contact_method, contact_info, paste_url, transaction_id, country) VALUES (${con.escape('discord')}, ${con.escape(invoice.buyer.name)}, ${con.escape(response.url)}, ${con.escape(invoice.id)}, ${con.escape(invoice.buyer.country)})`
                    con.query(sql)
                    return;
                }

                const mailOptions = {
                    from: process.env.USER,
                    to: invoice.buyer.email,
                    subject: 'AutoShop Support - Your Order',
                    html: `Hello! Thank you for purchasing from us. Your product is linked below. <br><br>${response.url}`
                  };
                  transporter.sendMail(mailOptions, function (err) {
                     if(err)
                       console.log(err)
                  });
                  

            }

        })
        res.json({
            status: 'success'
        });
        return;
    }
    res.json({
        status: 'fail'
    });

})

app.post('/buy/spotify', (req, res) => {

    if (!email_regex.test(req.body.contactInfo)) {
        buySpotifyDiscord()
        return;
    }
    buySpotify()
    async function buySpotifyDiscord() {
        var invoice = await client.create_invoice({
            price: 2.99,
            currency: 'USD',
            BuyerName: req.body.contactInfo,
            BuyerCountry: req.body.country,
            NotificationUrl: `http://${process.env.API_IP}:${process.env.API_PORT}/api/check/invoice`
        })
        var url = new URL(invoice.url)
        url.hostname = process.env.FRONTEND_SHOP_URL
        res.json(url)
    }
    async function buySpotify() {
        var invoice = await client.create_invoice({
            price: 2.99,
            currency: 'USD',
            BuyerEmail: req.body.contactInfo,
            BuyerCountry: req.body.country,
            NotificationUrl: `http://${process.env.API_IP}:${process.env.API_PORT}/api/check/invoice`
        })
        var url = new URL(invoice.url)
        url.hostname = process.env.FRONTEND_SHOP_URL
        res.json(url)
    }

})

app.post('/hit/spotify', (req, res) => {

    if (req.body.ADDRESS == '<Address>') {
        res.json({
            'status': 'User is not the owner of that family.'
        })
        return;
    }
    var invites_left = req.body.INVITES_LEFT.split('/')
    if (invites_left[0] >= 6) {
        res.json({
            'status': 'Family already full.'
        })
        return;
    }
    var sql = `INSERT INTO \`hits_spotify\` (COMBO,COUNTRY,ADDRESS,LINK, INVITES_LEFT) VALUES (${con.escape(req.body.COMBO)}, ${con.escape(req.body.COUNTRY)}, ${con.escape(req.body.ADDRESS)}, ${con.escape(req.body.LINK)}, ${con.escape(6 - req.body.INVITES_LEFT.split('/')[0])})`
    con.query(sql, function (err, result) {
        if (err) throw err;
    });
    res.json({
        'status': 'success'
    })
})

app.get('/stock/spotify', function (req, res) {
    var sql = `SELECT COUNTRY FROM \`hits_spotify\` GROUP BY COUNTRY`
    con.query(sql, function (err, result) {
        res.json(result)
    })
})


// Static stuff
app.get('/discord', function (req, res) {
    res.redirect(process.env.DISCORD_INVITE_LINK_URL)
})

app.get('/support', function (req, res) {
    res.redirect(process.env.SUPPORT_URL)
})

app.get('/logo', function (req, res) {
    res.sendFile(__dirname + '/public/logo.svg')
})

app.get('/promo', function (req, res) {
    res.sendFile(__dirname + '/public/promo.svg')
})

// Discord stuff
bot.on('message', message => {

    var prefix = '!'
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'claim') {
        if (message.channel.type == "dm") {
            message.channel.send('You must use the Discord server to claim.')
            return;
        }
        message.delete({
            timeout: 30000
        })
        sendStatus()
        async function sendStatus() {

            var status = await message.channel.send('Checking to see if there are any purchases with your Discord tag...')
            var sql = `SELECT * FROM transactions WHERE contact_info = '${message.author.tag}' ORDER BY date DESC`
            con.query(sql, function (err, result) {
    
                if (result[0] == null) {
                    status.edit('Sorry, there seems to be nobody with that username in our database. Something wrong? File a support ticket.').then(msg => {
                        msg.delete({
                            timeout: 30000
                        })
                    });
                    return;
                }
               status.edit('Success! DM\'ng you now.').then(msg => {
                    msg.delete({
                        timeout: 30000
                    })
                });
    
                const embed = new Discord.MessageEmbed()
                    .setTitle('Thanks, ' + message.author.username + '!')
                    .setDescription('Need support? Make a ticket! All the information you need is in this message.')
                    .addField('Invoice ID', result[0].transaction_id)
                    .addField('Claim Instructions', result[0].paste_url)
                    .addField('Country', result[0].country)
                    .setColor('#00b0f4')
                    .setTimestamp();
                message.author.send(embed).catch(() => status.edit('We can\'t DM you! You need to enable \"Allow direct messages from server members\" in your privacy settings.'))
    
            })
        }
        return;
    }
});

// Actually start it here...
app.listen(port, () => {
    console.log(`AutoShop API listening at http://${process.env.API_IP}:${port}`)
})
bot.login(process.env.DISCORD_BOT_TOKEN);