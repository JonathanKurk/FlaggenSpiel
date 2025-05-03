// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  countriesForGame,
  setCurrentCountry,
  language,
  setLanguage,
  winStreaks,
  selectedMode,
  saveWinStreaks,
  userPlatform
} from '../script.js';
import { showFlagListModal } from './flagListModal.js';
import { showStartScreen } from './startScreen.js'; // Import für den Zurück-Button

let flagHideTimer = null;
let blackoutActive = false;
let flagRevealQueued = false;

// Funktion zum Anzeigen des aktuellen Streaks
export function displayCurrentStreak() {
    const streakEl = document.getElementById('winningStreak');
    const streakContainer = document.getElementById('streak-container');
    const currentModeStreak = winStreaks[selectedMode] || 0;

    console.log(`Displaying streak for mode '${selectedMode}': ${currentModeStreak}`);

    if (streakEl) {
        streakEl.textContent = currentModeStreak;
    } else {
        console.warn("Element #winningStreak not found for display.");
    }
    if (streakContainer) {
        if (currentModeStreak > 0) {
            streakContainer.classList.add('has-streak');
        } else {
            streakContainer.classList.remove('has-streak');
        }
    } else {
         console.warn("Element #streak-container not found for class update.");
    }
}

// Setzt alle Event Listener für die UI-Elemente
export function setupUIListeners() {
  console.log("setupUIListeners called");
  document.getElementById('submitBtn').addEventListener('click', checkGuess);
  document.getElementById('nextBtn').addEventListener('click', loadNewFlag);
  document.getElementById('grayscaleToggle').addEventListener('change', applyEffects);
  document.getElementById('glitchToggle').addEventListener('change', applyEffects);
  document.getElementById('pixelateToggle').addEventListener('change', applyEffects);
  document.getElementById('invertToggle').addEventListener('change', applyEffects);
  document.getElementById('languageSelect').addEventListener('change', e => {
    setLanguage(e.target.value);
    updateUI();
    displayCurrentStreak();
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

  // === HIER WURDE ES GEÄNDERT ===
  document.getElementById('backToStartBtn').addEventListener('click', () => {
      console.log("backToStartBtn (from game) clicked");
      // Ruft showStartScreen ohne Argument auf, Standard ist jetzt 'mode'
      showStartScreen();
  });
  // =============================

  // Initialen Streak-Wert anzeigen
  displayCurrentStreak();
}

// Initialisiert das Spiel nach Auswahl des Modus
export function setupGameForSelectedOptions() {
  console.log("setupGameForSelectedOptions called");
  document.getElementById('languageSelect').value = language;
  updateUI();
  displayCurrentStreak();
  loadNewFlag();
}

// Aktualisiert alle Texte der Benutzeroberfläche basierend auf der Sprache
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
  if (flagListTitle) flagListTitle.textContent = i18n[language].flagListTitle;
  document.querySelector('[data-i18n="winStreak"]').textContent = i18n[language].winStreak; // Label
  document.querySelector('[data-i18n="backToStartBtn"]').textContent = i18n[language].backToStartBtn; // Text für den Button im Spiel
  if (window.currentCountry) {
    const name = language === 'de'
      ? (window.currentCountry.translations?.deu?.common || window.currentCountry.name?.common)
      : (window.currentCountry.name?.common || window.currentCountry.translations?.deu?.common);
    const flagEl = document.getElementById('flag');
    if(flagEl) flagEl.alt = i18n[language].flagAlt(name || 'Unbekannt');
  }
}

// Passt das UI basierend auf der Plattform an
export function updateUserInterfaceForPlatform() {
    console.log("Updating UI for platform:", userPlatform);
    const streakContainer = document.getElementById('streak-container');
    const controlsDiv = document.getElementById('controls');
    const quizDiv = document.getElementById('quiz');
    const mainElement = document.querySelector('main');

    if (!streakContainer || !controlsDiv || !quizDiv || !mainElement) {
        console.warn("Cannot update UI for platform: Required elements not found.");
        return;
    }

    if (userPlatform === 'android') {
        document.body.classList.add('platform-android');
        if (streakContainer.parentNode !== quizDiv) {
            console.log("Moving streak container into #quiz for Android layout.");
            quizDiv.appendChild(streakContainer);
        }
    } else {
        document.body.classList.remove('platform-android');
        if (streakContainer.parentNode !== mainElement || streakContainer.nextSibling !== controlsDiv) {
           console.log("Moving streak container back before #controls for PC layout.");
           mainElement.insertBefore(streakContainer, controlsDiv);
        }
    }
    displayCurrentStreak();
}

// Lädt eine neue Flagge und setzt die UI zurück
export function loadNewFlag() {
  console.log("loadNewFlag: Using countriesForGame array with length:", countriesForGame.length);
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

  if (flagContainer) flagContainer.classList.remove('blackout');
  if (flagBlackout) flagBlackout.style.display = 'none';
  if (flagImg) {
      flagImg.style.visibility = 'hidden';
      flagImg.removeAttribute('src');
      flagImg.alt = '';
  }
  if (resultEl) resultEl.textContent = '';
  if (guessInput) {
      guessInput.value = '';
      guessInput.disabled = true;
  }
  if (submitBtn) submitBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  applyEffects();

  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("loadNewFlag: No countries in countriesForGame array!");
    if(resultEl) {
        resultEl.textContent = "Fehler: Keine Länder für diesen Modus verfügbar.";
        resultEl.style.color = 'red';
    }
    return;
  }
  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx];
  setCurrentCountry(country);

  const nameForAlt = language === 'de'
      ? (country.translations?.deu?.common || country.name?.common)
      : (country.name?.common || country.translations?.deu?.common);
  if(flagImg) flagImg.alt = i18n[language].flagAlt(nameForAlt || 'Unbekannt');
  console.log("loadNewFlag: Selected country:", nameForAlt, country.flags?.svg);

  flagRevealQueued = true;
  if(flagImg && country.flags && country.flags.svg) {
    flagImg.onload = function () {
      console.log("loadNewFlag: Flag loaded:", flagImg.src);
      if (flagRevealQueued) {
        flagImg.style.visibility = 'visible';
        if (guessInput) guessInput.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        applyTimerToCurrentFlag();
        flagRevealQueued = false;
      }
      flagImg.onload = null;
      flagImg.onerror = null;
    };
    flagImg.onerror = function() {
        console.error("loadNewFlag: Error loading flag image:", flagImg.src);
        if(resultEl){
            resultEl.textContent = "Fehler beim Laden der Flagge.";
            resultEl.style.color = 'orange';
        }
        flagRevealQueued = false;
        flagImg.onload = null;
        flagImg.onerror = null;
        if(nextBtn) nextBtn.disabled = false;
        setTimeout(loadNewFlag, 1500);
    }
    flagImg.src = country.flags.svg;
  } else {
      console.error("loadNewFlag: Flag image element or flag SVG URL missing.", {flagImgExists: !!flagImg, svgUrl: country?.flags?.svg});
      if(resultEl){
           resultEl.textContent = "Fehler: Flaggenbild konnte nicht initialisiert werden.";
           resultEl.style.color = 'red';
       }
      flagRevealQueued = false;
      if(nextBtn) nextBtn.disabled = false;
  }
}

