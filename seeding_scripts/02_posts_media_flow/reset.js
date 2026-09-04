/**
 * FLOW 02 — Reset Script
 * ============================================================
 * Cleans up post references from session_state.json.
 *
 * Usage:
 *   node seeding_scripts/02_posts_media_flow/reset.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

function resetFlow02() {
  console.log('🔄 Resetting Flow 02 (Posts & Media)...');

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.posts;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.posts;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared post session references.');
}

resetFlow02();
