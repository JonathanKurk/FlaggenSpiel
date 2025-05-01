// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  countriesForGame,
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
  document.getElementById('timeSelect').addEventListener('change', () => {
    if (window.currentCountry && !document.getElementById('submitBtn').disabled) {
       applyTimerToCurrentFlag();
    }
  });
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
  const flagListTitle = document.querySelector('[data-i18n="flagListTitle"]');
   if(flagListTitle) flagListTitle.textContent = i18n[language].flagListTitle;
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
  console.log("loadNewFlag called. Using countriesForGame with length:", countriesForGame.length);
  blackoutActive = false;
  flagRevealQueued = false;
  clearTimeout(flagHideTimer);

  const flagContainer = document.getElementById('flag-container');
  const flagBlackout = document.getElementById('flag-blackout');
  const flagImg = document.getElementById('flag');
  const guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');

  flagContainer.classList.remove('blackout');
  flagBlackout.style.display = 'none';
  flagImg.style.visibility = 'hidden';
  flagImg.removeAttribute('src');
  resultEl.textContent = '';
  guessInput.value = '';
  guessInput.disabled = true;
  submitBtn.disabled = true;
  nextBtn.disabled = true;
  applyEffects();

  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("FATAL: No countries available in local countriesForGame array.");
    resultEl.textContent = "Fehler: Keine Länderdaten lokal verfügbar. Bitte online starten.";
    resultEl.style.color = 'red';
    return;
  }

  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx];
  setCurrentCountry(country);
  window.currentCountry = country;

  const name = language === 'de'
    ? country.translations.deu.common
    : country.name.common;
  flagImg.alt = i18n[language].flagAlt(name);
  console.log("Selected country:", name, country.flags.svg);

  flagRevealQueued = true;

  flagImg.onload = function () {
    console.log("Flag loaded:", flagImg.src);
    if (flagRevealQueued) {
      flagImg.style.visibility = 'visible';
      guessInput.disabled = false;
      submitBtn.disabled = false;
      applyTimerToCurrentFlag();
      flagRevealQueued = false;
    }
    flagImg.onload = null;
  };

  flagImg.onerror = function() {
    console.error("Error loading flag image:", country.flags.svg);
    resultEl.textContent = "Fehler beim Laden der Flagge. Überspringe.";
    resultEl.style.color = 'orange';
    flagRevealQueued = false;
    flagImg.onload = null;
    flagImg.onerror = null;
    setTimeout(loadNewFlag, 1500);
  }

  if (country.flags && country.flags.svg) {
    flagImg.src = country.flags.svg;
  } else {
    console.error("Missing flag SVG URL for country:", country.name.common);
    resultEl.textContent = "Fehler: Flaggen-URL fehlt. Überspringe.";
    resultEl.style.color = 'red';
    setTimeout(loadNewFlag, 1500);
  }

  // 🔽 Wichtig: Fokus aktiv entfernen (Browser-Autofokus verhindern)
  document.activeElement?.blur();
}


function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer);
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    if (flagImg.style.visibility !== 'visible') {
       nextBtn.disabled = false;
       return;
    }

    const t = document.getElementById('timeSelect').value;
    if (t !== "Infinity") {
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden';
            nextBtn.disabled = false;
        }, Number(t) * 1000);
         nextBtn.disabled = true;
    } else {
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        flagImg.style.visibility = 'visible';
        nextBtn.disabled = false;
    }
}

function checkGuess() {
  clearTimeout(flagHideTimer);

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

  if (blackoutActive) {
    document.getElementById('flag-container').classList.remove('blackout');
    document.getElementById('flag-blackout').style.display = 'none';
    document.getElementById('flag').style.visibility = 'visible';
    blackoutActive = false;
  }

  document.getElementById('submitBtn').disabled = true;
  document.getElementById('guessInput').disabled = true;
  document.getElementById('nextBtn').disabled = false;
  // Kein focus() mehr auf dem Next-Button

  setTimeout(() => {
     if (resultEl.textContent !== '') {
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

// --- END OF FILE ui/gameUI.js ---
