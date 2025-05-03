// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  countriesForGame,
  setCurrentCountry,
  language,
  setLanguage,
  // === GEÄNDERT: Importiere winStreaks und selectedMode statt currentStreak ===
  winStreaks,
  selectedMode,
  saveWinStreaks, // Funktion zum Speichern importieren
  // === === === === === === === === === === === === === === === === === === ===
  userPlatform
} from '../script.js';
import { showFlagListModal } from './flagListModal.js';
import { showStartScreen } from './startScreen.js';

let flagHideTimer = null;
let blackoutActive = false;
let flagRevealQueued = false;

// --- NEU: Funktion zum Anzeigen des aktuellen Streaks ---
export function displayCurrentStreak() {
    const streakEl = document.getElementById('winningStreak');
    const streakContainer = document.getElementById('streak-container');
    const currentModeStreak = winStreaks[selectedMode] || 0; // Hole Streak für aktuellen Modus

    console.log(`Displaying streak for mode '${selectedMode}': ${currentModeStreak}`); // Debug Log

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
// --- Ende neue Funktion ---


// Setzt alle Event Listener für die UI-Elemente
export function setupUIListeners() {
  console.log("setupUIListeners called"); // Debug Log
  document.getElementById('submitBtn').addEventListener('click', checkGuess);
  document.getElementById('nextBtn').addEventListener('click', loadNewFlag);
  document.getElementById('grayscaleToggle').addEventListener('change', applyEffects);
  document.getElementById('glitchToggle').addEventListener('change', applyEffects);
  document.getElementById('pixelateToggle').addEventListener('change', applyEffects);
  document.getElementById('invertToggle').addEventListener('change', applyEffects);
  document.getElementById('languageSelect').addEventListener('change', e => {
    setLanguage(e.target.value);
    updateUI(); // UI-Texte aktualisieren
    displayCurrentStreak(); // Streak neu anzeigen (Sprache ändert sich nicht, aber zur Sicherheit)
    // Flaggenliste aktualisieren, falls offen
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

  // Initialen Streak-Wert anzeigen (für den beim Start ausgewählten Modus)
  displayCurrentStreak();
}

// Initialisiert das Spiel nach Auswahl des Modus
export function setupGameForSelectedOptions() {
  console.log("setupGameForSelectedOptions called"); // Debug Log
  document.getElementById('languageSelect').value = language;
  updateUI();
  displayCurrentStreak(); // Wichtig: Zeige den Streak für den *jetzt* ausgewählten Modus
  loadNewFlag(); // Lädt die erste Flagge
}

// Aktualisiert alle Texte der Benutzeroberfläche basierend auf der Sprache
export function updateUI() {
  // console.log("updateUI called"); // Kann sehr gesprächig sein
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
  document.querySelector('[data-i18n="backToStartBtn"]').textContent = i18n[language].backToStartBtn;
  // Aktualisiert den Alt-Text, wenn eine Flagge angezeigt wird
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
    // Stelle sicher, dass der Streak-Wert korrekt angezeigt wird
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

  // UI-Reset
  if (flagContainer) flagContainer.classList.remove('blackout');
  if (flagBlackout) flagBlackout.style.display = 'none';
  if (flagImg) {
      flagImg.style.visibility = 'hidden';
      flagImg.removeAttribute('src'); // Wichtig: src entfernen, um "broken image" zu vermeiden
      flagImg.alt = ''; // Alt-Text leeren bis neu gesetzt
  }
  if (resultEl) resultEl.textContent = '';
  if (guessInput) {
      guessInput.value = '';
      guessInput.disabled = true;
  }
  if (submitBtn) submitBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  applyEffects(); // Effekte zurücksetzen/anwenden

  // Land auswählen
  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("loadNewFlag: No countries in countriesForGame array!");
    if(resultEl) {
        resultEl.textContent = "Fehler: Keine Länder für diesen Modus verfügbar.";
        resultEl.style.color = 'red';
    }
    // TODO: Maybe show start screen again?
    return;
  }
  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx];
  setCurrentCountry(country); // Setzt globalen State in script.js
  // window.currentCountry = country; // Alias beibehalten (optional)

  // Namen für Alt-Text
  const nameForAlt = language === 'de'
      ? (country.translations?.deu?.common || country.name?.common)
      : (country.name?.common || country.translations?.deu?.common);
  if(flagImg) flagImg.alt = i18n[language].flagAlt(nameForAlt || 'Unbekannt');
  console.log("loadNewFlag: Selected country:", nameForAlt, country.flags?.svg);

  // Flagge laden
  flagRevealQueued = true;
  if(flagImg && country.flags && country.flags.svg) {
    flagImg.onload = function () {
      console.log("loadNewFlag: Flag loaded:", flagImg.src);
      if (flagRevealQueued) { // Nur fortfahren, wenn dies noch die erwartete Flagge ist
        flagImg.style.visibility = 'visible';
        if (guessInput) guessInput.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        applyTimerToCurrentFlag();
        flagRevealQueued = false;
        // Kein Fokus hier, User soll selbst entscheiden
      }
      flagImg.onload = null; // Listener entfernen
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
        // Nächste Flagge versuchen nach kurzer Pause
        if(nextBtn) nextBtn.disabled = false; // Erlaube manuelle Weitergabe
        setTimeout(loadNewFlag, 1500);
    }
    // Setze die Quelle, um Laden auszulösen
    flagImg.src = country.flags.svg;

  } else {
      console.error("loadNewFlag: Flag image element or flag SVG URL missing.", {flagImgExists: !!flagImg, svgUrl: country?.flags?.svg});
      if(resultEl){
           resultEl.textContent = "Fehler: Flaggenbild konnte nicht initialisiert werden.";
           resultEl.style.color = 'red';
       }
      flagRevealQueued = false;
      if(nextBtn) nextBtn.disabled = false; // Erlaube manuelle Weitergabe
      // Evtl. automatisch nächste Flagge laden?
      // setTimeout(loadNewFlag, 1500);
  }
}


// Wendet den eingestellten Timer auf die aktuell sichtbare Flagge an
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer);
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    // Elemente prüfen
    if (!flagImg || !flagContainer || !flagBlackout || !nextBtn) {
        console.warn("applyTimerToCurrentFlag: Flag elements or next button not found.");
        return;
    }
    // Prüfen, ob die Flagge überhaupt sichtbar ist (relevant falls loadNewFlag gerade läuft)
    if (flagImg.style.visibility !== 'visible') {
       console.log("applyTimerToCurrentFlag: Flag not visible yet, timer not started.");
       nextBtn.disabled = false; // Nächste-Button sollte nutzbar sein
       return;
    }

    const timeValue = document.getElementById('timeSelect').value;
    if (timeValue !== "Infinity") {
        console.log(`Applying timer: ${timeValue}s`); // Debug Log
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden';
            nextBtn.disabled = false; // Nächste Flagge kann jetzt geladen werden
            console.log("Timer finished, flag hidden."); // Debug Log
        }, Number(timeValue) * 1000);
        nextBtn.disabled = true; // Während Timer läuft, nicht zur nächsten Flagge
    } else {
        // Timer ist "Unendlich", stelle sicher, dass Flagge sichtbar ist
        console.log("Timer set to Infinity, ensuring flag is visible."); // Debug Log
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        flagImg.style.visibility = 'visible'; // Redundant, aber sicher
        nextBtn.disabled = false; // Nächste Flagge kann geladen werden
    }
}


