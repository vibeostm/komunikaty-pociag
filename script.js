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
  addIconsToHeaders([
    '.accordion-header',
    '.green-toggle',
    '.orange-toggle',
    '.cyan-toggle',
    '.yellow-toggle',
    '.connection-toggle'
  ]);
}

function toggleSections(selector) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      if (!body) return;

      document.querySelectorAll(selector).forEach(otherBtn => {
        const otherBody = otherBtn.nextElementSibling;
        if (otherBody && otherBody !== body) {
          otherBody.classList.remove('active');
          otherBtn.classList.remove('active');
          const icon = otherBtn.querySelector('.arrow-icon');
          if (icon) icon.textContent = '▶';
        }
      });

      const wasActive = body.classList.contains('active');
      body.classList.toggle('active');
      btn.classList.toggle('active');

      const icon = btn.querySelector('.arrow-icon');
      if (icon) {
        icon.textContent = wasActive ? '▶' : '🔽';
      }

      if (!wasActive && window.innerWidth < 768) {
        setTimeout(() => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
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
  toggleSections('.connection-toggle');
}

function addIconsToHeaders(selectors) {
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(btn => {
      if (!btn.querySelector('.arrow-icon')) {
        const icon = document.createElement('span');
        icon.classList.add('arrow-icon');
        icon.textContent = '▶';
        btn.appendChild(icon);
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
