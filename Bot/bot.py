from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackContext

TOKEN = '7341764795:AAHeGeFkScGdlD-UkTwAfQlyA16T0gzMTE8'  # Замените на токен вашего бота

def start(update: Update, context: CallbackContext) -> None:
    keyboard = [[InlineKeyboardButton("game", url="http://64.226.126.143/")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    update.message.reply_text('Welcome! Click below to play the game:', reply_markup=reply_markup)

def main() -> None:
    updater = Updater(TOKEN)

    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))

    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()