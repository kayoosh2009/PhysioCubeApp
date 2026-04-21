// api/stats.js — serverless функция Vercel
// Токен и KV credentials хранятся только в Vercel → Settings → Environment Variables
// Переменные нужно добавить в Vercel:
//   KV_REST_API_URL   — из Vercel KV (Storage → Connect → .env.local)
//   KV_REST_API_TOKEN — оттуда же

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// Простой хелпер для Vercel KV REST API
async function kv(method, key, value) {
  let url, body;
  if (method === 'GET') {
    url = `${KV_URL}/get/${key}`;
  } else {
    url = `${KV_URL}/set/${key}`;
    body = JSON.stringify(value);
  }
  const res = await fetch(url, {
    method: method === 'GET' ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body } : {}),
  });
  const data = await res.json();
  return data.result ?? null;
}

// Дефолтная структура для поста
function defaultPost() {
  return { views: 0, reactions: { like: 0, fire: 0, clap: 0, heart: 0 } };
}

export default async function handler(req, res) {
  // CORS — только свой домен (можно ужесточить)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ── GET /api/stats?action=get ──────────────────
    if (req.method === 'GET') {
      // Возвращаем все посты (можно расширять)
      const raw = await kv('GET', 'post:0');
      const post0 = raw ? JSON.parse(raw) : defaultPost();
      return res.status(200).json({ '0': post0 });
    }

    // ── POST /api/stats ────────────────────────────
    if (req.method === 'POST') {
      const { action, postId, emoji } = req.body;
      const key = `post:${postId}`;

      const raw = await kv('GET', key);
      const post = raw ? JSON.parse(raw) : defaultPost();

      if (action === 'view') {
        post.views += 1;
      } else if (action === 'react' && post.reactions[emoji] !== undefined) {
        post.reactions[emoji] += 1;
      } else {
        return res.status(400).json({ error: 'unknown action' });
      }

      await kv('SET', key, JSON.stringify(post));
      return res.status(200).json({ ok: true, post });
    }

    return res.status(405).json({ error: 'method not allowed' });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}