# 📋 OpenClaw Quick Reference: Copy-Paste Code Snippets

## 🚀 Quick Start

### Install and Initialize
```bash
# Install globally
npm install -g openclaw@latest

# Or add to project
npm install openclaw-sdk

# Run onboarding wizard
openclaw onboard --install-daemon
```

### Basic Setup (JavaScript/Node.js)
```javascript
const { OpenClaw } = require('openclaw-sdk');

const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY || 'http://localhost:18789',
  token: process.env.OPENCLAW_TOKEN
});
```

### Basic Setup (TypeScript)
```typescript
import { OpenClaw } from 'openclaw-sdk';

const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY!,
  token: process.env.OPENCLAW_TOKEN!
});
```

---

## 💬 Sending Messages

### Simple Message
```javascript
await claw.message.send({
  to: '+1234567890',
  message: 'Hello from OpenClaw!',
  channel: 'whatsapp' // or 'telegram', 'slack', 'discord', etc.
});
```

### With Error Handling
```javascript
try {
  const result = await claw.message.send({
    to: user.phone,
    message: 'Your order has shipped!',
    channel: 'whatsapp'
  });
  console.log('Message sent:', result.id);
} catch (error) {
  console.error('Failed to send:', error.message);
}
```

### Broadcast to Multiple Users
```javascript
const users = ['+1234567890', '+0987654321'];
const results = await Promise.all(
  users.map(phone =>
    claw.message.send({
      to: phone,
      message: 'New feature announcement!',
      channel: 'whatsapp'
    })
  )
);
```

### Send with Attachments
```javascript
await claw.message.send({
  to: '+1234567890',
  message: 'Check out this file!',
  attachments: [
    {
      type: 'image',
      url: 'https://example.com/image.jpg'
    }
  ],
  channel: 'whatsapp'
});
```

---

## 🤖 AI Chat Integration

### Simple AI Chat
```javascript
const response = await claw.agent.chat('What is the weather today?');
console.log(response.text);
```

### With Context
```javascript
const response = await claw.agent.chat('Recommend a product', {
  context: {
    userHistory: ['purchased laptop', 'viewed monitors'],
    budget: 500
  },
  thinking: 'high' // 'low', 'medium', or 'high'
});
```

### Streaming Response
```javascript
const stream = await claw.agent.chatStream('Write a long story');

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

---

## 📥 Receiving Messages

### Basic Message Listener
```javascript
claw.on('message', async (message) => {
  console.log(`From: ${message.from}`);
  console.log(`Text: ${message.text}`);
  console.log(`Channel: ${message.channel}`);
});

claw.start();
```

### Auto-Reply Pattern
```javascript
claw.on('message', async (message) => {
  if (message.text.toLowerCase().includes('help')) {
    await message.reply('How can I assist you?');
  }
});
```

### Conditional Processing
```javascript
claw.on('message', async (message) => {
  const text = message.text.toLowerCase();
  
  if (text.includes('order status')) {
    const order = await getOrder(message.from);
    await message.reply(`Your order #${order.id} is ${order.status}`);
  } else if (text.includes('support')) {
    await forwardToSupport(message);
  } else {
    const aiResponse = await claw.agent.chat(message.text);
    await message.reply(aiResponse.text);
  }
});
```

---

## 🔌 Express.js Integration

### Basic Endpoint
```javascript
const express = require('express');
const { OpenClaw } = require('openclaw-sdk');

const app = express();
app.use(express.json());

const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY,
  token: process.env.OPENCLAW_TOKEN
});

