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
    // Wenn die Flaggenliste gerade offen ist, aktualisiere ihren Inhalt
    const flagListModal = document.getElementById('flag-list-modal');
    if (flagListModal && flagListModal.style.display === 'block') {
      import('./flagListModal.js').then(mod => {
        mod.fillFlagListContent();
        setTimeout(mod.initFlagListHover, 0); // Re-initialize hover after filling
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

  document.getElementById('backToStartBtn').addEventListener('click', () => {
      console.log("backToStartBtn (from game) clicked");
      // Ruft showStartScreen ohne Argument auf, Standard ist jetzt 'mode'
      showStartScreen();
  });

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
    const body = document.body;

    if (userPlatform === 'android') {
        body.classList.add('platform-android');
    } else {
        body.classList.remove('platform-android');
    }

    // Streak container position is now handled purely by CSS via the platform-android class
    // The JS logic to move it relative to #controls is no longer needed or correct.

    // Ensure streak display is updated after potential style changes
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

  if (!flagContainer || !flagBlackout || !flagImg || !guessInput || !resultEl || !submitBtn || !nextBtn) {
      console.error("loadNewFlag: One or more required game UI elements not found.");
      if(resultEl) {
          resultEl.textContent = "Fehler: UI-Elemente fehlen.";
          resultEl.style.color = 'red';
      }
      if(nextBtn) nextBtn.disabled = false; // Allow retrying
      return;
  }


  flagContainer.classList.remove('blackout');
  flagBlackout.style.display = 'none';

  // Temporarily hide flag and reset src/alt
  flagImg.style.visibility = 'hidden';
  flagImg.removeAttribute('src');
  flagImg.alt = '';

  resultEl.textContent = '';
  guessInput.value = '';
  guessInput.disabled = true;
  submitBtn.disabled = true;
  nextBtn.disabled = true;

  applyEffects(); // Apply effects immediately even before flag source is set

  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("loadNewFlag: No countries in countriesForGame array!");
    resultEl.textContent = "Fehler: Keine Länder für diesen Modus verfügbar.";
    resultEl.style.color = 'red';
    nextBtn.disabled = false;
    return;
  }
  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx];
  setCurrentCountry(country);

  const nameForAlt = language === 'de'
      ? (country.translations?.deu?.common || country.name?.common)
      : (country.name?.common || country.translations?.deu?.common);
  flagImg.alt = i18n[language].flagAlt(nameForAlt || 'Unbekannt');
  console.log("loadNewFlag: Selected country:", nameForAlt, country.flags?.svg);

  flagRevealQueued = true; // Indicate that flag should be revealed on load

  if(country.flags?.svg) {
    flagImg.onload = function () {
      console.log("loadNewFlag: Flag loaded successfully:", flagImg.src);
      if (flagRevealQueued) { // Check if still intended to reveal this flag
        flagImg.style.visibility = 'visible';
        guessInput.disabled = false;
        submitBtn.disabled = false;
        applyTimerToCurrentFlag(); // Start timer only after flag is visible
        flagRevealQueued = false;
      }
      flagImg.onload = null; // Clean up listener
      flagImg.onerror = null; // Clean up listener
    };
    flagImg.onerror = function() {
        console.error("loadNewFlag: Error loading flag image:", flagImg.src);
        resultEl.textContent = "Fehler beim Laden der Flagge.";
        resultEl.style.color = 'orange';
        flagRevealQueued = false; // Cancel reveal
        flagImg.onload = null;
        flagImg.onerror = null;
        nextBtn.disabled = false; // Allow user to try next
        // Optionally auto-load next after a short delay
        setTimeout(loadNewFlag, 1500);
    }
    flagImg.src = country.flags.svg;
  } else {
      console.error("loadNewFlag: Flag SVG URL missing for country:", country);
      resultEl.textContent = "Fehler: Flaggenbild-URL fehlt.";
      resultEl.style.color = 'red';
      flagRevealQueued = false; // Cancel reveal
      nextBtn.disabled = false; // Allow user to try next
  }
}

