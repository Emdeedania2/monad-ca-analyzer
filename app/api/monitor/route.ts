import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// This would typically go in an environment variable
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// In-memory store for demo purposes (would use Redis/DB in prod)
// Map<DeployerAddress, Set<ChatId>>
const MONITORED_DEPLOYERS = new Map<string, Set<string>>();

export async function POST(req: NextRequest) {
    try {
        const { deployer, chatId } = await req.json();

        if (!deployer || !chatId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (!MONITORED_DEPLOYERS.has(deployer)) {
            MONITORED_DEPLOYERS.set(deployer, new Set());
        }

        MONITORED_DEPLOYERS.get(deployer)?.add(chatId);

        // If bot token is configured, send a confirmation message
        if (TELEGRAM_TOKEN) {
            const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
            await bot.sendMessage(chatId, `✅ Now monitoring deployer: ${deployer} on Monad Mainnet.`);
        }

        return NextResponse.json({ success: true, message: `Monitoring ${deployer}` });
    } catch (error) {
        console.error('Telegram Monitor Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
