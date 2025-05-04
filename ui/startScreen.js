// --- START OF FILE ui/startScreen.js ---

import { i18n } from '../utils/i18n.js';
import { countries, selectedMode, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
import { setupGameForSelectedOptions, displayCurrentStreak } from './gameUI.js'; // Import displayCurrentStreak

// Initializes the start screen, sets up listeners
export function initStartScreen() {
  console.log("initStartScreen: Setting up start screen listeners.");

  const stepLangEl = document.getElementById('step-language');
  const stepModeEl = document.getElementById('step-mode');
  const startScreenEl = document.getElementById('start-screen');

  if (!stepLangEl || !stepModeEl || !startScreenEl) {
      console.error("FEHLER: Start screen core elements (#start-screen, #step-language, #step-mode) not found!");
      return; // Stop initialization if essential elements are missing
  }

  // --- Language Selection Listeners ---
  const langBtns = document.querySelectorAll('.lang-select-btn');
  if (langBtns.length === 0) {
      console.warn("Keine Sprachauswahl-Buttons (.lang-select-btn) gefunden!");
  } else {
      langBtns.forEach(btn => {
          const lang = btn.dataset.lang;
          if (!lang) {
              console.warn("Sprachauswahl-Button ohne data-lang Attribut gefunden:", btn);
              return;
          }
          btn.addEventListener('click', () => {
              console.log(`Language button clicked: ${lang}`);
              setLanguage(lang);
              updateStartScreenI18n(); // Update texts for the next step

              // Hide language step, show mode step
              stepLangEl.style.display = 'none';
              stepModeEl.style.display = 'block';
              console.log("Switched from language selection to mode selection step.");
          });
      });
  }

  // --- Mode Selection Listeners ---
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  if (modeBtns.length === 0) {
      console.warn("Keine Modusauswahl-Buttons (.mode-select-btn) gefunden!");
  } else {
      modeBtns.forEach(btn => {
          const mode = btn.dataset.mode;
          if (!mode) {
              console.warn("Modusauswahl-Button ohne data-mode Attribut gefunden:", btn);
              return;
          }
          btn.addEventListener('click', () => {
              console.log(`Mode button clicked: ${mode}`);
              setSelectedMode(mode);
              showGameScreen(); // Transition to the main game screen
          });
      });
  }

  // --- Back to Language Selection Listener ---
  const backToLangBtn = document.getElementById('backToLanguageBtn');
  if (!backToLangBtn) {
      console.warn("Button #backToLanguageBtn nicht gefunden!");
  } else {
      backToLangBtn.addEventListener('click', () => {
          console.log("backToLanguageBtn clicked");
          // Show language step, hide mode step
          stepModeEl.style.display = 'none';
          stepLangEl.style.display = 'block';
          updateStartScreenI18n(); // Update texts for the language step
          console.log("Switched back from mode selection to language selection step.");
      });
  }

  // --- Initial State ---
  // Ensure only the language step is visible initially when the app loads
  stepLangEl.style.display = 'block';
  stepModeEl.style.display = 'none';
  startScreenEl.style.display = 'flex'; // Make sure the whole start screen is visible
  startScreenEl.classList.remove('hide'); // Ensure no fade-out class is active
  document.querySelector('main').style.display = 'none'; // Ensure main game is hidden

  updateStartScreenI18n(); // Set initial texts for the language step
  console.log("initStartScreen: Start screen initialized, showing language selection.");
}

// Updates the text content within the start screen based on the selected language
function updateStartScreenI18n() {
    console.log(`Updating start screen i18n for language: ${language}`);
    const currentLangData = i18n[language];
    if (!currentLangData) {
        console.error(`i18n data for language "${language}" not found!`);
        return;
    }

    // Helper function to set text content safely
    const setText = (selector, key) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = currentLangData[key] || `Missing key: ${key}`;
        } else {
            // More specific warning if element itself is missing
            if (!selector.startsWith('#') && !selector.startsWith('.')) { // Simple check for ID/class
                 const idSelector = `#${selector}`;
                 if (!document.getElementById(selector)) console.warn(`Element with ID "${selector}" not found for i18n key "${key}".`);
            } else {
                 console.warn(`Element "${selector}" not found for i18n key "${key}".`);
            }
        }
    };

    // Update titles and labels
    setText('#start-title', 'title');
    setText('#step-language h2', 'chooseLang');
    setText('#choose-mode-label', 'chooseMode'); // Corrected selector

    // Update mode button texts (using spans with data-i18n)
    document.querySelectorAll('.mode-select-btn span[data-i18n]').forEach(span => {
        const key = span.dataset.i18n;
        if (currentLangData[key]) {
            span.textContent = currentLangData[key];
        } else {
            console.warn(`i18n key '${key}' not found for lang '${language}'.`);
            span.textContent = `Missing key: ${key}`;
        }
    });

    // Update "Back to Language" button text
    setText('#backToLanguageBtn span[data-i18n="backToLanguageBtn"]', 'backToLanguageBtn');

    console.log("Finished updating start screen i18n.");
}


