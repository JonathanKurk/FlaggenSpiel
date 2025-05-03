// --- START OF FILE ui/startScreen.js ---

import { i18n } from '../utils/i18n.js';
import { countries, selectedMode, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
// REMOVED: updateUI import is no longer needed here if only setupGameForSelectedOptions uses it.
// If setupGameForSelectedOptions needs it, keep it, but it's removed from updateStartScreenI18n
import { setupGameForSelectedOptions, updateUI } from './gameUI.js'; // Keep updateUI import if setupGame... needs it

export function initStartScreen() {
  // Language selection
  const langBtns = document.querySelectorAll('.lang-select-btn');
  for (const btn of langBtns) {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
      updateStartScreenI18n(); // Update texts on start screen
      // Now correctly hide language and show mode selection
      document.getElementById('step-language').style.display = 'none';
      document.getElementById('step-mode').style.display = '';
    });
  }
  updateStartScreenI18n(); // Initial text setting

  // Mode selection
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      setSelectedMode(btn.dataset.mode);
      showGameScreen();
    });
  }
}

// Updates only the texts relevant to the start screen
function updateStartScreenI18n() {
  document.getElementById('start-title').textContent = i18n[language].title;
  document.querySelector('#step-language h2').textContent = i18n[language].chooseLang;
  document.getElementById('choose-mode-label').textContent = i18n[language].chooseMode;
  document.querySelector('.mode-select-btn[data-mode="all"] span[data-i18n="modeAll"]').textContent = i18n[language].modeAll;
  document.querySelector('.mode-select-btn[data-mode="Europe"] span[data-i18n="modeEurope"]').textContent = i18n[language].modeEurope;
  document.querySelector('.mode-select-btn[data-mode="Asia"] span[data-i18n="modeAsia"]').textContent = i18n[language].modeAsia;
  document.querySelector('.mode-select-btn[data-mode="Africa"] span[data-i18n="modeAfrica"]').textContent = i18n[language].modeAfrica;
  document.querySelector('.mode-select-btn[data-mode="South America"] span[data-i18n="modeSouthAmerica"]').textContent = i18n[language].modeSouthAmerica;
  document.querySelector('.mode-select-btn[data-mode="North America"] span[data-i18n="modeNorthAmerica"]').textContent = i18n[language].modeNorthAmerica;
  document.querySelector('.mode-select-btn[data-mode="Oceania"] span[data-i18n="modeOceania"]').textContent = i18n[language].modeOceania;

  // REMOVED THIS LINE: updateUI();
  // The main game UI will be updated when the game screen is shown via showGameScreen -> setupGameForSelectedOptions -> updateUI
}

export function showGameScreen() {
  let filtered;
  const mode = selectedMode;

  if (mode === 'all') {
    filtered = countries.slice();
  } else if (
    mode === 'Europe' ||
    mode === 'Asia' ||
    mode === 'Africa' ||
    mode === 'Oceania' ||
    mode === 'North America' ||
    mode === 'South America'
  ) {
    // Filter based on continent - ensure it handles cases like 'Americas' subregions if needed
    filtered = countries.filter(c => {
        if (!Array.isArray(c.continents)) return false;
        // Handle North/South America which might be under 'Americas' continent
        if (mode === 'North America') {
            return c.continents.includes('North America') || (c.continents.includes('Americas') && c.subregion === 'North America');
        }
        if (mode === 'South America') {
            return c.continents.includes('South America') || (c.continents.includes('Americas') && c.subregion === 'South America');
        }
        return c.continents.includes(mode);
    });
  } else {
    console.warn(`Unknown mode selected: ${mode}. Defaulting to all countries.`);
    filtered = countries.slice();
  }


  if (!filtered || filtered.length === 0) {
      console.warn(`No countries found for mode: ${mode}. Check API data and filtering logic. Defaulting to all countries.`);
      filtered = countries.slice();
      // Maybe inform the user here?
      // alert(`Warning: No countries found for ${mode}. Showing all countries instead.`);
      // setSelectedMode('all'); // Optionally reset the mode
  }

  setGameCountries(filtered);

  document.getElementById('start-screen').classList.add('hide');
  setTimeout(() => {
    document.getElementById('start-screen').style.display = 'none';
    document.querySelector('main').style.display = 'block';
    setupGameForSelectedOptions(); // This function should handle calling updateUI for the main screen
  }, 230);
}

export function showStartScreen() {
  // Reset relevant game state if necessary, e.g., clearing the streak display for the *next* session
  // Note: Current streak is preserved per mode in localStorage now. Display updates handle this.

  document.querySelector('main').style.display = 'none';
  document.getElementById('start-screen').style.display = 'flex';
  document.getElementById('start-screen').classList.remove('hide');
  // Reset to language selection step
  document.getElementById('step-language').style.display = '';
  document.getElementById('step-mode').style.display = 'none';
  // Optionally update start screen texts again if language might have changed
  updateStartScreenI18n();
}
// --- END OF FILE ui/startScreen.js ---
