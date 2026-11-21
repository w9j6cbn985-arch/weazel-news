'use strict';
const crypto = require('crypto');

// Rollen-IDs (keine Geheimnisse). Es wird nur nach IDs geprüft, nie nach Namen.
const ROLES = {
  l: ['1568311769275830456', '1568311769275830455', '1568311769275830454'], // Leitung
  f: ['1568311769250790452', '1568311769259184259'],                       // Führungsebene
  m: ['1568311769259184257', '1568311769259184256', '1568311769259184255', '1568311769259184254',
      '1568311769259184253', '1568540852022812792', '1568676113629315362'] // Mitarbeiter
};
const LABEL = { l: 'Leitung', f: 'Führungsebene', m: 'Mitarbeiter' };
const levelOf = ids => ['l', 'f', 'm'].find(k => ids.some(id => ROLES[k].includes(String(id)))) || null;

const guild = () => process.env.DISCORD_GUILD_ID || '1568311769250799879';
const site = () => (process.env.SITE_URL || 'https://weazelnewsmv.netlify.app').replace(/\/$/, '');
const redirectUri = () => process.env.DISCORD_REDIRECT_URI || site() + '/.netlify/functions/discord-callback';

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen');
  return s;
}
const safeEq = (a, b) => crypto.timingSafeEqual(
  crypto.createHash('sha256').update(String(a)).digest(),
  crypto.createHash('sha256').update(String(b)).digest());

function sign(obj, ttl) {
  const p = Buffer.from(JSON.stringify({ ...obj, exp: Math.floor(Date.now() / 1000) + ttl })).toString('base64url');
  return p + '.' + crypto.createHmac('sha256', secret()).update(p).digest('base64url');
}
function verify(tok) {
  if (!tok || tok.split('.').length !== 2) return null;
  const [p, s] = tok.split('.');
  if (!safeEq(s, crypto.createHmac('sha256', secret()).update(p).digest('base64url'))) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() / 1000 ? o : null; }
  catch { return null; }
}
function cookies(event) {
  const o = {};
  String((event.headers && (event.headers.cookie || event.headers.Cookie)) || '').split(';').forEach(c => {
    const i = c.indexOf('=');
    if (i > 0) { try { o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); } catch {} }
  });
  return o;
}
const cookie = (n, v, maxAge) => `${n}=${encodeURIComponent(v)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
const json = (code, obj, sc) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj), ...(sc ? { multiValueHeaders: { 'Set-Cookie': sc } } : {}) });
const redirect = (url, sc) => ({ statusCode: 302, headers: { Location: url, 'Cache-Control': 'no-store' }, body: '',
  ...(sc ? { multiValueHeaders: { 'Set-Cookie': sc } } : {}) });
const sameOrigin = e => { const o = e.headers && e.headers.origin; return !o || o.replace(/\/$/, '') === site(); };

async function sb(path, opts = {}) {
  const u = process.env.SUPABASE_URL, k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!u || !k) throw new Error('SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt');
  const r = await fetch(u.replace(/\/$/, '') + '/rest/v1/' + path, { ...opts,
    headers: { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + t.slice(0, 200));
  return t ? JSON.parse(t) : null;
}
// Gültige Session UND Profil noch aktiv (Sperrung wirkt sofort)
async function requireUser(event) {
  const s = verify(cookies(event).wn_session);
  if (!s || !/^\d{5,25}$/.test(String(s.uid))) return null;
  const p = await sb('employee_profiles?discord_user_id=eq.' + encodeURIComponent(s.uid) + '&select=is_active');
  return p && p[0] && p[0].is_active !== false ? s : null;
}
module.exports = { ROLES, LABEL, levelOf, guild, site, redirectUri, safeEq, sign, verify, cookies, cookie, json, redirect, sameOrigin, sb, requireUser };
