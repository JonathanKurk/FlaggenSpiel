import { i18n } from '../utils/i18n.js';
import {
  countries,
  countriesForGame,
  setCountriesForGame, 
  setCurrentCountry,
  language,
  setLanguage,
  currentStreak,
  setCurrentStreak,
} from '../script.js';
import { showFlagListModal } from './flagListModal.js';
import { showStartScreen } from './startScreen.js';

let flagHideTimer = null;
let blackoutActive = false;
let flagRevealQueued = false;

export function setupUIListeners() {
  document.getElementById('submitBtn').addEventListener('click', checkGuess);
  document.getElementById('nextBtn').addEventListener('click', loadNewFlag);
  document.getElementById('grayscaleToggle').addEventListener('change', applyEffects);
  document.getElementById('glitchToggle').addEventListener('change', applyEffects);
  document.getElementById('pixelateToggle').addEventListener('change', applyEffects);
  document.getElementById('invertToggle').addEventListener('change', applyEffects);
  document.getElementById('languageSelect').addEventListener('change', e => {
    setLanguage(e.target.value);
    updateUI();
    if (document.getElementById('flag-list-modal').style.display === 'block') {
      import('./flagListModal.js').then(mod => {
        mod.fillFlagListContent();
        setTimeout(mod.initFlagListHover, 0);
      });
    }
  });
  document.getElementById('timeSelect').addEventListener('change', loadNewFlag);
  document.getElementById('guessInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !document.getElementById('submitBtn').disabled) {
      e.preventDefault();
      checkGuess();
    }
  });
  const showBtn = document.getElementById('showFlagListBtn');
  if (showBtn) showBtn.addEventListener('click', showFlagListModal);
  const closeBtn = document.getElementById('closeFlagList');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    document.getElementById('flag-list-modal').style.display = 'none';
  });
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', () => {
    document.getElementById('flag-list-modal').style.display = 'none';
  });

  document.getElementById('backToStartBtn').addEventListener('click', showStartScreen);

  document.getElementById('winningStreak').textContent = currentStreak;
}

export function setupGameForSelectedOptions() {
  document.getElementById('languageSelect').value = language;
  updateUI();
  loadNewFlag();
}

export function updateUI() {
  document.documentElement.lang = language;
  document.querySelector('h1[data-i18n="title"]').textContent = i18n[language].title;
  document.getElementById('guessInput').placeholder = i18n[language].placeholder;
  document.querySelector('[data-i18n="grayscaleLabel"]').textContent = i18n[language].grayscaleLabel;
  document.querySelector('[data-i18n="glitchLabel"]').textContent = i18n[language].glitchLabel;
  document.querySelector('[data-i18n="pixelateLabel"]').textContent = i18n[language].pixelateLabel;
  document.querySelector('[data-i18n="invertLabel"]').textContent = i18n[language].invertLabel;
  document.querySelector('[data-i18n="checkBtn"]').textContent = i18n[language].checkBtn;
  document.querySelector('[data-i18n="nextBtn"]').textContent = i18n[language].nextBtn;
  document.querySelector('[data-i18n="flagListBtn"]').textContent = i18n[language].flagListBtn;
  document.querySelector('[data-i18n="timeLabel"]').textContent = i18n[language].timeLabel;
  document.querySelector('[data-i18n="flagListTitle"]').textContent = i18n[language].flagListTitle;
  document.querySelector('[data-i18n="winStreak"]').textContent = i18n[language].winStreak;
  document.querySelector('[data-i18n="backToStartBtn"]').textContent = i18n[language].backToStartBtn;
  if (window.currentCountry) {
    const name = language === 'de'
      ? window.currentCountry.translations.deu.common
      : window.currentCountry.name.common;
    document.getElementById('flag').alt = i18n[language].flagAlt(name);
  }
}

