# 🏗️ OpenClaw Integration Guide: From Zero to Production

## Overview

This guide shows you exactly how to integrate OpenClaw into your application, with real-world code examples and best practices.

---

## 🎯 Integration Levels

Choose your integration level based on your needs:

| Level | Complexity | Time | Best For |
|-------|-----------|------|----------|
| **Basic** | Low | 30 min | Prototyping, MVPs |
| **Standard** | Medium | 2-4 hours | Most applications |
| **Advanced** | High | 1-2 days | Enterprise, Custom |

---

## 📦 Level 1: Basic Integration (30 minutes)

Perfect for: Getting started, prototypes, simple use cases

### Step 1: Install OpenClaw

```bash
npm install -g openclaw@latest

# Or add to your project
npm install openclaw-sdk --save
```

### Step 2: Start the Gateway

```bash
openclaw onboard --install-daemon
```

This wizard will:
- Configure your AI provider (Anthropic/OpenAI/etc.)
- Set up your first messaging channel
- Install the gateway as a system service
- Generate API credentials

### Step 3: Basic Usage in Your App

```javascript
// app.js
const OpenClaw = require('openclaw-sdk');

const claw = new OpenClaw({
  gateway: 'http://localhost:18789',
  token: process.env.OPENCLAW_TOKEN
});

// Send a message
async function notifyUser(userId, message) {
  const user = await getUser(userId);
  
  await claw.message.send({
    to: user.phone,
    message: message,
    channel: user.preferredChannel || 'whatsapp'
  });
}

// Example: Send order confirmation
await notifyUser(order.customerId, 
  `✅ Order #${order.id} confirmed! Estimated delivery: ${order.deliveryDate}`
);
```

### Step 4: Receive Messages (Optional)

```javascript
// Listen for incoming messages
claw.on('message', async (message) => {
  console.log(`Received from ${message.from}: ${message.text}`);
  
  // Auto-respond
  if (message.text.toLowerCase().includes('status')) {
    const order = await getOrderByPhone(message.from);
    await message.reply(`Your order #${order.id} is ${order.status}`);
  }
});

claw.start();
```

**That's it!** You now have multi-channel messaging in your app.

---

## 🚀 Level 2: Standard Integration (2-4 hours)

Perfect for: Production apps, SaaS products, internal tools

### Architecture

```
┌─────────────────────────────────────────┐
│         Your Application                │
│  (Express/Next.js/Django/etc.)         │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      OpenClaw Gateway (Docker)          │
│  ┌────────────────────────────────┐    │
│  │  Message Router                │    │
│  │  • WhatsApp  • Telegram        │    │
│  │  • Slack     • Discord         │    │
│  │  • + 10 more channels          │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      AI Provider (Anthropic/OpenAI)    │
└─────────────────────────────────────────┘
```

### Step 1: Deploy OpenClaw Gateway

**Using Docker (Recommended):**

```yaml
# docker-compose.yml
version: '3.8'

services:
  openclaw:
    image: openclaw/gateway:latest
    ports:
      - "18789:18789"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENCLAW_TOKEN=${OPENCLAW_TOKEN}
    volumes:
      - ./openclaw-data:/data
    restart: unless-stopped
```

```bash
docker-compose up -d
```

**Environment Variables:**
```bash
# .env
OPENCLAW_TOKEN=your-secure-token-here
ANTHROPIC_API_KEY=sk-ant-...
# Or
OPENAI_API_KEY=sk-...
```

### Step 2: Configure Channels

```bash
# Connect WhatsApp
docker exec openclaw openclaw channels add whatsapp

# Connect Telegram
docker exec openclaw openclaw channels add telegram

# Connect Slack
docker exec openclaw openclaw channels add slack --token xoxb-...

# List all connected channels
docker exec openclaw openclaw channels status
```

### Step 3: Integrate with Your Backend

**Express.js Example:**

```javascript
// server.js
const express = require('express');
const { OpenClaw } = require('openclaw-sdk');

const app = express();
const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY || 'http://localhost:18789',
  token: process.env.OPENCLAW_TOKEN
});

// Middleware: Add OpenClaw to request
app.use((req, res, next) => {
  req.claw = claw;
  next();
});

