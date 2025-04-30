// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  countriesForGame, // Unsere lokale Datenquelle
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

  document.getElementById('winningStreak').textContent = currentStreak;
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
    document.getElementById('flag').alt = i18n[language].flagAlt(name || 'Unbekannt');
  }
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
  flagContainer.classList.remove('blackout');
  flagBlackout.style.display = 'none';
  flagImg.style.visibility = 'hidden';
  flagImg.removeAttribute('src');
  resultEl.textContent = '';
  guessInput.value = '';
  guessInput.disabled = true; // Warten bis Flagge geladen
  submitBtn.disabled = true;
  nextBtn.disabled = true;
  applyEffects();

  // Land aus lokalem Array auswählen
  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("loadNewFlag: No countries in local array!");
    resultEl.textContent = "Fehler: Keine Länderdaten verfügbar.";
    resultEl.style.color = 'red';
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
  flagImg.alt = i18n[language].flagAlt(nameForAlt || 'Unbekannt');
  console.log("loadNewFlag: Selected country:", nameForAlt, country.flags?.svg);

  // Flaggenbild laden (via Service Worker für Offline-Cache)
  flagRevealQueued = true;

  flagImg.onload = function () {
    console.log("loadNewFlag: Flag loaded:", flagImg.src);
    if (flagRevealQueued) {
      flagImg.style.visibility = 'visible';
      guessInput.disabled = false;
      submitBtn.disabled = false;
      applyTimerToCurrentFlag(); // Timer starten/anwenden
      flagRevealQueued = false;
      // KEIN automatischer Fokus mehr hier:
      // guessInput.focus();
    }
    flagImg.onload = null; // Listener entfernen
  };

  flagImg.onerror = function() {
      console.error("loadNewFlag: Error loading flag image:", country.flags?.svg);
      resultEl.textContent = "Fehler beim Laden der Flagge.";
      resultEl.style.color = 'orange';
      flagRevealQueued = false;
      flagImg.onload = null;
      flagImg.onerror = null;
      // Nächste Flagge versuchen, anstatt zu blockieren
      setTimeout(loadNewFlag, 1000); // Kurze Pause
  }

  // URL setzen (löst onload oder onerror aus)
  if (country.flags && country.flags.svg) {
     flagImg.src = country.flags.svg;
  } else {
     console.error("loadNewFlag: Missing flag SVG URL for country:", nameForAlt);
     resultEl.textContent = "Fehler: Flaggen-URL fehlt.";
     resultEl.style.color = 'red';
     setTimeout(loadNewFlag, 1000); // Nächste Flagge versuchen
  }
}

// Wendet den eingestellten Timer auf die aktuell sichtbare Flagge an
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer);
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    // Nur weitermachen, wenn Flagge sichtbar ist
    if (flagImg.style.visibility !== 'visible') {
       console.log("applyTimerToCurrentFlag: Flag not visible, doing nothing.");
       // Sicherheitshalber Next-Button aktivieren, falls er hängen sollte
       if(nextBtn) nextBtn.disabled = false;
       return;
    }

    const timeValue = document.getElementById('timeSelect').value;
    if (timeValue !== "Infinity") {
        // Timeout zum Ausblenden starten
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden';
            if(nextBtn) nextBtn.disabled = false; // Jetzt "Nächste" erlauben
        }, Number(timeValue) * 1000);
        // Während Timer läuft, ist "Nächste" deaktiviert
        if(nextBtn) nextBtn.disabled = true;
    } else {
        // Unbegrenzte Anzeige
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        // Sicherstellen, dass Flagge sichtbar bleibt (falls vorher Timeout aktiv war)
        flagImg.style.visibility = 'visible';
        if(nextBtn) nextBtn.disabled = false; // "Nächste" sofort erlauben
    }
}

// Überprüft die Benutzereingabe gegen das aktuelle Land
function checkGuess() {
  clearTimeout(flagHideTimer); // Aktiven Timer stoppen

  const guessInput = document.getElementById('guessInput');
  const input = guessInput.value.trim().toLowerCase();
  const currentCountryData = window.currentCountry;
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!currentCountryData) {
    console.error("checkGuess: currentCountry data is missing.");
    resultEl.textContent = "Fehler: Interner Zustand ungültig.";
    resultEl.style.color = 'red';
    return;
  }

  // Korrekte Namen ermitteln (mit Fallback)
  const correctDe = currentCountryData.translations?.deu?.common?.toLowerCase();
  const correctEn = currentCountryData.name?.common?.toLowerCase();
  const correct = language === 'de' ? correctDe : correctEn;
  const correctNameForDisplay = language === 'de'
      ? (currentCountryData.translations?.deu?.common || currentCountryData.name?.common)
      : (currentCountryData.name?.common || currentCountryData.translations?.deu?.common);

  // Vergleich
  if (correct && input === correct) {
    resultEl.textContent = i18n[language].correct;
    resultEl.style.color = 'green';
    setCurrentStreak(currentStreak + 1);
    document.getElementById('winningStreak').textContent = currentStreak;
  } else {
    resultEl.textContent = i18n[language].wrong(correctNameForDisplay || 'Unbekannt');
    resultEl.style.color = 'red';
    setCurrentStreak(0);
    document.getElementById('winningStreak').textContent = 0;
  }

  // Flagge anzeigen, falls ausgeblendet
  if (blackoutActive) {
    document.getElementById('flag-container').classList.remove('blackout');
    document.getElementById('flag-blackout').style.display = 'none';
    document.getElementById('flag').style.visibility = 'visible';
    blackoutActive = false;
  }

  // UI für nächste Runde vorbereiten
  if(submitBtn) submitBtn.disabled = true;
  if(guessInput) guessInput.disabled = true;
  if(nextBtn) {
      nextBtn.disabled = false;
      nextBtn.focus(); // Fokus auf "Nächste Flagge" Button
  }
}

// Wendet die visuellen Effekte (Graustufen etc.) an
function applyEffects() {
  const ctr = document.getElementById('flag-container');
  if (!ctr) return;
  ctr.classList.remove('grayscale', 'glitch', 'pixelate', 'invert');
  if (document.getElementById('grayscaleToggle')?.checked) ctr.classList.add('grayscale');
  if (document.getElementById('invertToggle')?.checked) ctr.classList.add('invert');
  if (document.getElementById('pixelateToggle')?.checked) ctr.classList.add('pixelate');
  if (document.getElementById('glitchToggle')?.checked) ctr.classList.add('glitch');
}

// --- END OF FILE ui/gameUI.js ---
