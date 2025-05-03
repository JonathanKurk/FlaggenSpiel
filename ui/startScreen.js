// --- START OF FILE ui/startScreen.js ---

import { i18n } from '../utils/i18n.js';
import { countries, selectedMode, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
import { setupGameForSelectedOptions } from './gameUI.js';

export function initStartScreen() {
  console.log("initStartScreen called");

  // --- Sprachauswahl Listener (unverändert) ---
  const langBtns = document.querySelectorAll('.lang-select-btn');
  console.log(`Found ${langBtns.length} language buttons.`);
  if (langBtns.length === 0) {
      console.error("FEHLER: Keine Sprachauswahl-Buttons mit Klasse '.lang-select-btn' gefunden!");
  }
  for (const btn of langBtns) {
    const lang = btn.dataset.lang;
    console.log(`Adding listener to language button: ${lang}`);
    btn.addEventListener('click', (event) => {
      console.log(`--- Language button clicked: ${lang} ---`);
      // alert(`Sprache ${lang} geklickt!`); // Alert entfernen, wenn es funktioniert
      // btn.style.border = ""; // Rahmen wieder entfernen

      try {
          setLanguage(lang);
          console.log(`setLanguage called successfully for ${lang}`);
          updateStartScreenI18n();
          console.log("updateStartScreenI18n called successfully");

          const stepLang = document.getElementById('step-language');
          if (stepLang) {
              stepLang.style.display = 'none';
              console.log("Hid #step-language");
          } else {
              console.error("FEHLER: Element #step-language nicht gefunden!");
          }
          const stepMode = document.getElementById('step-mode');
          if (stepMode) {
              stepMode.style.display = 'block';
              console.log("Showed #step-mode");
          } else {
              console.error("FEHLER: Element #step-mode nicht gefunden!");
          }
          console.log("--- Language button click handler finished ---");
      } catch (error) {
          console.error("FEHLER im Language Button Click Handler:", error);
      }
    });
  }

  // --- Modusauswahl Listener (unverändert) ---
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  console.log(`Found ${modeBtns.length} mode buttons.`);
  if (modeBtns.length === 0) {
      console.error("FEHLER: Keine Modusauswahl-Buttons mit Klasse '.mode-select-btn' gefunden!");
  }
  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      console.log(`Mode button clicked: ${mode}`);
      setSelectedMode(mode);
      showGameScreen();
    });
  }

  // --- NEU: Listener für den "Zurück zur Sprache"-Button ---
  const backToLangBtn = document.getElementById('backToLanguageBtn');
  if (backToLangBtn) {
      console.log("Adding listener to backToLanguageBtn");
      backToLangBtn.addEventListener('click', () => {
          console.log("backToLanguageBtn clicked");
          showStartScreen('language'); // Ziel 'language' angeben
      });
  } else {
      console.error("FEHLER: Button #backToLanguageBtn nicht gefunden!");
      // Stelle sicher, dass der Button in index.html existiert und die ID stimmt!
  }
  // ------------------------------------------------------

  updateStartScreenI18n(); // Initiales Setzen der Texte
}

// Updates only the texts relevant to the start screen
function updateStartScreenI18n() {
    console.log(`Updating start screen i18n for language: ${language}`);
    try {
        const startTitle = document.getElementById('start-title');
        if (startTitle) startTitle.textContent = i18n[language].title;

        const stepLangH2 = document.querySelector('#step-language h2');
        if (stepLangH2) stepLangH2.textContent = i18n[language].chooseLang;

        const chooseModeLabel = document.getElementById('choose-mode-label');
        if (chooseModeLabel) chooseModeLabel.textContent = i18n[language].chooseMode;

        // Update mode buttons
        const modeButtonSpans = document.querySelectorAll('.mode-select-btn span[data-i18n]');
        modeButtonSpans.forEach(span => {
            const key = span.dataset.i18n;
            if (i18n[language] && i18n[language][key]) {
                span.textContent = i18n[language][key];
            } else {
                console.warn(`i18n key '${key}' not found for lang '${language}'.`);
            }
        });

        // --- NEU: Text für den "Zurück zur Sprache"-Button aktualisieren ---
        const backToLangBtnSpan = document.querySelector('#backToLanguageBtn span[data-i18n="backToLanguageBtn"]');
        if (backToLangBtnSpan && i18n[language]?.backToLanguageBtn) {
            backToLangBtnSpan.textContent = i18n[language].backToLanguageBtn;
        } else if (!backToLangBtnSpan && document.getElementById('backToLanguageBtn')) {
             console.warn("Span inside #backToLanguageBtn not found for i18n update.");
        }
        // -------------------------------------------------------------

        console.log("Finished updating start screen i18n.");
    } catch (error) {
        console.error("FEHLER während updateStartScreenI18n:", error);
    }
}

