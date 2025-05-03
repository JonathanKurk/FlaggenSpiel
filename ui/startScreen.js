// --- START OF FILE startScreen.js ---

import { i18n } from '../utils/i18n.js';
// Importiere setSelectedMode statt selectedMode direkt
import { countries, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
// displayCurrentStreak wird über setSelectedMode -> setGameCountries -> displayCurrentStreak aufgerufen
import { setupGameForSelectedOptions, updateUI } from './gameUI.js';

export function initStartScreen() {
  // Sprachauswahl
  const langBtns = document.querySelectorAll('.lang-select-btn');
  for (const btn of langBtns) {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang); // Setzt Sprache global
      updateStartScreenI18n(); // Aktualisiert Texte im Start Screen
      // Zeige nächsten Schritt (Moduswahl)
      document.getElementById('step-language').style.display = 'none';
      document.getElementById('step-mode').style.display = '';
    });
  }
  updateStartScreenI18n(); // Initiale Texte setzen

  // Modusauswahl
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      const newMode = btn.dataset.mode;
      setSelectedMode(newMode); // WICHTIG: Setzt den Modus & löst Streak-Anzeige aus
      showGameScreen(); // Startet das Spiel mit dem gewählten Modus
    });
  }
}

// Aktualisiert Texte auf dem Startbildschirm basierend auf der Sprache
function updateStartScreenI18n() {
  document.getElementById('start-title').textContent = i18n[language].title;
  document.querySelector('#step-language h2').textContent = i18n[language].chooseLang;
  document.getElementById('choose-mode-label').textContent = i18n[language].chooseMode;
  // i18n für Modus-Buttons anwenden
  document.querySelector('.mode-select-btn[data-mode="all"] span[data-i18n="modeAll"]').textContent = i18n[language].modeAll;
  document.querySelector('.mode-select-btn[data-mode="Europe"] span[data-i18n="modeEurope"]').textContent = i18n[language].modeEurope;
  document.querySelector('.mode-select-btn[data-mode="Asia"] span[data-i18n="modeAsia"]').textContent = i18n[language].modeAsia;
  document.querySelector('.mode-select-btn[data-mode="Africa"] span[data-i18n="modeAfrica"]').textContent = i18n[language].modeAfrica;
  document.querySelector('.mode-select-btn[data-mode="South America"] span[data-i18n="modeSouthAmerica"]').textContent = i18n[language].modeSouthAmerica;
  document.querySelector('.mode-select-btn[data-mode="North America"] span[data-i18n="modeNorthAmerica"]').textContent = i18n[language].modeNorthAmerica;
  document.querySelector('.mode-select-btn[data-mode="Oceania"] span[data-i18n="modeOceania"]').textContent = i18n[language].modeOceania;

  updateUI(); // Aktualisiert auch Texte im (noch versteckten) Spielbereich
}

// Zeigt den Spielbildschirm an und filtert Länder nach Modus
export function showGameScreen() {
  let filtered;
  const mode = document.querySelector('.mode-select-btn.active')?.dataset.mode || 'all'; // Hole aktiven Modus
  // Anmerkung: Besser wäre es, den Modus aus der `selectedMode` Variable zu nehmen,
  // die durch `setSelectedMode` gesetzt wurde.
  // Verwende `language` und `selectedMode` aus script.js

  console.log(`Filtering countries for mode: ${selectedMode}`);

  if (selectedMode === 'all') {
    filtered = countries.slice();
  } else {
    // Filtert basierend auf dem Kontinentnamen im 'continents' Array
    // Wichtig: Prüft, ob c.continents existiert und ein Array ist
    filtered = countries.filter(c => Array.isArray(c.continents) && c.continents.includes(selectedMode));

    // Spezieller Fall für Nord/Südamerika, falls die API nur "Americas" liefert
    if (selectedMode === 'North America' || selectedMode === 'South America') {
        // Wenn die Hauptfilterung nichts ergab ODER zur Sicherheit: Prüfe Subregion
         filtered = countries.filter(c =>
             (Array.isArray(c.continents) && c.continents.includes(selectedMode)) || // Direkter Treffer
             (Array.isArray(c.continents) && c.continents.includes('Americas') && c.subregion === selectedMode) // Fallback über Subregion
         );
    }
  }


  if (!filtered || filtered.length === 0) {
      console.warn(`No countries found for mode: ${selectedMode}. Check API data and filtering logic. Defaulting to all countries.`);
      filtered = countries.slice();
      // Setze ggf. den Modus zurück auf 'all', wenn der gewählte Modus keine Länder liefert?
      // setSelectedMode('all'); // Oder behalte den gewählten Modus bei und zeige leeres Spiel?
  }

  setGameCountries(filtered); // Setzt die Länderliste & aktualisiert Streak-Anzeige

  // Blende Startbildschirm aus und Spielbildschirm ein
  const startScreen = document.getElementById('start-screen');
  const mainContent = document.querySelector('main');

  if (startScreen) startScreen.classList.add('hide');
  setTimeout(() => {
    if (startScreen) startScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    setupGameForSelectedOptions(); // Setzt UI-Listener etc. für das Spiel
  }, 250); // Muss zur CSS transition passen
}

// Zeigt den Startbildschirm an (z.B. bei Klick auf "Zurück")
export function showStartScreen() {
  // Winstreak NICHT zurücksetzen!
  const mainContent = document.querySelector('main');
  const startScreen = document.getElementById('start-screen');

  if(mainContent) mainContent.style.display = 'none';
  if(startScreen) {
      startScreen.style.display = 'flex';
      startScreen.classList.remove('hide');
  }
  // Setze die Schritte im Startbildschirm zurück
  const stepLang = document.getElementById('step-language');
  const stepMode = document.getElementById('step-mode');
  if (stepLang) stepLang.style.display = '';
  if (stepMode) stepMode.style.display = 'none';

  // Entferne ggf. aktive Markierung von Modus-Buttons
  document.querySelectorAll('.mode-select-btn.active').forEach(btn => btn.classList.remove('active'));
}

// --- END OF FILE startScreen.js ---
