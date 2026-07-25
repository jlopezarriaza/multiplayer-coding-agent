import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.join(__dirname, '../workspace');
const WS_URL = 'ws://localhost:3001/ws';
const API_URL = 'http://localhost:3001/api/config/apikey';

async function setApiKeyIfPresent() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY is not set in environment.');
    return false;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const data = await res.json();
    console.log('🔑 API Key configured on server:', data);
    return true;
  } catch (err) {
    console.error('Failed to send API key to server:', err);
    return false;
  }
}

function createClient(userName: string, userId: string, avatar: string) {
  return new Promise<{ ws: WebSocket; sendMsg: (text: string) => Promise<any> }>((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomId: 'room-dev-1',
          user: { id: userId, name: userName, avatar, role: 'human' }
        }
      }));

      const sendMsg = (text: string) => {
        return new Promise((resMsg) => {
          const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

          const handleIncoming = (raw: WebSocket.Data) => {
            try {
              const packet = JSON.parse(raw.toString());
              if (packet.type === 'AGENT_STREAM_UPDATE' && packet.payload?.message?.isStreaming === false) {
                console.log(`\n🤖 [AGENT RESPONSE RECEIVED FOR ${userName}]`);
                console.log(`Content:\n${packet.payload.message.content}`);
                if (packet.payload.message.toolExecutions?.length) {
                  console.log(`Tools Executed (${packet.payload.message.toolExecutions.length}):`);
                  for (const tool of packet.payload.message.toolExecutions) {
                    console.log(`  - ${tool.toolName} -> ${tool.status}: ${tool.result?.slice(0, 100)}`);
                  }
                }
                ws.off('message', handleIncoming);
                resMsg(packet.payload.message);
              }
            } catch (e) {
              // Ignore non-json
            }
          };

          ws.on('message', handleIncoming);

          ws.send(JSON.stringify({
            type: 'SEND_MESSAGE',
            payload: {
              message: {
                id: msgId,
                roomId: 'room-dev-1',
                sender: { id: userId, name: userName, avatar, role: 'human' },
                content: text,
                timestamp: new Date().toISOString(),
                mentions: ['@gemini']
              }
            }
          }));
        });
      };

      resolve({ ws, sendMsg });
    });

    ws.on('error', (err) => reject(err));
  });
}

async function runMultiplayerGameBuildTest() {
  console.log('🚀 Starting Multiplayer Game Build Simulation Test...\n');

  const hasKey = await setApiKeyIfPresent();
  if (!hasKey) {
    console.log('❌ Test aborted: Please set GEMINI_API_KEY environment variable to execute live LLM turns.');
    process.exit(1);
  }

  console.log('👥 Connecting 2 simulated players: Bob (Game Designer) & Alice (Tech Lead)...');
  const bob = await createClient('Bob (Game Designer)', 'user-bob-101', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob');
  const alice = await createClient('Alice (Tech Lead)', 'user-alice-102', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice');

  console.log('✅ Both players connected to room-dev-1 via WebSocket.\n');

  // Turn 1: Bob asks @gemini to build initial TUI snake game
  console.log('🎮 TURN 1: Bob requests initial TUI Snake game build...');
  const prompt1 = `@gemini Create a python script snake_tui.py in the workspace directory. It should implement a Terminal UI (TUI) Snake video game using curses or ANSI terminal codes, featuring a game grid, snake movement, food spawning, score calculation, and a --demo flag that runs 25 frames automatically and exits cleanly with 0 exit code. Verify it works by executing python3 snake_tui.py --demo.`;

  await bob.sendMsg(prompt1);
  console.log('✨ Turn 1 finished!\n');

  // Turn 2: Alice requests features & testing
  console.log('🎮 TURN 2: Alice requests obstacle walls and high score system...');
  const prompt2 = `@gemini Excellent work! Now update snake_tui.py to add obstacle walls ('#') and a high score tracker. Run python3 snake_tui.py --demo to verify that the demo mode renders the new features and exits cleanly.`;

  await alice.sendMsg(prompt2);
  console.log('✨ Turn 2 finished!\n');

  // Verification step
  console.log('🔍 VERIFICATION STEP: Validating workspace artifacts on disk...');
  const snakePath = path.join(WORKSPACE_DIR, 'snake_tui.py');

  if (!fs.existsSync(snakePath)) {
    console.error(`❌ FAIL: File ${snakePath} was not created on disk!`);
    process.exit(1);
  }

  console.log(`✅ File found on disk: ${snakePath}`);
  console.log(`File size: ${fs.statSync(snakePath).size} bytes`);

  console.log('🏃 Executing python3 snake_tui.py --demo in workspace...');
  try {
    const stdout = execSync('python3 snake_tui.py --demo', { cwd: WORKSPACE_DIR, encoding: 'utf-8', timeout: 10000 });
    console.log('--- DEMO OUTPUT ---');
    console.log(stdout.slice(0, 500));
    console.log('-------------------');
    console.log('🎉 SUCCESS: Python TUI video game built and verified in multiplayer simulation test!');
  } catch (err: any) {
    console.error('❌ FAIL: Execution error:', err?.message || err);
    process.exit(1);
  }

  bob.ws.close();
  alice.ws.close();
  process.exit(0);
}

runMultiplayerGameBuildTest().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
