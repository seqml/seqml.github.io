

(function setupFlowCanvas(){
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palette = [
    [215, 25, 32],   // Portugal home red
    [0, 137, 86],    // Portugal / malachite green
    [246, 200, 95],  // World Cup trophy gold
    [255, 232, 168], // bright trophy highlight
    [11, 107, 73],   // deep malachite
  ];
  const ribbons = [];
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = true;
  let frame = 0;

  function rgba(index, alpha) {
    const color = palette[index % palette.length];
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }

  function resize() {
    const nextWidth = Math.max(1, window.innerWidth);
    const nextHeight = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(28, Math.min(72, Math.round(width * height / 18500)));
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.8 + Math.random() * 5.8,
      vx: (.12 + Math.random() * .42) * (Math.random() > .5 ? 1 : -1),
      vy: -.18 + Math.random() * .36,
      color: i % palette.length,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function drawRibbon(ribbon, time) {
    const gradient = ctx.createLinearGradient(-width * .1, 0, width * 1.1, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(.22, rgba(ribbon.colors[0], .00));
    gradient.addColorStop(.34, rgba(ribbon.colors[0], .55));
    gradient.addColorStop(.52, rgba(ribbon.colors[1], .42));
    gradient.addColorStop(.68, rgba(ribbon.colors[2], .34));
    gradient.addColorStop(.86, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = reduceMotion ? .34 : .52;
    ctx.filter = `blur(${Math.max(9, ribbon.width * .11)}px)`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = gradient;
    ctx.lineWidth = ribbon.width;
    ctx.beginPath();
    const wave = time * ribbon.speed + ribbon.phase;
    for (let i = 0; i <= 10; i += 1) {
      const x = -width * .16 + i * (width * 1.32 / 10);
      const y = height * ribbon.y
        + Math.sin(i * 1.05 + wave) * ribbon.amp
        + Math.sin(i * .52 - wave * 1.35) * ribbon.amp * .32;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles(time, speed) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const p of particles) {
      p.x += p.vx * speed + Math.sin(time + p.phase) * .16 * speed;
      p.y += p.vy * speed + Math.cos(time * .8 + p.phase) * .12 * speed;
      if (p.x < -24) p.x = width + 24;
      if (p.x > width + 24) p.x = -24;
      if (p.y < -24) p.y = height + 24;
      if (p.y > height + 24) p.y = -24;
      const radius = p.r * (1.8 + Math.sin(time * 1.4 + p.phase) * .35);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 6);
      glow.addColorStop(0, rgba(p.color, .38));
      glow.addColorStop(.42, rgba(p.color, .10));
      glow.addColorStop(1, rgba(p.color, 0));
      ctx.fillStyle = glow;
      ctx.globalAlpha = reduceMotion ? .42 : .74;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(now) {
    if (!running) return;
    const speed = reduceMotion ? .20 : 1;
    const time = now * 0.001 * speed;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const halo = ctx.createRadialGradient(width * .5, height * .45, 0, width * .5, height * .45, Math.max(width, height) * .72);
    halo.addColorStop(0, 'rgba(246,200,95,.10)');
    halo.addColorStop(.45, 'rgba(0,137,86,.07)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Light bands disabled: keep only ambient glow and particles.
    // ribbons.forEach((ribbon, index) => drawRibbon(ribbon, time + index * .72));
    drawParticles(time, speed);

    frame = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) frame = requestAnimationFrame(draw);
    else cancelAnimationFrame(frame);
  });
  window.addEventListener('resize', resize, { passive: true });
  resize();
  frame = requestAnimationFrame(draw);
})();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const menuButton = $('.menu-button');
const navLinks = $('.nav-links');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.addEventListener('click', () => navLinks.classList.remove('open'));
}

const anchorLinks = $$('.nav-links a[href^="#"]');
const sectionById = new Map(anchorLinks.map((link) => {
  const id = link.getAttribute('href').slice(1);
  return [id, document.getElementById(id)];
}).filter(([, section]) => Boolean(section)));

function setActiveNav(id) {
  anchorLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
}

if (sectionById.size) {
  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.id) setActiveNav(visible.target.id);
  }, { rootMargin: '-36% 0px -52% 0px', threshold: [0.01, 0.2, 0.6] });
  sectionById.forEach((section) => navObserver.observe(section));
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el) => revealObserver.observe(el));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const value = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const decimals = Number(el.dataset.decimals || (Number.isInteger(value) ? 0 : 2));
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (value * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => counterObserver.observe(el));

function setupTabs(buttonSelector, panelSelector, dataKey, activeClass = 'active') {
  const buttons = $$(buttonSelector);
  const panels = $$(panelSelector);
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset[dataKey];
      buttons.forEach((b) => {
        const isActive = b === button;
        b.classList.toggle(activeClass, isActive);
        if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', String(isActive));
      });
      panels.forEach((panel) => {
        const panelKey = panel.dataset.casePanel || panel.id?.replace(/^panel-/, '');
        const show = panelKey === key;
        panel.hidden = !show;
        panel.classList.toggle(activeClass, show);
        if (show) panel.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
      });
    });
  });
}
setupTabs('.results-tabs button[data-tab]', '.tab-panel', 'tab');

function setupEvaluationViewTabs() {
  $$('.eval-setting-panel').forEach((settingPanel) => {
    const buttons = $$('.eval-view-tabs button[data-eval-view]', settingPanel);
    const panels = $$('.eval-view-panel[data-eval-view-panel]', settingPanel);
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.evalView;
        buttons.forEach((b) => {
          const isActive = b === button;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', String(isActive));
        });
        panels.forEach((panel) => {
          const show = panel.dataset.evalViewPanel === key;
          panel.hidden = !show;
          panel.classList.toggle('active', show);
          if (show) panel.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
        });
      });
    });
  });
}
setupEvaluationViewTabs();


const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = '<button type="button" aria-label="Close image">✕</button><img alt="Expanded figure">';
document.body.appendChild(lightbox);
const lightboxImg = $('img', lightbox);
$$('.image-shell img, .figure-card img').forEach((img) => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || 'Expanded figure';
    lightbox.classList.add('open');
  });
});
$('button', lightbox).addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.classList.remove('open');
});
