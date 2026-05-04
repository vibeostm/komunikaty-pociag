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

  // 1. Najpierw ładujemy tylko widoczny język
  if (activeSection) {
    await loadElements(activeSection.querySelectorAll('[data-load]'));
  }

  // 2. Drugi język doładowujemy po chwili w tle
  // Dzięki temu PL/EN później przełącza się szybciej,
  // ale nie blokuje pierwszego użycia strony.
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
// delegacja klików — działa natychmiast po pojawieniu się HTML
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
// TABY — PRZEŁĄCZANIE JĘZYKA
// ========================

const tabPL = document.getElementById('tabPL');
const tabEN = document.getElementById('tabEN');
const sectionPL = document.getElementById('sectionPL');
const sectionEN = document.getElementById('sectionEN');

if (tabPL) {
  tabPL.onclick = () => {
    tabPL.classList.add('active');
    tabEN.classList.remove('active');

    sectionPL.classList.add('active');
    sectionEN.classList.remove('active');

    updateLangFabLabel();
    loadSections();
  };
}

if (tabEN) {
  tabEN.onclick = () => {
    tabEN.classList.add('active');
    tabPL.classList.remove('active');

    sectionEN.classList.add('active');
    sectionPL.classList.remove('active');

    updateLangFabLabel();
    loadSections();
  };
}

// ========================
// PŁYWAJĄCY SWITCH PL/EN
// ========================

const langFab = document.getElementById('langFab');

function getActiveLang() {
  return document.getElementById('sectionEN').classList.contains('active') ? 'EN' : 'PL';
}

function setLang(lang) {
  if (lang === 'PL') document.getElementById('tabPL').click();
  else document.getElementById('tabEN').click();

  updateLangFabLabel();
}

function updateLangFabLabel() {
  if (!langFab) return;

  const active = getActiveLang();
  langFab.textContent = active === 'PL' ? 'EN' : 'PL';
}

function getHeaderKey(text) {
  const t = (text || '').trim();
  const m = t.match(/^([0-9]+\.|[A-Z][0-9]+\.|B[0-9]+\.|C[0-9]+\.)/i);
  return m ? m[1].toUpperCase() : null;
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

function swapLangInId(id) {
  if (!id) return null;

  if (id.includes('-pl-')) return id.replace('-pl-', '-en-');
  if (id.includes('-en-')) return id.replace('-en-', '-pl-');

  if (id.startsWith('delay-cat-')) {
    const rest = id.replace('delay-cat-', '');
    return `delay-en-${rest}`;
  }

  if (id.startsWith('delay-en-')) {
    const rest = id.replace('delay-en-', '');
    return `delay-cat-${rest}`;
  }

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

function waitForSelector(root, selector, maxTries = 60) {
  return new Promise((resolve) => {
    let tries = 0;

    const tick = () => {
      tries++;
      const el = root.querySelector(selector);

      if (el) return resolve(el);
      if (tries >= maxTries) return resolve(null);

      setTimeout(tick, 50);
    };

    tick();
  });
}

async function waitForHeaderByKey(sectionEl, key) {
  if (!key) return null;

  for (let i = 0; i < 60; i++) {
    const headers = Array.from(sectionEl.querySelectorAll('.accordion-header'));
    const found = headers.find(h => getHeaderKey(h.textContent) === key);

    if (found) return found;

    await new Promise(r => setTimeout(r, 50));
  }

  return null;
}

function ensureOpenMain(header) {
  const body = header.nextElementSibling;

  if (!body || !body.classList || !body.classList.contains('accordion-body')) return;

  if (!body.classList.contains('active')) {
    header.click();
  }
}

function ensureOpenSub(activeSection, targetId) {
  if (!targetId) return;

  const toggler = activeSection.querySelector(`[data-target="${CSS.escape(targetId)}"]`);
  const panel = activeSection.querySelector(`#${CSS.escape(targetId)}`);

  if (!toggler || !panel) return;
  if (panel.classList.contains('active')) return;

  toggler.click();
}

function captureViewportState() {
  const thumbOffset = 160;
  const x = Math.min(window.innerWidth - 30, window.innerWidth * 0.75);
  const y = Math.max(10, window.innerHeight - thumbOffset);

  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const header = findAccordionHeaderFromElement(el);
  if (!header) return null;

  const body = header.nextElementSibling;
  const key = getHeaderKey(header.textContent);

  const wasOpen =
    body &&
    body.classList &&
    body.classList.contains('accordion-body') &&
    body.classList.contains('active');

  const subPanel = el.closest('.gastronomy-more.active');
  const subId = subPanel ? subPanel.id : null;

  let ratio = 0;

  if (wasOpen && body) {
    const rect = body.getBoundingClientRect();
    const bodyTop = rect.top + window.scrollY;
    const bodyH = Math.max(1, rect.height);
    const thumbDocY = window.scrollY + y;

    ratio = (thumbDocY - bodyTop) / bodyH;
    ratio = Math.max(0, Math.min(1, ratio));
  }

  return { key, wasOpen, ratio, thumbOffset, subId };
}

async function restoreViewportState(state) {
  if (!state) return;

  const activeSection = document.getElementById(
    getActiveLang() === 'PL' ? 'sectionPL' : 'sectionEN'
  );

  let targetHeader = await waitForHeaderByKey(activeSection, state.key);

  if (!targetHeader) {
    const headers = Array.from(activeSection.querySelectorAll('.accordion-header'));
    targetHeader = headers.length ? headers[0] : null;
  }

  if (!targetHeader) return;

  if (state.wasOpen) ensureOpenMain(targetHeader);

  const mappedSubId = swapLangInId(state.subId);

  if (mappedSubId) {
    const subPanel = await waitForSelector(activeSection, `#${CSS.escape(mappedSubId)}`, 80);

    if (subPanel) {
      ensureOpenSub(activeSection, mappedSubId);
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const targetBody = targetHeader.nextElementSibling;

      const hasBody =
        targetBody &&
        targetBody.classList &&
        targetBody.classList.contains('accordion-body');

      const baseTop =
        state.wasOpen && hasBody
          ? targetBody.getBoundingClientRect().top + window.scrollY
          : targetHeader.getBoundingClientRect().top + window.scrollY;

      const height =
        state.wasOpen && hasBody
          ? Math.max(1, targetBody.getBoundingClientRect().height)
          : 1;

      const targetY =
        baseTop +
        (state.wasOpen ? state.ratio * height : 0) -
        (window.innerHeight - state.thumbOffset);

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'instant'
      });
    });
  });
}

if (langFab) {
  langFab.addEventListener('click', async () => {
    const state = captureViewportState();
    const nextLang = getActiveLang() === 'PL' ? 'EN' : 'PL';

    setLang(nextLang);
    await restoreViewportState(state);
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

// START
loadSections();
