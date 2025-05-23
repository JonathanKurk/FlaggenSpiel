// --- START OF FILE ui/startScreen.js ---

import { i18n } from '../utils/i18n.js';
import { countries, selectedMode, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
import { setupGameForSelectedOptions } from './gameUI.js';

export function initStartScreen() {
  console.log("initStartScreen called");

  const startScreenEl = document.getElementById('start-screen');
  const stepLang = document.getElementById('step-language');
  const stepMode = document.getElementById('step-mode');

   if (!startScreenEl || !stepLang || !stepMode) {
        console.error("FEHLER in initStartScreen: Wichtige Startbildschirm-Elemente fehlen!");
        // Optional: Display a fatal error or fallback UI
        return;
   }


  // --- Ensure initial step display state ---
  // This ensures that even if CSS or other scripts interfere,
  // the language selection is the default visible step on load.
  startScreenEl.style.display = 'flex'; // Ensure the container is visible
  startScreenEl.classList.remove('hide'); // Ensure it's not hidden by opacity
  stepLang.style.display = 'block'; // Show language step
  stepMode.style.display = 'none'; // Hide mode step
  console.log("Initial start screen step display state enforced: Language step shown.");
  // ----------------------------------------


  // --- Sprachauswahl Listener ---
  const langBtns = document.querySelectorAll('.lang-select-btn');
  console.log(`Found ${langBtns.length} language buttons.`);
  if (langBtns.length === 0) {
      console.error("FEHLER: Keine Sprachauswahl-Buttons mit Klasse '.lang-select-btn' gefunden!");
  }
  langBtns.forEach(btn => { // Use forEach for cleaner loop
    const lang = btn.dataset.lang;
    // console.log(`Adding listener to language button: ${lang}`);
    btn.addEventListener('click', (event) => {
      console.log(`--- Language button clicked: ${lang} ---`);
      try {
          setLanguage(lang);
          console.log(`setLanguage called successfully for ${lang}`);
          updateStartScreenI18n(); // Update texts for both steps *after* language is set

          // Hide language step and show mode step
          const stepLang = document.getElementById('step-language'); // Re-get elements to be safe
          const stepMode = document.getElementById('step-mode');
          if (stepLang && stepMode) { // Check both exist before swapping
              stepLang.style.display = 'none';
              stepMode.style.display = 'block';
              console.log("Switched from language step to mode step.");
          } else {
              console.error("FEHLER beim Wechsel der Startbildschirm-Schritte: stepLang oder stepMode nicht gefunden!");
          }
          console.log("--- Language button click handler finished ---");
      } catch (error) {
          console.error("FEHLER im Language Button Click Handler:", error);
          // Optional: Display an error message to the user
      }
    });
  });


  // --- Modusauswahl Listener ---
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  console.log(`Found ${modeBtns.length} mode buttons.`);
  if (modeBtns.length === 0) {
      console.error("FEHLER: Keine Modusauswahl-Buttons mit Klasse '.mode-select-btn' gefunden!");
  }
  modeBtns.forEach(btn => { // Use forEach for cleaner loop
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      console.log(`Mode button clicked: ${mode}`);
      setSelectedMode(mode);
      showGameScreen();
    });
  });

  // --- Listener für den "Zurück zur Sprache"-Button ---
  const backToLangBtn = document.getElementById('backToLanguageBtn');
  if (backToLangBtn) {
      console.log("Adding listener to backToLanguageBtn");
      backToLangBtn.addEventListener('click', () => {
          console.log("backToLanguageBtn clicked");
          showStartScreen('language'); // Ziel 'language' angeben
      });
  } else {
      console.error("FEHLER: Button #backToLanguageBtn nicht gefunden!");
  }
  // ------------------------------------------------------

  updateStartScreenI18n(); // Initiales Setzen der Texte basierend auf default 'de' or saved lang
}

