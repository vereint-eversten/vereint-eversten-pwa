const navButtons = document.querySelectorAll('.nav-btn');
const moduleBar = document.getElementById('module-bar');
const moduleContent = document.getElementById('module-content');

const modules = {
  home: "Willkommen im Home-Modul.",
  verein: "Hier findest du Informationen über das Projekt verein[t].",
  chat: "Hier ist dein Messenger.",
  kalender: "Hier findest du deinen Kalender mit allen Terminen.",
  shop: "Hier findest du unseren Spenden- & Merchandise-Bereich."
};

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mod = btn.dataset.module;
    moduleBar.textContent = mod.charAt(0).toUpperCase() + mod.slice(1);
    moduleContent.innerHTML = `<p>${modules[mod]}</p>`;

    navButtons.forEach(b => {
      const icon = b.querySelector('img');
      const modName = b.dataset.module;
      icon.src = `assets/icons/Button-${capitalize(modName)}-${modName === mod ? 'aktiv' : 'inaktiv'}.svg`;
    });
  });
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const isAdmin = true;
if (isAdmin) {
  document.querySelector('.admin-only').style.display = 'block';
}
