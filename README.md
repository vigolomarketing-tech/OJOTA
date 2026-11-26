# Ojotas con escudo — Vigolo Web Studio

Web de venta de ojotas con una ojota 3D que gira y cambia de escudo en cada vuelta.
HTML + CSS + JS vanilla, sin build para el sitio. Se abre con un servidor estático (`python3 -m http.server`).

- `js/data.js` — todo el contenido editable (marca, WhatsApp, escudos, talles, productos, textos).
- `img/escudos/` — PNG de los escudos 2 y 3 (ver `LEEME.txt`).
- `src/ojota3d.src.js` — modelo 3D (Three.js). Se compila a `js/ojota3d.js` con `npm install && npm run build`.