// Filters countries based on mode and transitions to the main game screen
export function showGameScreen() {
    console.log(`showGameScreen: Starting game with mode: ${selectedMode}`);
    const startScreenEl = document.getElementById('start-screen');
    const mainEl = document.querySelector('main');

    if (!startScreenEl || !mainEl) {
        console.error("FEHLER: Kann Spiel nicht starten - #start-screen oder main Element nicht gefunden!");
        return;
    }
    if (!countries || countries.length === 0) {
        console.error("FEHLER: 'countries' Array ist leer oder nicht definiert beim Versuch, das Spiel zu starten!");
        alert("Fehler: Länderdaten nicht verfügbar. Spiel kann nicht gestartet werden.");
        return; // Prevent further execution
    }

    // Filter countries based on the selected mode
    let filteredCountries;
    const mode = selectedMode; // Use the global selectedMode

    if (mode === 'all') {
        filteredCountries = countries.slice(); // Use all countries
    } else if (['Europe', 'Asia', 'Africa', 'Oceania', 'North America', 'South America'].includes(mode)) {
        // Filter by continent/region, handling Americas specifically
        filteredCountries = countries.filter(c => {
            if (!Array.isArray(c.continents)) return false; // Skip if continent data is missing

            if (mode === 'North America') {
                return c.continents.includes('North America') || (c.continents.includes('Americas') && c.subregion === 'North America');
            }
            if (mode === 'South America') {
                return c.continents.includes('South America') || (c.continents.includes('Americas') && c.subregion === 'South America');
            }
            // For other continents
            return c.continents.includes(mode);
        });
    } else {
        console.warn(`Unbekannter Modus "${mode}". Wechsle zu 'Alle Länder'.`);
        setSelectedMode('all'); // Correct the mode state
        filteredCountries = countries.slice();
    }

    // Check if filtering resulted in any countries
    if (!filteredCountries || filteredCountries.length === 0) {
        const modeName = i18n[language]?.[`mode${mode.replace(/\s/g, '')}`] || mode;
        console.warn(`Keine Länder für Modus "${modeName}" gefunden. Zeige stattdessen alle Länder.`);
        alert(`Warnung: Keine Länder für den Modus "${modeName}" gefunden. Wechsle zu 'Alle Länder'.`);
        setSelectedMode('all'); // Ensure mode state is updated
        filteredCountries = countries.slice(); // Fallback to all countries

        // Final check if even 'all' yields no countries
        if (!filteredCountries || filteredCountries.length === 0) {
            console.error("KRITISCHER FEHLER: Keine Länderdaten verfügbar, auch nicht für 'Alle Länder'. Spielstart abgebrochen.");
            alert("Kritischer Fehler: Keine Länderdaten verfügbar. Das Spiel kann nicht gestartet werden.");
            // Optionally, show start screen again or display a permanent error
            showStartScreen('language'); // Go back to language select
            return;
        }
    }

    console.log(`Gefiltert auf ${filteredCountries.length} Länder für Modus ${selectedMode}.`);
    setGameCountries(filteredCountries); // Set the countries for the game UI

    // --- Transition ---
    startScreenEl.classList.add('hide'); // Start fade out
    console.log("Added 'hide' class to #start-screen for transition.");

    // Wait for fade out animation, then switch display
    setTimeout(() => {
        try {
            console.log("Transition timeout finished. Hiding start screen, showing main game.");
            startScreenEl.style.display = 'none'; // Hide start screen completely
            mainEl.style.display = 'block';     // Show main game area (or 'flex' if needed by layout)

            // Set up the game with the selected options (language, mode, countries)
            console.log("Calling setupGameForSelectedOptions...");
            setupGameForSelectedOptions(); // This should load the first flag etc.
        } catch (error) {
            console.error("FEHLER im Timeout beim Wechsel zum Spielbildschirm:", error);
            // Attempt to recover or show error message
            mainEl.innerHTML = '<h1>Fehler</h1><p>Problem beim Starten des Spiels. Bitte neu laden.</p>';
            mainEl.style.display = 'block';
            startScreenEl.style.display = 'none';
        }
    }, 250); // Match CSS transition duration slightly longer just in case
}


// Shows the start screen, targeting a specific step ('language' or 'mode')
export function showStartScreen(targetStep = 'mode') { // Default to mode selection when returning from game
  console.log(`showStartScreen: Showing start screen, targeting step: ${targetStep}`);

  const mainEl = document.querySelector('main');
  const startScreenEl = document.getElementById('start-screen');
  const stepLangEl = document.getElementById('step-language');
  const stepModeEl = document.getElementById('step-mode');

  if (!mainEl || !startScreenEl || !stepLangEl || !stepModeEl) {
      console.error("FEHLER: Wichtige Elemente für showStartScreen fehlen!");
      // Try to recover gracefully
      if (startScreenEl) startScreenEl.style.display = 'flex';
      if (mainEl) mainEl.style.display = 'none';
      alert("Ein Fehler ist aufgetreten. Anzeige des Startbildschirms möglicherweise fehlerhaft.");
      return;
  }

  // Hide main game content, show start screen container
  mainEl.style.display = 'none';
  startScreenEl.style.display = 'flex';
  startScreenEl.classList.remove('hide'); // Remove fade-out class if present

  // Show the correct step within the start screen
  if (targetStep === 'language') {
      stepLangEl.style.display = 'block';
      stepModeEl.style.display = 'none';
      console.log("Showing language selection step.");
  } else { // Default or 'mode'
      stepLangEl.style.display = 'none';
      stepModeEl.style.display = 'block';
      console.log("Showing mode selection step.");
  }

  updateStartScreenI18n(); // Update texts for the currently visible step
  displayCurrentStreak(); // Ensure streak display is updated (might be needed if returning from game)
  console.log(`Startbildschirm angezeigt (Zielschritt: ${targetStep}).`);
}
// --- END OF FILE ui/startScreen.js ---
