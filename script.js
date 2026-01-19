// ========================
// ŁADOWANIE SEKCJI (FETCH)
// ========================
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

  // Po wstawieniu HTML aktywujemy akordeony
  activateAccordions();
}

// ========================
// AKORDEONY – GŁÓWNE BLOKI
// ========================
function activateAccordions() {
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.onclick = () => {
      const body = btn.nextElementSibling;

      document.querySelectorAll('.accordion-body').forEach(b => {
        if (b !== body) b.classList.remove('active');
      });

      body.classList.toggle('active');
    };
  });
}

// ==================================================
// TOGGLE PODBLOKÓW – KLIK CAŁEJ BELKI (DELEGACJA)
// ==================================================
document.addEventListener('click', function (e) {

  // Szukamy kliknięcia w belkę rozwijaną
  const header = e.target.closest('.toggle-header');
  if (!header) return;

  // Nie pozwalamy, aby klik wpływał na akordeon wyżej
  e.preventDefault();
  e.stopPropagation();

  // Rodzic = cały blok (.toggle)
  const toggleBlock = header.parentElement;

  // Zamykamy tylko rodzeństwo NA TYM SAMYM POZIOMIE
  const siblings = toggleBlock.parentElement.querySelectorAll('.toggle');
  siblings.forEach(el => {
    if (el !== toggleBlock) el.classList.remove('active');
  });

  // Toggle aktywności
  toggleBlock.classList.toggle('active');
});

// ========================
// TABY PL / EN
// ========================
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

// ========================
// START
// ========================
loadSections();
