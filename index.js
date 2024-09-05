require("dotenv").config();
const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const gameName = "testGame";
const webURL = "www.catflip.run";

const server = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

const port = process.env.PORT || 3000;

const SCORE_TOKEN = process.env.SCORE_TOKEN.split(";").map((t) => BigInt(t));

const queries = {};

function addAllNumbers(number) {
    const strNumber = number.toString();

    if (strNumber.length === 1) return number;

    const numbers = strNumber.split("");
    var sum = 0;
    for (var i = 0; i < numbers.length; i++) {
        sum += parseInt(numbers[i], 10);
    }
    return addAllNumbers(sum);
}

bot.on("polling_error", console.log);

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const nickname = msg.from.username;
    const gameurl = `https://${webURL}/index.html`;
    const communityLink = 'https://t.me/catflipio';  // ссылка на сообщество в Telegram

    // Отправка сообщения с картинкой, текстом и кнопками
    bot.sendPhoto(chatId, 'https://firebasestorage.googleapis.com/v0/b/catflip-run.appspot.com/o/Frame%2037596.png?alt=media&token=c6bc0e14-afdb-464c-9684-efeead66f2ad', {  // Укажите здесь URL вашей картинки
        caption: "**Hello, sporty kitten!**\n" +
            "\n" +
            "🐈 Welcome to the world of the CatFlip gameFi project! Here, you can not only play but also earn FlipCoin, which you can later exchange for $CATLI and receive rewards in TON — listing is just around the corner! Run the longest marathons, collect the most coins, and prove that you're the fastest and coolest sporty kitten out there!\n" +
            "\n" +
            "🥇 CatFlip is a unique 3D runner in Telegram, so the first launch might take a little time. But don’t worry—we’re just spreading coins around the streets of Dubai so you can collect as many as possible.\n" +
            "Don’t forget to invite your friends! For each one you bring, you’ll receive bonus FlipCoin, helping you level up and reach new heights.\n" +
            "\n" +
            "\n" +
            "👀 Join our community to stay up-to-date with the latest CatFlip news! ",
        reply_markup: {
            inline_keyboard: [
                [{text: "💸 Play", web_app: {url: gameurl}}],
                [{text: "📣 Community", url: communityLink}]
            ]
        }
    });
});

server.use(express.static(path.join(__dirname, 'public')));

// server.get('*', (req, res) => {
//     console.log('Some enter non-static')
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

server.get("/highscore/:score", function (req, res, next) {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();

    const token = SCORE_TOKEN[addAllNumbers(BigInt(req.query.id)) - 1];

    let query = queries[req.query.id];

    let options;
    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id,
        };
    }

    // ===== Obfuscation decoding starts =====
    // Change this part if you want to use your own obfuscation method
    const obfuscatedScore = BigInt(req.params.score);

    const realScore = Math.round(Number(obfuscatedScore / token));

    // If the score is valid
    if (BigInt(realScore) * token == obfuscatedScore) {
        // ===== Obfuscation decoding ends =====
        bot
            .setGameScore(query.from.id, realScore, options)
            .then((b) => {
                return res.status(200).send("Score added successfully");
            })
            .catch((err) => {
                if (
                    err.response.body.description ===
                    "Bad Request: BOT_SCORE_NOT_MODIFIED"
                ) {
                    return res
                        .status(204)
                        .send("New score is inferior to user's previous one");
                } else {
                    return res.status(500);
                }
            });
        return;
    } else {
        return res.status(400).send("Are you cheating ?");
    }
});

server.listen(port);