app.post('/api/notify', async (req, res) => {
  const { to, message } = req.body;
  
  try {
    const result = await claw.message.send({
      to,
      message,
      channel: 'whatsapp'
    });
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### Webhook Handler
```javascript
app.post('/webhooks/openclaw', async (req, res) => {
  const message = req.body;
  
  // Verify webhook
  if (!claw.verifyWebhook(req.headers, req.body)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process message
  console.log('Received:', message);
  
  // Your logic here
  if (message.text === 'ping') {
    await claw.message.send({
      to: message.from,
      message: 'pong',
      channel: message.channel
    });
  }
  
  res.json({ success: true });
});
```

---

## ⚛️ React Integration

### Custom Hook
```typescript
// hooks/useOpenClaw.ts
import { useEffect, useState } from 'react';
import { OpenClaw } from 'openclaw-sdk';

export function useOpenClaw() {
  const [claw] = useState(() => new OpenClaw({
    gateway: process.env.REACT_APP_OPENCLAW_GATEWAY!,
    token: process.env.REACT_APP_OPENCLAW_TOKEN!
  }));

  const sendMessage = async (to: string, message: string) => {
    return await claw.message.send({ to, message, channel: 'whatsapp' });
  };

  const chat = async (message: string) => {
    return await claw.agent.chat(message);
  };

  return { sendMessage, chat };
}
```

### Component Usage
```typescript
// components/ChatWidget.tsx
import { useState } from 'react';
import { useOpenClaw } from '../hooks/useOpenClaw';

export function ChatWidget() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const { chat } = useOpenClaw();

  const handleSend = async () => {
    const result = await chat(message);
    setResponse(result.text);
    setMessage('');
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button onClick={handleSend}>Send</button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

---

## 🐍 Python Integration

### Basic Usage
```python
import requests
import os

OPENCLAW_GATEWAY = os.getenv('OPENCLAW_GATEWAY', 'http://localhost:18789')
OPENCLAW_TOKEN = os.getenv('OPENCLAW_TOKEN')

def send_message(to: str, message: str, channel: str = 'whatsapp'):
    response = requests.post(
        f'{OPENCLAW_GATEWAY}/api/messages/send',
        headers={'Authorization': f'Bearer {OPENCLAW_TOKEN}'},
        json={
            'to': to,
            'message': message,
            'channel': channel
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
result = send_message('+1234567890', 'Hello from Python!')
print(f"Message sent: {result['id']}")
```

### FastAPI Integration
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

class MessageRequest(BaseModel):
    to: str
    message: str
    channel: str = 'whatsapp'

@app.post('/api/notify')
async def send_notification(req: MessageRequest):
    try:
        response = requests.post(
            f"{os.getenv('OPENCLAW_GATEWAY')}/api/messages/send",
            headers={'Authorization': f"Bearer {os.getenv('OPENCLAW_TOKEN')}"},
            json=req.dict()
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔧 Common Patterns

### Retry Logic
```javascript
async function sendWithRetry(to, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await claw.message.send({ to, message });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Batch Processing
```javascript
async function sendBatch(messages, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(msg => claw.message.send(msg))
    );
    results.push(...batchResults);
    
    // Rate limiting pause
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### Queue Pattern
```javascript
const Queue = require('bull');

const messageQueue = new Queue('openclaw-messages', {
  redis: { port: 6379, host: '127.0.0.1' }
});

// Add messages to queue
messageQueue.add({
  to: '+1234567890',
  message: 'Queued message',
  channel: 'whatsapp'
});

// Process queue
messageQueue.process(async (job) => {
  const { to, message, channel } = job.data;
  return await claw.message.send({ to, message, channel });
});
```

---

## 📊 Monitoring

### Basic Logging
```javascript
claw.on('message:sent', (msg) => {
  console.log(`✓ Sent to ${msg.to} via ${msg.channel}`);
});

claw.on('message:failed', (msg, error) => {
  console.error(`✗ Failed to send to ${msg.to}:`, error.message);
});

claw.on('error', (error) => {
  console.error('OpenClaw error:', error);
});
```

### With Winston Logger
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'openclaw.log' })
  ]
});

claw.on('message:sent', (msg) => {
  logger.info('Message sent', {
    messageId: msg.id,
    to: msg.to,
    channel: msg.channel
  });
});
```

### Prometheus Metrics
```javascript
const prometheus = require('prom-client');

const messageCounter = new prometheus.Counter({
  name: 'openclaw_messages_total',
  help: 'Total messages sent',
  labelNames: ['channel', 'status']
});

claw.on('message:sent', (msg) => {
  messageCounter.inc({ channel: msg.channel, status: 'success' });
});

claw.on('message:failed', (msg) => {
  messageCounter.inc({ channel: msg.channel, status: 'failed' });
});
```

---

## 🔒 Security

### Environment Variables (.env)
```bash
# .env
OPENCLAW_GATEWAY=http://localhost:18789
OPENCLAW_TOKEN=your-secure-token-here
OPENCLAW_WEBHOOK_SECRET=your-webhook-secret

# For Docker
OPENCLAW_GATEWAY=http://openclaw:18789
```

### Secure Token Loading
```javascript
// Load from AWS Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getOpenClawToken() {
  const data = await secretsManager.getSecretValue({
    SecretId: 'prod/openclaw/token'
  }).promise();
  
  return JSON.parse(data.SecretString).token;
}

const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY,
  token: await getOpenClawToken()
});
```

### Webhook Verification
```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}

app.post('/webhook', (req, res) => {
  if (!verifyWebhook(req.body, req.headers['x-signature'], secret)) {
    return res.status(401).send('Invalid signature');
  }
  // Process webhook
});
```

---

## 🐳 Docker Deployment

### docker-compose.yml
```yaml
version: '3.8'

services:
  openclaw:
    image: openclaw/gateway:latest
    ports:
      - "18789:18789"
    environment:
      - OPENCLAW_TOKEN=${OPENCLAW_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Start Services
```bash
# Create .env file
echo "OPENCLAW_TOKEN=your-token" > .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Start
docker-compose up -d

# Check logs
docker-compose logs -f openclaw

# Connect channels
docker-compose exec openclaw openclaw channels add whatsapp
```

---

## 🧪 Testing

### Unit Test Example (Jest)
```javascript
// __tests__/notifications.test.js
const { sendNotification } = require('../services/notifications');

jest.mock('openclaw-sdk');

describe('Notifications', () => {
  it('should send notification', async () => {
    const result = await sendNotification('+1234567890', 'Test');
    expect(result).toHaveProperty('id');
  });
});
```

### Integration Test
```javascript
// __tests__/integration.test.js
const { OpenClaw } = require('openclaw-sdk');

describe('OpenClaw Integration', () => {
  let claw;

  beforeAll(() => {
    claw = new OpenClaw({
      gateway: process.env.TEST_GATEWAY,
      token: process.env.TEST_TOKEN
    });
  });

  it('should send message', async () => {
    const result = await claw.message.send({
      to: process.env.TEST_PHONE,
      message: 'Test message',
      channel: 'whatsapp'
    });
    
    expect(result.id).toBeDefined();
  });
});
```

---

## 📱 Channel-Specific Examples

### WhatsApp
```javascript
await claw.message.send({
  to: '+1234567890',
  message: 'Hello via WhatsApp!',
  channel: 'whatsapp',
  options: {
    previewUrl: true // Enable link previews
  }
});
```

### Telegram
```javascript
await claw.message.send({
  to: '@username', // or chat_id
  message: '*Bold* _italic_ `code`',
  channel: 'telegram',
  options: {
    parseMode: 'markdown'
  }
});
```

### Slack
```javascript
await claw.message.send({
  to: '#general',
  message: 'Hello team!',
  channel: 'slack',
  options: {
    username: 'Bot Name',
    iconEmoji: ':robot_face:'
  }
});
```

### Discord
```javascript
await claw.message.send({
  to: 'channel_id',
  message: 'Hello Discord!',
  channel: 'discord',
  options: {
    embed: {
      title: 'Important Update',
      description: 'Check this out!',
      color: 0x0099ff
    }
  }
});
```

---

## 🎯 Real-World Use Cases

### Order Confirmation
```javascript
async function sendOrderConfirmation(order) {
  await claw.message.send({
    to: order.customer.phone,
    message: `✅ Order #${order.id} confirmed!\n\n` +
      `Items: ${order.items.length}\n` +
      `Total: $${order.total}\n` +
      `Estimated delivery: ${order.deliveryDate}`,
    channel: 'whatsapp'
  });
}
```

### Support Ticket Alert
```javascript
async function alertSupport(ticket) {
  await claw.message.send({
    to: '#support-urgent',
    message: `🚨 New Priority Ticket\n\n` +
      `ID: ${ticket.id}\n` +
      `Customer: ${ticket.customer}\n` +
      `Issue: ${ticket.description}\n\n` +
      `<@support-team>`,
    channel: 'slack'
  });
}
```

### Appointment Reminder
```javascript
async function sendAppointmentReminder(appointment) {
  const message = await claw.agent.chat(
    `Create a friendly reminder for appointment:\n` +
    `Date: ${appointment.date}\n` +
    `Time: ${appointment.time}\n` +
    `Location: ${appointment.location}`
  );
  
  await claw.message.send({
    to: appointment.customer.phone,
    message: message.text,
    channel: 'whatsapp'
  });
}
```

---

## 🆘 Troubleshooting

### Check Gateway Status
```javascript
const health = await claw.health();
console.log('Gateway status:', health);
```

### List Connected Channels
```javascript
const channels = await claw.channels.list();
channels.forEach(ch => {
  console.log(`${ch.name}: ${ch.status}`);
});
```

### Debug Mode
```javascript
const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY,
  token: process.env.OPENCLAW_TOKEN,
  debug: true // Enable debug logging
});
```

### Test Message
```bash
# CLI test
openclaw message send \
  --to "+1234567890" \
  --message "Test message" \
  --channel whatsapp
```

---

## 📚 Additional Resources

- **Full Documentation**: https://docs.openclaw.ai
- **API Reference**: https://docs.openclaw.ai/api
- **Discord Community**: https://discord.gg/clawd
- **GitHub**: https://github.com/openclaw/openclaw
- **Examples Repository**: https://github.com/openclaw/examples

---

**Need more help?** Join our [Discord](https://discord.gg/clawd) or check the [docs](https://docs.openclaw.ai)! 🦞
