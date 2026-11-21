'use strict';
const c = require('../lib/common');

exports.handler = async event => {
  const clear = c.cookie('wn_state', '', 0);
  const back = m => c.redirect(c.site() + '/?login=' + m + '#portal', [clear]);
  try {
    const qs = event.queryStringParameters || {}, ck = c.cookies(event);
    if (qs.error) {
      if (['interaction_required', 'consent_required', 'login_required'].includes(qs.error))
        return c.redirect(c.site() + '/.netlify/functions/discord-login?force=1', [clear]);
      return back('abgebrochen');
    }
    if (!qs.code || !qs.state || !ck.wn_state || !c.safeEq(qs.state, ck.wn_state)) return back('state');  // CSRF
    if (!c.verify(ck.wn_pw)) return back('passwort');

    const tr = await fetch('https://discord.com/api/v10/oauth2/token', { method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code', code: qs.code, redirect_uri: c.redirectUri() }) });
    if (!tr.ok) return back('token');
    const { access_token } = await tr.json();

    const mr = await fetch(`https://discord.com/api/v10/users/@me/guilds/${c.guild()}/member`,
      { headers: { Authorization: 'Bearer ' + access_token } });
    if (mr.status === 404 || mr.status === 403) return back('kein-mitglied');
    if (!mr.ok) return back('discord');
    const m = await mr.json();
    const uid = m.user.id, name = m.nick || m.user.global_name || m.user.username;
    const lv = c.levelOf(m.roles || []);
    if (!lv) return back('keine-rolle');

    const ex = await c.sb('employee_profiles?discord_user_id=eq.' + encodeURIComponent(uid) + '&select=is_active');
    if (ex && ex[0] && ex[0].is_active === false) return back('deaktiviert');
    await c.sb('employee_profiles?on_conflict=discord_user_id', { method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ discord_user_id: uid, display_name: name, is_active: true, access_level: lv,
        last_login_at: new Date().toISOString() }]) });

    return c.redirect(c.site() + '/#portal', [
      c.cookie('wn_session', c.sign({ uid, name, lv }, 8 * 3600), 8 * 3600),
      c.cookie('wn_link', c.sign({ uid }, 365 * 86400), 365 * 86400),
      clear, c.cookie('wn_pw', '', 0)]);
  } catch (e) { console.error(e); return back('discord'); }
};
