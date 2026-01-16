async function loadSections() {
  const elements = document.querySelectorAll('[data-load]');

  for (const el of elements) {
    const url = el.getAttribute('data-load');

    try {
      const response = await fetch(url);
      el.innerHTML = await response.text();
    } catch (e) {
      el.innerHTML = `<p>Błąd ładowania: ${url}</p>`;
    }
  }

  activateAccordions();
}

function toggleSections(selector) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      if (body) {
        body.classList.toggle('active');
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
  toggleSections('.connection-toggle'); // dodana obsługa przycisku przesiadki
}

// Tabs
document.getElementById('tabPL').addEventListener('click', () => {
  document.getElementById('tabPL').classList.add('active');
  document.getElementById('tabEN').classList.remove('active');
  document.getElementById('sectionPL').classList.add('active');
  document.getElementById('sectionEN').classList.remove('active');
});

document.getElementById('tabEN').addEventListener('click', () => {
  document.getElementById('tabEN').classList.add('active');
  document.getElementById('tabPL').classList.remove('active');
  document.getElementById('sectionEN').classList.add('active');
  document.getElementById('sectionPL').classList.remove('active');
});

// Start aplikacji
loadSections();
