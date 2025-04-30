// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  // countries, // Wird nicht mehr direkt hier gebraucht
  countriesForGame, // Das ist jetzt unsere lokale Datenquelle!
  // setCountriesForGame, // Wird in startScreen.js gesetzt
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
let flagRevealQueued = false; // Verhindert Race Conditions beim Laden

// Funktion zum Setzen von UI-Listenern (unverändert aus Original)
export function setupUIListeners() {
  document.getElementById(' der Anpassungen für die Offline-Nutzung und ohne den automatischen Fokus auf das Eingabefeld.

Ersetze den gesamten Inhalt deiner `ui/gameUI.js`-Datei mit diesem Code:

```javascript
// --- START OF FILE ui/gameUI.js ---

import { i18n } from '../utils/i18n.js';
import {
  // countries, // Wird nicht mehr direkt hier gebraucht
  countriesForGame, // Das ist jetzt unsere lokale Datenquelle!
  // setCountriesForGame, // Wird in startScreen.js gesetzt
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
let flagRevealQueued = false; // Verhindert Race Conditions beim Laden

// Funktion zum Setzen von UI-Listenern
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
      // Dynamischer Import für Flaggenliste, falls geöffnet
      import('./flagListModal.js').then(mod => {
        mod.fillFlagListContent();
        setTimeout(mod.initFlagListHover, 0);
      });
    }
  });
  document.getElementById('timeSelect').addEventListener('change', () => {
    // Bei Zeitänderung: Aktuelle Flagge neu laden, um Timer anzuwenden
    // Nur sinnvoll, wenn eine Flagge gerade angezeigt wird und das Raten noch läuft
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
  if (backdrop) backdrop.submitBtn').addEventListener('click', checkGuess);
  document.getElementById('nextBtn').addEventListener('click', loadNewFlag);
  document.getElementById('grayscaleToggle').addEventListener('change', applyEffects);
  document.getElementById('glitchToggle').addEventListener('change', applyEffects);
  document.getElementById('pixelateToggle').addEventListener('change', applyEffects);
  document.getElementById('invertToggle').addEventListener('change', applyEffects);
  document.getElementById('languageSelect').addEventListener('change', e => {
    setLanguage(e.target.value);
    updateUI();
    if (document.getElementById('flag-list-modal').style.display === 'block') {
      // Dynamischer Import für Flaggenliste, falls geöffnet
      import('./flagListModal.js').then(mod => {
        mod.fillFlagListContent();
        setTimeout(mod.initFlagListHover, 0);
      });
    }
  });
  document.getElementById('timeSelect').addEventListener('change', () => {
    // Bei Zeitänderung: Aktuelle Flagge neu laden, um Timer anzuwenden
    // Nur sinnvoll, wenn eine Flagge gerade angezeigt wird
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
  if (backdrop) backdrop.addEventListener('click', () => {addEventListener('click', () => {
    document.getElementById('flag-list-modal').style.display = 'none';
  });

  document.getElementById('backToStartBtn').addEventListener('click', showStartScreen);

  document.getElementById('winningStreak').textContent = currentStreak;
}

// Funktion zum Initialisieren des Spiels nach Moduswahl
export function setupGameForSelectedOptions() {
  document.getElementById('languageSelect').value = language;
  updateUI();
  loadNewFlag(); // Erste Flagge laden
}

// Funktion zum Aktualisieren der UI-Texte
export function updateUI() {
  document.documentElement.lang = language;
  document.querySelector('h1[data-i18n="title"]').textContent = i18n[language].title;
  document.getElementById('guessInput').placeholder = i18n[language].placeholder;
  document.querySelector('[data-i18n="grayscaleLabel"]').textContent = i18n[language].grayscaleLabel;
  document.querySelector('[data-i18n="glitchLabel"]').textContent = i18n[language].glitchLabel;
  document.querySelector('[data-i18n="pixelateLabel"]').textContent
    document.getElementById('flag-list-modal').style.display = 'none';
  });

  document.getElementById('backToStartBtn').addEventListener('click', showStartScreen);

  document.getElementById('winningStreak').textContent = currentStreak;
}

// Funktion zum Initialisieren des Spiels nach Moduswahl (unverändert aus Original)
export function setupGameForSelectedOptions() {
  document.getElementById('languageSelect').value = language;
  updateUI();
  loadNewFlag(); // Erste Flagge laden
}

// Funktion zum Aktualisieren der UI-Texte (unverändert aus Original)
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
  document.querySelector('[data-i18n="flagList = i18n[language].pixelateLabel;
  document.querySelector('[data-i18n="invertLabel"]').textContent = i18n[language].invertLabel;
  document.querySelector('[data-i18n="checkBtn"]').textContent = i18n[language].checkBtn;
  document.querySelector('[data-i18n="nextBtn"]').textContent = i18n[language].nextBtn;
  document.querySelector('[data-i18n="flagListBtn"]').textContent = i18n[language].flagListBtn;
  document.querySelector('[data-i18n="timeLabel"]').textContent = i18n[language].timeLabel;
  // Titel im Modal nur aktualisieren, wenn es existiert/geöffnet wird
  const flagListTitle = document.querySelector('[data-i18n="flagListTitleBtn"]').textContent = i18n[language].flagListBtn;
  document.querySelector('[data-i18n="timeLabel"]').textContent = i18n[language].timeLabel;
  // Titel im Modal nur aktualisieren, wenn es existiert/geöffnet wird
  const flagListTitle = document.querySelector('[data-i18n="flagListTitle"]');
   if(flagListTitle) flagListTitle.textContent = i18n[language].flagListTitle;
  document.querySelector('[data-i18n="winStreak"]');
   if(flagListTitle) flagListTitle.textContent = i18n[language].flagListTitle;
  document.querySelector('[data-i18n="winStreak"]').textContent = i18n[language].winStreak;
  document.querySelector('[data-i18n="backToStartBtn"]').textContent = i18n[language].winStreak;
  document.querySelector('[data-i18n="backToStartBtn"]').textContent = i18n[language].backToStartBtn;
  //"]').textContent = i18n[language].backToStartBtn;
  // Alt-Text der Flagge aktualisieren Alt-Text der Flagge aktualisieren, wenn eine angezeigt wird
  if (window.currentCountry) {
, wenn eine angezeigt wird
  if (window.currentCountry) {
    const name = language === 'de    const name = language === 'de'
      ? window.currentCountry.translations.deu.common
'
      ? window.currentCountry.translations.deu.common
      : window.currentCountry.name      : window.currentCountry.name.common;
    document.getElementById('flag').alt = i18.common;
    document.getElementById('flag').alt = i18n[language].flagAlt(namen[language].flagAlt(name);
  }
}

// Funktion zum Laden einer neuen Flagge ();
  }
}

// Funktion zum Laden einer neuen Flagge (ANGEPASST für Offline-NutzANGEPASST für Offline-Nutzung & KEIN Autofokus)
export function loadNewFlag() {
  ung & KEIN Autofokus)
export function loadNewFlag() {
  console.log("loadNewFlag calledconsole.log("loadNewFlag called. Using countriesForGame with length:", countriesForGame.length);
  . Using countriesForGame with length:", countriesForGame.length);
  blackoutActive = false;
  blackoutActive = false;
  flagRevealQueued = false;
  clearTimeout(flagHideTimer);flagRevealQueued = false;
  clearTimeout(flagHideTimer); // Alten Timer löschen

  const flagContainer // Alten Timer löschen

  const flagContainer = document.getElementById('flag-container');
  const flagBlackout = = document.getElementById('flag-container');
  const flagBlackout = document.getElementById('flag-blackout document.getElementById('flag-blackout');
  const flagImg = document.getElementById('flag');
  const');
  const flagImg = document.getElementById('flag');
  const guessInput = document.getElementById('guess guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  Input');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');submitBtn');
  const nextBtn = document.getElementById('nextBtn');

  // UI-Reset für neue Runde
  

  // UI-Reset für neue Runde
  flagContainer.classList.remove('blackout');
  flagBlackout.flagContainer.classList.remove('blackout');
  flagBlackout.style.display = 'none';
style.display = 'none';
  flagImg.style.visibility = 'hidden'; // Erstmal verstecken  flagImg.style.visibility = 'hidden'; // Erstmal verstecken
  flagImg.removeAttribute('src
  flagImg.removeAttribute('src'); // Quelle entfernen, um Neuladen zu erzwingen
  resultEl.textContent'); // Quelle entfernen, um Neuladen zu erzwingen
  resultEl.textContent = '';
  guess = '';
  guessInput.value = '';
  guessInput.disabled = true; // Deaktivieren,Input.value = '';
  guessInput.disabled = true; // Deaktivieren, bis Flagge geladen bis Flagge geladen ist
  submitBtn.disabled = true;
  nextBtn.disabled = true; // Erst nach Laden/Timeout aktivieren
  applyEffects(); // Visuelle Effekte anwenden

  // === Kernänderung: Daten aus lokalem Array holen ===
  if (!countriesForGame || countriesForGame.length === ist
  submitBtn.disabled = true;
  nextBtn.disabled = true; // Erst nach Laden/Timeout aktivieren
  applyEffects(); // Visuelle Effekte anwenden

  // === Kernänderung: Daten aus lokalem Array holen ===
  if (!countriesForGame || countriesForGame.length === 0) {
    console.error("FATAL: No countries available in local countriesForGame array.");
    resultEl.textContent 0) {
    console.error("FATAL: No countries available in local countriesForGame array.");
    resultEl.textContent = "Fehler: Keine Länderdaten lokal verfügbar. Bitte online starten.";
    resultEl.style.color = 'red';
    // Kein Spiel möglich ohne Daten
    return;
  }

 = "Fehler: Keine Länderdaten lokal verfügbar. Bitte online starten.";
    resultEl.style.color = 'red';
    // Kein Spiel möglich ohne Daten
    return;
  }

  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx  const idx = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[idx];
  setCurrentCountry(country); // Wichtig für checkGuess
  window.currentCountry = country; // Alias behalten

  // Land und Flagge setzen (Alt-Text)
  const name = language === 'de'
    ? country.translations.deu.common
    : country.name];
  setCurrentCountry(country); // Wichtig für checkGuess
  window.currentCountry = country; // Alias behalten

  // Land und Flagge setzen (Alt-Text)
  const name = language === 'de'
    ? country.translations.deu.common
    : country.name.common;
  flagImg.alt = i18n[language].flagAlt(name);
  console.log("Selected.common;
  flagImg.alt = i18n[language].flagAlt(name);
  console.log("Selected country:", name, country.flags.svg); // Debugging

  // === Flaggenbild laden (Service Worker wird das Caching übernehmen) ===
  flagRevealQueued = true; // Markieren, dass dieses Laden gültig ist

  flagImg.onload = function () {
    console.log("Flag loaded:", flagImg.src);
    if (flagRevealQueued) {
      flagImg.style.visibility = ' country:", name, country.flags.svg); // Debugging

  // === Flaggenbild laden (Service Worker wird das Caching übernehmen) ===
  flagRevealQueued = true; // Markieren, dass dieses Laden gültig ist

  flagImg.onload = function () {
    console.log("Flag loaded:", flagImg.src);
    if (flagRevealQueued) {
      flagImg.style.visibility = 'visible'; // Anzeigen, wenn geladen
      guessInput.disabled = false; // Input freigeben
      submitBtn.disabled = false; // Prüfen-Button freigeben
      applyTimerToCurrentFlag(); // Timer starten (oder auchvisible'; // Anzeigen, wenn geladen
      guessInput.disabled = false; // Input freigeben
      submitBtn.disabled = false; // Prüfen-Button freigeben
      applyTimerToCurrentFlag(); // Timer starten (oder auch nicht bei Infinity)
      flagRevealQueued = false; // Laden abgeschlossen
      // guessInput.focus(); // <<<<<< DIESE ZEILE IST AUSKOMMENTIERT/ENTFERNT worden
    }
    flagImg.onload = null; // Event Listener entfernen
  };

  flagImg. nicht bei Infinity)
      flagRevealQueued = false; // Laden abgeschlossen
      // guessInput.focus(); // <<<<<< HIER KEIN AUTOMATISCHER FOKUS MEHR
    }
    flagImg.onload = null; // Event Listener entfernen
  };

  flagImg.onerror = function() {
      console.error("Error loading flag image:", country.flags.svg);
      resultEl.textContent = "Fehler beim Laden der Flagge. Überspringe.";
      resultEl.style.color = 'orange';
      flagRevealQueued = false;
      flagImg.onload = null;
      flagImg.onerror = null;
      // Nonerror = function() {
      console.error("Error loading flag image:", country.flags.svg);
      resultEl.textContent = "Fehler beim Laden der Flagge. Überspringe.";
      resultEl.style.color = 'orange';
      flagRevealQueued = false;
      flagImg.onload = null;
      flagImg.onerror = null;
      // Nächste Flagge versuchen zu laden, auch wenn eine fehlschlägt
      setTimeout(loadNewFlag, 1500);
  }

  // Quelle setzen -> löst Laden aus (wird von SW abgefangen)
  if (country.flags && country.flagsächste Flagge versuchen zu laden, auch wenn eine fehlschlägt
      setTimeout(loadNewFlag, 1500);
  }

  // Quelle setzen -> löst Laden aus (wird von SW abgefangen)
  if (country.flags && country.flags.svg) {
     flagImg.src = country.flags.svg;
  } else {
     console.error("Missing flag SVG URL for country:", country.name.common);
     resultEl.textContent = "Fehler: Flaggen-URL fehlt. Überspringe.";
     result.svg) {
     flagImg.src = country.flags.svg;
  } else {
     console.error("Missing flag SVG URL for country:", country.name.common);
     resultEl.textContent = "Fehler: Flaggen-URL fehlt. Überspringe.";
     resultEl.style.color = 'red';
     setTimeout(loadNewFlag, 1500); // Nächste Flagge versuchen
  }
}

// Hilfsfunktion, um den Timer anzuwenden/neu zu starten
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer); // Bestehenden Timer stoppen
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    constEl.style.color = 'red';
     setTimeout(loadNewFlag, 1500); // Nächste Flagge versuchen
  }
}

// Hilfsfunktion, um den Timer anzuwenden/neu zu starten
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer); // Bestehenden Timer stoppen
    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    // Wenn Flagge nicht sichtbar ist (z.B. während des Ladens oder nach Fehler), nichts tun
    if (flagImg.style.visibility !== 'visible') {
       nextBtn.disabled flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');

    // Prüfen, ob die Flagge überhaupt sichtbar ist (relevant, falls Timer geändert wird, während ausgeblendet)
    if (flagImg.style.visibility !== 'visible' && !blackoutActive) {
       // Wenn Flagge nicht sichtbar ist UND nicht aktiv ausgeblendet -> warten auf onload
       // Normalerweise sollte das nicht passieren, da diese Funktion nach onload aufgerufen wird
       console.log("applyTimerToCurrentFlag called while flag not = false; // Aber Next Button sollte im Fehlerfall evtl. aktiv sein
       return;
    }

    const t = document.getElementById('timeSelect').value;
    if (t !== "Infinity") {
        // Timeout für Ausblenden starten
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden'; // Flagge ausblenden
            nextBtn.disabled = false; // Nächste Flagge jetzt möglich
        }, Number(t) * 1000);
         visible/loaded.");
       nextBtn.disabled = false; // Sicherheitshalber aktivieren
       return;
    }

    const t = document.getElementById('timeSelect').value;
    if (t !== "Infinity") {
        // Timeout für Ausblenden starten
        flagHideTimer = setTimeout(() => {
            blackoutActive = true;
            flagContainer.classList.add('blackout');
            flagBlackout.style.display = 'block';
            flagImg.style.visibility = 'hidden'; // Flagge ausblenden
            nextBtn.disabled = false; // Nächste Flagge jetzt möglich
        }, Number(t) * 1000);// Deaktivieren, bis Timeout abläuft ODER geantwortet wird, sonst kann man "Next" klicken, während Timer läuft
         nextBtn.disabled = true;
    } else {
        // Unbegrenzte Anzeige
        blackoutActive = false; // Sicherstellen, dass nicht ausgeblendet wird
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        flagImg.style.visibility = 'visible';
        nextBtn.disabled = false; // Nächste Flagge sofort möglich
    }
         // Next Button deaktivieren, bis Timeout abläuft ODER geantwortet wird
         // Es sei denn, die Flagge ist schon verborgen (dann bleibt er aktiv)
         if (!blackoutActive) {
            nextBtn.disabled = true;
         } else {
             nextBtn.disabled = false;
         }
    } else {
        // Unbegrenzte Anzeige
        blackoutActive = false; // Sicherstellen, dass nicht ausgeblendet wird
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
}

// Funktion zur Überprüfung der Eingabe
function checkGuess() {
  clearTimeout(flagHideTimer); // Timer stoppen, wenn geantwortet wird

  const input = document.getElementById('guessInput').value.trim().toLowerCase();
  const currentCountryData = window.currentCountry; // Kopie für den Fall, dass es sich ändert

  // Sicherstellen, dass ein Land ausgewählt ist
  if (!currentCountryData) {
    console.error("checkGuess called without a current country.");
    return;
  }

  const correctDe = currentCountryData.translations?.deu?.common?.toLowerCase();
  const correctEn = currentCountryData.name?.common
        // Sicherstellen, dass Flagge sichtbar ist, falls sie gerade aktiv war
        if (flagImg.style.visibility !== 'visible') {
            flagImg.style.visibility = 'visible';
        }
        nextBtn.disabled = false; // Nächste Flagge sofort möglich
    }
}


// Funktion zur Überprüfung der Eingabe (unverändert, nutzt window.currentCountry)
function checkGuess() {
  clearTimeout(flag?.toLowerCase();

  // Bestimme den korrekten Namen basierend auf der Sprache
  const correct = language === 'de' ? correctDe : correctEn;
  // Fallback, falls eine Übersetzung fehlt
  const correctNameForDisplay = language === 'de'
      ? (currentCountryData.translations?.deu?.common || currentCountryData.nameHideTimer); // Timer stoppen, wenn geantwortet wird

  const input = document.getElementById('guessInput').value.trim().toLowerCase();
  // Stelle sicher, dass currentCountry existiert
  if (!window.currentCountry || !window.currentCountry.translations || !window.currentCountry.name) {
      console.error("Cannot check guess: currentCountry data is missing.");
      document.getElementById('result').textContent = "Fehler: Land nicht geladen.";
      document.getElementById('result').style.color = 'red';
      return;
  }?.common) // Nimm DE, sonst EN
      : (currentCountryData.name?.common || currentCountryData.translations?.deu?.common); // Nimm EN, sonst DE

  const resultEl = document.getElementById('result');

  // Prüfe gegen beide Sprachen, wenn eine Übersetzung fehlt oder mehr Toleranz gewünscht ist?
  // Hier strikt nach ausgewählter Sprache:
  if (correct && input === correct) {
    resultEl.textContent =

  const correct = (language === 'de'
    ? window.currentCountry.translations.deu.common
    : window.currentCountry.name.common
  ).toLowerCase();

  const resultEl = document.getElementById('result');
  if (input === correct) {
    resultEl.textContent = i18n[language].correct;
    resultEl.style.color = 'green';
    setCurrentStreak(currentStreak i18n[language].correct;
    resultEl.style.color = 'green';
    setCurrentStreak(currentStreak + 1);
    document.getElementById('winningStreak').textContent = currentStreak;
  } else {
    resultEl.textContent = i18n[language].wrong(correctNameForDisplay || + 1);
    document.getElementById('winningStreak').textContent = currentStreak;
  } else {
    const correctName = language === 'de'
      ? window.currentCountry.translations.deu.common
      : window.currentCountry.name.common;
    resultEl.textContent = i18n[language].wrong(correctName);
    resultEl.style.color = 'red';
    setCurrentStreak( 'Unbekannt'); // Zeige korrekten Namen an
    resultEl.style.color = 'red';
    setCurrentStreak(0);
    document.getElementById('winningStreak').textContent = 0;
  }

  // Flagge wieder anzeigen, falls sie ausgeblendet war
  if (blackoutActive) {
    document.getElementById('flag-container').classList.remove('blackout');
    document.getElementById('flag-blackout').style.display = 'none';
    document.getElementById('flag').style.visibility = 'visible';
    blackoutActive = false;
  }

  // Buttons deaktivieren/aktivieren für nächste Runde
  document.getElementById0);
    document.getElementById('winningStreak').textContent = 0;
  }

  // Flagge wieder anzeigen, falls sie ausgeblendet war
  if (blackoutActive) {
    document.getElementById('flag-container').classList.remove('blackout');
    document.getElementById('flag-blackout').style.display = 'none';
    document.getElementById('flag').style.visibility = 'visible';
    blackoutActive = false;
  }

  // Buttons deaktivieren/aktivieren für nächste Runde
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('guessInput').disabled = true;
  document.getElementById('next('submitBtn').disabled = true;
  document.getElementById('guessInput').disabled = true;
  document.getElementById('nextBtn').disabled = false; // Nächste Flagge Button aktivieren
  document.getElementById('nextBtn').focus(); // Fokus auf "Nächste" Button ist okay
}

// Funktion zum Anwenden visueller Effekte
function applyEffects() {
  const ctr = document.getElementById('flag-container');
  ctr.classList.remove('grayscale', 'glitch', 'pixelate', 'invert');
  if (documentBtn').disabled = false; // Nächste Flagge Button aktivieren
  document.getElementById('nextBtn').focus(); // Fokus auf "Nächste" Button, nicht Input

  // Optional: Automatisch nächste Flagge nach kurzer Anzeige des Ergebnisses
  // setTimeout(() => {
  //     if (resultEl.textContent !== '') { // Nur wenn eine Antwort gegeben wurde
  //         loadNewFlag();
  //     }
  // }, 2000);
}

// Funktion zum Anwenden visueller Effekte (unverändert aus Original)
function applyEffects() {
  const ctr = document.getElementById('flag-container');
  ctr.classList.remove.getElementById('grayscaleToggle').checked) ctr.classList.add('grayscale');
  if (document.getElementById('invertToggle').checked) ctr.classList.add('invert');
  if (document.getElementById('pixelateToggle').checked) ctr.classList.add('pixelate');
  if (document.getElementById('glitchToggle').checked) ctr.classList.add('glitch');
}

// --- END OF FILE ui/gameUI.js ---
