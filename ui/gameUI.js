// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  countriesForGame, // Unsere lokale Datenquelle
  setCurrentCountry,
  language,
  setLanguage,
  currentStreak,
  setCurrentStreak,
  userPlatform // Importiere Plattform-Variable
} from '../script.js';
import { showFlagListModal } from './flagListModal.js';
import { showStartScreen } from './startScreen.js';

let flagHideTimer = null;
let blackoutActive = false;
let flagRevealQueued = false;

// Setzt alle Event Listener für die UI-Elemente
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
    // Wendet den Timer auf die aktuell angezeigte Flagge an, wenn das Raten läuft
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

  // Initialen Streak-Wert setzen (wird auch in updateUserInterfaceForPlatform gemacht)
  const streakEl = document.getElementById('winningStreak');
  if (streakEl) streakEl.textContent = currentStreak;
   const streakContainer = document.getElementById('streak-container');
   if (streakContainer) {
        if (currentStreak > 0) streakContainer.classList.add('has-streak');
        else streakContainer.classList.remove('has-streak');
   }
}

// Initialisiert das Spiel nach Auswahl des Modus
export function setupGameForSelectedOptions() {
  document.getElementById('languageSelect').value = language;
  updateUI();
  loadNewFlag(); // Lädt die erste Flagge
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
  document.querySelector('[data-i18n="winStreak"]').textContent = i18n[language].winStreak;
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

// ---- NEU/ANGEPASST: Passt das UI basierend auf der Plattform an ----
export function updateUserInterfaceForPlatform() {
    console.log("Updating UI for platform:", userPlatform);
    const streakContainer = document.getElementById('streak-container');
    const controlsDiv = document.getElementById('controls'); // Wo es im PC Layout VOR steht
    const quizDiv = document.getElementById('quiz'); // Wo es im Android Layout ANS ENDE kommt
    const mainElement = document.querySelector('main'); // Eltern-Element im PC Layout

    if (!streakContainer || !controlsDiv || !quizDiv || !mainElement) {
        console.warn("Cannot update UI for platform: Required elements not found.");
        return;
    }

    // Setze Klasse am Body für CSS-Regeln
    if (userPlatform === 'android') {
        document.body.classList.add('platform-android');
        // Verschiebe den Streak-Container ANS ENDE des #quiz Divs
        if (streakContainer.parentNode !== quizDiv) {
            console.log("Moving streak container into #quiz for Android layout.");
            quizDiv.appendChild(streakContainer); // Fügt es am Ende von #quiz hinzu
        }
    } else {
        // PC oder unbekannt -> Standardlayout sicherstellen
        document.body.classList.remove('platform-android');
        // Verschiebe den Streak-Container ZURÜCK VOR die #controls (innerhalb von main)
        if (streakContainer.parentNode !== mainElement || streakContainer.nextSibling !== controlsDiv) {
           // Nur verschieben, wenn es nicht schon an der richtigen Stelle ist
           // (z.B. wenn es noch im quizDiv ist)
            console.log("Moving streak container back before #controls for PC layout.");
            mainElement.insertBefore(streakContainer, controlsDiv);
        }
    }

    // Initialen Streak-Wert und Styling sicherstellen (redundant, aber sicher)
    const streakEl = document.getElementById('winningStreak');
    if (streakEl) streakEl.textContent = currentStreak;
    if (streakContainer) {
        if (currentStreak > 0) {
            streakContainer.classList.add('has-streak');
        } else {
            streakContainer.classList.remove('has-streak');
        }
    }
}
// -------------------------------------------------------


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
      flagImg.removeAttribute('src');
  }
  if (resultEl) resultEl.textContent = '';
  if (guessInput) {
      guessInput.value = '';
      guessInput.disabled = true; // Warten bis Flagge geladen
  }
  if (submitBtn) submitBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  applyEffects();

  // Land aus lokalem Array auswählen
  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("loadNewFlag: No countries in local array!");
    if(resultEl) {
        resultEl.textContent = "Fehler: Keine Länderdaten verfügbar.";
        resultEl.style.color = 'red';
    }
    return;
  }
  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx];
  setCurrentCountry(country);
  window.currentCountry = country; // Alias beibehalten

  // Namen für Alt-Text ermitteln (mit Fallback)
  const nameForAlt = language === 'de'
      ? (country.translations?.deu?.common || country.name?.common)
      : (country.name?.common || country.translations?.deu?.common);
  if(flagImg) flagImg.alt = i18n[language].flagAlt(nameForAlt || 'Unbekannt');
  console.log("loadNewFlag: Selected country:", nameForAlt, country.flags?.svg);

  // Flaggenbild laden (via Service Worker für Offline-Cache)
  flagRevealQueued = true;

  if(flagImg) { // Nur wenn Flaggenbild existiert
    flagImg.onload = function () {
      console.log("loadNewFlag: Flag loaded:", flagImg.src);
      if (flagRevealQueued) {
        flagImg.style.visibility = 'visible';
        if (guessInput) guessInput.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
        applyTimerToCurrentFlag(); // Timer starten/anwenden
        flagRevealQueued = false;
        // KEIN automatischer Fokus
      }
      flagImg.onload = null; // Listener entfernen
    };

    flagImg.onerror = function() {
        console.error("loadNewFlag: Error loading flag image:", country.flags?.svg);
        if(resultEl){
            resultEl.textContent = "Fehler beim Laden der Flagge.";
            resultEl.style.color = 'orange';
        }
        flagRevealQueued = false;
        flagImg.onload = null;
        flagImg.onerror = null;
        setTimeout(loadNewFlag, 1000); // Nächste Flagge versuchen
    }

    // URL setzen (löst onload oder onerror aus)
    if (country.flags && country.flags.svg) {
       flagImg.src = country.flags.svg;
    } else {
       console.error("loadNewFlag: Missing flag SVG URL for country:", nameForAlt);
       if(resultEl){
           resultEl.textContent = "Fehler: Flaggen-URL fehlt.";
           resultEl.style.color = 'red';
       }
       setTimeout(loadNewFlag, 1000); // Nächste Flagge versuchen
    }
  } else {
      console.error("loadNewFlag: Flag image element not found.");
      if(resultEl){
           resultEl.textContent = "Fehler: Flaggen-Element nicht gefunden.";
           resultEl.style.color = 'red';
       }
  }
}

