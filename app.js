const navButtons = document.querySelectorAll('.nav-btn');
const moduleBar = document.getElementById('module-bar');
const moduleContent = document.getElementById('module-content');

// Mapping von Modulnamen zu Dateien
const moduleFiles = {
  home: "home.html",
  vereint: "vereint.html",
  tus: "tus.html",
  messenger: "messenger.html",
  kalender: "kalender.html",
  shop: "shop.html",
  einstellungen: "einstellungen.html",
  administration: "administration.html"
};

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mod = btn.dataset.module.toLowerCase();
    moduleBar.textContent = mod.charAt(0).toUpperCase() + mod.slice(1);

    const fileName = moduleFiles[mod];
    if (fileName) {
      fetch(`modules/${fileName}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Modul ${fileName} konnte nicht geladen werden.`);
          }
          return response.text();
        })
        .then(html => {
          moduleContent.innerHTML = html;
        })
        .catch(error => {
          moduleContent.innerHTML = `<p>Fehler beim Laden des Moduls: ${error.message}</p>`;
        });
    } else {
      moduleContent.innerHTML = `<p>Kein Modul gefunden für "${mod}"</p>`;
    }

    navButtons.forEach(b => {
      const icon = b.querySelector('img');
      const modName = b.dataset.module.toLowerCase();
      icon.src = `assets/icons/Button-${capitalize(modName)}-${modName === mod ? 'aktiv' : 'inaktiv'}.svg`;
    });
  });
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener("DOMContentLoaded", () => {
  const isAdmin = true;
  if (isAdmin) {
    document.querySelector('.admin-only').style.display = 'block';
  }
});
