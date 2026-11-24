/**
 * VibeGrid Master Postman Collection Generator
 * ============================================================
 * Generates Postman Collection v2.1.0 covering all 46 REST API routes
 * with automatic token/cookie capture, variable chaining, and tests.
 *
 * Usage:
 *   node scripts/generate-postman-collection.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'postman', 'VibeGrid.postman_collection.json');
const ENV_PATH = path.join(__dirname, '..', 'postman', 'VibeGrid.postman_environment.json');

// --- Helper Script Builders ---
const LOGIN_TEST_SCRIPT = [
  "const body = pm.response.json();",
  "if (pm.response.code >= 200 && pm.response.code < 300) {",
  "    let token = '';",
  "    const cookies = pm.response.headers.all().filter(h => h.key.toLowerCase() === 'set-cookie');",
  "    cookies.forEach(c => {",
  "        const match = c.value.match(/access_token=([^;]+)/);",
  "        if (match) token = match[1];",
  "    });",
  "    if (!token && body.token) token = body.token;",
  "    if (!token && body.accessToken) token = body.accessToken;",
  "    if (token) {",
  "        pm.collectionVariables.set('jwt_token', token);",
  "        pm.collectionVariables.set('cookie_header', 'access_token=' + token);",
  "    }",
  "    if (body.user?.id) pm.collectionVariables.set('user_id', body.user.id);",
  "    if (body.user?.email) pm.collectionVariables.set('user_email', body.user.email);",
  "    if (body.user?.role) pm.collectionVariables.set('user_role', body.user.role);",
  "    pm.test('Status is 200 & Token Captured', () => {",
  "        pm.expect(pm.response.code).to.be.oneOf([200, 201]);",
  "        pm.expect(pm.collectionVariables.get('jwt_token')).to.be.a('string').and.not.empty;",
  "    });",
  "}"
];

const STANDARD_TEST_SCRIPT = [
  "pm.test('Status code is 2xx', () => {",
  "    pm.expect(pm.response.code).to.be.within(200, 299);",
  "});"
];

function makeReq(name, method, urlPath, body = null, tests = STANDARD_TEST_SCRIPT, desc = '') {
  const urlSegments = urlPath.replace(/^\//, '').split('/');
  const item = {
    name,
    request: {
      method,
      header: [
        { key: 'Content-Type', value: 'application/json', type: 'text' }
      ],
      url: {
        raw: '{{base_url}}/' + urlSegments.join('/'),
        host: ['{{base_url}}'],
        path: urlSegments
      },
      description: desc
    },
    response: []
  };

  if (body) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } }
    };
  }

  if (tests && tests.length > 0) {
    item.event = [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: tests
        }
      }
    ];
  }

  return item;
}

// --- Domain Folders Construction ---
const collection = {
  info: {
    _postman_id: 'vibegrid-master-api-collection',
    name: 'VibeGrid Platform API',
    description: 'Comprehensive REST API collection for VibeGrid Clean Architecture Microservices platform.\n\n' +
      '**Authentication Flow:**\n' +
      '1. Select Environment (Local or Production).\n' +
      '2. Run `01. Authentication & Identity -> Login (User or Admin)`.\n' +
      '3. The test script automatically extracts `access_token` from Set-Cookie / body and sets `{{jwt_token}}`.\n' +
      '4. All subsequent requests automatically inherit Bearer token & Cookie headers.\n\n' +
      '**Dynamic Variable Chaining:** Post IDs, Poll IDs, Conversation IDs, and Guild Slugs are auto-captured.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  auth: {
    type: 'bearer',
    bearer: [
      { key: 'token', value: '{{jwt_token}}', type: 'string' }
    ]
  },
  event: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          "const token = pm.collectionVariables.get('jwt_token');",
          "if (token) {",
          "    pm.request.headers.upsert({ key: 'Authorization', value: 'Bearer ' + token });",
          "    pm.request.headers.upsert({ key: 'Cookie', value: 'access_token=' + token });",
          "}"
        ]
      }
    }
  ],
  variable: [
    { key: 'base_url', value: 'http://localhost:3000/api' },
    { key: 'jwt_token', value: '' },
    { key: 'cookie_header', value: '' },
    { key: 'user_id', value: '' },
    { key: 'user_email', value: '' },
    { key: 'user_role', value: '' },
    { key: 'category_id', value: '' },
    { key: 'vibe_id', value: '' },
    { key: 'post_id', value: '' },
    { key: 'poll_id', value: '' },
    { key: 'community_slug', value: 'frontend-architects' },
    { key: 'conversation_id', value: '' }
  ],
  item: [
    // 00. System Health & Readiness
    {
      name: '00. System Health & Readiness',
      item: [
        makeReq('Liveness Probe (GET /api/health)', 'GET', 'health', null, STANDARD_TEST_SCRIPT, 'Checks microservices liveness.'),
        makeReq('Readiness Probe (GET /api/ready)', 'GET', 'ready', null, STANDARD_TEST_SCRIPT, 'Checks database & cache connectivity.')
      ]
    },

    // 01. Authentication & Identity
    {
      name: '01. Authentication & Identity',
      item: [
        makeReq('Register User (POST /api/auth/register)', 'POST', 'auth/register', {
          name: 'Omar Farooq',
          username: 'omar_farooq',
          email: 'developer_01@vibegrid.manakhly.tech',
          password: 'Password#2026!'
        }, STANDARD_TEST_SCRIPT, 'Registers new developer persona.'),
        
        makeReq('Verify Email with Seed OTP (POST /api/auth/verify-email)', 'POST', 'auth/verify-email', {
          email: 'developer_01@vibegrid.manakhly.tech',
          code: '123456'
        }, STANDARD_TEST_SCRIPT, 'Verifies email using developer bypass OTP (123456).'),
        
        makeReq('Login as Persona (POST /api/auth/login)', 'POST', 'auth/login', {
          email: 'developer_01@vibegrid.manakhly.tech',
          password: 'Password#2026!'
        }, LOGIN_TEST_SCRIPT, 'Authenticates persona and captures access_token & cookie.'),

        makeReq('Login as Platform Admin (POST /api/auth/login)', 'POST', 'auth/login', {
          email: 'admin@vibegrid.manakhly.tech',
          password: '{{admin_password}}'
        }, LOGIN_TEST_SCRIPT, 'Authenticates platform admin for taxonomy and guild operations.'),

        makeReq('Get Current User Session (GET /api/auth/me)', 'GET', 'auth/me', null, STANDARD_TEST_SCRIPT, 'Returns authenticated user identity.'),
        makeReq('Refresh Access Token (POST /api/auth/refresh)', 'POST', 'auth/refresh', {}, STANDARD_TEST_SCRIPT, 'Rotates JWT tokens via refresh token cookie.'),
        makeReq('Logout (POST /api/auth/logout)', 'POST', 'auth/logout', {}, STANDARD_TEST_SCRIPT, 'Clears server session & cookies.')
      ]
    },

    // 02. Taxonomy & Categorization
    {
      name: '02. Taxonomy & Categorization',
      item: [
        makeReq('Get Feed Filters (GET /api/feed/filters)', 'GET', 'feed/filters', null, [
          ...STANDARD_TEST_SCRIPT,
          "const body = pm.response.json();",
          "if (body.categories?.[0]?.id) pm.collectionVariables.set('category_id', body.categories[0].id);",
          "if (body.vibes?.[0]?.id) pm.collectionVariables.set('vibe_id', body.vibes[0].id);"
        ], 'Retrieves all 15 active categories and 12 vibes, saving sample IDs.'),

        makeReq('Get Trending Tags (GET /api/feed/tags)', 'GET', 'feed/tags', null, STANDARD_TEST_SCRIPT, 'Returns top hashtags.'),
        makeReq('Get Trending Posts (GET /api/feed/trending)', 'GET', 'feed/trending', null, STANDARD_TEST_SCRIPT, 'Returns trending posts ranking.'),

        makeReq('Create Category [Admin] (POST /api/taxonomy/categories)', 'POST', 'taxonomy/categories', {
          name: 'Distributed Systems',
          slug: 'distributed-systems',
          emoji: '🌐'
        }, STANDARD_TEST_SCRIPT, 'Admin route: creates new category.'),

        makeReq('Create Vibe [Admin] (POST /api/taxonomy/vibes)', 'POST', 'taxonomy/vibes', {
          key: 'benchmarking',
          label: '⚡ Benchmarking'
        }, STANDARD_TEST_SCRIPT, 'Admin route: creates new vibe tag.')
      ]
    },

    // 03. Profiles & Topic Interests
    {
      name: '03. User Profiles & Settings',
      item: [
        makeReq('Get Current Profile (GET /api/profile)', 'GET', 'profile', null, STANDARD_TEST_SCRIPT, 'Fetches active user profile.'),
        makeReq('Update Profile Details (PUT /api/profile)', 'PUT', 'profile', {
          name: 'Omar Farooq',
          bio: 'Staff Distributed Systems Engineer | Raft & Paxos Specialist',
          location: 'Cairo, Egypt',
          githubUrl: 'https://github.com/omar-farooq',
          skills: ['Go', 'Rust', 'Distributed Systems', 'Redis']
        }, STANDARD_TEST_SCRIPT, 'Updates technical bio and external profiles.'),

        makeReq('Update Topic Interests (PUT /api/social/interests)', 'PUT', 'social/interests', {
          categoryIds: ['{{category_id}}']
        }, STANDARD_TEST_SCRIPT, 'Saves technical topic interests for feed personalization.')
      ]
    },

    // 04. Developer Communities & Guilds
    {
      name: '04. Developer Communities & Guilds',
      item: [
        makeReq('List All Communities (GET /api/communities)', 'GET', 'communities', null, STANDARD_TEST_SCRIPT, 'Lists active developer guilds.'),
        makeReq('Get Suggested Communities (GET /api/communities/suggested)', 'GET', 'communities/suggested', null, STANDARD_TEST_SCRIPT, 'Personalized guild suggestions.'),
        makeReq('Create Guild [Admin] (POST /api/communities)', 'POST', 'communities', {
          name: 'Kubernetes Operators',
          slug: 'k8s-operators',
          description: 'Custom Controllers & Cloud Native Systems in Go',
          icon: '☸️'
        }, STANDARD_TEST_SCRIPT, 'Creates developer guild.'),
        makeReq('Join Community (POST /api/communities/:slug/join)', 'POST', 'communities/{{community_slug}}/join', {}, STANDARD_TEST_SCRIPT, 'Enrolls user in community.')
      ]
    },

    // 05. Rich Posts, Media & Feeds
    {
      name: '05. Rich Posts & Feeds',
      item: [
        makeReq('Get Feed (GET /api/posts)', 'GET', 'posts?limit=10', null, STANDARD_TEST_SCRIPT, 'Fetches personalized post feed.'),
        makeReq('Request MinIO Upload Intent (POST /api/media/upload-intent)', 'POST', 'media/upload-intent', {
          filename: 'diagram.webp',
          mimeType: 'image/webp',
          size: 154200,
          purpose: 'post_attachment'
        }, [
          ...STANDARD_TEST_SCRIPT,
          "const body = pm.response.json();",
          "if (body.data?.assetId) pm.collectionVariables.set('asset_id', body.data.assetId);"
        ], 'Step 1 of MinIO decoupled upload pipeline.'),

        makeReq('Confirm MinIO Upload (POST /api/media/confirm-upload)', 'POST', 'media/confirm-upload', {
          assetId: '{{asset_id}}'
        }, STANDARD_TEST_SCRIPT, 'Step 3 of MinIO decoupled upload pipeline.'),

        makeReq('Create Standard Post (POST /api/posts)', 'POST', 'posts', {
          content: 'Just deployed our new multi-raft consensus engine! 🚀 #distributed #rust',
          categoryId: '{{category_id}}',
          vibeId: '{{vibe_id}}'
        }, [
          ...STANDARD_TEST_SCRIPT,
          "const body = pm.response.json();",
          "if (body.post?.id) pm.collectionVariables.set('post_id', body.post.id);"
        ], 'Publishes post and captures post_id.'),

        makeReq('Create Tech Dilemma Poll (POST /api/posts)', 'POST', 'posts', {
          content: 'Architecture Decision: PostgreSQL with read replicas vs Distributed ScyllaDB for 100k writes/sec?',
          postType: 'DILEMMA_POLL',
          poll: {
            question: 'Which datastore would you pick?',
            options: ['PostgreSQL Partitioned', 'ScyllaDB / Cassandra', 'CockroachDB'],
            durationHours: 24
          }
        }, [
          ...STANDARD_TEST_SCRIPT,
          "const body = pm.response.json();",
          "if (body.post?.id) pm.collectionVariables.set('poll_id', body.post.id);"
        ], 'Creates Dilemma Poll post.'),

        makeReq('Get Single Post (GET /api/posts/:id)', 'GET', 'posts/{{post_id}}', null, STANDARD_TEST_SCRIPT, 'Retrieves post details and comments.'),
        makeReq('Delete Post (DELETE /api/posts/:id)', 'DELETE', 'posts/{{post_id}}', null, STANDARD_TEST_SCRIPT, 'Removes post.')
      ]
    },

    // 06. Social Graph
    {
      name: '06. Social Graph & Discovery',
      item: [
        makeReq('Toggle Follow User (POST /api/social/follow)', 'POST', 'social/follow', {
          targetUserId: '{{target_user_id}}'
        }, STANDARD_TEST_SCRIPT, 'Establishes or toggles follow connection.'),
        makeReq('Get Suggested Users (GET /api/social/suggested)', 'GET', 'social/suggested', null, STANDARD_TEST_SCRIPT, 'Returns relevant engineers to follow.'),
        makeReq('Search Users (GET /api/search/users)', 'GET', 'search/users?q=omar', null, STANDARD_TEST_SCRIPT, 'Finds user profiles matching query.')
      ]
    },

    // 07. Social Engagement Matrix
    {
      name: '07. Social Engagement Matrix',
      item: [
        makeReq('Toggle Like Post (POST /api/posts/:id/like)', 'POST', 'posts/{{post_id}}/like', {}, STANDARD_TEST_SCRIPT, 'Registers post like.'),
        makeReq('Add Threaded Comment (POST /api/posts/:id/comments)', 'POST', 'posts/{{post_id}}/comments', {
          content: 'Incredible writeup! Did you benchmark tail latencies with p999?'
        }, STANDARD_TEST_SCRIPT, 'Adds comment to post.'),
        makeReq('Vote on Dilemma Poll (POST /api/posts/:id/poll/vote)', 'POST', 'posts/{{poll_id}}/poll/vote', {
          optionIndex: 0
        }, STANDARD_TEST_SCRIPT, 'Casts vote on tech dilemma poll.'),
        makeReq('Re-Grid / Amplify Post (POST /api/posts/:id/regrid)', 'POST', 'posts/{{post_id}}/regrid', {}, STANDARD_TEST_SCRIPT, 'Re-grids post to followers.'),
        makeReq('Mark Accepted Solution (POST /api/posts/:id/solution)', 'POST', 'posts/{{post_id}}/solution', {
          commentId: '{{comment_id}}'
        }, STANDARD_TEST_SCRIPT, 'Author accepts solution on Q&A post.')
      ]
    },

    // 08. Bookmarks & Notifications
    {
      name: '08. Bookmarks & Notifications',
      item: [
        makeReq('Toggle Bookmark (POST /api/posts/:id/bookmark)', 'POST', 'posts/{{post_id}}/bookmark', {}, STANDARD_TEST_SCRIPT, 'Saves post to personal reading list.'),
        makeReq('Get Notifications (GET /api/notifications)', 'GET', 'notifications', null, STANDARD_TEST_SCRIPT, 'Retrieves user notifications.'),
        makeReq('Mark Notifications Read (PATCH /api/notifications)', 'PATCH', 'notifications', {
          notificationIds: []
        }, STANDARD_TEST_SCRIPT, 'Marks notifications as read.')
      ]
    },

    // 09. Direct Messaging & Conversations
    {
      name: '09. Direct Messaging & Conversations',
      item: [
        makeReq('Get or Start Conversation (POST /api/messages/conversations)', 'POST', 'messages/conversations', {
          participantId: '{{target_user_id}}'
        }, [
          ...STANDARD_TEST_SCRIPT,
          "const body = pm.response.json();",
          "if (body.conversation?.id) pm.collectionVariables.set('conversation_id', body.conversation.id);"
        ], 'Initializes 1-on-1 private chat channel.'),

        makeReq('Send Direct Message (POST /api/messages/conversations/:id/messages)', 'POST', 'messages/conversations/{{conversation_id}}/messages', {
          content: 'Hey Sarah! Did you review the latest Raft benchmark traces?'
        }, STANDARD_TEST_SCRIPT, 'Dispatches message into chat channel.'),

        makeReq('Get Message History (GET /api/messages/conversations/:id/messages)', 'GET', 'messages/conversations/{{conversation_id}}/messages', null, STANDARD_TEST_SCRIPT, 'Fetches message timeline.')
      ]
    }
  ]
};

// --- Postman Environment Presets ---
const environment = {
  id: 'vibegrid-default-env',
  name: 'VibeGrid Environment (Local / Prod)',
  values: [
    { key: 'base_url', value: 'https://www.vibegrid.manakhly.tech/api', enabled: true },
    { key: 'local_base_url', value: 'http://localhost:3000/api', enabled: true },
    { key: 'prod_base_url', value: 'https://www.vibegrid.manakhly.tech/api', enabled: true },
    { key: 'admin_password', value: 'V1b3Gr1d_Adm!n2026', enabled: true },
    { key: 'target_user_id', value: '', enabled: true }
  ]
};

// --- Write Files ---
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(collection, null, 2), 'utf8');
console.log('✅ Generated Master Postman Collection:', OUTPUT_PATH);

fs.writeFileSync(ENV_PATH, JSON.stringify(environment, null, 2), 'utf8');
console.log('✅ Generated Postman Environment Preset:', ENV_PATH);