// Updates only the texts relevant to the start screen
function updateStartScreenI18n() {
    console.log(`Updating start screen i18n for language: ${language}`);
    try {
        const startTitle = document.getElementById('start-title');
        if (startTitle) startTitle.textContent = i18n[language]?.title || i18n.de.title; // Fallback to German

        const stepLangH2 = document.querySelector('#step-language h2');
        if (stepLangH2) stepLangH2.textContent = i18n[language]?.chooseLang || i18n.de.chooseLang;

        const chooseModeLabel = document.getElementById('choose-mode-label');
        if (chooseModeLabel) chooseModeLabel.textContent = i18n[language]?.chooseMode || i18n.de.chooseMode;

        // Update mode buttons
        const modeButtonSpans = document.querySelectorAll('.mode-select-btn span[data-i18n]');
        modeButtonSpans.forEach(span => {
            const key = span.dataset.i18n;
            span.textContent = i18n[language]?.[key] || i18n.de[key] || span.textContent; // Fallback chain
        });

        // Update text for the "Back to Language" button
        const backToLangBtnSpan = document.querySelector('#backToLanguageBtn span[data-i18n="backToLanguageBtn"]');
        if (backToLangBtnSpan) {
             backToLangBtnSpan.textContent = i18n[language]?.backToLanguageBtn || i18n.de.backToLanguageBtn; // Fallback
        } else if (document.getElementById('backToLanguageBtn')) {
             console.warn("Span with data-i18n='backToLanguageBtn' not found inside #backToLanguageBtn for i18n update.");
        }

        // Update text for the "Back" button in the game UI (even though it's hidden)
        const backToStartBtnGameSpan = document.querySelector('#backToStartBtn span[data-i18n="backToStartBtn"]');
         if (backToStartBtnGameSpan) {
             backToStartBtnGameSpan.textContent = i18n[language]?.backToStartBtn || i18n.de.backToStartBtn; // Fallback
        } else if (document.getElementById('backToStartBtn')) {
             console.warn("Span with data-i18n='backToStartBtn' not found inside #backToStartBtn for i18n update.");
        }


        console.log("Finished updating start screen i18n.");
    } catch (error) {
        console.error("FEHLER während updateStartScreenI18n:", error);
    }
}

// --- showGameScreen remains largely unchanged ---
export function showGameScreen() {
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
    startScreenEl.classList.add('hide'); // Use opacity transition
    console.log("Klasse 'hide' zu #start-screen hinzugefügt.");
    setTimeout(() => {
        try {
            console.log("Timeout abgelaufen: Verstecke Startbildschirm, zeige Hauptspiel.");
            startScreenEl.style.display = 'none'; // Fully hide after transition
            mainEl.style.display = 'flex'; // Show main game area (using flex as per new CSS)
            console.log("Rufe setupGameForSelectedOptions auf...");
            setupGameForSelectedOptions();
        } catch(error) {
            console.error("FEHLER im Timeout beim Bildschirmwechsel:", error);
        }
    }, 230); // Matched CSS transition duration
}


// GEÄNDERT: showStartScreen akzeptiert targetStep und setzt Displays explizit
export function showStartScreen(targetStep = 'mode') { // Standard ist 'mode'
  console.log(`showStartScreen called, targeting step: ${targetStep}`);

  const mainEl = document.querySelector('main');
  const startScreenEl = document.getElementById('start-screen');
  const stepLang = document.getElementById('step-language');
  const stepMode = document.getElementById('step-mode');

  if (!mainEl || !startScreenEl || !stepLang || !stepMode) {
      console.error("FEHLER beim Anzeigen des Startbildschirms: Wichtige Elemente fehlen!");
      // Optional: Render a fatal error message to the body
      // document.body.innerHTML = `<h1>Error</h1><p>Could not load necessary UI elements. Please try refreshing.</p>`;
      return;
  }

  // Hauptspiel immer ausblenden
  mainEl.style.display = 'none';

  // Startbildschirm anzeigen (ensure it's visible and not transitioning out)
  startScreenEl.style.display = 'flex'; // Use flex as defined in CSS
  startScreenEl.classList.remove('hide'); // Ensure it's not hidden by opacity

  // Entscheiden, welcher Schritt angezeigt wird und Displays explizit setzen
  if (targetStep === 'language') {
      stepLang.style.display = 'block';
      stepMode.style.display = 'none';
      console.log("Showing language selection step.");
  } else { // Default or targetStep === 'mode'
      stepLang.style.display = 'none';
      stepMode.style.display = 'block';
      console.log("Showing mode selection step.");
  }

  updateStartScreenI18n(); // Texte aktualisieren
  console.log(`Startbildschirm angezeigt (Schritt: ${targetStep}).`);
}
