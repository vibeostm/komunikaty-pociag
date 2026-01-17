// ============ Dynamiczne ładowanie sekcji ============
async function loadSections() {
  const elements = document.querySelectorAll('[data-load]');

  for (const el of elements) {
    const url = el.getAttribute('data-load');

    // Nie ładuj ponownie jeśli już załadowane
    if (el.dataset.loaded === "true") continue;

    try {
      const response = await fetch(url);
      el.innerHTML = await response.text();
      el.dataset.loaded = "true"; // oznacz jako załadowane
    } catch (e) {
      el.innerHTML = `<p>Błąd ładowania: ${url}</p>`;
    }
  }

  activateAccordions(); // rebinduj nowe elementy po załadowaniu
}

// ============ Akordeony ============
function toggleSections(selector, options = {}) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      if (!body) return;

      // Jeśli onlyOneOpen = true
      if (options.oneOpen) {
        document.querySelectorAll(selector).forEach(otherBtn => {
          if (otherBtn !== btn && otherBtn.nextElementSibling) {
            otherBtn.nextElementSibling.classList.remove('active');
          }
        });
      }

      body.classList.toggle('active');

      // UX: Przewiń do otwartego bloku, jeśli na mobile
      if (body.classList.contains('active') && window.innerWidth < 768) {
        setTimeout(() => body.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }
    });
  });
}

function activateAccordions() {
  toggleSections('.accordion-header');
  toggleSections('.green-toggle');
  toggleSections('.orange-toggle');
  toggleSections('.cyan-toggle');
  toggleSections('.yellow-toggle');
  toggleSections('.connection-toggle'); // Obsługa przesiadki
}

// ============ Tabsy (języki) ============
function initTabs(tabButtons) {
  tabButtons.forEach(({ btnId, sectionId }) => {
    const btn = document.getElementById(btnId);
    const section = document.getElementById(sectionId);

    if (!btn || !section) return;

    btn.addEventListener('click', () => {
      // Deaktywuj wszystkie
      tabButtons.forEach(({ btnId, sectionId }) => {
        document.getElementById(btnId).classList.remove('active');
        document.getElementById(sectionId).classList.remove('active');
      });

      // Aktywuj wybrany
      btn.classList.add('active');
      section.classList.add('active');
    });
  });
}

// ============ Start aplikacji ============
document.addEventListener('DOMContentLoaded', () => {
  initTabs([
    { btnId: 'tabPL', sectionId: 'sectionPL' },
    { btnId: 'tabEN', sectionId: 'sectionEN' }
  ]);

  loadSections();
});