// Endpoint: Send notification
app.post('/api/notifications/send', async (req, res) => {
  const { userId, message, channel } = req.body;
  
  try {
    const result = await req.claw.message.send({
      to: userId,
      message,
      channel: channel || 'whatsapp'
    });
    
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: AI-powered chat
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  
  try {
    const response = await req.claw.agent.chat(message, {
      context,
      thinking: 'high' // or 'low', 'medium'
    });
    
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook: Receive messages from OpenClaw
app.post('/webhooks/openclaw', async (req, res) => {
  const message = req.body;
  
  // Verify webhook signature
  if (!req.claw.verifyWebhook(req.headers, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process message
  console.log('Received:', message);
  
  // Your business logic here
  if (message.text === 'order status') {
    const order = await getOrderByUser(message.from);
    await req.claw.message.send({
      to: message.from,
      message: `Order #${order.id}: ${order.status}`,
      channel: message.channel
    });
  }
  
  res.json({ success: true });
});

app.listen(3000);
```

**Next.js API Route Example:**

```typescript
// pages/api/openclaw/send.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenClaw } from 'openclaw-sdk';

const claw = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY!,
  token: process.env.OPENCLAW_TOKEN!
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, channel = 'whatsapp' } = req.body;

  try {
    const result = await claw.message.send({
      to,
      message,
      channel
    });

    res.status(200).json({ success: true, messageId: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Step 4: Error Handling & Retry Logic

```javascript
const { OpenClaw, OpenClawError } = require('openclaw-sdk');

async function sendWithRetry(to, message, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await claw.message.send({ to, message });
    } catch (error) {
      if (error instanceof OpenClawError) {
        if (error.code === 'RATE_LIMIT') {
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        } else if (error.code === 'INVALID_NUMBER') {
          // Don't retry invalid numbers
          throw error;
        }
      }
      
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

### Step 5: Monitoring & Logging

```javascript
// Set up monitoring
claw.on('error', (error) => {
  console.error('OpenClaw error:', error);
  // Send to your error tracking (Sentry, etc.)
  Sentry.captureException(error);
});

claw.on('message:sent', (message) => {
  console.log('Message sent:', message.id);
  // Track in analytics
  analytics.track('message_sent', {
    channel: message.channel,
    to: message.to
  });
});

claw.on('message:received', (message) => {
  console.log('Message received:', message.id);
  analytics.track('message_received', {
    channel: message.channel,
    from: message.from
  });
});
```

---

## ⚡ Level 3: Advanced Integration (1-2 days)

Perfect for: Enterprise, custom workflows, high-scale deployments

### Custom Hooks

Intercept and modify messages at any point:

```javascript
// hooks/custom-filters.js
module.exports = {
  // Pre-processing hook
  'before-send': async (message, context) => {
    // Add custom metadata
    message.metadata = {
      sentBy: context.user.id,
      timestamp: Date.now(),
      version: '2.0'
    };
    
    // Content moderation
    if (await containsProfanity(message.text)) {
      message.text = await moderateContent(message.text);
    }
    
    // Custom routing logic
    if (message.to.startsWith('+1')) {
      message.channel = 'whatsapp';
    } else if (message.to.startsWith('@')) {
      message.channel = 'telegram';
    }
    
    return message;
  },
  
  // Post-processing hook
  'after-send': async (message, result) => {
    // Log to database
    await db.messages.create({
      id: result.id,
      to: message.to,
      channel: message.channel,
      status: 'sent',
      sentAt: new Date()
    });
    
    // Trigger analytics
    await analytics.track('message_sent', {
      messageId: result.id,
      channel: message.channel
    });
  },
  
  // Error handling hook
  'on-error': async (error, message) => {
    // Custom error handling
    await db.errors.create({
      message: error.message,
      stack: error.stack,
      originalMessage: message
    });
    
    // Alert operations
    if (error.severity === 'critical') {
      await alertOps(error);
    }
  }
};
```

Register hooks:
```javascript
const hooks = require('./hooks/custom-filters');

for (const [event, handler] of Object.entries(hooks)) {
  claw.hooks.register(event, handler);
}
```

### Custom Channels

Add support for your proprietary messaging system:

```javascript
// channels/my-custom-channel.js
const { BaseChannel } = require('openclaw-sdk');

class MyCustomChannel extends BaseChannel {
  constructor(config) {
    super('my-custom-channel', config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  async sendMessage(to, text, options = {}) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: to,
        content: text,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send: ${response.statusText}`);
    }

    return await response.json();
  }

  async receiveMessages(callback) {
    // Set up webhook or polling
    // Call callback(message) for each received message
  }
}

// Register the channel
claw.channels.register('my-custom-channel', MyCustomChannel);
```

### High-Availability Setup

```yaml
# docker-compose.ha.yml
version: '3.8'

services:
  openclaw-1:
    image: openclaw/gateway:latest
    ports:
      - "18789:18789"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  openclaw-2:
    image: openclaw/gateway:latest
    ports:
      - "18790:18789"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - openclaw-1
      - openclaw-2
    restart: unless-stopped

volumes:
  redis-data:
```

Load balancer config:
```nginx
# nginx.conf
upstream openclaw {
    least_conn;
    server openclaw-1:18789 max_fails=3 fail_timeout=30s;
    server openclaw-2:18789 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://openclaw;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Advanced AI Integration

```javascript
// Custom AI provider integration
const { AIProvider } = require('openclaw-sdk');

class CustomAIProvider extends AIProvider {
  constructor(config) {
    super('my-ai-provider', config);
  }

  async chat(messages, options = {}) {
    // Your AI API integration
    const response = await this.api.post('/chat', {
      messages,
      model: options.model || 'gpt-4',
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000
    });

    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model
    };
  }
}

// Register and use
claw.ai.register('my-ai-provider', CustomAIProvider);
claw.ai.setDefault('my-ai-provider');
```

### Workflow Automation

```javascript
// workflows/support-automation.js
const { Workflow } = require('openclaw-sdk');

const supportWorkflow = new Workflow('support-automation')
  .trigger('message', {
    channel: ['whatsapp', 'telegram'],
    pattern: /help|support|issue/i
  })
  .step('categorize', async (message) => {
    const category = await claw.agent.chat(
      `Categorize this support request: "${message.text}". 
       Categories: billing, technical, general. 
       Respond with just the category name.`
    );
    return { category: category.text.toLowerCase().trim() };
  })
  .step('route', async (message, context) => {
    const { category } = context;
    const team = {
      billing: process.env.BILLING_TEAM_CHANNEL,
      technical: process.env.TECH_TEAM_CHANNEL,
      general: process.env.SUPPORT_TEAM_CHANNEL
    }[category];
    
    await claw.message.send({
      to: team,
      message: `New ${category} support request from ${message.from}:\n\n${message.text}`,
      channel: 'slack'
    });
  })
  .step('acknowledge', async (message) => {
    await message.reply(
      `Thanks for contacting support! Your ${context.category} request has been forwarded to our team. We'll respond shortly.`
    );
  })
  .onError(async (error, message) => {
    await message.reply('Sorry, something went wrong. Please try again.');
    console.error('Workflow error:', error);
  });

// Register workflow
claw.workflows.register(supportWorkflow);
```

---

## 🔒 Security Best Practices

### 1. Token Management

```javascript
// DON'T: Hardcode tokens
const claw = new OpenClaw({ token: 'abc123' });

// DO: Use environment variables
const claw = new OpenClaw({ 
  token: process.env.OPENCLAW_TOKEN 
});

// BETTER: Use secrets manager
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');
const secretsManager = new SecretsManager();

async function getOpenClawToken() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'openclaw/api-token'
  });
  return JSON.parse(secret.SecretString).token;
}

const claw = new OpenClaw({
  token: await getOpenClawToken()
});
```

### 2. Webhook Verification

```javascript
app.post('/webhooks/openclaw', (req, res) => {
  // Verify signature
  const signature = req.headers['x-openclaw-signature'];
  const isValid = claw.verifyWebhookSignature(
    req.body,
    signature,
    process.env.OPENCLAW_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  // ...
});
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/openclaw', limiter);
```

### 4. Input Validation

```javascript
const { z } = require('zod');

const sendMessageSchema = z.object({
  to: z.string().regex(/^\+?\d{10,15}$/),
  message: z.string().min(1).max(4096),
  channel: z.enum(['whatsapp', 'telegram', 'slack', 'discord'])
});

app.post('/api/send', async (req, res) => {
  try {
    const validated = sendMessageSchema.parse(req.body);
    const result = await claw.message.send(validated);
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📊 Monitoring & Observability

### Application Metrics

```javascript
const prometheus = require('prom-client');

// Create metrics
const messagesSent = new prometheus.Counter({
  name: 'openclaw_messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['channel', 'status']
});

const messageLatency = new prometheus.Histogram({
  name: 'openclaw_message_latency_seconds',
  help: 'Message send latency in seconds',
  labelNames: ['channel']
});

// Instrument your code
async function sendMessage(to, message, channel) {
  const timer = messageLatency.startTimer({ channel });
  
  try {
    const result = await claw.message.send({ to, message, channel });
    messagesSent.inc({ channel, status: 'success' });
    return result;
  } catch (error) {
    messagesSent.inc({ channel, status: 'error' });
    throw error;
  } finally {
    timer();
  }
}

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Health Checks

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check OpenClaw gateway
  try {
    await claw.health();
    health.checks.openclaw = { status: 'ok' };
  } catch (error) {
    health.checks.openclaw = { status: 'error', message: error.message };
    health.status = 'degraded';
  }

  // Check channels
  try {
    const channels = await claw.channels.status();
    health.checks.channels = {
      status: 'ok',
      connected: channels.filter(c => c.status === 'connected').length,
      total: channels.length
    };
  } catch (error) {
    health.checks.channels = { status: 'error', message: error.message };
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

## 🧪 Testing

### Unit Tests

```javascript
// __tests__/openclaw-integration.test.js
const { OpenClaw } = require('openclaw-sdk');

// Mock OpenClaw for testing
jest.mock('openclaw-sdk');

describe('OpenClaw Integration', () => {
  let claw;

  beforeEach(() => {
    claw = new OpenClaw({
      gateway: 'http://localhost:18789',
      token: 'test-token'
    });
  });

  it('should send message successfully', async () => {
    const mockSend = jest.fn().mockResolvedValue({ 
      id: 'msg_123', 
      status: 'sent' 
    });
    claw.message.send = mockSend;

    const result = await sendNotification('user123', 'Test message');

    expect(mockSend).toHaveBeenCalledWith({
      to: '+1234567890',
      message: 'Test message',
      channel: 'whatsapp'
    });
    expect(result.id).toBe('msg_123');
  });

  it('should handle errors gracefully', async () => {
    const mockSend = jest.fn().mockRejectedValue(
      new Error('Network error')
    );
    claw.message.send = mockSend;

    await expect(sendNotification('user123', 'Test'))
      .rejects.toThrow('Network error');
  });
});
```

### Integration Tests

```javascript
// __tests__/openclaw-e2e.test.js
const { OpenClaw } = require('openclaw-sdk');

describe('OpenClaw E2E', () => {
  let claw;

  beforeAll(() => {
    // Use test gateway
    claw = new OpenClaw({
      gateway: process.env.TEST_OPENCLAW_GATEWAY,
      token: process.env.TEST_OPENCLAW_TOKEN
    });
  });

  it('should send and receive messages', async () => {
    const testMessage = `Test ${Date.now()}`;
    
    // Send message
    const sent = await claw.message.send({
      to: process.env.TEST_PHONE_NUMBER,
      message: testMessage,
      channel: 'whatsapp'
    });

    expect(sent.id).toBeDefined();
    expect(sent.status).toBe('sent');

    // Wait for message to be received
    const received = await waitForMessage(sent.id, 30000);
    expect(received.text).toBe(testMessage);
  });
});
```

---

## 🚀 Deployment Checklist

Before going to production:

- [ ] **Environment variables** configured
- [ ] **API tokens** secured (use secrets manager)
- [ ] **Webhook signature** verification enabled
- [ ] **Rate limiting** implemented
- [ ] **Error handling** comprehensive
- [ ] **Logging** configured (structured logs)
- [ ] **Monitoring** set up (Prometheus/Datadog/etc.)
- [ ] **Health checks** implemented
- [ ] **Backup strategy** for OpenClaw data
- [ ] **Load testing** completed
- [ ] **Security audit** performed
- [ ] **Documentation** updated for your team
- [ ] **Runbook** created for operations
- [ ] **Alerts** configured for critical errors
- [ ] **Scaling plan** documented

---

## 📚 Next Steps

1. **Start simple**: Get basic integration working
2. **Add monitoring**: Set up metrics and alerts
3. **Optimize**: Tune performance based on usage
4. **Scale**: Add more gateways as needed
5. **Customize**: Add hooks, workflows, custom channels

---

## 💬 Need Help?

- **Documentation**: https://docs.openclaw.ai
- **Discord**: https://discord.gg/clawd
- **GitHub**: https://github.com/openclaw/openclaw/issues
- **Examples**: https://github.com/openclaw/openclaw-examples

---

**Happy building! 🦞**
