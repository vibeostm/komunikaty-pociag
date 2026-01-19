alert('SCRIPT JS DZIAŁA');

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

  // aktywuj po wstawieniu HTML
  activateAccordions();
}

// ================= AKORDEONY =================
function activateAccordions() {

  // Główne akordeony
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.onclick = () => {
      const body = btn.nextElementSibling;
      document.querySelectorAll('.accordion-body').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });
      body.classList.toggle('active');
    };
  });

  // Przesiadki (jeśli używane)
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

// ================= PLUSIK GASTRONOMIA =================
// EVENT DELEGATION – DZIAŁA Z FETCH()
document.addEventListener('click', function (e) {

  const plus = e.target.closest('.gastronomy-plus');
  if (!plus) return;

  const id = plus.getAttribute('data-target');
  if (!id) return;

  const block = document.getElementById(id);
  if (!block) return;

  block.classList.toggle('active');
});

// ================= TABY =================
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

// ================= START =================
loadSections();

