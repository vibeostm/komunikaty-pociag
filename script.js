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

  activateAccordions();
}

function activateAccordions() {
  document.querySelectorAll('.accordion-header, .connection-toggle')
    .forEach(btn => {
      btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        if (!body) return;

        // zamknij wszystkie inne
        document.querySelectorAll('.accordion-header, .connection-toggle')
          .forEach(otherBtn => {
            const otherBody = otherBtn.nextElementSibling;
            if (otherBtn !== btn && otherBody) {
              otherBody.classList.remove('active');
              otherBtn.classList.remove('active');
            }
          });

        // toggle aktualnej
        body.classList.toggle('active');
        btn.classList.toggle('active');

        // przewiń do aktywnej sekcji na mobile
        if (body.classList.contains('active') && window.innerWidth < 768) {
          setTimeout(() => {
            btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      });
    });
}

function initTabs(tabButtons) {
  tabButtons.forEach(({ btnId, sectionId }) => {
    const btn = document.getElementById(btnId);
    const section = document.getElementById(sectionId);

    if (!btn || !section) return;

    btn.addEventListener('click', () => {
      tabButtons.forEach(({ btnId, sectionId }) => {
        document.getElementById(btnId).classList.remove('active');
        document.getElementById(sectionId).classList.remove('active');
      });

      btn.classList.add('active');
      section.classList.add('active');

      setTimeout(loadSections, 0);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs([
    { btnId: 'tabPL', sectionId: 'sectionPL' },
    { btnId: 'tabEN', sectionId: 'sectionEN' }
  ]);

  loadSections();
});
