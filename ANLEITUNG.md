# Weazel News – Discord-Verknüpfung einrichten

## Was sich geändert hat
- **Gleich geblieben:** komplettes Design, alle Seiten, Team, Berichte, News-Balken, Logo, Karriere, Intern.
- **Anmeldung:** ein gemeinsames Passwort für alle (wird auf dem Server geprüft), danach einmalig Discord. Bei späteren Anmeldungen geht Discord meist ohne erneute Zustimmung.
- **Rechte kommen von den Discord-Rollen (Prüfung nach Rollen-ID):**
  - **Leitung** (Geschäftsführer, Stv. Geschäftsführung, Personalverwaltung): alles, inkl. Team, Karriere, Intern, Logo, News-Balken und Verwaltung der Verknüpfungen.
  - **Führungsebene** (Leitender Journalist, Chefredakteur): alle Beiträge erstellen/bearbeiten/löschen, News-Balken, Intern **lesen**.
  - **Mitarbeiter** (Sekretär bis Praktikant): Beiträge erstellen sowie **nur eigene** bearbeiten/löschen. Kein Intern, kein Team/Logo.
- **Serverseitig geschützt:** Speichern läuft über die Function `site-state`. Sie prüft Session und Rolle und lehnt unerlaubte Änderungen ab. Den internen Text bekommen nur Leitung und Führungsebene geliefert.
- **Wegfall:** Das Passwort-ändern-Formular im Portal und der Leitung-Passwort-Zugang. Das Passwort steht jetzt als Umgebungsvariable bei Netlify.

## Schritt 1: Supabase
1. Supabase → Projekt **Weazel News** → **SQL Editor**.
2. Inhalt von `supabase.sql` einfügen → **Run**. (Löscht nichts, kann wiederholt werden. Meldet der Unique-Index einen Fehler, gibt es doppelte `discord_user_id`-Einträge in `employee_profiles`; erst bereinigen.)
3. Inhalt von `supabase-seed-intern.sql` einfügen → **Run**. Das übernimmt deinen bisherigen internen Text. Er steht danach nicht mehr in der öffentlichen HTML-Datei.
4. **Project Settings → API:** `Project URL` und den **service_role**-Schlüssel kopieren (der Schlüssel darf nie in HTML oder Chat).

## Schritt 2: Discord
Im Developer Portal → deine Anwendung → **OAuth2** → Redirects muss genau stehen:
`https://weazelnewsmv.netlify.app/.netlify/functions/discord-callback`
Client ID und Client Secret kopieren.

## Schritt 3: Netlify (mit Functions)
Drag-and-drop reicht für Functions nicht zuverlässig. Nimm GitHub:
1. Neues GitHub-Repository, den **Inhalt dieses Ordners** hochladen (`netlify.toml`, Ordner `public` und `netlify`; `ANLEITUNG.md` und die `.sql`-Dateien sind optional).
2. Netlify → **Add new site → Import from Git** → Repository wählen. Build command leer lassen, `publish`/`functions` kommen aus der `netlify.toml`.
3. Deine bestehende Seite `weazelnewsmv` kannst du stattdessen unter **Site configuration → Build & deploy → Link repository** verbinden.

## Schritt 4: Umgebungsvariablen
Netlify → **Site configuration → Environment variables** (vor dem Deploy eintragen, danach neu deployen):

| Name | Wert |
|---|---|
| `SITE_PASSWORD` | das gemeinsame Mitarbeiter-Passwort |
| `SESSION_SECRET` | zufälliger Text, mind. 32 Zeichen (z. B. im Passwort-Manager erzeugen) |
| `DISCORD_CLIENT_ID` | Client ID der Discord-Anwendung |
| `DISCORD_CLIENT_SECRET` | Client Secret der Discord-Anwendung |
| `SUPABASE_URL` | Project URL aus Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role-Schlüssel |
| `DISCORD_GUILD_ID` | optional, Standard `1568311769250799879` |
| `SITE_URL` | optional, Standard `https://weazelnewsmv.netlify.app` |

## Schritt 5: Erste Anmeldung
1. Seite öffnen → **Mitarbeiterportal** → Passwort → Discord bestätigen.
2. Als **Leitung** anmelden und im Portal unter „Discord-Konto“ einmal **„Aktuellen Inhalt in die Datenbank speichern“** klicken. Erst dann können andere Rollen speichern.
3. Testen: mit einem Mitarbeiter-Konto einen Beitrag anlegen, mit der Leitung das Team ändern.

## Gut zu wissen
- **Rollen** werden bei jeder Anmeldung neu abgefragt, die Sitzung hält 8 Stunden. Wer eine Rolle verliert, verliert die Rechte spätestens dann.
- **„Trennen“** (nur Leitung) sperrt einen Zugang, löscht aber nichts. „Freigeben“ hebt die Sperre auf.
- **Speichern** ist „letzter gewinnt“. Zwei Personen, die gleichzeitig dieselbe Seite bearbeiten, überschreiben sich eventuell.
- **Bilder:** alles zusammen darf beim Speichern etwa 5 MB nicht überschreiten (Netlify-Grenze). Bei Fehlermeldung Bilder verkleinern oder löschen.
- **Öffentlich bleiben** Team (inkl. Lebenslauf, Telefon), Berichte, Meldungen und Karriere.
- Die Beitrags-Schreibrechte der Mitarbeiter gelten nur für Beiträge, die nach dieser Umstellung entstehen. Ältere Beiträge haben keinen Besitzer und kann nur Führung/Leitung ändern.

## Textformatierung (auch im Portal unter „Textformatierung (Hilfe)“)
| Du schreibst | Ergebnis |
|---|---|
| `**Text**` | fett, stark hervorgehoben |
| `*Text*` | kursiv |
| `__Text__` | unterstrichen |
| `~~Text~~` | durchgestrichen |
| `==Text==` | mit Textmarker markiert |
| `https://…` oder `www.…` | automatisch anklickbarer Link |
| `# Titel` (Zeilenanfang) | fette Zwischenüberschrift, nur Karriere, Intern, Lebenslauf |
| neue Zeile | neuer Absatz, in Karriere/Intern/Lebenslauf ein Aufzählungspunkt |

Kombinierbar, z. B. `**fett und *kursiv***`. Beiträge ohne Bild zeigen ein neutrales Standardbild. Bilder lassen sich per Klick vergrößern (zweiter Klick zoomt weiter, auf dem Handy auch mit zwei Fingern).
