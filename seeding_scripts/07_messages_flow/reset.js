/**
 * FLOW 07 — Reset Script
 * ============================================================
 * Cleans up conversation references from session_state.json.
 *
 * Usage:
 *   node seeding_scripts/07_messages_flow/reset.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

function resetFlow07() {
  console.log('🔄 Resetting Flow 07 (Direct Messaging)...');

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.conversations;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.conversations;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared direct conversation session references.');
}

resetFlow07();

