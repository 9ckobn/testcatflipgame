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
    bot.sendMessage(chatId, "Tap to play", {
        reply_markup: {
            inline_keyboard: [
                [{text: "Play", web_app: {url: gameurl}}]
            ]
        }
    });
});

server.use(express.static(path.join(__dirname, 'public')));

server.get('*', (req, res) => {
    console.log('Some enter non-static')
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
