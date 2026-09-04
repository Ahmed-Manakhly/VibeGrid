/**
 * FLOW 05 — Reset Script
 * ============================================================
 * Cleans up notification verification state from session_state.json.
 *
 * Usage:
 *   node seeding_scripts/05_notifications_flow/reset.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

function resetFlow05() {
  console.log('🔄 Resetting Flow 05 (Notifications)...');

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.notifications;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.notifications;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared notification session references.');
}

resetFlow05();
