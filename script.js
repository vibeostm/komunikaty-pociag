// ========================
// ŁADOWANIE SEKCJI
// szybsze: aktywna sekcja najpierw, pliki równolegle
// ========================

const loadedUrls = new Set();
const loadingUrls = new Set();

async function loadOne(el) {
  const url = el.getAttribute('data-load');
  if (!url) return;

  if (el.dataset.loaded === "true") return;
  if (loadingUrls.has(url)) return;

  loadingUrls.add(url);
  el.dataset.loading = "true";

  try {
    const response = await fetch(url, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    el.innerHTML = await response.text();
    el.dataset.loaded = "true";
    loadedUrls.add(url);
  } catch (e) {
    el.innerHTML = `<p>Błąd ładowania: ${url}</p>`;
    console.warn("Błąd ładowania sekcji:", url, e);
  } finally {
    el.dataset.loading = "false";
    loadingUrls.delete(url);
  }
}

async function loadElements(elements) {
  const tasks = Array.from(elements).map(el => loadOne(el));
  await Promise.allSettled(tasks);
}

async function loadSections() {
  const activeSection = document.querySelector('.section.active');
  const inactiveSections = Array.from(document.querySelectorAll('.section:not(.active)'));

  // 1. Najpierw ładujemy aktualnie widoczny język
  if (activeSection) {
    await loadElements(activeSection.querySelectorAll('[data-load]'));
  }

  // 2. Drugi język doładowujemy później w tle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      inactiveSections.forEach(section => {
        loadElements(section.querySelectorAll('[data-load]'));
      });
    });
  } else {
    setTimeout(() => {
      inactiveSections.forEach(section => {
        loadElements(section.querySelectorAll('[data-load]'));
      });
    }, 400);
  }
}

// ========================
// GŁÓWNE AKORDEONY
// delegacja klików — działa od razu po pojawieniu się HTML
// ========================

document.addEventListener('click', function (e) {
  const btn = e.target.closest('.accordion-header');
  if (!btn) return;

  const body = btn.nextElementSibling;
  if (!body || !body.classList.contains('accordion-body')) return;

  e.preventDefault();

  const isOpen = body.classList.contains('active');

  // zamknij inne główne zakładki
  document.querySelectorAll('.accordion-body').forEach(b => {
    if (b !== body) b.classList.remove('active');
  });

  // jeśli kliknięta była zamknięta — otwórz
  // jeśli była otwarta — zamknij
  body.classList.toggle('active', !isOpen);

  // po otwarciu zakładki zamknij plusiki gastronomii w jej wnętrzu
  if (!isOpen) {
    body.querySelectorAll('.gastronomy-more').forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
  }
});

// ========================
// PODAKORDEON — PRZESIADKI / LOTNISKA
// ========================

document.addEventListener('click', function (e) {
  const btn = e.target.closest('.connection-toggle');
  if (!btn) return;

  const body = btn.nextElementSibling;
  if (!body || !body.classList.contains('accordion-subbody')) return;

  e.preventDefault();

  const isOpen = btn.classList.contains('active');

  document.querySelectorAll('.connection-toggle').forEach(o => {
    if (o !== btn) o.classList.remove('active');
  });

  document.querySelectorAll('.connection-toggle + .accordion-subbody').forEach(b => {
    if (b !== body) b.classList.remove('active');
  });

  btn.classList.toggle('active', !isOpen);
  body.classList.toggle('active', !isOpen);
});

// ========================
// PLUSIK GASTRONOMII
// ========================

document.addEventListener('click', function (e) {
  const plus = e.target.closest('.gastronomy-plus');
  if (!plus) return;

  e.preventDefault();
  e.stopPropagation();

  const id = plus.getAttribute('data-target');
  if (!id) return;

  const block = document.getElementById(id);
  if (!block) return;

  const root = plus.closest('.accordion-body') || document;

  root.querySelectorAll('.gastronomy-more').forEach(other => {
    if (other !== block) {
      other.classList.remove('active');
      other.style.display = 'none';
    }
  });

  block.classList.toggle('active');

  const isActive = block.classList.contains('active');
  block.style.display = isActive ? 'block' : 'none';
});

// ========================
// TABY + PŁYWAJĄCY SWITCH PL/EN
// stabilne przełączanie z zachowaniem miejsca
// ========================

const tabPL = document.getElementById('tabPL');
const tabEN = document.getElementById('tabEN');
const sectionPL = document.getElementById('sectionPL');
const sectionEN = document.getElementById('sectionEN');
const langFab = document.getElementById('langFab');

let langSwitchBusy = false;

function getActiveLang() {
  return sectionEN.classList.contains('active') ? 'EN' : 'PL';
}

