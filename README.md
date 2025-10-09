
# Verein[t] – Website (Netlify, Dark Theme, Deutsch)

Sofort nutzbare Vorlage. Inhalte bearbeitest du im Browser via **/admin** (Netlify CMS).

## Struktur
- `index.html` – Startseite
- `idee.html`, `liga.html`, `camps.html`, `partner.html` – Inhaltsseiten (ziehen Inhalte aus `/content/*.json`)
- `/content/*.json` – **Diese Dateien bearbeitest du im CMS.**
- `/admin` – Netlify CMS
- `/css/style.css` – Design (dunkel, grüne Akzente)
- `/js/content-loader.js` – lädt JSON-Inhalte in die Seiten
- `netlify.toml` – Security-Header

## Deployment (GitHub → Netlify)
1) Neues **GitHub-Repository** anlegen und diese Dateien hochladen.
2) Auf **Netlify** einloggen → **New site from Git** → GitHub Repo verbinden.
3) Domain `www.vereint-eversten.de` in den **Domain Settings** auf diese Site zeigen lassen.
4) **Netlify Identity** aktivieren (für Login ins CMS): Site → Identity → Enable Identity → Registration: Invite only.
5) Unter **Identity → Services → Git Gateway** aktivieren.
6) Dich selbst per **Invite** einladen und einloggen: `https://www.vereint-eversten.de/admin`

## Inhalte bearbeiten
- Nach Login unter `/admin` die Bereiche **Idee**, **Liga**, **Camps**, **Partner** öffnen.
- Abschnitte hinzufügen, Reihenfolge ändern, veröffentlichen.

## Hinweise
- Impressum/Datenschutz/Kontakt sind einfache Seiten (statisch). Inhalte dort bei Bedarf direkt in den HTML-Dateien anpassen (oder später ebenfalls via CMS JSONisieren).
- Das Setup ist bewusst **leichtgewichtig** (kein Build-Schritt). Für SEO/Mehrsprachigkeit/Blog können wir später Eleventy/Next.js ergänzen.
