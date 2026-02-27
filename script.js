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
// PŁYWAJĄCY SWITCH PL/EN (wersja A)
// ========================
const langFab = document.getElementById('langFab');

function getActiveLang() {
  return document.getElementById('sectionEN').classList.contains('active') ? 'EN' : 'PL';
}

function setLang(lang) {
  if (lang === 'PL') {
    document.getElementById('tabPL').click();
  } else {
    document.getElementById('tabEN').click();
  }
  updateLangFabLabel();
}

function updateLangFabLabel() {
  // Na ekranie pokazujemy "drugą stronę" (co klikniesz)
  const active = getActiveLang();
  langFab.textContent = (active === 'PL') ? 'EN' : 'PL';
}

// Wyciągnięcie “klucza” komunikatu: np. "1." / "5." / "B2." / "C1." itd.
function getHeaderKey(text) {
  const t = (text || '').trim();
  const m = t.match(/^([0-9]+\.|[A-Z][0-9]+\.|B[0-9]+\.|C[0-9]+\.)/i);
  return m ? m[1].toUpperCase() : null;
}

// Zapis “gdzie jestem” wg punktu pod kciukiem (prawy dół)
function captureViewportState() {
  const thumbOffset = 160; // px od dołu – punkt “czytania” (możesz zmienić)
  const x = Math.min(window.innerWidth - 30, window.innerWidth * 0.75);
  const y = Math.max(10, window.innerHeight - thumbOffset);

  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  // Szukamy najbliższego komunikatu (section.accordion)
  const acc = el.closest('section.accordion');
  if (!acc) return null;

  const header = acc.querySelector('.accordion-header');
  if (!header) return null;

  const body = header.nextElementSibling;
  const key = getHeaderKey(header.textContent);

  // Czy był otwarty?
  const wasOpen = body && body.classList.contains('active');

  // Proporcja przewinięcia wewnątrz body (jeśli otwarte)
  let ratio = 0;
  if (wasOpen && body) {
    const bodyRect = body.getBoundingClientRect();
    const bodyTop = bodyRect.top + window.scrollY;
    const bodyH = Math.max(1, bodyRect.height);
    const thumbDocY = (window.scrollY + y);
    ratio = (thumbDocY - bodyTop) / bodyH;
    ratio = Math.max(0, Math.min(1, ratio));
  }

  return { key, wasOpen, ratio, thumbOffset };
}

// Po przełączeniu: znajdź ten sam komunikat w drugim języku i przewiń
function restoreViewportState(state) {
  if (!state) return;

  const activeSection = document.getElementById(getActiveLang() === 'PL' ? 'sectionPL' : 'sectionEN');
  const headers = Array.from(activeSection.querySelectorAll('.accordion-header'));

  // 1) Szukamy po kluczu (np. "5." albo "B2.")
  let targetHeader = null;
  if (state.key) {
    targetHeader = headers.find(h => getHeaderKey(h.textContent) === state.key) || null;
  }

  // 2) Fallback: jeśli nie znaleziono klucza, bierzemy najbliższy nagłówek do góry ekranu
  if (!targetHeader && headers.length) {
    targetHeader = headers.reduce((best, h) => {
      const d = Math.abs(h.getBoundingClientRect().top - 120);
      const bd = best ? Math.abs(best.getBoundingClientRect().top - 120) : Infinity;
      return d < bd ? h : best;
    }, null);
  }

  if (!targetHeader) return;

  const targetBody = targetHeader.nextElementSibling;

  // Jeśli wcześniej był otwarty – otwórz też tutaj
  if (state.wasOpen && targetBody) {
    // zamknij inne, otwórz to
    document.querySelectorAll('.accordion-body').forEach(b => {
      if (b !== targetBody) b.classList.remove('active');
    });
    targetBody.classList.add('active');
  }

  // przewijanie: albo do body (proporcją), albo do nagłówka
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const baseTop = (state.wasOpen && targetBody)
        ? (targetBody.getBoundingClientRect().top + window.scrollY)
        : (targetHeader.getBoundingClientRect().top + window.scrollY);

      const height = (state.wasOpen && targetBody)
        ? Math.max(1, targetBody.getBoundingClientRect().height)
        : 1;

      const targetY = baseTop + (state.wasOpen ? state.ratio * height : 0) - (window.innerHeight - state.thumbOffset);
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'instant' });
    });
  });
}

// Klik w pływający przycisk
langFab.addEventListener('click', () => {
  const state = captureViewportState();
  const nextLang = (getActiveLang() === 'PL') ? 'EN' : 'PL';

  setLang(nextLang);

  // Po przełączeniu sekcji przewiń do odpowiednika
  // (loadSections() i tak jest wywoływane przy klikach tabów, więc treść już będzie)
  restoreViewportState(state);
});

// Na start ustaw label
updateLangFabLabel();

