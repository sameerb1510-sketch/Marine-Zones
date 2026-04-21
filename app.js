/* =====================================================
   MPA ANALYSER — APPLICATION LOGIC
   Three.js Hero · SVG Map · Stats Engine · Animations
   ===================================================== */

'use strict';

// ── Global State ──────────────────────────────────────
let zones           = [];
let selectedZone    = null;
let activeFilter    = null;
let statsRevealDone = false;
let revealObserver  = null;       // singleton observer

// ── Persistence ──────────────────────────────────────
const STORAGE_KEY = 'mpa-analyser-v1';

function saveState() {
  const overrides = {};
  zones.forEach(z => { overrides[z.id] = z.mpaStatus; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function loadState(zonesArr) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) zonesArr.forEach(z => { if (z.id in saved) z.mpaStatus = saved[z.id]; });
  } catch(e) { /* ignore */ }
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

// Embedded fallback data (used when fetch fails on file://)
const FALLBACK_DATA = {"zones":[{"id":"Z01","name":"Arctic Basin","gridX":0,"gridY":0,"speciesRichness":4,"fishingPressure":2,"mpaStatus":false,"area":35000,"depth":3800,"habitatType":"deep_sea"},{"id":"Z02","name":"N. Atlantic Ridge","gridX":1,"gridY":0,"speciesRichness":6,"fishingPressure":5,"mpaStatus":true,"area":28000,"depth":2100,"habitatType":"seamount"},{"id":"Z03","name":"Norwegian Sea","gridX":2,"gridY":0,"speciesRichness":5,"fishingPressure":7,"mpaStatus":false,"area":22000,"depth":1800,"habitatType":"pelagic"},{"id":"Z04","name":"Barents Zone","gridX":3,"gridY":0,"speciesRichness":7,"fishingPressure":8,"mpaStatus":false,"area":18000,"depth":350,"habitatType":"pelagic"},{"id":"Z05","name":"Greenland Current","gridX":4,"gridY":0,"speciesRichness":5,"fishingPressure":3,"mpaStatus":true,"area":31000,"depth":2200,"habitatType":"deep_sea"},{"id":"Z06","name":"Labrador Basin","gridX":5,"gridY":0,"speciesRichness":3,"fishingPressure":4,"mpaStatus":false,"area":25000,"depth":2900,"habitatType":"deep_sea"},{"id":"Z07","name":"N. Pacific Gyre","gridX":0,"gridY":1,"speciesRichness":3,"fishingPressure":3,"mpaStatus":false,"area":45000,"depth":4200,"habitatType":"pelagic"},{"id":"Z08","name":"California Current","gridX":1,"gridY":1,"speciesRichness":8,"fishingPressure":9,"mpaStatus":false,"area":12000,"depth":300,"habitatType":"kelp_forest"},{"id":"Z09","name":"Gulf of Mexico","gridX":2,"gridY":1,"speciesRichness":7,"fishingPressure":8,"mpaStatus":true,"area":15000,"depth":450,"habitatType":"coral_reef"},{"id":"Z10","name":"Sargasso Sea","gridX":3,"gridY":1,"speciesRichness":6,"fishingPressure":4,"mpaStatus":false,"area":33000,"depth":5000,"habitatType":"pelagic"},{"id":"Z11","name":"N. Mediterranean","gridX":4,"gridY":1,"speciesRichness":8,"fishingPressure":9,"mpaStatus":false,"area":8000,"depth":500,"habitatType":"seagrass"},{"id":"Z12","name":"Black Sea Inlet","gridX":5,"gridY":1,"speciesRichness":5,"fishingPressure":7,"mpaStatus":false,"area":5000,"depth":200,"habitatType":"seagrass"},{"id":"Z13","name":"Coral Triangle","gridX":0,"gridY":2,"speciesRichness":10,"fishingPressure":9,"mpaStatus":false,"area":9000,"depth":200,"habitatType":"coral_reef"},{"id":"Z14","name":"Philippine Sea","gridX":1,"gridY":2,"speciesRichness":9,"fishingPressure":7,"mpaStatus":true,"area":14000,"depth":800,"habitatType":"coral_reef"},{"id":"Z15","name":"South China Sea","gridX":2,"gridY":2,"speciesRichness":8,"fishingPressure":10,"mpaStatus":false,"area":11000,"depth":350,"habitatType":"coral_reef"},{"id":"Z16","name":"Indian Ocean Mid","gridX":3,"gridY":2,"speciesRichness":6,"fishingPressure":5,"mpaStatus":true,"area":42000,"depth":3800,"habitatType":"pelagic"},{"id":"Z17","name":"Arabian Sea","gridX":4,"gridY":2,"speciesRichness":7,"fishingPressure":8,"mpaStatus":false,"area":16000,"depth":600,"habitatType":"pelagic"},{"id":"Z18","name":"Bay of Bengal","gridX":5,"gridY":2,"speciesRichness":8,"fishingPressure":7,"mpaStatus":false,"area":13000,"depth":400,"habitatType":"mangrove"},{"id":"Z19","name":"Great Barrier W.","gridX":0,"gridY":3,"speciesRichness":9,"fishingPressure":6,"mpaStatus":true,"area":20000,"depth":150,"habitatType":"coral_reef"},{"id":"Z20","name":"Coral Sea East","gridX":1,"gridY":3,"speciesRichness":8,"fishingPressure":5,"mpaStatus":true,"area":17000,"depth":300,"habitatType":"coral_reef"},{"id":"Z21","name":"Tasman Basin","gridX":2,"gridY":3,"speciesRichness":5,"fishingPressure":4,"mpaStatus":false,"area":22000,"depth":2800,"habitatType":"deep_sea"},{"id":"Z22","name":"Maldives Zone","gridX":3,"gridY":3,"speciesRichness":9,"fishingPressure":8,"mpaStatus":false,"area":7000,"depth":100,"habitatType":"coral_reef"},{"id":"Z23","name":"Persian Gulf","gridX":4,"gridY":3,"speciesRichness":4,"fishingPressure":9,"mpaStatus":false,"area":6000,"depth":50,"habitatType":"seagrass"},{"id":"Z24","name":"Red Sea","gridX":5,"gridY":3,"speciesRichness":8,"fishingPressure":7,"mpaStatus":true,"area":9500,"depth":300,"habitatType":"coral_reef"},{"id":"Z25","name":"S. Pacific Gyre","gridX":0,"gridY":4,"speciesRichness":2,"fishingPressure":1,"mpaStatus":false,"area":50000,"depth":4500,"habitatType":"pelagic"},{"id":"Z26","name":"Ross Sea","gridX":1,"gridY":4,"speciesRichness":7,"fishingPressure":2,"mpaStatus":true,"area":38000,"depth":800,"habitatType":"deep_sea"},{"id":"Z27","name":"Weddell Sea","gridX":2,"gridY":4,"speciesRichness":6,"fishingPressure":1,"mpaStatus":true,"area":35000,"depth":600,"habitatType":"deep_sea"},{"id":"Z28","name":"Antarctic Ridge","gridX":3,"gridY":4,"speciesRichness":5,"fishingPressure":2,"mpaStatus":false,"area":28000,"depth":3200,"habitatType":"seamount"},{"id":"Z29","name":"Cape Basin","gridX":4,"gridY":4,"speciesRichness":6,"fishingPressure":6,"mpaStatus":false,"area":18000,"depth":2100,"habitatType":"pelagic"},{"id":"Z30","name":"Benguela Current","gridX":5,"gridY":4,"speciesRichness":8,"fishingPressure":7,"mpaStatus":false,"area":12000,"depth":200,"habitatType":"kelp_forest"}]};

// ── Helpers ───────────────────────────────────────────
const $  = id => document.getElementById(id);
const fmt = n => n.toLocaleString();
const score = z => z.speciesRichness * z.fishingPressure;
const isCritical = z => z.speciesRichness >= 7 && z.fishingPressure >= 7;

// ── Stats Engine ──────────────────────────────────────
function computeStats() {
  const criticalZones       = zones.filter(isCritical);
  const protectedCritical   = criticalZones.filter(z => z.mpaStatus);
  const unprotectedCritical = criticalZones.filter(z => !z.mpaStatus);
  const protectedTotal      = zones.filter(z => z.mpaStatus);

  // Area-weighted coverage (km²)
  const criticalArea      = criticalZones.reduce((s, z) => s + z.area, 0);
  const protCritArea      = protectedCritical.reduce((s, z) => s + z.area, 0);
  const coveragePct       = criticalArea ? Math.round(protCritArea / criticalArea * 100) : 0;
  const protectedAreaKm   = protectedTotal.reduce((s, z) => s + z.area, 0);
  const critProtectedKm   = protCritArea;   // critical habitat area under protection

  return { criticalZones, protectedCritical, unprotectedCritical, protectedTotal, coveragePct, protectedAreaKm, critProtectedKm };
}

function getTop5Gaps() {
  return zones.filter(z => isCritical(z) && !z.mpaStatus)
              .sort((a,b) => score(b) - score(a))
              .slice(0,5);
}

function getAllCritical() {
  return zones.filter(isCritical).sort((a,b) => score(b) - score(a));
}

// ── Animated Counter ──────────────────────────────────
function counter(el, from, to, ms, suffix = '') {
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / ms, 1);
    const e = 1 - Math.pow(1 - p, 3);             // ease-out cubic
    el.textContent = Math.round(from + (to - from) * e) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Update All Stats ──────────────────────────────────
function updateStats(animate) {
  const s = computeStats();

  // Hero
  if (animate) {
    counter($('hero-coverage'), 0, s.coveragePct,            2400, '%');
    counter($('hero-total'),    0, zones.length,             1800, '');
    counter($('hero-critical'), 0, s.criticalZones.length,   2000, '');
    counter($('hero-protected'),0, s.protectedTotal.length,  2200, '');
  } else {
    $('hero-coverage').textContent  = s.coveragePct + '%';
    $('hero-total').textContent     = zones.length;
    $('hero-critical').textContent  = s.criticalZones.length;
    $('hero-protected').textContent = s.protectedTotal.length;
  }

  // Overview cards text
  if ($('stat-coverage'))    $('stat-coverage').textContent    = s.coveragePct + '%';
  if ($('stat-protected'))   $('stat-protected').textContent   = s.protectedTotal.length;
  if ($('stat-critical'))    $('stat-critical').textContent    = s.criticalZones.length;
  if ($('stat-unprotected')) $('stat-unprotected').textContent = s.unprotectedCritical.length;

  // Critical habitat area protected km² (stat card 5)
  const areaEl = $('stat-area-km');
  if (areaEl) {
    const km = s.critProtectedKm;
    areaEl.textContent = km >= 1000000 ? (km/1000000).toFixed(1)+'M'
                       : km >= 1000    ? (km/1000).toFixed(0)+'K'
                       : String(km);
  }

  // Bars
  setTimeout(() => {
    $('fill-coverage').style.width    = s.coveragePct + '%';
    $('fill-protected').style.width   = (s.protectedTotal.length / zones.length * 100) + '%';
    $('fill-critical').style.width    = (s.criticalZones.length / zones.length * 100) + '%';
    $('fill-unprotected').style.width = (s.unprotectedCritical.length / zones.length * 100) + '%';
  }, 450);

  // Re-render dynamic sections
  renderZoneGrid();
  renderZoneList();
  renderCriticalGrid();
  renderGapAnalysis();

  // Update panel if a zone is selected
  if (selectedZone) {
    const updated = zones.find(z => z.id === selectedZone.id);
    if (updated) showPanel(updated);
  }
}
// ── Zone Colour Mapping ───────────────────────────────
const HABITAT_EMOJI = {
  coral_reef: '🐠', seagrass: '🌱', pelagic: '🌊',
  mangrove: '🌴', kelp_forest: '🌿', deep_sea: '💠', seamount: '⛰️'
};

function zoneColors(z) {
  if (z.mpaStatus)    return { stroke: '#00E676' };       // protected
  if (isCritical(z))  return { stroke: '#FF6B6B' };       // critical (R≥7 AND P≥7)
  const s = score(z);
  if (s >= 42 || z.fishingPressure >= 7) return { stroke: '#FFB347' };  // moderate
  return { stroke: '#00D4FF' };                            // low priority
}

// ── Filter helpers ────────────────────────────────────
function matchesFilter(z) {
  if (!activeFilter) return true;
  switch (activeFilter) {
    case 'protected': return z.mpaStatus;
    case 'critical':  return !z.mpaStatus && isCritical(z);
    case 'moderate':  return !z.mpaStatus && !isCritical(z) && (score(z) >= 42 || z.fishingPressure >= 7);
    case 'low':       return !z.mpaStatus && !isCritical(z) && score(z) < 42 && z.fishingPressure < 7;
  }
  return true;
}

function setFilter(type) {
  activeFilter = (activeFilter === type) ? null : type;
  document.querySelectorAll('.filter-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.filter === activeFilter)
  );
  // Clear selection if selected zone no longer matches the new filter
  if (selectedZone && !matchesFilter(selectedZone)) {
    selectedZone = null;
    document.getElementById('zl-inline-detail')?.remove();
    document.querySelectorAll('.zl-item').forEach(el => el.classList.remove('zl-active'));
    document.querySelectorAll('.zone-card').forEach(el => el.classList.remove('zc-selected'));
  }
  renderZoneGrid();
  renderZoneList();
}

// ── Zone Card Grid ────────────────────────────────────
function renderZoneGrid() {
  const grid = $('zone-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Sort by geographic position (gridY = row, gridX = column)
  const filtered = zones
    .filter(matchesFilter)
    .slice()
    .sort((a, b) => a.gridY - b.gridY || a.gridX - b.gridX);

  if (!filtered.length) {
    grid.innerHTML = `<div class="zone-grid-empty">No zones match this filter.</div>`;
    return;
  }

  filtered.forEach(z => {
    const c  = zoneColors(z);
    const s  = score(z);
    const card = document.createElement('div');
    card.className = 'zone-card' + (selectedZone?.id === z.id ? ' zc-selected' : '');
    card.id = `zcard-${z.id}`;
    card.style.setProperty('--zc-clr', c.stroke);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${z.name}, score ${s}, ${z.mpaStatus ? 'protected' : 'unprotected'}`);

    card.innerHTML = `
      <div class="zc-top">
        <span class="zc-id">${z.id}</span>
        <span class="zc-score">${s}</span>
      </div>
      <div class="zc-bars">
        <div class="zc-bar-track"><div class="zc-bar-fill zc-r" style="width:${z.speciesRichness * 10}%"></div></div>
        <div class="zc-bar-track"><div class="zc-bar-fill zc-p" style="width:${z.fishingPressure * 10}%"></div></div>
      </div>
      <div class="zc-name">${z.name.split(' ').slice(0,3).join(' ')}</div>
    `;

    const doSelect = () => {
      selectedZone = z;
      document.querySelectorAll('.zone-card').forEach(el => el.classList.remove('zc-selected'));
      card.classList.add('zc-selected');
      const li = $(`zli-${z.id}`);
      if (li) { li.classList.add('zl-active'); document.querySelectorAll('.zl-item').forEach(l => { if (l !== li) l.classList.remove('zl-active'); }); li.scrollIntoView({ block: 'nearest' }); }
      showPanel(z);
    };
    card.addEventListener('click', doSelect);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSelect(); } });
    grid.appendChild(card);
  });
}

// ── Zone List inline detail injector ─────────────────
function injectListDetail(z, afterItem) {
  document.getElementById('zl-inline-detail')?.remove();
  const s = score(z);
  const statusTxt = z.mpaStatus
    ? '<span style="color:var(--green)">Protected</span>'
    : '<span style="color:var(--coral)">Unprotected</span>';
  const btnClass = z.mpaStatus ? 'protect-btn btn-remove' : 'protect-btn btn-add';
  const btnLabel = z.mpaStatus ? '🔓 Remove Protection' : '🛡️ Add MPA Protection';

  const det = document.createElement('div');
  det.id = 'zl-inline-detail';
  det.className = 'zl-inline-detail';
  det.innerHTML = `
    <div class="zd-name">${z.name}</div>
    <div class="zd-meta"><span class="zd-zone-id">${z.id}</span> · ${statusTxt} · Score <strong>${s}</strong></div>
    <div class="zd-metrics-row">
      <div class="zd-mc"><div class="zd-mc-lbl">Richness</div><div class="zd-mc-val">${z.speciesRichness}/10</div></div>
      <div class="zd-mc"><div class="zd-mc-lbl">Pressure</div><div class="zd-mc-val">${z.fishingPressure}/10</div></div>
    </div>
    <div class="zd-extra-row">
      <div class="zd-extra"><span class="zd-extra-lbl">Area</span><span class="zd-extra-val">${z.area.toLocaleString()} km²</span></div>
      <div class="zd-extra"><span class="zd-extra-lbl">Depth</span><span class="zd-extra-val">${z.depth}m</span></div>
      <div class="zd-extra"><span class="zd-extra-lbl">Habitat</span><span class="zd-extra-val">${z.habitatType.replace(/_/g,' ')}</span></div>
    </div>
    <button class="protect-btn ${btnClass}" id="protect-btn" onclick="toggleProtection()">${btnLabel}</button>
  `;
  afterItem.insertAdjacentElement('afterend', det);
  setTimeout(() => det.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

// ── Zone List (right panel) ───────────────────────────
function renderZoneList() {
  const list = $('zone-list');
  if (!list) return;
  list.innerHTML = '';

  const filtered = zones.filter(matchesFilter);
  const countEl  = $('zone-panel-count');
  if (countEl) countEl.textContent = filtered.length + ' ZONES';

  filtered.forEach(z => {
    const c    = zoneColors(z);
    const item = document.createElement('div');
    item.className = 'zl-item' + (selectedZone?.id === z.id ? ' zl-active' : '');
    item.id = `zli-${z.id}`;
    item.innerHTML = `
      <span class="zl-dot" style="background:${c.stroke};box-shadow:0 0 6px ${c.stroke}88"></span>
      <span class="zl-id">${z.id}</span>
      <div class="zl-info">
        <div class="zl-name">${z.name}</div>
        <div class="zl-rp">R ${z.speciesRichness}/10 · P ${z.fishingPressure}/10</div>
      </div>
    `;
    item.addEventListener('click', () => {
      // Toggle off if same item clicked again
      if (selectedZone?.id === z.id && document.getElementById('zl-inline-detail')) {
        document.getElementById('zl-inline-detail').remove();
        selectedZone = null;
        item.classList.remove('zl-active');
        document.querySelectorAll('.zone-card').forEach(el => el.classList.remove('zc-selected'));
        return;
      }
      selectedZone = z;
      document.querySelectorAll('.zl-item').forEach(l => l.classList.remove('zl-active'));
      item.classList.add('zl-active');
      document.querySelectorAll('.zone-card').forEach(el => el.classList.remove('zc-selected'));
      const card = $(`zcard-${z.id}`);
      if (card) card.classList.add('zc-selected');
      injectListDetail(z, item);
    });
    list.appendChild(item);
  });

  // Re-inject inline detail after list re-render if a zone is selected
  if (selectedZone) {
    const item = $(`zli-${selectedZone.id}`);
    if (item) injectListDetail(selectedZone, item);
  }
}

// ── Zone Detail Panel ─────────────────────────────────
function showPanel(z) {
  // Refresh the inline list detail if it's open
  const item = $(`zli-${z.id}`);
  if (item) injectListDetail(z, item);
}

// ── Toggle Protection ─────────────────────────────────
function toggleProtection() {
  if (!selectedZone) return;

  const z = selectedZone;
  z.mpaStatus = !z.mpaStatus;

  saveState();
  showToast(z.mpaStatus
    ? `🛡️ ${z.name} is now a Marine Protected Area!`
    : `🔓 ${z.name} MPA status removed.`);

  // If active filter no longer includes this zone, clear selection
  if (activeFilter && !matchesFilter(z)) {
    selectedZone = null;
    document.getElementById('zl-inline-detail')?.remove();
  }

  updateStats(false); // re-renders grid + list (re-injects detail if selectedZone still set)
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg) {
  $('toast-msg').textContent = msg;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 3600);
}

// ── Critical Habitat Grid ─────────────────────────────
function renderCriticalGrid() {
  const critical = getAllCritical();
  const grid = $('critical-grid');
  grid.innerHTML = '';

  critical.forEach((z, i) => {
    const s  = score(z);
    const card = document.createElement('div');
    card.className = `critical-card${z.mpaStatus ? ' is-protected' : ''} crit-reveal`;

    card.innerHTML = `
      <div class="cc-header">
        <span class="cc-rank">#${i+1} RANKED</span>
        <div><span class="cc-score-val">${s}</span><span class="cc-score-unit">/100</span></div>
      </div>
      <div class="cc-name">${z.name}</div>
      <div class="cc-habitat">${HABITAT_EMOJI[z.habitatType]||''} ${z.habitatType.replace(/_/g,' ')}</div>
      <div class="cc-metrics">
        <div class="cc-metric"><div class="cc-metric-val">${z.speciesRichness}</div><div class="cc-metric-lbl">Richness</div></div>
        <div class="cc-metric"><div class="cc-metric-val">${z.fishingPressure}</div><div class="cc-metric-lbl">Pressure</div></div>
        <div class="cc-metric"><div class="cc-metric-val">${(z.area/1000).toFixed(0)}k</div><div class="cc-metric-lbl">km²</div></div>
      </div>
      <div class="cc-footer">
        <span class="cc-badge ${z.mpaStatus ? 'protected' : 'unprotected'}">${z.mpaStatus ? '✅ Protected' : '⚠️ Unprotected'}</span>
        <span class="cc-area">${z.depth}m depth</span>
      </div>
    `;

    // 3D tilt on mousemove
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y*9}deg) rotateY(${x*9}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });

    grid.appendChild(card);
  });

  // Observe the grid as a whole — animate row by row
  setTimeout(() => initCritReveal(grid), 80);
}

function initCritReveal(grid) {
  if (grid.dataset.critObserved) {
    // Already set up — just re-reveal if grid re-rendered while in view
    const r = grid.getBoundingClientRect();
    if (r.top < window.innerHeight) revealCriticalRows(grid);
    return;
  }
  grid.dataset.critObserved = '1';
  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    revealCriticalRows(grid);
    obs.disconnect();
  }, { threshold: 0.08 });
  obs.observe(grid);
}

function revealCriticalRows(grid) {
  const cards = [...grid.querySelectorAll('.crit-reveal')];
  if (!cards.length) return;
  // Group cards by their top offset (= same row)
  const rows = [];
  cards.forEach(card => {
    const top = card.getBoundingClientRect().top;
    let row = rows.find(r => Math.abs(r.top - top) < 4);
    if (!row) { row = { top, cards: [] }; rows.push(row); }
    row.cards.push(card);
  });
  rows.sort((a, b) => a.top - b.top);
  rows.forEach((row, ri) => {
    row.cards.forEach(card => {
      setTimeout(() => card.classList.add('crit-visible'), ri * 110);
    });
  });
}

// ── Gap Analysis ──────────────────────────────────────
function renderGapAnalysis() {
  const top5  = getTop5Gaps();
  const maxSc = top5.length ? score(top5[0]) : 100;
  const list  = $('gap-list');
  const bars  = $('chart-bars');
  list.innerHTML = '';
  bars.innerHTML = '';

  // Empty / success state
  if (top5.length === 0) {
    list.innerHTML = `
      <div class="gap-success reveal-up">
        <div class="gap-success-icon">🎉</div>
        <div class="gap-success-title">All Critical Gaps Closed!</div>
        <div class="gap-success-sub">Every unprotected critical zone now has MPA coverage. Outstanding conservation work!</div>
      </div>`;
    bars.innerHTML = `<div style="color:var(--txt-3);font-size:13px;text-align:center;padding:30px 0">No unprotected gaps remain.</div>`;
    setTimeout(initReveal, 80);
    return;
  }

  // List
  top5.forEach((z, i) => {
    const s = score(z);
    const item = document.createElement('div');
    item.className = 'gap-item reveal-up';
    item.style.transitionDelay = (i * 90) + 'ms';
    item.innerHTML = `
      <div class="gap-rank-badge rank-${i+1}">${i+1}</div>
      <div class="gap-info">
        <div class="gap-zone-name">${z.name}</div>
        <div class="gap-zone-sub">${z.habitatType.replace(/_/g,' ')} · ${fmt(z.area)} km²</div>
      </div>
      <div class="gap-score-box">
        <div class="gap-score-val">${s}</div>
        <div class="gap-score-lbl">score</div>
      </div>
    `;
    list.appendChild(item);
  });

  // Bar chart
  top5.forEach((z, i) => {
    const s   = score(z);
    const pct = (s / maxSc * 100).toFixed(1);
    const div = document.createElement('div');
    div.className = 'chart-bar-item';
    div.innerHTML = `
      <div class="chart-bar-labels">
        <span class="chart-bar-name">${z.name.split(' ').slice(0,2).join(' ')}</span>
        <span class="chart-bar-score">${s}</span>
      </div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" data-pct="${pct}"></div>
      </div>
    `;
    bars.appendChild(div);
  });

  setTimeout(() => {
    initReveal();
    const panel = $('gap-chart-panel');
    if (panel) {
      const r = panel.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        panel.querySelectorAll('.chart-bar-fill').forEach(bar => { bar.style.width = bar.dataset.pct + '%'; });
      }
    }
  }, 80);
}

// ── Scroll Reveal (IntersectionObserver) ─────────────
function initReveal() {                              // Bug 3 fix: singleton — one observer total
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');

        // Animate chart bars inside revealed elements
        entry.target.querySelectorAll('.chart-bar-fill').forEach(bar => {
          setTimeout(() => { bar.style.width = bar.dataset.pct + '%'; }, 300);
        });

        // Animate stat bars (once) when overview section enters view
        if (entry.target.id === 'overview' && !statsRevealDone) {
          statsRevealDone = true;
          const s = computeStats();
          setTimeout(() => {
            $('fill-coverage').style.width    = s.coveragePct + '%';
            $('fill-protected').style.width   = (s.protectedTotal.length / zones.length * 100) + '%';
            $('fill-critical').style.width    = (s.criticalZones.length / zones.length * 100) + '%';
            $('fill-unprotected').style.width = (s.unprotectedCritical.length / zones.length * 100) + '%';
          }, 400);
        }
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    const ov = $('overview');
    if (ov) revealObserver.observe(ov);
  }
  // Register any new .reveal-up elements not yet observed
  document.querySelectorAll('.reveal-up:not(.visible)').forEach(el => revealObserver.observe(el));
}

// ── Navbar Scroll Blur + Active Link Spy ─────────────
function initNavbar() {
  const navbar = $('navbar');
  const NAV_MAP = [
    ['overview',          $('nav-overview')],
    ['map-section',       $('nav-map')],
    ['critical-section',  $('nav-critical')],
    ['gap-section',       $('nav-gap')],
  ];

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);

    // Scroll-spy: highlight the section whose top is nearest above viewport centre
    let current = '';
    for (const [id] of NAV_MAP) {
      const el = $(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) current = id;
    }
    for (const [id, link] of NAV_MAP) {
      if (link) link.classList.toggle('active', id === current);
    }
  }, { passive: true });
}

// ── Three.js Hero Scene ───────────────────────────────
function initThreeJS() {
  if (typeof THREE === 'undefined') { console.warn('Three.js not loaded'); return; }

  const canvas   = $('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 5.5);

  // ── Particle cloud (bioluminescent plankton) ──
  const COUNT = 900;
  const pos   = new Float32Array(COUNT * 3);
  const col   = new Float32Array(COUNT * 3);           // Bug 7 fix: removed unused sz array

  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 3 + Math.random() * 6;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);

    const t = Math.random();
    if      (t < 0.55) { col[i*3]=0;   col[i*3+1]=0.83; col[i*3+2]=1;    } // cyan
    else if (t < 0.80) { col[i*3]=0;   col[i*3+1]=1;    col[i*3+2]=0.82; } // teal
    else               { col[i*3]=0.6; col[i*3+1]=0.44; col[i*3+2]=0.86; } // purple
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.055, vertexColors: true, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Wireframe globe ──
  const globeGeo = new THREE.SphereGeometry(2.2, 22, 22);
  const globeMat = new THREE.MeshBasicMaterial({
    color: 0x00D4FF, wireframe: true, transparent: true, opacity: 0.055
  });
  const globe = new THREE.Mesh(globeGeo, globeMat);
  globe.position.set(2.6, 0.2, -1.5);
  scene.add(globe);

  // ── Inner teal globe ──
  const innerGeo = new THREE.SphereGeometry(1.5, 18, 18);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x00FFD1, wireframe: true, transparent: true, opacity: 0.038
  });
  const innerGlobe = new THREE.Mesh(innerGeo, innerMat);
  innerGlobe.position.set(2.6, 0.2, -1.5);
  scene.add(innerGlobe);

  // ── Mouse parallax ──
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, { passive: true });

  // ── Animate ──
  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.006;

    particles.rotation.y = t * 0.06;
    particles.rotation.x = t * 0.025;
    particles.rotation.z = Math.sin(t * 0.4) * 0.04;

    globe.rotation.y      = t * 0.28;
    globe.rotation.x      = t * 0.18;
    innerGlobe.rotation.y = -t * 0.38;
    innerGlobe.rotation.x =  t * 0.28;

    globeMat.opacity  = 0.05 + Math.sin(t * 1.8) * 0.02;
    innerMat.opacity  = 0.03 + Math.sin(t * 2.2) * 0.015;

    // Smooth camera parallax
    camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  })();
}

// ── Load Data ─────────────────────────────────────────
async function loadData() {
  try {
    const res  = await fetch('ocean_zones.json');
    const data = await res.json();
    zones = data.zones;
  } catch {
    zones = FALLBACK_DATA.zones;            // file:// protocol fallback
  }
  loadState(zones);   // merge persisted MPA overrides
  initApp();
}

// ── Init App ──────────────────────────────────────────
function initApp() {
  updateStats(false);
  initNavbar();
  initReveal();
  initPanelScroll();
  setTimeout(animateHeroCounters, 800);
}

// ── Isolate right-panel scroll ────────────────────────
function initPanelScroll() {
  const panel = $('zone-panel');
  const list  = $('zone-list');
  if (!panel || !list) return;
  panel.addEventListener('wheel', e => {
    e.preventDefault();
    list.scrollTop += e.deltaY;
  }, { passive: false });
}

// ── Hero Counter Animation ────────────────────────────
function animateHeroCounters() {            // Bug 1 fix: extracted from updateStats(true)
  const s = computeStats();
  counter($('hero-coverage'), 0, s.coveragePct,           2400, '%');
  counter($('hero-total'),    0, zones.length,            1800, '');
  counter($('hero-critical'), 0, s.criticalZones.length,  2000, '');
  counter($('hero-protected'),0, s.protectedTotal.length, 2200, '');
}

// ── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  initThreeJS();
  loadData();
});
