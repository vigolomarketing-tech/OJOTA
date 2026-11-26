(function () {
  const C = CONFIG, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => '$ ' + n.toLocaleString('es-AR', { useGrouping: 'always', maximumFractionDigits: 0 });
  const wa = (txt) => `https://wa.me/${C.contacto.whatsapp}?text=${encodeURIComponent(txt)}`;

  /* ---------- Textos y enlaces desde CONFIG ---------- */
  $$('[data-brand]').forEach((e) => (e.textContent = C.negocio.nombre));
  $$('[data-brand-upper]').forEach((e) => (e.textContent = C.negocio.nombre.toUpperCase()));
  $$('[data-wa]').forEach((a) => (a.href = wa(C.contacto.mensajeWhatsapp)));
  $('#igLink').href = C.contacto.instagram;
  $('#year').textContent = new Date().getFullYear();
  $('#footLine').textContent = C.negocio.eslogan;
  $('#enviosTexto').textContent = C.envios.texto;
  $('#payChips').innerHTML = C.envios.pago.map((p) => `<span>${p}</span>`).join('');
  $('.marquee-track').innerHTML = [...Array(2)].map(() => ['Tu escudo', 'En relieve', 'Cómodas todo el día', 'Pedí por WhatsApp', 'Envíos a todo el país'].map((t) => `<span>${t}</span>`).join('')).join('');
  if (C.contacto.mapsEmbed) {
    const m = $('#mapBox'); m.hidden = false;
    m.innerHTML = `<iframe src="${C.contacto.mapsEmbed}" title="Mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }

  /* ---------- Escudos: chips, nombre, color de acento ---------- */
  const E = C.escudos, root = document.documentElement.style;
  const crestCanvas = Ojota3D.crests(E, (i) => { paintAll(); api && api.refreshTex(i); });
  let api = null, current = 0;

  function paintCanvas(target, i) {
    const ctx = target.getContext('2d'); ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(crestCanvas[i], 0, 0, target.width, target.height);
  }
  function makeChips(box, onPick) {
    box.innerHTML = '';
    E.forEach((e, i) => {
      const b = document.createElement('button'); b.className = 'chip'; b.type = 'button';
      b.setAttribute('aria-label', e.nombre); b.setAttribute('aria-pressed', i === 0);
      b.innerHTML = '<canvas width="102" height="120"></canvas>';
      b.addEventListener('click', () => onPick(i)); box.appendChild(b);
    });
  }
  function paintAll() {
    $$('#chips .chip canvas').forEach((c, i) => paintCanvas(c, i));
    $$('#buildCrests .chip canvas').forEach((c, i) => paintCanvas(c, i));
    paintCanvas($('#buildPreview'), buildCrest);
  }
  function setActive(i) {
    current = i; const e = E[i];
    root.setProperty('--accent', e.color);
    $('#crestName').textContent = e.nombre;
    $$('#chips .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  }

  makeChips($('#chips'), (i) => { if (api) api.goTo(i); else setActive(i); });
  setActive(0);

  api = Ojota3D.init($('#stage'), {
    escudos: E, nombre: C.negocio.nombre,
    onChange: (i) => setActive(i),
    onProgress: (p) => ($('#progress').style.transform = `scaleX(${p})`),
  });
  if (!api) { // sin WebGL: foto fija y escudos que rotan solos
    $('.stage-fallback').hidden = false;
    setInterval(() => setActive((current + 1) % E.length), 6000);
  }

  /* ---------- Carrusel de modelos ---------- */
  const talleOpts = C.talles.map((t) => `<option>${t}</option>`).join('');
  $('#carousel').innerHTML = C.productos.map((p) => `
    <article class="card" data-id="${p.id}">
      <div class="card-media">
        <img src="${p.foto}" alt="${p.nombre}" loading="lazy" width="600" height="600">
        ${p.etiqueta ? `<span class="tag">${p.etiqueta}</span>` : ''}
      </div>
      <h3>${p.nombre}</h3>
      <p>${p.descripcion}</p>
      <div class="price">${fmt(p.precio)}</div>
      <div class="card-row">
        <select aria-label="Talle de ${p.nombre}">${talleOpts}</select>
        <a class="btn btn-dark" target="_blank" rel="noopener">Consultar</a>
      </div>
    </article>`).join('');
  $$('.card').forEach((card) => {
    const p = C.productos.find((x) => x.id === card.dataset.id), sel = $('select', card), btn = $('.btn', card);
    const upd = () => (btn.href = wa(`¡Hola! Quiero consultar por:\n• ${p.nombre} — ${fmt(p.precio)}\n• Talle: ${sel.value}`));
    sel.value = '42'; upd(); sel.addEventListener('change', upd);
    if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => (card.style.transform = ''));
    }
  });
  const car = $('#carousel'), step = () => (car.firstElementChild?.getBoundingClientRect().width || 300) + 20;
  $('#prev').addEventListener('click', () => car.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#next').addEventListener('click', () => car.scrollBy({ left: step(), behavior: 'smooth' }));
  car.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); car.scrollBy({ left: step(), behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); car.scrollBy({ left: -step(), behavior: 'smooth' }); }
  });

  /* ---------- Armá la tuya ---------- */
  let buildCrest = 0, buildSize = '42';
  const personalizada = C.productos.find((p) => p.id === 'personalizada') || C.productos[0];
  makeChips($('#buildCrests'), (i) => {
    buildCrest = i; $$('#buildCrests .chip').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    const cv = $('#buildPreview'); cv.classList.add('pop');
    setTimeout(() => { paintCanvas(cv, i); cv.classList.remove('pop'); }, 160);
    if (api) api.goTo(i); else setActive(i);
    updateBuild();
  });
  $('#buildSizes').innerHTML = C.talles.map((t) => `<button type="button" class="size" aria-pressed="${t === buildSize}">${t}</button>`).join('');
  $$('#buildSizes .size').forEach((b) => b.addEventListener('click', () => {
    buildSize = b.textContent; $$('#buildSizes .size').forEach((x) => x.setAttribute('aria-pressed', x === b)); updateBuild();
  }));
  function updateBuild() {
    const e = E[buildCrest];
    $('#buildCta').href = wa(`¡Hola! Quiero una ojota con escudo:\n• Escudo: ${e.nombre}\n• Talle: ${buildSize}\n• Precio: ${fmt(personalizada.precio)}`);
    $('#buildSummary').textContent = `${e.nombre} · Talle ${buildSize} · ${fmt(personalizada.precio)}`;
  }
  updateBuild(); paintAll();

  /* ---------- Menú, revelado y SEO ---------- */
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú'); });
  $$('#menu a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.rv').forEach((el, i) => { el.style.setProperty('--d', `${(i % 4) * .08}s`); io.observe(el); });

  const ld = { '@context': 'https://schema.org', '@type': 'Store', name: C.negocio.nombre, description: C.seo.descripcion, image: new URL('img/og.jpg', location.href).href, sameAs: [C.contacto.instagram].filter(Boolean) };
  if (C.seo.url) ld.url = C.seo.url;
  if (C.contacto.direccion) ld.address = { '@type': 'PostalAddress', streetAddress: C.contacto.direccion, addressCountry: 'AR' };
  const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
})();