function updateLangFabLabel() {
  if (!langFab) return;

  const active = getActiveLang();
  langFab.textContent = active === 'PL' ? 'EN' : 'PL';
}

function applyLangVisualState(lang) {
  if (lang === 'PL') {
    tabPL.classList.add('active');
    tabEN.classList.remove('active');

    sectionPL.classList.add('active');
    sectionEN.classList.remove('active');

    document.documentElement.lang = 'pl';
  } else {
    tabEN.classList.add('active');
    tabPL.classList.remove('active');

    sectionEN.classList.add('active');
    sectionPL.classList.remove('active');

    document.documentElement.lang = 'en';
  }

  updateLangFabLabel();
}

async function setLangReady(lang) {
  applyLangVisualState(lang);

  // Czekamy aż aktywna sekcja realnie się załaduje
  await loadSections();

  const activeSection = lang === 'PL' ? sectionPL : sectionEN;

  // Asekuracja: czekamy aż pojawią się nagłówki akordeonów
  for (let i = 0; i < 60; i++) {
    if (activeSection.querySelector('.accordion-header')) return;
    await new Promise(r => setTimeout(r, 50));
  }
}

function getHeaderKey(text) {
  const t = (text || '').trim();
  const m = t.match(/^([0-9]+\.|[A-Z][0-9]+\.|B[0-9]+\.|C[0-9]+\.)/i);
  return m ? m[1].toUpperCase() : null;
}

function getActiveSection() {
  return getActiveLang() === 'PL' ? sectionPL : sectionEN;
}

function findAccordionHeaderFromElement(el) {
  if (!el) return null;

  const directHeader = el.closest('.accordion-header');
  if (directHeader) return directHeader;

  const body = el.closest('.accordion-body');
  if (body) {
    let prev = body.previousElementSibling;

    while (prev) {
      if (prev.classList && prev.classList.contains('accordion-header')) return prev;
      prev = prev.previousElementSibling;
    }
  }

  const wrapper = el.closest('.accordion');
  if (wrapper) {
    const h = wrapper.querySelector('.accordion-header');
    if (h) return h;
  }

  return null;
}

function getVisibleReferenceElement() {
  // Kilka punktów odniesienia zwiększa stabilność na telefonie
  const points = [
    { x: window.innerWidth * 0.50, y: window.innerHeight * 0.42 },
    { x: window.innerWidth * 0.50, y: window.innerHeight * 0.55 },
    { x: window.innerWidth * 0.75, y: window.innerHeight - 160 },
    { x: window.innerWidth * 0.50, y: 120 }
  ];

  for (const p of points) {
    const x = Math.max(1, Math.min(window.innerWidth - 2, p.x));
    const y = Math.max(1, Math.min(window.innerHeight - 2, p.y));
    const el = document.elementFromPoint(x, y);

    if (el && el.closest('.section.active')) {
      return { el, x, y };
    }
  }

  return null;
}

function getHeaderIndex(section, header) {
  const headers = Array.from(section.querySelectorAll('.accordion-header'));
  return headers.indexOf(header);
}

function findHeaderByKeyOrIndex(section, key, index) {
  const headers = Array.from(section.querySelectorAll('.accordion-header'));

  if (key) {
    const byKey = headers.find(h => getHeaderKey(h.textContent) === key);
    if (byKey) return byKey;
  }

  if (index >= 0 && headers[index]) {
    return headers[index];
  }

  return headers[0] || null;
}

function swapLangInId(id) {
  if (!id) return null;

  // Uniwersalne mapowanie -pl- / -en-
  if (id.includes('-pl-')) return id.replace('-pl-', '-en-');
  if (id.includes('-en-')) return id.replace('-en-', '-pl-');

  // Komunikat 6
  if (id.startsWith('delay-cat-')) {
    const rest = id.replace('delay-cat-', '');
    return `delay-en-${rest}`;
  }

  if (id.startsWith('delay-en-')) {
    const rest = id.replace('delay-en-', '');
    return `delay-cat-${rest}`;
  }

  // Komunikat 7
  if (id.startsWith('wypadek-pl-7-')) {
    const rest = id.replace('wypadek-pl-7-', '');
    return `acc-en7-${rest}`;
  }

  if (id.startsWith('acc-en7-')) {
    const rest = id.replace('acc-en7-', '');
    return `wypadek-pl-7-${rest}`;
  }

  return null;
}

