// --- START OF FILE ui/startScreen.js ---

import { i18n } from '../utils/i18n.js';
import { countries, selectedMode, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
import { setupGameForSelectedOptions } from './gameUI.js'; // updateUI wird von setupGameForSelectedOptions aufgerufen

export function initStartScreen() {
  console.log("initStartScreen called");

  const langBtns = document.querySelectorAll('.lang-select-btn');
  console.log(`Found ${langBtns.length} language buttons.`);
  if (langBtns.length === 0) {
      console.error("FEHLER: Keine Sprachauswahl-Buttons mit Klasse '.lang-select-btn' gefunden!");
  }

  for (const btn of langBtns) {
    const lang = btn.dataset.lang;
    console.log(`Adding listener to language button: ${lang}`);
    btn.addEventListener('click', (event) => { // event hinzugefügt
      // ***** NEUE TESTAUSGABEN *****
      console.log(`--- Language button clicked: ${lang} ---`);
      alert(`Sprache ${lang} geklickt!`); // Direkte Bestätigung
      btn.style.border = "3px solid red"; // Visuelle Bestätigung am Button
      // ****************************

      try {
          setLanguage(lang);
          console.log(`setLanguage called successfully for ${lang}`);

          updateStartScreenI18n();
          console.log("updateStartScreenI18n called successfully");

          const stepLang = document.getElementById('step-language');
          if (stepLang) {
              stepLang.style.display = 'none';
              console.log("Attempted to hide #step-language (style.display='none')"); // Geändert: Attempted
          } else {
              console.error("FEHLER: Element #step-language nicht gefunden!");
          }

          const stepMode = document.getElementById('step-mode');
          if (stepMode) {
              stepMode.style.display = 'block'; // Sicherstellen, dass 'block' gesetzt wird
              console.log("Attempted to show #step-mode (style.display='block')"); // Geändert: Attempted
          } else {
              console.error("FEHLER: Element #step-mode nicht gefunden!");
          }
          console.log("--- Language button click handler finished ---");

      } catch (error) {
          console.error("FEHLER im Language Button Click Handler:", error);
      }
    });
  }
  updateStartScreenI18n();

  // Modusauswahl (Listeners bleiben gleich)
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  console.log(`Found ${modeBtns.length} mode buttons.`); // Debug log
  if (modeBtns.length === 0) {
      console.error("FEHLER: Keine Modusauswahl-Buttons mit Klasse '.mode-select-btn' gefunden!");
  }
  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      console.log(`Mode button clicked: ${mode}`); // Debug log
      setSelectedMode(mode);
      showGameScreen();
    });
  }
}

// Updates only the texts relevant to the start screen
function updateStartScreenI18n() {
  console.log(`Updating start screen i18n for language: ${language}`); // Debug log
  try {
      // Sicherstellen, dass Elemente existieren, bevor textContent gesetzt wird
      const startTitle = document.getElementById('start-title');
      if (startTitle) startTitle.textContent = i18n[language].title;
      else console.warn("Element #start-title not found for i18n update.");

      const stepLangH2 = document.querySelector('#step-language h2');
      if (stepLangH2) stepLangH2.textContent = i18n[language].chooseLang;
      else console.warn("Element '#step-language h2' not found for i18n update.");

      const chooseModeLabel = document.getElementById('choose-mode-label');
      if (chooseModeLabel) chooseModeLabel.textContent = i18n[language].chooseMode;
      else console.warn("Element '#choose-mode-label' not found for i18n update.");

      // Update mode buttons safely
      const modeButtonSpans = document.querySelectorAll('.mode-select-btn span[data-i18n]');
      modeButtonSpans.forEach(span => {
          const key = span.dataset.i18n;
          if (i18n[language] && i18n[language][key]) {
              span.textContent = i18n[language][key];
          } else {
              // Keine Panik, wenn Key fehlt, aber loggen
              console.warn(`i18n key '${key}' not found for language '${language}' during start screen update.`);
          }
      });
       console.log("Finished updating start screen i18n."); // Debug log
  } catch (error) {
      console.error("FEHLER während updateStartScreenI18n:", error); // Debug log
  }
}

