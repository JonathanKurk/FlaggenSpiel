// --- START OF FILE script.js ---
import { i18n } from './utils/i18n.js';
import { initStartScreen, showGameScreen, showStartScreen } from './ui/startScreen.js';
import { setupUIListeners, updateUI, setupGameForSelectedOptions, updateUserInterfaceForPlatform, displayCurrentStreak } from './ui/gameUI.js'; // displayCurrentStreak importiert
import { checkPlatformChoice } from './platform.js';

let countries = [];
let currentCountry = null;
let language = 'de';
let selectedMode = 'all'; // Wichtig für den Zugriff auf den richtigen Streak
let countriesForGame = [];

// ---- NEU: Streak-Management mit Objekt ----
let winStreaks = {}; // Objekt zur Speicherung der Streaks pro Modus

// Lade Streaks aus localStorage beim Start
function loadWinStreaks() {
    try {
        const storedStreaks = localStorage.getItem('flagGameWinStreaks'); // Neuer Key
        if (storedStreaks) {
            winStreaks = JSON.parse(storedStreaks);
            // Sicherstellen, dass alle Werte Zahlen sind (falls Daten korrupt)
            for (const mode in winStreaks) {
                if (typeof winStreaks[mode] !== 'number' || isNaN(winStreaks[mode])) {
                    winStreaks[mode] = 0;
                }
            }
            console.log("Loaded win streaks:", winStreaks);
        } else {
            winStreaks = {}; // Start mit leerem Objekt, falls nichts gespeichert
            console.log("No win streaks found in localStorage, starting fresh.");
        }
    } catch (e) {
        console.error("Error loading or parsing win streaks from localStorage:", e);
        winStreaks = {}; // Bei Fehler zurücksetzen
    }
}

// Speichere Streaks in localStorage
export function saveWinStreaks() {
    try {
        localStorage.setItem('flagGameWinStreaks', JSON.stringify(winStreaks));
        // console.log("Saved win streaks:", winStreaks); // Optional: zum Debuggen
    } catch (e) {
        console.error("Error saving win streaks to localStorage:", e);
    }
}
// ------------------------------------------

export let userPlatform = null;

export {
  countries,
  currentCountry,
  language,
  selectedMode,
  countriesForGame,
  winStreaks, // Exportiere das Objekt statt currentStreak
  // currentStreak, // Wird nicht mehr direkt exportiert
};

// State setter functions used by other modules
export function setCountries(data) { countries = data; }
export function setCurrentCountry(c) { currentCountry = c; window.currentCountry = c; }
export function setLanguage(l) { language = l; }
export function setSelectedMode(m) {
    console.log("Mode selected:", m);
    selectedMode = m;
    // Stelle sicher, dass der Streak für den neuen Modus angezeigt wird
    displayCurrentStreak(); // Ruft die UI-Funktion auf
}
export function setCountriesForGame(arr) { countriesForGame = arr; }

// Die alte setCurrentStreak Funktion wird entfernt, da die Logik in checkGuess liegt.

export function setUserPlatform(platform) {
    userPlatform = platform;
    console.log("User platform set to:", userPlatform);
    updateUserInterfaceForPlatform();
}

// Setzt die Länder für das aktuelle Spiel (Moduswahl)
export function setGameCountries(arr) {
  countriesForGame = arr;
  // Wichtig: Streak NICHT zurücksetzen beim Moduswechsel!
  // Stattdessen den Streak für den NEUEN Modus anzeigen
  displayCurrentStreak(); // Zeigt den Streak für den aktuellen 'selectedMode' an
}

// Hauptfunktion zum Laden der Länderdaten
async function loadCountries() {
  try {
    console.log("Loading country data...");
    loadWinStreaks(); // Lade Streaks BEVOR irgendwas angezeigt wird

    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,translations,flags,continents,subregion,population,area,capital,region,cca3,demonyms,currencies,languages');
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Country data fetched.");

    const filteredData = data.filter(
      c => c.translations?.deu?.common && c.name?.common && c.flags?.svg && Array.isArray(c.continents) && c.continents.length > 0
    );

    if (!filteredData || filteredData.length === 0) {
        console.error("No valid countries found after filtering API data.");
        document.body.innerHTML = `<h1>Error</h1><p>Could not load valid country data. Please try refreshing the page.</p>`;
        return;
    }
    console.log("Valid countries found:", filteredData.length);
    setCountries(filteredData);

    await checkPlatformChoice();

    initStartScreen();
    setupUIListeners(); // Ruft intern displayCurrentStreak auf

    // updateUserInterfaceForPlatform(); // Wird schon in setUserPlatform aufgerufen

  } catch (e) {
    console.error('Error loading or processing country data:', e);
    document.body.innerHTML = `<h1>Error</h1><p>Failed to load country data. Please check your internet connection and try refreshing the page. Details: ${e.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadCountries);
// --- END OF FILE script.js ---
