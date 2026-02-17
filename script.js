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
      document.querySelectorAll('.accordion-body').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });
      body.classList.toggle('active');
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

  // ====== NOWE: zamykanie innych rozwinięć w tej samej sekcji ======
  // Najbezpieczniejszy root: aktualna otwarta zakładka (accordion-body)
  const root = plus.closest('.accordion-body') || document;

  // Zamknij wszystkie inne .gastronomy-more w tym samym root
  root.querySelectorAll('.gastronomy-more').forEach(other => {
    if (other !== block) {
      other.classList.remove('active');
      other.style.display = 'none';
    }
  });
  // ===============================================================

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