// Wendet den eingestellten Timer auf die aktuell sichtbare Flagge an
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer);
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    if (!flagImg || !flagContainer || !flagBlackout || !nextBtn) {
        console.warn("applyTimerToCurrentFlag: Flag elements or next button not found.");
        return;
    }
    if (flagImg.style.visibility !== 'visible') {
       console.log("applyTimerToCurrentFlag: Flag not visible yet, timer not started.");
       nextBtn.disabled = false;
       return;
    }

    const timeValue = document.getElementById('timeSelect').value;
    if (timeValue !== "Infinity") {
        console.log(`Applying timer: ${timeValue}s`);
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden';
            nextBtn.disabled = false;
            console.log("Timer finished, flag hidden.");
        }, Number(timeValue) * 1000);
        nextBtn.disabled = true;
    } else {
        console.log("Timer set to Infinity, ensuring flag is visible.");
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        flagImg.style.visibility = 'visible';
        nextBtn.disabled = false;
    }
}

// Überprüft die Benutzereingabe
function checkGuess() {
  clearTimeout(flagHideTimer);

  const guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');
  const winningStreakEl = document.getElementById('winningStreak');

  if (!guessInput || !resultEl || !submitBtn || !nextBtn || !winningStreakEl || !window.currentCountry) {
       console.error("checkGuess: Required elements or currentCountry data missing!");
       if(resultEl) resultEl.textContent = "Interner Fehler!";
       return;
  }

  const input = guessInput.value.trim().toLowerCase();
  const currentCountryData = window.currentCountry;

  const correctDe = currentCountryData.translations?.deu?.common?.toLowerCase();
  const correctEn = currentCountryData.name?.common?.toLowerCase();
  const correct = language === 'de' ? correctDe : correctEn;
  const correctNameForDisplay = language === 'de'
      ? (currentCountryData.translations?.deu?.common || currentCountryData.name?.common)
      : (currentCountryData.name?.common || currentCountryData.translations?.deu?.common);

  let streakIncreased = false;
  const currentModeStreak = winStreaks[selectedMode] || 0;

  if (correct && input === correct) {
    resultEl.textContent = i18n[language].correct;
    resultEl.style.color = 'green';
    winStreaks[selectedMode] = currentModeStreak + 1;
    saveWinStreaks();
    streakIncreased = true;
    console.log(`Correct guess! Streak for ${selectedMode} is now ${winStreaks[selectedMode]}`);
  } else {
    resultEl.textContent = i18n[language].wrong(correctNameForDisplay || 'Unbekannt');
    resultEl.style.color = 'red';
    if (currentModeStreak > 0) {
       winStreaks[selectedMode] = 0;
       saveWinStreaks();
       console.log(`Wrong guess! Streak for ${selectedMode} reset to 0`);
    }
  }

  displayCurrentStreak();
  if (streakIncreased && (winStreaks[selectedMode] || 0) > 0) {
      winningStreakEl.classList.add('streak-pulse');
      setTimeout(() => {
          winningStreakEl.classList.remove('streak-pulse');
      }, 400);
  }

  const flagContainerEl = document.getElementById('flag-container');
  const flagBlackoutEl = document.getElementById('flag-blackout');
  const flagImgEl = document.getElementById('flag');
  if (blackoutActive && flagContainerEl && flagBlackoutEl && flagImgEl) {
    flagContainerEl.classList.remove('blackout');
    flagBlackoutEl.style.display = 'none';
    flagImgEl.style.visibility = 'visible';
    blackoutActive = false;
    console.log("Revealed flag after guess.");
  }

  submitBtn.disabled = true;
  guessInput.disabled = true;
  nextBtn.disabled = false;

   const autoNextTimeout = setTimeout(() => {
      const currentResultEl = document.getElementById('result');
      if (currentResultEl && currentResultEl.textContent !== '') {
          console.log("Auto-loading next flag.");
          loadNewFlag();
      } else {
          console.log("Auto-next cancelled, result cleared or element gone.");
      }
  }, 2000);

  // WICHTIG: Der onclick muss immer neu gesetzt werden, da loadNewFlag den Button-Status ändert
  // Besser: Einen persistenten Listener in setupUIListeners verwenden und dort den Timeout löschen
  // Für jetzt lassen wir es so, aber es ist nicht ideal.
  const nextBtnClickHandler = () => {
      clearTimeout(autoNextTimeout);
      loadNewFlag();
      nextBtn.removeEventListener('click', nextBtnClickHandler); // Listener entfernen nach Klick
  };
  nextBtn.addEventListener('click', nextBtnClickHandler);

}

// Wendet die visuellen Effekte an
function applyEffects() {
  const ctr = document.getElementById('flag-container');
  if (!ctr) return;
  const effects = {
      grayscale: document.getElementById('grayscaleToggle')?.checked,
      invert: document.getElementById('invertToggle')?.checked,
      pixelate: document.getElementById('pixelateToggle')?.checked,
      glitch: document.getElementById('glitchToggle')?.checked
  };
  Object.keys(effects).forEach(effect => {
      if (effects[effect]) {
          ctr.classList.add(effect);
      } else {
          ctr.classList.remove(effect);
      }
  });
}

// --- END OF FILE ui/gameUI.js ---
