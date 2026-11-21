'use strict';
const c = require('../lib/common');

const KEYS = ['tick', 'team', 'logo', 'desk', 'rep', 'car', 'int', 'tx', 'p1'];
const FREE = { l: KEYS, f: ['tick', 'desk', 'rep', 'p1'], m: ['p1'] };   // frei änderbare Bereiche je Rolle
const norm = v => (v == null || v === '' || (Array.isArray(v) && !v.length) ||
  (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) ? null : v;
const eq = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

// Mitarbeiter dürfen nur eigene Beiträge anlegen, ändern oder löschen
function postsOk(oldA, newA, uid) {
  oldA = oldA || []; newA = newA || [];
  const om = new Map(oldA.filter(x => x.id).map(x => [x.id, x]));
  for (const o of oldA) {
    if (!o.id) { if (!newA.some(n => eq(n, o))) return false; }
    else if (!newA.some(n => n.id === o.id) && o.u !== uid) return false;
  }
  for (const n of newA) {
    if (!n.id) { if (!oldA.some(o => eq(o, n))) return false; continue; }
    const o = om.get(n.id);
    if (o && eq(o, n)) continue;
    if (n.u !== uid || (o && o.u !== uid)) return false;
  }
  return true;
}
function allowed(lv, uid, base, res) {
  return KEYS.every(k => {
    if (FREE[lv].includes(k)) return true;
    if (lv === 'm' && (k === 'desk' || k === 'rep')) return postsOk(base[k], res[k], uid);
    return eq(base[k], res[k]);
  });
}

exports.handler = async event => {
  try {
    const row = await c.sb('site_state?id=eq.1&select=data');
    const stored = (row && row[0] && row[0].data) || null;
    const u = await c.requireUser(event);
    if (event.httpMethod === 'GET') {
      const d = stored ? { ...stored } : null;
      if (d) { delete d.pw; if (!u || u.lv === 'm') delete d.int; }       // Internes nur für Leitung/Führung
      return c.json(200, { data: d });
    }
    if (event.httpMethod !== 'POST' || !c.sameOrigin(event)) return c.json(405, { error: 'Nicht erlaubt.' });
    if (!u) return c.json(401, { error: 'Bitte anmelden.' });
    if ((event.body || '').length > 5500000) return c.json(413, { error: 'Zu viele oder zu große Bilder (max. ca. 5 MB).' });
    let b = {}; try { b = JSON.parse(event.body || '{}'); } catch {}
    if (!b.data || typeof b.data !== 'object') return c.json(400, { error: 'Ungültige Daten.' });
    const base = { ...(stored || {}) }; delete base.pw;
    const res = { ...base };
    KEYS.forEach(k => { if (k in b.data) res[k] = b.data[k]; });
    if (u.lv === 'm') res.int = base.int;                                     // Mitarbeiter sehen/senden kein "int"
    if (!allowed(u.lv, u.uid, base, res)) return c.json(403, { error: 'Dafür fehlt dir die Berechtigung.' });
    await c.sb('site_state?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ id: 1, data: res, updated_at: new Date().toISOString() }]) });
    return c.json(200, { ok: true });
  } catch (e) { console.error(e); return c.json(500, { error: 'Serverfehler.' }); }
};
module.exports.postsOk = postsOk; module.exports.allowed = allowed;
