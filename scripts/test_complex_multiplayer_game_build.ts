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
                console.log(`Content:\n${packet.payload.message.content.slice(0, 400)}...\n`);
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

async function runComplexMultiplayerGameBuildTest() {
  console.log('🚀 Starting COMPLEX Multi-Turn Multiplayer Game Build Benchmark...\n');

  const hasKey = await setApiKeyIfPresent();
  if (!hasKey) {
    console.log('❌ Test aborted: Please set GEMINI_API_KEY environment variable to execute live LLM turns.');
    process.exit(1);
  }

  console.log('👥 Connecting simulated team: Bob (Product Lead) & Alice (Senior Architect)...');
  const bob = await createClient('Bob (Product Lead)', 'user-bob-101', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob');
  const alice = await createClient('Alice (Senior Architect)', 'user-alice-102', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice');

  console.log('✅ Connected to room-dev-1 via WebSocket.\n');

  // TURN 1: Initial Modular Game Engine Setup
  console.log('🎮 TURN 1 [Bob]: Requesting modular Space Invaders game engine...');
  const prompt1 = `@gemini We need a full-featured modular Terminal Space Invaders video game (space_invaders_tui.py) in the workspace. Implement clean OOP classes: GameEngine, PlayerShip ('^'), AlienArmy ('V' grid), ProjectileManager, and Renderer. Include a --demo flag that runs 40 frames automatically and exits cleanly with exit code 0. Execute python3 space_invaders_tui.py --demo to test it.`;
  await bob.sendMsg(prompt1);
  console.log('✨ Turn 1 completed.\n');

  // TURN 2: Dynamic Difficulty & 3 Enemy Tiers
  console.log('🎮 TURN 2 [Alice]: Adding 3 enemy tiers and Dreadnought boss...');
  const prompt2 = `@gemini Great start! Now update space_invaders_tui.py to add 3 enemy tiers ('V' Scout = 10pts, 'W' Cruiser = 20pts, 'M' Dreadnought Boss = 100pts with 5 health), player shield energy, and dynamic speed scaling as enemy count decreases. Run python3 space_invaders_tui.py --demo to verify execution.`;
  await alice.sendMsg(prompt2);
  console.log('✨ Turn 2 completed.\n');

  // TURN 3: Unit Testing Suite & Bug Verification
  console.log('🎮 TURN 3 [Bob]: Adding unit test suite --run-tests...');
  const prompt3 = `@gemini Let's ensure code reliability! Add a --run-tests flag to space_invaders_tui.py that executes unit tests for PlayerShip shield mechanics, alien hit detection, and boss spawning. Execute python3 space_invaders_tui.py --run-tests and fix any errors until 100% green.`;
  await bob.sendMsg(prompt3);
  console.log('✨ Turn 3 completed.\n');

  // TURN 4: Modular High Score Persistence Module
  console.log('🎮 TURN 4 [Alice]: Creating score_manager.py JSON persistence module...');
  const prompt4 = `@gemini Now create a separate score_manager.py module in workspace that persists top 5 high scores with player names and timestamps in JSON format (scores.json). Integrate score_manager.py into space_invaders_tui.py. Run python3 space_invaders_tui.py --run-tests to verify integration.`;
  await alice.sendMsg(prompt4);
  console.log('✨ Turn 4 completed.\n');

  // TURN 5: Final Release Check & Git Commit
  console.log('🎮 TURN 5 [Bob]: Final release audit & git commit...');
  const prompt5 = `@gemini Final release check: Run both python3 space_invaders_tui.py --demo and python3 space_invaders_tui.py --run-tests. Then commit all changes with git_commit message 'release: v1.0.0 Space Invaders TUI Suite'.`;
  await bob.sendMsg(prompt5);
  console.log('✨ Turn 5 completed.\n');

  // PHYSICAL DISK VALIDATION
  console.log('🔍 FINAL BENCHMARK VALIDATION: Checking physical workspace artifacts...');
  const gamePath = path.join(WORKSPACE_DIR, 'space_invaders_tui.py');
  const scorePath = path.join(WORKSPACE_DIR, 'score_manager.py');

  if (!fs.existsSync(gamePath)) {
    console.error(`❌ FAIL: File ${gamePath} was not created!`);
    process.exit(1);
  }
  if (!fs.existsSync(scorePath)) {
    console.error(`❌ FAIL: Module ${scorePath} was not created!`);
    process.exit(1);
  }

  console.log(`✅ Files created on disk:`);
  console.log(`  - ${gamePath} (${fs.statSync(gamePath).size} bytes)`);
  console.log(`  - ${scorePath} (${fs.statSync(scorePath).size} bytes)`);

  console.log('\n🏃 Running Unit Test Suite: python3 space_invaders_tui.py --run-tests ...');
  try {
    const testOut = execSync('python3 space_invaders_tui.py --run-tests', { cwd: WORKSPACE_DIR, encoding: 'utf-8', timeout: 10000 });
    console.log('--- TEST SUITE STDOUT ---');
    console.log(testOut.trim());
    console.log('-------------------------\n');
  } catch (err: any) {
    console.error('❌ FAIL: Unit test execution failed:', err?.message || err);
    process.exit(1);
  }

  console.log('🏃 Running Game Demo: python3 space_invaders_tui.py --demo ...');
  try {
    const demoOut = execSync('python3 space_invaders_tui.py --demo', { cwd: WORKSPACE_DIR, encoding: 'utf-8', timeout: 10000 });
    console.log('--- GAME DEMO STDOUT ---');
    console.log(demoOut.slice(0, 600));
    console.log('------------------------\n');
  } catch (err: any) {
    console.error('❌ FAIL: Demo execution failed:', err?.message || err);
    process.exit(1);
  }

  console.log('🏆 BENCHMARK PASSED 100%! Complex multi-turn game suite built, refactored, tested, and verified autonomously!');
  bob.ws.close();
  alice.ws.close();
  process.exit(0);
}

runComplexMultiplayerGameBuildTest().catch((err) => {
  console.error('Complex benchmark script error:', err);
  process.exit(1);
});