// Wendet den eingestellten Timer auf die aktuell sichtbare Flagge an
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer);
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn'); // Need submitBtn to re-enable

    if (!flagImg || !flagContainer || !flagBlackout || !nextBtn || !submitBtn) {
        console.warn("applyTimerToCurrentFlag: Required flag/button elements not found.");
        return;
    }

    const timeSelect = document.getElementById('timeSelect');
    if (!timeSelect) {
        console.warn("applyTimerToCurrentFlag: timeSelect element not found.");
        nextBtn.disabled = false;
        return;
    }

    // Only apply timer if flag is currently visible (prevents timer on error state)
    if (flagImg.style.visibility !== 'visible' || blackoutActive) {
       console.log("applyTimerToCurrentFlag: Flag not visible or already blacked out, timer not applied.");
       nextBtn.disabled = false; // Ensure next is enabled if no timer starts
       return;
    }


    const timeValue = timeSelect.value;
    if (timeValue !== "Infinity") {
        console.log(`Applying timer: ${timeValue}s`);
        nextBtn.disabled = true; // Disable next while timer is active
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden';
            nextBtn.disabled = false; // Re-enable next after blackout
            submitBtn.disabled = true; // Disable submit after blackout
            document.getElementById('guessInput').disabled = true; // Disable input
            console.log("Timer finished, flag hidden. Submit/Input disabled, Next enabled.");
        }, Number(timeValue) * 1000);
    } else {
        console.log("Timer set to Infinity, ensuring flag is visible.");
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        flagImg.style.visibility = 'visible';
        nextBtn.disabled = false; // Ensure next is enabled when no timer is active
    }
}


// Überprüft die Benutzereingabe
function checkGuess() {
  clearTimeout(flagHideTimer); // Timer stoppen, falls er läuft

  const guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');
  const winningStreakEl = document.getElementById('winningStreak');
  const flagContainerEl = document.getElementById('flag-container');
  const flagBlackoutEl = document.getElementById('flag-blackout');
  const flagImgEl = document.getElementById('flag');


  if (!guessInput || !resultEl || !submitBtn || !nextBtn || !winningStreakEl || !window.currentCountry || !flagContainerEl || !flagBlackoutEl || !flagImgEl) {
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

  displayCurrentStreak(); // Always update displayed streak
  if (streakIncreased && (winStreaks[selectedMode] || 0) > 0) {
      winningStreakEl.classList.add('streak-pulse');
      // Remove pulse class after animation ends
      winningStreakEl.addEventListener('animationend', function handler() {
          winningStreakEl.classList.remove('streak-pulse');
          winningStreakEl.removeEventListener('animationend', handler);
      });
  }

  // Reveal flag if it was blacked out
  if (blackoutActive) {
    flagContainerEl.classList.remove('blackout');
    flagBlackoutEl.style.display = 'none';
    flagImgEl.style.visibility = 'visible';
    blackoutActive = false;
    console.log("Revealed flag after guess.");
  }

  // Disable input and submit button
  submitBtn.disabled = true;
  guessInput.disabled = true;

  // Enable next button
  nextBtn.disabled = false;

  // Set auto-next timer
   const autoNextTimeout = setTimeout(() => {
       // Check if the result message is still the one we just set
       // This prevents auto-next if the user quickly clicked "Next" manually
       // or if a new flag was loaded for some reason.
      const currentResultEl = document.getElementById('result');
      if (currentResultEl && currentResultEl.textContent === resultEl.textContent) {
          console.log("Auto-loading next flag after guess.");
          loadNewFlag();
      } else {
          console.log("Auto-next cancelled (result changed or element missing).");
      }
  }, 2000); // Auto-load next flag after 2 seconds

  // Ensure the manual "Next" button click cancels the auto-next timer
  // We add a temporary listener that cleans itself up
  const nextBtnClickHandler = () => {
      clearTimeout(autoNextTimeout); // Cancel auto-next
      console.log("Manual 'Next' button clicked, auto-next cancelled.");
      loadNewFlag(); // Load next flag manually
      nextBtn.removeEventListener('click', nextBtnClickHandler); // Remove this temporary listener
  };
  // Add the temporary listener only if the Next button isn't already set up by loadNewFlag
  // (loadNewFlag enables and adds the permanent listener, checkGuess re-enables it and adds temp listener)
  // A cleaner approach is to handle the permanent listener in setupUIListeners and just clear the timeout here.
  // Let's stick to the provided pattern for now but note this could be refactored.
   // Remove any existing temporary listener to avoid duplicates
   const oldHandler = nextBtn.onclick; // This pattern isn't ideal, better use addEventListener with named function or check
   if (oldHandler && oldHandler._isTempCheckGuessHandler) {
        nextBtn.removeEventListener('click', oldHandler);
   }
   nextBtn.addEventListener('click', nextBtnClickHandler);
   // Mark the listener so we can potentially remove it later if needed (though better refactoring exists)
   nextBtnClickHandler._isTempCheckGuessHandler = true;
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
  // Ensure all classes are removed first to apply correct combination
  ctr.classList.remove('grayscale', 'invert', 'pixelate', 'glitch');

  // Add classes based on checked state
  if (effects.grayscale) ctr.classList.add('grayscale');
  if (effects.invert) ctr.classList.add('invert');
  if (effects.pixelate) ctr.classList.add('pixelate');
  if (effects.glitch) ctr.classList.add('glitch');
}
