'use strict';
const c = require('../lib/common');

exports.handler = async event => {
  try {
    if (event.httpMethod === 'POST') {            // Abmelden
      if (!c.sameOrigin(event)) return c.json(403, { error: 'Ungültige Herkunft.' });
      return c.json(200, { ok: true }, [c.cookie('wn_session', '', 0)]);
    }
    const s = await c.requireUser(event);
    if (!s) return c.json(200, { authenticated: false });
    return c.json(200, { authenticated: true, uid: s.uid, name: s.name, level: s.lv, label: c.LABEL[s.lv] });
  } catch (e) { console.error(e); return c.json(200, { authenticated: false }); }
};
