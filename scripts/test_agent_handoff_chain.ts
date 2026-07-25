import WebSocket from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WS_URL = 'ws://localhost:3001/ws';
const API_URL = 'http://localhost:3001/api/config/apikey';

async function runHandoffTest() {
  console.log('🚀 Testing Agent-to-Agent Handoff Chain (@architect -> @gemini)...\n');

  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC9ud8bVb2bRGMzWCrIJNoPjWY7SyG7Gq4';
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });

  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'JOIN_ROOM',
      payload: {
        roomId: 'room-dev-1',
        user: { id: 'user-lead-1', name: 'Bob (Product Manager)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', role: 'human' }
      }
    }));

    const handoffsSeen: string[] = [];

    ws.on('message', (raw) => {
      try {
        const packet = JSON.parse(raw.toString());
        if (packet.type === 'AGENT_STREAM_UPDATE' && packet.payload?.message?.isStreaming === false) {
          const msg = packet.payload.message;
          console.log(`✨ [AGENT RESPONSE] ${msg.sender.handle} (${msg.sender.name})`);
          console.log(`Content:\n${msg.content.slice(0, 200)}...\n`);
          handoffsSeen.push(msg.sender.handle);

          if (handoffsSeen.includes('@architect') && handoffsSeen.includes('@gemini')) {
            console.log('🎉 SUCCESS: Agent-to-Agent handoff chain verified! @architect handed off work to @gemini autonomously!');
            ws.close();
            process.exit(0);
          }
        }
      } catch (e) {}
    });

    console.log('💬 Prompting @architect and asking it to delegate implementation to @gemini...');
    ws.send(JSON.stringify({
      type: 'SEND_MESSAGE',
      payload: {
        message: {
          id: `msg-handoff-${Date.now()}`,
          roomId: 'room-dev-1',
          sender: { id: 'user-lead-1', name: 'Bob (Product Manager)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', role: 'human' },
          content: '@architect design a microservice architecture for an email notification service and tag @gemini to implement the Python notification worker.',
          timestamp: new Date().toISOString(),
          mentions: ['@architect']
        }
      }
    }));
  });
}

runHandoffTest().catch(console.error);