function captureViewportState() {
  const activeSection = getActiveSection();
  const ref = getVisibleReferenceElement();

  if (!ref) return null;

  const header = findAccordionHeaderFromElement(ref.el);
  if (!header) return null;

  const body = header.nextElementSibling;
  const key = getHeaderKey(header.textContent);
  const index = getHeaderIndex(activeSection, header);

  const wasOpen =
    body &&
    body.classList &&
    body.classList.contains('accordion-body') &&
    body.classList.contains('active');

  let ratio = 0;

  if (wasOpen && body) {
    const rect = body.getBoundingClientRect();
    const bodyTop = rect.top + window.scrollY;
    const bodyHeight = Math.max(1, rect.height);
    const refDocY = window.scrollY + ref.y;

    ratio = (refDocY - bodyTop) / bodyHeight;
    ratio = Math.max(0, Math.min(1, ratio));
  }

  const activeSubPanel =
    ref.el.closest('.gastronomy-more.active') ||
    ref.el.closest('.accordion-subbody.active');

  const subId = activeSubPanel ? activeSubPanel.id : null;

  return {
    key,
    index,
    wasOpen,
    ratio,
    refY: ref.y,
    subId
  };
}

function ensureOpenMain(header) {
  if (!header) return;

  const body = header.nextElementSibling;

  if (!body || !body.classList || !body.classList.contains('accordion-body')) return;

  if (!body.classList.contains('active')) {
    header.click();
  }
}

function ensureOpenSub(activeSection, targetId) {
  if (!targetId) return;

  const safeId = CSS.escape(targetId);
  const toggler = activeSection.querySelector(`[data-target="${safeId}"]`);
  const panel = activeSection.querySelector(`#${safeId}`);

  if (!toggler || !panel) return;

  if (!panel.classList.contains('active')) {
    toggler.click();
  }
}

async function waitForTargetHeader(section, key, index) {
  for (let i = 0; i < 80; i++) {
    const header = findHeaderByKeyOrIndex(section, key, index);
    if (header) return header;

    await new Promise(r => setTimeout(r, 50));
  }

  return null;
}

async function restoreViewportState(state) {
  if (!state) return;

  const activeSection = getActiveSection();

  const targetHeader = await waitForTargetHeader(
    activeSection,
    state.key,
    state.index
  );

  if (!targetHeader) return;

  if (state.wasOpen) {
    ensureOpenMain(targetHeader);
  }

  const mappedSubId = swapLangInId(state.subId);

  if (mappedSubId) {
    for (let i = 0; i < 40; i++) {
      if (activeSection.querySelector(`#${CSS.escape(mappedSubId)}`)) break;
      await new Promise(r => setTimeout(r, 50));
    }

    ensureOpenSub(activeSection, mappedSubId);
  }

  // Czekamy dwie klatki, żeby przeglądarka przeliczyła wysokości
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => requestAnimationFrame(resolve));

  const targetBody = targetHeader.nextElementSibling;

  const hasBody =
    targetBody &&
    targetBody.classList &&
    targetBody.classList.contains('accordion-body');

  let targetY;

  if (state.wasOpen && hasBody) {
    const bodyTop = targetBody.getBoundingClientRect().top + window.scrollY;
    const bodyHeight = Math.max(1, targetBody.getBoundingClientRect().height);

    targetY = bodyTop + state.ratio * bodyHeight - state.refY;
  } else {
    const headerTop = targetHeader.getBoundingClientRect().top + window.scrollY;
    targetY = headerTop - 90;
  }

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'instant'
  });
}

async function switchLanguagePreservingPosition(nextLang) {
  if (langSwitchBusy) return;

  langSwitchBusy = true;

  if (langFab) {
    langFab.disabled = true;
    langFab.style.opacity = '0.72';
  }

  const state = captureViewportState();

  await setLangReady(nextLang);
  await restoreViewportState(state);

  if (langFab) {
    langFab.disabled = false;
    langFab.style.opacity = '';
  }

  langSwitchBusy = false;
}

if (tabPL) {
  tabPL.onclick = async () => {
    if (getActiveLang() === 'PL') return;
    await switchLanguagePreservingPosition('PL');
  };
}

if (tabEN) {
  tabEN.onclick = async () => {
    if (getActiveLang() === 'EN') return;
    await switchLanguagePreservingPosition('EN');
  };
}

if (langFab) {
  langFab.addEventListener('click', async () => {
    const nextLang = getActiveLang() === 'PL' ? 'EN' : 'PL';
    await switchLanguagePreservingPosition(nextLang);
  });
}

updateLangFabLabel();

// ========================
// KOMUNIKAT 6 — tylko jeden wewnętrzny akordeon naraz
// ========================

document.addEventListener("click", (e) => {
  const summary = e.target.closest("summary.k6-pill");
  if (!summary) return;

  const details = summary.parentElement;
  if (!details || details.tagName !== "DETAILS") return;

  const group = details.closest(".k6-group");
  if (!group) return;

  e.preventDefault();

  const wasOpen = details.open;

  group.querySelectorAll("details.k6-details[open]").forEach((d) => {
    d.open = false;
  });

  if (!wasOpen) {
    details.open = true;
  }
});

// ========================
// START
// ========================

loadSections();
