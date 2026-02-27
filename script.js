async function loadSections() {
  const elements = document.querySelectorAll('[data-load]');

  for (const el of elements) {
    const url = el.getAttribute('data-load');
    if (el.dataset.loaded === "true") continue;

    try {
      const response = await fetch(url);
      el.innerHTML = await response.text();
      el.dataset.loaded = "true";
    } catch (e) {
      el.innerHTML = `<p>Błąd ładowania: ${url}</p>`;
    }
  }

  // Po wstawieniu HTML aktywujemy akordeony (plusiki obsługujemy delegacją)
  activateAccordions();
}

function activateAccordions() {
  // Główne nagłówki
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.onclick = () => {
      const body = btn.nextElementSibling;

      // zamknij inne główne zakładki
      document.querySelectorAll('.accordion-body').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });

      body.classList.toggle('active');

      // ====== NOWE: po otwarciu innej zakładki zamknij wszystkie plusiki w niej ======
      if (body.classList.contains('active')) {
        body.querySelectorAll('.gastronomy-more').forEach(m => {
          m.classList.remove('active');
          m.style.display = 'none';
        });
      }
      // ===========================================================================

    };
  });

  // Tylko przesiadki
  document.querySelectorAll('.connection-toggle').forEach(btn => {
    btn.onclick = () => {
      const body = btn.nextElementSibling;

      document.querySelectorAll('.connection-toggle').forEach(o => {
        if (o !== btn) o.classList.remove('active');
      });

      document.querySelectorAll('.accordion-subbody').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });

      btn.classList.toggle('active');
      body.classList.toggle('active');
    };
  });
}

// ========================
// PLUSIK (delegacja klików)
// ========================
document.addEventListener('click', function (e) {
  const plus = e.target.closest('.gastronomy-plus');
  if (!plus) return;

  // Ważne: nie pozwól, żeby klik w plus wpływał na inne klik-handlery
  e.preventDefault();
  e.stopPropagation();

  const id = plus.getAttribute('data-target');
  if (!id) return;

  const block = document.getElementById(id);
  if (!block) return;

  // Najbezpieczniejszy root: aktualna otwarta zakładka (accordion-body)
  const root = plus.closest('.accordion-body') || document;

  // Zamknij wszystkie inne .gastronomy-more w tym samym root
  root.querySelectorAll('.gastronomy-more').forEach(other => {
    if (other !== block) {
      other.classList.remove('active');
      other.style.display = 'none';
    }
  });

  // Toggle klasy dla klikniętego
  block.classList.toggle('active');

  // Wymuś display zgodnie ze stanem
  const isActive = block.classList.contains('active');
  block.style.display = isActive ? 'block' : 'none';
});

// Taby
document.getElementById('tabPL').onclick = () => {
  document.getElementById('tabPL').classList.add('active');
  document.getElementById('tabEN').classList.remove('active');
  document.getElementById('sectionPL').classList.add('active');
  document.getElementById('sectionEN').classList.remove('active');
  loadSections();
};

document.getElementById('tabEN').onclick = () => {
  document.getElementById('tabEN').classList.add('active');
  document.getElementById('tabPL').classList.remove('active');
  document.getElementById('sectionEN').classList.add('active');
  document.getElementById('sectionPL').classList.remove('active');
  loadSections();
};

// Start
loadSections();

// ========================
// PŁYWAJĄCY SWITCH PL/EN (wersja A+) — z podzakładkami (gastronomy-more)
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
  const active = getActiveLang();
  langFab.textContent = (active === 'PL') ? 'EN' : 'PL';
}

// Wyciągnięcie “klucza” komunikatu: np. "1." / "5." / "B2." / "C1." itd.
function getHeaderKey(text) {
  const t = (text || '').trim();
  const m = t.match(/^([0-9]+\.|[A-Z][0-9]+\.|B[0-9]+\.|C[0-9]+\.)/i);
  return m ? m[1].toUpperCase() : null;
}

// Znajdź nagłówek akordeonu z dowolnego elementu na ekranie
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

// Zamiana id podzakładki: misc-pl-c4 <-> misc-en-c4 (i inne z -pl-/-en-)
function swapLangInId(id) {
  if (!id) return null;
  if (id.includes('-pl-')) return id.replace('-pl-', '-en-');
  if (id.includes('-en-')) return id.replace('-en-', '-pl-');
  return null; // nie umiemy mapować — wtedy olewamy
}

