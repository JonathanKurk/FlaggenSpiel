// --- START OF FILE script.js ---
import { i18n } from './utils/i18n.js';
import { initStartScreen, showGameScreen, showStartScreen } from './ui/startScreen.js';
// Stelle sicher, dass updateUserInterfaceForPlatform korrekt importiert wird
import { setupUIListeners, updateUI, setupGameForSelectedOptions, updateUserInterfaceForPlatform } from './ui/gameUI.js';
import { checkPlatformChoice } from './platform.js'; // Importieren der neuen Funktion

let countries = [];
let currentCountry = null;
let language = 'de'; // Default language
let selectedMode = 'all'; // Default mode
let countriesForGame = []; // Holds the filtered list for the current game session

// Lade Streak aus localStorage oder starte bei 0
let initialStreak = parseInt(localStorage.getItem('flagGameWinStreak') || '0', 10);
let currentStreak = isNaN(initialStreak) ? 0 : initialStreak;

// Variable für die Plattform des Benutzers
export let userPlatform = null; // Wird von platform.js gesetzt

export {
  countries,
  currentCountry,
  language,
  selectedMode,
  countriesForGame,
  currentStreak,
};

// State setter functions used by other modules
export function setCountries(data) { countries = data; }
export function setCurrentCountry(c) { currentCountry = c; window.currentCountry = c; }
export function setLanguage(l) { language = l; }
export function setSelectedMode(m) { selectedMode = m; }
export function setCountriesForGame(arr) { countriesForGame = arr; }

// Funktion zum Setzen des Streaks, speichert auch in localStorage
export function setCurrentStreak(streak) {
    if (typeof streak === 'number' && !isNaN(streak)) {
        currentStreak = streak;
        localStorage.setItem('flagGameWinStreak', currentStreak.toString()); // Speichern
        // Update UI der Zahl sofort (wird auch in checkGuess gemacht für Animation)
        const streakEl = document.getElementById('winningStreak');
        const streakContainer = document.getElementById('streak-container');
        if (streakEl) streakEl.textContent = currentStreak;
        // Aktualisiere auch die has-streak Klasse sofort
        if (streakContainer) {
           if (currentStreak > 0) {
                streakContainer.classList.add('has-streak');
           } else {
                streakContainer.classList.remove('has-streak');
           }
        }

    } else {
        console.error("Invalid streak value passed to setCurrentStreak:", streak);
    }
}

// Setter für Plattform
export function setUserPlatform(platform) {
    userPlatform = platform;
    console.log("User platform set to:", userPlatform);
    // UI anpassen, nachdem Plattform bekannt ist und DOM bereit ist
    // Stelle sicher, dass dies aufgerufen wird, wenn das DOM bereit ist.
    // Der Aufruf in loadCountries nach checkPlatformChoice ist gut.
    updateUserInterfaceForPlatform();
}

// Setzt die Länder für das aktuelle Spiel (Moduswahl)
export function setGameCountries(arr) {
  countriesForGame = arr;
  // Wichtig: Streak NICHT zurücksetzen beim Moduswechsel!
  // Stattdessen den aktuell gespeicherten Streak anzeigen
  const streakEl = document.getElementById('winningStreak');
  if(streakEl) streakEl.textContent = currentStreak;
  // Sicherstellen, dass Styling stimmt
  const streakContainer = document.getElementById('streak-container');
   if (streakContainer) {
      if (currentStreak > 0) {
           streakContainer.classList.add('has-streak');
      } else {
           streakContainer.classList.remove('has-streak');
      }
   }
}

// Hauptfunktion zum Laden der Länderdaten
async function loadCountries() {
  try {
    console.log("Loading country data...");
    // Fetch all necessary fields at once
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,translations,flags,continents,subregion,population,area,capital,region,cca3,demonyms,currencies,languages');
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Country data fetched.");

    // Pre-filter countries to ensure essential data exists
    const filteredData = data.filter(
      c => c.translations?.deu?.common &&
           c.name?.common &&
           c.flags?.svg &&
           Array.isArray(c.continents) && c.continents.length > 0
    );

    if (!filteredData || filteredData.length === 0) {
        console.error("No valid countries found after filtering API data.");
        document.body.innerHTML = `<h1>Error</h1><p>Could not load valid country data. Please try refreshing the page.</p>`;
        return;
    }
    console.log("Valid countries found:", filteredData.length);
    setCountries(filteredData);

    // Plattform prüfen (zeigt ggf. Modal an und wartet auf Auswahl)
    // Muss vor UI-Initialisierung geschehen, die vom Layout abhängt
    await checkPlatformChoice();

    // Initialize UI elements after data and platform are ready
    initStartScreen(); // Setup start screen listeners
    setupUIListeners(); // Setup main game UI listeners (kennt jetzt Plattform)

    // Sicherstellen, dass das Layout nach dem Setup korrekt ist
    // (Kann nötig sein, falls setupUIListeners das DOM verändert)
     updateUserInterfaceForPlatform();


  } catch (e) {
    console.error('Error loading or processing country data:', e);
    document.body.innerHTML = `<h1>Error</h1><p>Failed to load country data. Please check your internet connection and try refreshing the page. Details: ${e.message}</p>`;
  }
}

// Start loading data when the DOM is ready
document.addEventListener('DOMContentLoaded', loadCountries);
// --- END OF FILE script.js ---