export function showGameScreen() {
  console.log(`showGameScreen called with mode: ${selectedMode}`); // Debug log
  let filtered;
  const mode = selectedMode;

  // Sicherheitscheck: Sind Länderdaten vorhanden?
  if (!countries || countries.length === 0) {
      console.error("FEHLER: Kann Spiel nicht starten - 'countries'-Array ist leer oder nicht definiert!");
      alert("Fehler: Länderdaten konnten nicht geladen werden. Das Spiel kann nicht gestartet werden."); // Benutzer informieren
      return; // Abbrechen
  }

  // Filterlogik (leicht angepasst für Klarheit und Robustheit)
  if (mode === 'all') {
    filtered = countries.slice();
  } else if (['Europe', 'Asia', 'Africa', 'Oceania', 'North America', 'South America'].includes(mode)) {
    filtered = countries.filter(c => {
        if (!Array.isArray(c.continents)) return false;
        // Spezifische Behandlung für Amerika, da Kontinent 'Americas' sein kann
        if (mode === 'North America') {
            return c.continents.includes('North America') || (c.continents.includes('Americas') && c.subregion === 'North America');
        }
        if (mode === 'South America') {
            return c.continents.includes('South America') || (c.continents.includes('Americas') && c.subregion === 'South America');
        }
        // Direkter Check für andere Kontinente
        return c.continents.includes(mode);
    });
  } else {
    console.warn(`Unbekannter Modus gewählt: ${mode}. Wechsle zu 'Alle Länder'.`);
    setSelectedMode('all'); // Korrigiere den Modus-State
    filtered = countries.slice();
  }

  // Sicherheitscheck: Hat das Filtern funktioniert?
  if (!filtered || filtered.length === 0) {
      console.warn(`Keine Länder für Modus gefunden: ${mode}. Wechsle zu 'Alle Länder'.`);
      alert(`Warnung: Keine Länder für den Modus "${i18n[language]['mode'+mode] || mode}" gefunden. Zeige stattdessen alle Länder an.`);
      setSelectedMode('all'); // Modus-State korrigieren
      filtered = countries.slice(); // Erneut filtern mit 'all'
      // Finaler Check, ob überhaupt Länder da sind
      if (!filtered || filtered.length === 0) {
           console.error("KRITISCHER FEHLER: Auch nach Wechsel zu 'all' keine Länderdaten vorhanden. Spielstart abgebrochen.");
           alert("Kritischer Fehler: Keine Länderdaten verfügbar. Das Spiel kann nicht gestartet werden.");
           return; // Abbruch
      }
  }

  console.log(`Gefiltert auf ${filtered.length} Länder für Modus ${selectedMode}.`); // Verwende aktuellen selectedMode
  setGameCountries(filtered);

  // Elemente für den Bildschirmwechsel holen
  const startScreenEl = document.getElementById('start-screen');
  const mainEl = document.querySelector('main');

  if (!startScreenEl || !mainEl) {
      console.error("FEHLER beim Bildschirmwechsel: #start-screen oder main Element nicht gefunden!");
      return;
  }

  startScreenEl.classList.add('hide');
  console.log("Klasse 'hide' zu #start-screen hinzugefügt."); // Debug log

  setTimeout(() => {
    try {
        console.log("Timeout abgelaufen: Verstecke Startbildschirm, zeige Hauptspiel."); // Debug log
        startScreenEl.style.display = 'none';
        mainEl.style.display = 'block'; // Oder 'flex', je nach main-Layout
        console.log("Rufe setupGameForSelectedOptions auf..."); // Debug log
        setupGameForSelectedOptions();
    } catch(error) {
        console.error("FEHLER im Timeout beim Bildschirmwechsel:", error); // Debug log
    }
  }, 230); // Dauer der CSS-Transition
}

export function showStartScreen() {
  console.log("showStartScreen called"); // Debug log

  const mainEl = document.querySelector('main');
  const startScreenEl = document.getElementById('start-screen');
  const stepLang = document.getElementById('step-language');
  const stepMode = document.getElementById('step-mode');

  // Prüfen, ob alle Elemente da sind
  if (!mainEl || !startScreenEl || !stepLang || !stepMode) {
      console.error("FEHLER beim Anzeigen des Startbildschirms: Wichtige Elemente fehlen!");
      return;
  }

  mainEl.style.display = 'none';
  startScreenEl.style.display = 'flex'; // Sicherstellen, dass er sichtbar ist
  startScreenEl.classList.remove('hide');

  // Zurück zur Sprachauswahl
  stepLang.style.display = 'block'; // Oder '' um inline style zu entfernen
  stepMode.style.display = 'none';

  updateStartScreenI18n(); // Texte aktualisieren
  console.log("Startbildschirm angezeigt."); // Debug log
}
// --- END OF FILE ui/startScreen.js ---
