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
  // Główne nagłówki (1,2,3,4,5)
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;

      // Zamknij inne
      document.querySelectorAll('.accordion-body').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });

      body.classList.toggle('active');
    });
  });

  // Tylko przesiadki jako pod-akordeon
  document.querySelectorAll('.connection-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;

      document.querySelectorAll('.connection-toggle').forEach(o => {
        if (o !== btn) o.classList.remove('active');
      });

      document.querySelectorAll('.accordion-subbody').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });

      btn.classList.toggle('active');
      body.classList.toggle('active');
    });
  });
}

document.getElementById('tabPL').addEventListener('click', () => {
  document.getElementById('tabPL').classList.add('active');
  document.getElementById('tabEN').classList.remove('active');
  document.getElementById('sectionPL').classList.add('active');
  document.getElementById('sectionEN').classList.remove('active');
  loadSections();
});

document.getElementById('tabEN').addEventListener('click', () => {
  document.getElementById('tabEN').classList.add('active');
  document.getElementById('tabPL').classList.remove('active');
  document.getElementById('sectionEN').classList.add('active');
  document.getElementById('sectionPL').classList.remove('active');
  loadSections();
});

loadSections();