// Czekamy aż element pojawi się w DOM (fetch)
function waitForSelector(root, selector, maxTries = 40) {
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

// Otwórz główny akordeon (bez ryzyka, że go zamkniesz)
function ensureOpenMain(header) {
  const body = header.nextElementSibling;
  if (!body || !body.classList || !body.classList.contains('accordion-body')) return;
  if (!body.classList.contains('active')) header.click();
}

// Otwórz podzakładkę (klik w element z data-target)
function ensureOpenSub(activeSection, targetId) {
  if (!targetId) return;
  const toggler = activeSection.querySelector(`[data-target="${CSS.escape(targetId)}"]`);
  const panel = activeSection.querySelector(`#${CSS.escape(targetId)}`);

  // jeśli nie ma — nie robimy nic
  if (!toggler || !panel) return;

  // jeśli już otwarte — OK
  if (panel.classList.contains('active')) return;

  // klik otworzy (Twoje JS deleguje po .gastronomy-plus)
  toggler.click();
}

// Zapis “gdzie jestem” wg punktu pod kciukiem (prawy dół)
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

  const wasOpen = body && body.classList && body.classList.contains('accordion-body') && body.classList.contains('active');

  // >>> NOWE: podzakładka (np. C4) jeśli jesteśmy w środku .gastronomy-more.active
  const subPanel = el.closest('.gastronomy-more.active');
  const subId = subPanel ? subPanel.id : null;

  // ratio wewnątrz głównej treści (jak było)
  let ratio = 0;
  if (wasOpen && body) {
    const rect = body.getBoundingClientRect();
    const bodyTop = rect.top + window.scrollY;
    const bodyH = Math.max(1, rect.height);
    const thumbDocY = (window.scrollY + y);
    ratio = (thumbDocY - bodyTop) / bodyH;
    ratio = Math.max(0, Math.min(1, ratio));
  }

  return { key, wasOpen, ratio, thumbOffset, subId };
}

async function restoreViewportState(state) {
  if (!state) return;

  const activeSection = document.getElementById(getActiveLang() === 'PL' ? 'sectionPL' : 'sectionEN');

  // 1) znajdź docelowy główny komunikat po key
  const headers = Array.from(activeSection.querySelectorAll('.accordion-header'));
  let targetHeader = null;
  if (state.key) {
    targetHeader = headers.find(h => getHeaderKey(h.textContent) === state.key) || null;
  }
  if (!targetHeader) targetHeader = headers.length ? headers[0] : null;
  if (!targetHeader) return;

  if (state.wasOpen) ensureOpenMain(targetHeader);

  // 2) >>> NOWE: spróbuj otworzyć tę samą podzakładkę w drugim języku
  //    mapujemy id: misc-pl-c4 -> misc-en-c4
  let mappedSubId = swapLangInId(state.subId);
  if (mappedSubId) {
    // czekamy aż ta sekcja się wczyta i id będzie w DOM
    const subPanel = await waitForSelector(activeSection, `#${CSS.escape(mappedSubId)}`, 60);
    if (subPanel) {
      ensureOpenSub(activeSection, mappedSubId);
    }
  }

  // 3) przewiń do podobnego miejsca
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const targetBody = targetHeader.nextElementSibling;
      const hasBody = targetBody && targetBody.classList && targetBody.classList.contains('accordion-body');

      const baseTop = (state.wasOpen && hasBody)
        ? (targetBody.getBoundingClientRect().top + window.scrollY)
        : (targetHeader.getBoundingClientRect().top + window.scrollY);

      const height = (state.wasOpen && hasBody)
        ? Math.max(1, targetBody.getBoundingClientRect().height)
        : 1;

      const targetY = baseTop + (state.wasOpen ? state.ratio * height : 0) - (window.innerHeight - state.thumbOffset);
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' });
    });
  });
}

langFab.addEventListener('click', async () => {
  const state = captureViewportState();
  const nextLang = (getActiveLang() === 'PL') ? 'EN' : 'PL';
  setLang(nextLang);
  await restoreViewportState(state);
});

updateLangFabLabel();