// Wendet den eingestellten Timer auf die aktuell sichtbare Flagge an
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer);
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    if (!flagImg || !flagContainer || !flagBlackout) {
        console.warn("applyTimerToCurrentFlag: Flag elements not found.");
        return;
    }

    if (flagImg.style.visibility !== 'visible') {
       console.log("applyTimerToCurrentFlag: Flag not visible, doing nothing.");
       if(nextBtn) nextBtn.disabled = false;
       return;
    }

    const timeValue = document.getElementById('timeSelect').value;
    if (timeValue !== "Infinity") {
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden';
            if(nextBtn) nextBtn.disabled = false;
        }, Number(timeValue) * 1000);
        if(nextBtn) nextBtn.disabled = true;
    } else {
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        flagImg.style.visibility = 'visible';
        if(nextBtn) nextBtn.disabled = false;
    }
}

// Überprüft die Benutzereingabe gegen das aktuelle Land (mit Streak-Animation)
function checkGuess() {
  clearTimeout(flagHideTimer); // Aktiven Timer stoppen

  const guessInput = document.getElementById('guessInput');
  const input = guessInput.value.trim().toLowerCase();
  const currentCountryData = window.currentCountry;
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');
  const streakContainer = document.getElementById('streak-container');
  const winningStreakEl = document.getElementById('winningStreak');

  if (!currentCountryData) {
    console.error("checkGuess: currentCountry data is missing.");
    if(resultEl){
        resultEl.textContent = "Fehler: Interner Zustand ungültig.";
        resultEl.style.color = 'red';
    }
    return;
  }

  // Korrekte Namen ermitteln (mit Fallback)
  const correctDe = currentCountryData.translations?.deu?.common?.toLowerCase();
  const correctEn = currentCountryData.name?.common?.toLowerCase();
  const correct = language === 'de' ? correctDe : correctEn;
  const correctNameForDisplay = language === 'de'
      ? (currentCountryData.translations?.deu?.common || currentCountryData.name?.common)
      : (currentCountryData.name?.common || currentCountryData.translations?.deu?.common);

  // --- Winstreak Logik ---
  let streakIncreased = false;

  if (correct && input === correct) {
    if(resultEl){
        resultEl.textContent = i18n[language].correct;
        resultEl.style.color = 'green';
    }
    setCurrentStreak(currentStreak + 1);
    streakIncreased = true;
  } else {
    if(resultEl){
        resultEl.textContent = i18n[language].wrong(correctNameForDisplay || 'Unbekannt');
        resultEl.style.color = 'red';
    }
    setCurrentStreak(0);
  }

  // Update der Anzeige und Animation für den Streak
  if (winningStreakEl && streakContainer) {
      // Zahl und Farbe/Klasse werden bereits durch setCurrentStreak gesetzt
      // Nur Animation bei Erhöhung auslösen
      if (currentStreak > 0 && streakIncreased) {
          winningStreakEl.classList.add('streak-pulse');
          setTimeout(() => {
              winningStreakEl.classList.remove('streak-pulse');
          }, 400); // Dauer muss zur CSS-Animation passen
      }
  }
  // -------------------------

  // Flagge wieder anzeigen, falls sie ausgeblendet war
  const flagContainerEl = document.getElementById('flag-container');
  const flagBlackoutEl = document.getElementById('flag-blackout');
  const flagImgEl = document.getElementById('flag');
  if (blackoutActive && flagContainerEl && flagBlackoutEl && flagImgEl) {
    flagContainerEl.classList.remove('blackout');
    flagBlackoutEl.style.display = 'none';
    flagImgEl.style.visibility = 'visible';
    blackoutActive = false;
  }

  // UI für nächste Runde vorbereiten
  if(submitBtn) submitBtn.disabled = true;
  if(guessInput) guessInput.disabled = true;
  if(nextBtn) {
      nextBtn.disabled = false;
      // KEIN automatischer Fokus
  }

  // Optional: Automatisch nächste Flagge nach 2 Sekunden
   setTimeout(() => {
      // Prüfe, ob das Ergebnis-Element noch existiert und Text enthält
      const currentResultEl = document.getElementById('result');
      if (currentResultEl && currentResultEl.textContent !== '') {
          loadNewFlag();
      }
  }, 2000);
}

// Wendet die visuellen Effekte (Graustufen etc.) an
function applyEffects() {
  const ctr = document.getElementById('flag-container');
  if (!ctr) return;
  ctr.classList.remove('grayscale', 'glitch', 'pixelate', 'invert');
  // Prüfe Existenz der Checkboxen, bevor auf checked zugegriffen wird
  if (document.getElementById('grayscaleToggle')?.checked) ctr.classList.add('grayscale');
  if (document.getElementById('invertToggle')?.checked) ctr.classList.add('invert');
  if (document.getElementById('pixelateToggle')?.checked) ctr.classList.add('pixelate');
  if (document.getElementById('glitchToggle')?.checked) ctr.classList.add('glitch');
}

// --- END OF FILE ui/gameUI.js ---
