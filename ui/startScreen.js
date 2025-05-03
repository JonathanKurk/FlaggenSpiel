import { i18n } from '../utils/i18n.js';
import { countries, selectedMode, setGameCountries, setSelectedMode, setLanguage, language } from '../script.js';
import { setupGameForSelectedOptions, updateUI } from './gameUI.js';

export function initStartScreen() {
  // Language selection
  const langBtns = document.querySelectorAll('.lang-select-btn');
  for (const btn of langBtns) {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
      updateStartScreenI18n();
      document.getElementById('step-language').style.display = 'none';
      document.getElementById('step-mode').style.display = '';
    });
  }
  updateStartScreenI18n();

  // Mode selection
  const modeBtns = document.querySelectorAll('.mode-select-btn');
  for (const btn of modeBtns) {
    btn.addEventListener('click', () => {
      setSelectedMode(btn.dataset.mode);
      showGameScreen();
    });
  }
}

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

  updateUI();
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
    filtered = countries.filter(c => Array.isArray(c.continents) && c.continents.includes(mode));
  } else {
    console.warn(`Unknown mode selected: ${mode}. Defaulting to all countries.`);
    filtered = countries.slice();
  }

  if (!filtered || filtered.length === 0) {
      console.warn(`No countries found for mode: ${mode}. Check API data and filtering logic. Defaulting to all countries.`);
      filtered = countries.slice(); 
  }

  setGameCountries(filtered); 

  document.getElementById('start-screen').classList.add('hide');
  setTimeout(() => {
    document.getElementById('start-screen').style.display = 'none';
    document.querySelector('main').style.display = 'block';
    setupGameForSelectedOptions();
  }, 230); 
}

export function showStartScreen() {
  document.getElementById('winningStreak').textContent = 0;
  document.querySelector('main').style.display = 'none';
  document.getElementById('start-screen').style.display = 'flex';
  document.getElementById('start-screen').classList.remove('hide');
  document.getElementById('step-language').style.display = '';
  document.getElementById('step-mode').style.display = 'none';
}