// Überprüft die Benutzereingabe
function checkGuess() {
  clearTimeout(flagHideTimer);

  const guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');
  const winningStreakEl = document.getElementById('winningStreak'); // Nur das Element

  // Prüfen, ob Elemente vorhanden sind
  if (!guessInput || !resultEl || !submitBtn || !nextBtn || !winningStreakEl || !window.currentCountry) {
       console.error("checkGuess: Required elements or currentCountry data missing!");
       if(resultEl) resultEl.textContent = "Interner Fehler!";
       return;
  }

  const input = guessInput.value.trim().toLowerCase();
  const currentCountryData = window.currentCountry;

  // Namen ermitteln
  const correctDe = currentCountryData.translations?.deu?.common?.toLowerCase();
  const correctEn = currentCountryData.name?.common?.toLowerCase();
  const correct = language === 'de' ? correctDe : correctEn;
  const correctNameForDisplay = language === 'de'
      ? (currentCountryData.translations?.deu?.common || currentCountryData.name?.common)
      : (currentCountryData.name?.common || currentCountryData.translations?.deu?.common);

  // --- Streak Logik (angepasst) ---
  let streakIncreased = false;
  const currentModeStreak = winStreaks[selectedMode] || 0; // Aktuellen Streak holen

  if (correct && input === correct) {
    resultEl.textContent = i18n[language].correct;
    resultEl.style.color = 'green';
    // Streak im Objekt erhöhen und speichern
    winStreaks[selectedMode] = currentModeStreak + 1;
    saveWinStreaks();
    streakIncreased = true;
    console.log(`Correct guess! Streak for ${selectedMode} is now ${winStreaks[selectedMode]}`); // Debug
  } else {
    resultEl.textContent = i18n[language].wrong(correctNameForDisplay || 'Unbekannt');
    resultEl.style.color = 'red';
    // Streak im Objekt zurücksetzen und speichern
    if (currentModeStreak > 0) { // Nur loggen/speichern wenn nötig
       winStreaks[selectedMode] = 0;
       saveWinStreaks();
       console.log(`Wrong guess! Streak for ${selectedMode} reset to 0`); // Debug
    }
  }

  // Update der Anzeige und Animation für den Streak
  displayCurrentStreak(); // Aktualisiert Zahl und Klasse
  if (streakIncreased && (winStreaks[selectedMode] || 0) > 0) { // Nur animieren, wenn erhöht UND > 0
      winningStreakEl.classList.add('streak-pulse');
      setTimeout(() => {
          winningStreakEl.classList.remove('streak-pulse');
      }, 400);
  }
  // --- Ende Streak Logik ---

  // Flagge wieder anzeigen, falls versteckt
  const flagContainerEl = document.getElementById('flag-container');
  const flagBlackoutEl = document.getElementById('flag-blackout');
  const flagImgEl = document.getElementById('flag');
  if (blackoutActive && flagContainerEl && flagBlackoutEl && flagImgEl) {
    flagContainerEl.classList.remove('blackout');
    flagBlackoutEl.style.display = 'none';
    flagImgEl.style.visibility = 'visible';
    blackoutActive = false;
    console.log("Revealed flag after guess."); // Debug Log
  }

  // UI für nächste Runde
  submitBtn.disabled = true;
  guessInput.disabled = true;
  nextBtn.disabled = false;
  // Kein Fokus auf Next-Button

  // Optional: Automatisch nächste Flagge
   const autoNextTimeout = setTimeout(() => {
      // Erneutes Holen des Elements, falls es inzwischen entfernt wurde
      const currentResultEl = document.getElementById('result');
      if (currentResultEl && currentResultEl.textContent !== '') { // Nur wenn noch eine Antwort angezeigt wird
          console.log("Auto-loading next flag."); // Debug Log
          loadNewFlag();
      } else {
          console.log("Auto-next cancelled, result cleared or element gone."); // Debug Log
      }
  }, 2000); // 2 Sekunden warten

  // Wenn User manuell auf "Next" klickt, Auto-Next abbrechen
  nextBtn.onclick = () => {
      clearTimeout(autoNextTimeout);
      loadNewFlag();
      nextBtn.onclick = null; // Listener wieder entfernen
  };
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
  // Klassen basierend auf den Checkboxen setzen/entfernen
  Object.keys(effects).forEach(effect => {
      if (effects[effect]) {
          ctr.classList.add(effect);
      } else {
          ctr.classList.remove(effect);
      }
  });
   // console.log("Applied effects:", effects); // Debug Log
}

// --- END OF FILE ui/gameUI.js ---