export function loadNewFlag() {
  blackoutActive = false;
  flagRevealQueued = false; 
  clearTimeout(flagHideTimer);
  document.getElementById('flag-container').classList.remove('blackout');
  document.getElementById('flag-blackout').style.display = 'none';
  const flagImg = document.getElementById('flag');
  flagImg.style.visibility = 'hidden';
  flagImg.removeAttribute('src');

  let gameCountries = countriesForGame;
  if (!gameCountries || !gameCountries.length) {
    console.warn("countriesForGame is empty in loadNewFlag. Defaulting to all countries.");
    gameCountries = countries.slice();
    if (!gameCountries || !gameCountries.length) {
        console.error("FATAL: No countries available at all.");
        document.getElementById('result').textContent = "Error: No countries loaded.";
        return; 
    }
  }

  const idx = Math.floor(Math.random() * gameCountries.length);
  const country = gameCountries[idx];
  setCurrentCountry(country);
  window.currentCountry = country; 

  const name = language === 'de'
    ? country.translations.deu.common
    : country.name.common;
  flagImg.alt = i18n[language].flagAlt(name);

  const guessInput = document.getElementById('guessInput');
  document.getElementById('result').textContent = '';
  guessInput.value = '';
  applyEffects(); 
  guessInput.disabled = false;
  document.getElementById('submitBtn').disabled = false;
  document.getElementById('nextBtn').disabled = true; 

  flagRevealQueued = true;
  flagImg.onload = function () {
    if (flagRevealQueued) { 
      flagImg.style.visibility = 'visible';
      const t = document.getElementById('timeSelect').value;
      if (t !== "Infinity") {
        flagHideTimer = setTimeout(() => {
          blackoutActive = true;
          document.getElementById('flag-container').classList.add('blackout');
          document.getElementById('flag-blackout').style.display = 'block';
          flagImg.style.visibility = 'hidden';
          guessInput.disabled = false;
          document.getElementById('submitBtn').disabled = false;
          document.getElementById('nextBtn').disabled = false; 
        }, Number(t) * 1000);
      } else {
        document.getElementById('flag-container').classList.remove('blackout');
        document.getElementById('flag-blackout').style.display = 'none';
        flagImg.style.visibility = 'visible';
        document.getElementById('nextBtn').disabled = false; 
      }
      flagRevealQueued = false; 
      guessInput.focus();
    }
    flagImg.onload = null; 
  };
  flagImg.onerror = function() {
      console.error("Error loading flag image:", country.flags.svg);
      document.getElementById('result').textContent = "Error loading flag. Skipping.";
      flagRevealQueued = false;
      flagImg.onload = null;
      flagImg.onerror = null;
      setTimeout(loadNewFlag, 1500); 
  }
  flagImg.src = country.flags.svg;
}

function checkGuess() {
  const input = document.getElementById('guessInput').value.trim().toLowerCase();
  const correct = (language === 'de'
    ? window.currentCountry.translations.deu.common
    : window.currentCountry.name.common
  ).toLowerCase();

  const resultEl = document.getElementById('result');
  if (input === correct) {
    resultEl.textContent = i18n[language].correct;
    resultEl.style.color = 'green';
    setCurrentStreak(currentStreak + 1);
    document.getElementById('winningStreak').textContent = currentStreak;
  } else {
    const correctName = language === 'de'
      ? window.currentCountry.translations.deu.common
      : window.currentCountry.name.common;
    resultEl.textContent = i18n[language].wrong(correctName);
    resultEl.style.color = 'red';
    setCurrentStreak(0); 
    document.getElementById('winningStreak').textContent = 0;
  }

  clearTimeout(flagHideTimer);
  if (blackoutActive) {
    document.getElementById('flag-container').classList.remove('blackout');
    document.getElementById('flag-blackout').style.display = 'none';
    document.getElementById('flag').style.visibility = 'visible';
    blackoutActive = false;
  }


  document.getElementById('submitBtn').disabled = true;
  document.getElementById('guessInput').disabled = true;
  document.getElementById('nextBtn').disabled = false; 
  document.getElementById('nextBtn').focus(); 

  setTimeout(() => {
      if (document.getElementById('result').textContent !== '') {
          loadNewFlag();
      }
  }, 2000); 
}

function applyEffects() {
  const ctr = document.getElementById('flag-container');
  ctr.classList.remove('grayscale', 'glitch', 'pixelate', 'invert');
  if (document.getElementById('grayscaleToggle').checked) ctr.classList.add('grayscale');
  if (document.getElementById('invertToggle').checked) ctr.classList.add('invert');
  if (document.getElementById('pixelateToggle').checked) ctr.classList.add('pixelate');
  if (document.getElementById('glitchToggle').checked) ctr.classList.add('glitch');
}