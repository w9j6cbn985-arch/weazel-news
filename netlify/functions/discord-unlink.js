'use strict';
const c = require('../lib/common');

// Nur Leitung: Verknüpfungen auflisten (GET), sperren/freigeben (POST). Es wird nichts gelöscht.
exports.handler = async event => {
  try {
    const s = await c.requireUser(event);
    if (!s || s.lv !== 'l') return c.json(403, { error: 'Nur für die Leitung.' });
    if (event.httpMethod === 'GET') {
      const p = await c.sb('employee_profiles?select=discord_user_id,display_name,access_level,is_active,last_login_at&order=display_name');
      return c.json(200, { profiles: p || [] });
    }
    if (event.httpMethod !== 'POST' || !c.sameOrigin(event)) return c.json(405, { error: 'Nicht erlaubt.' });
    let b = {}; try { b = JSON.parse(event.body || '{}'); } catch {}
    if (!/^\d{5,25}$/.test(String(b.discord_user_id)) || typeof b.is_active !== 'boolean') return c.json(400, { error: 'Ungültige Eingabe.' });
    if (String(b.discord_user_id) === String(s.uid)) return c.json(400, { error: 'Du kannst dich nicht selbst sperren.' });
    await c.sb('employee_profiles?discord_user_id=eq.' + encodeURIComponent(b.discord_user_id),
      { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_active: b.is_active }) });
    return c.json(200, { ok: true });
  } catch (e) { console.error(e); return c.json(500, { error: 'Serverfehler.' }); }
};