// --- showGameScreen bleibt unverändert ---
export function showGameScreen() {
    // ... (kompletter Code von showGameScreen wie vorher) ...
    console.log(`showGameScreen called with mode: ${selectedMode}`);
    let filtered;
    const mode = selectedMode;
    if (!countries || countries.length === 0) {
        console.error("FEHLER: Kann Spiel nicht starten - 'countries'-Array ist leer oder nicht definiert!");
        alert("Fehler: Länderdaten konnten nicht geladen werden. Das Spiel kann nicht gestartet werden.");
        return;
    }
    if (mode === 'all') {
        filtered = countries.slice();
    } else if (['Europe', 'Asia', 'Africa', 'Oceania', 'North America', 'South America'].includes(mode)) {
        filtered = countries.filter(c => {
            if (!Array.isArray(c.continents)) return false;
            if (mode === 'North America') {
                return c.continents.includes('North America') || (c.continents.includes('Americas') && c.subregion === 'North America');
            }
            if (mode === 'South America') {
                return c.continents.includes('South America') || (c.continents.includes('Americas') && c.subregion === 'South America');
            }
            return c.continents.includes(mode);
        });
    } else {
        console.warn(`Unbekannter Modus gewählt: ${mode}. Wechsle zu 'Alle Länder'.`);
        setSelectedMode('all');
        filtered = countries.slice();
    }
    if (!filtered || filtered.length === 0) {
        console.warn(`Keine Länder für Modus gefunden: ${mode}. Wechsle zu 'Alle Länder'.`);
        const modeName = i18n[language]['mode'+mode.replace(/\s/g, '')] || mode; // Versuche, den Modusnamen zu übersetzen
        alert(`Warnung: Keine Länder für den Modus "${modeName}" gefunden. Zeige stattdessen alle Länder an.`);
        setSelectedMode('all');
        filtered = countries.slice();
        if (!filtered || filtered.length === 0) {
            console.error("KRITISCHER FEHLER: Auch nach Wechsel zu 'all' keine Länderdaten vorhanden. Spielstart abgebrochen.");
            alert("Kritischer Fehler: Keine Länderdaten verfügbar. Das Spiel kann nicht gestartet werden.");
            return;
        }
    }
    console.log(`Gefiltert auf ${filtered.length} Länder für Modus ${selectedMode}.`);
    setGameCountries(filtered);
    const startScreenEl = document.getElementById('start-screen');
    const mainEl = document.querySelector('main');
    if (!startScreenEl || !mainEl) {
        console.error("FEHLER beim Bildschirmwechsel: #start-screen oder main Element nicht gefunden!");
        return;
    }
    startScreenEl.classList.add('hide');
    console.log("Klasse 'hide' zu #start-screen hinzugefügt.");
    setTimeout(() => {
        try {
            console.log("Timeout abgelaufen: Verstecke Startbildschirm, zeige Hauptspiel.");
            startScreenEl.style.display = 'none';
            mainEl.style.display = 'block';
            console.log("Rufe setupGameForSelectedOptions auf...");
            setupGameForSelectedOptions();
        } catch(error) {
            console.error("FEHLER im Timeout beim Bildschirmwechsel:", error);
        }
    }, 230);
}


// --- GEÄNDERT: showStartScreen akzeptiert targetStep ---
export function showStartScreen(targetStep = 'mode') { // Standard ist jetzt 'mode'
  console.log(`showStartScreen called, targeting step: ${targetStep}`);

  const mainEl = document.querySelector('main');
  const startScreenEl = document.getElementById('start-screen');
  const stepLang = document.getElementById('step-language');
  const stepMode = document.getElementById('step-mode');

  if (!mainEl || !startScreenEl || !stepLang || !stepMode) {
      console.error("FEHLER beim Anzeigen des Startbildschirms: Wichtige Elemente fehlen!");
      return;
  }

  // Hauptspiel immer ausblenden
  mainEl.style.display = 'none';

  // Startbildschirm anzeigen
  startScreenEl.style.display = 'flex';
  startScreenEl.classList.remove('hide');

  // Entscheiden, welcher Schritt angezeigt wird
  if (targetStep === 'mode') {
      stepLang.style.display = 'none';
      stepMode.style.display = 'block';
      console.log("Showing mode selection step.");
  } else { // Default/Fallback ist 'language'
      stepLang.style.display = 'block';
      stepMode.style.display = 'none';
      console.log("Showing language selection step.");
  }

  updateStartScreenI18n(); // Texte aktualisieren für den sichtbaren Schritt
  console.log(`Startbildschirm angezeigt (Schritt: ${targetStep}).`);
}
// --- END OF FILE ui/startScreen.js ---
