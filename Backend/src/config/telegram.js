const axios = require("axios");

/**
 * Send message to Telegram Bot
 * @param {string} message
 */
const postMessage = async (url, payload) => {
    const response = await axios.post(url, payload);
    return response.data;
};

exports.sendTelegramMessage = async (message) => {
    try {
        // ✅ READ ENV INSIDE FUNCTION
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const BOT_CHAT = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !BOT_CHAT) {
            console.error("❌ Telegram ENV missing", {
                BOT_TOKEN,
                BOT_CHAT
            });
            return;
        }

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const payload = {
            chat_id: BOT_CHAT,
            text: message,
            parse_mode: "HTML"
        };

        let response = await postMessage(url, payload);
        if (!response?.ok) {
            // Fallback to plain text if HTML parse fails.
            response = await postMessage(url, {
                chat_id: BOT_CHAT,
                text: message
            });
        }

        console.log("✅ Telegram sent:", response.ok);
        return response.ok;
    } catch (error) {
        console.error(
            "❌ Telegram Error:",
            error.response?.data || error.message
        );
        return false;
    }
};
