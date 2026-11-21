'use strict';
const crypto = require('crypto');
const c = require('../lib/common');

exports.handler = async event => {
  try {
    const ck = c.cookies(event);
    if (event.httpMethod === 'POST') {            // Schritt 1: gemeinsames Passwort serverseitig prüfen
      if (!c.sameOrigin(event)) return c.json(403, { error: 'Ungültige Herkunft.' });
      const pw = process.env.SITE_PASSWORD;
      if (!pw) return c.json(500, { error: 'Serverfehler (Passwort nicht eingerichtet).' });
      let body = {}; try { body = JSON.parse(event.body || '{}'); } catch {}
      if (typeof body.password !== 'string' || !c.safeEq(body.password, pw)) {
        await new Promise(r => setTimeout(r, 700));
        return c.json(401, { error: 'Falsches Passwort.' });
      }
      return c.json(200, { ok: true }, [c.cookie('wn_pw', c.sign({ pw: 1 }, 600), 600)]);
    }
    // Schritt 2 (GET): Weiterleitung zu Discord, nur nach bestandener Passwortprüfung
    if (!c.verify(ck.wn_pw)) return c.redirect(c.site() + '/#portal');
    const state = crypto.randomBytes(24).toString('base64url');
    const q = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID || '', response_type: 'code',
      redirect_uri: c.redirectUri(), scope: 'identify guilds.members.read', state });
    const force = event.queryStringParameters && event.queryStringParameters.force;
    if (c.verify(ck.wn_link) && !force) q.set('prompt', 'none');   // bereits verknüpft: ohne erneute Zustimmung
    return c.redirect('https://discord.com/oauth2/authorize?' + q, [c.cookie('wn_state', state, 600)]);
  } catch (e) { console.error(e); return c.json(500, { error: 'Serverfehler.' }); }
};
