import { i18n } from './utils/i18n.js';
import { initStartScreen, showGameScreen, showStartScreen } from './ui/startScreen.js';
import { setupUIListeners, updateUI, setupGameForSelectedOptions } from './ui/gameUI.js';

let countries = [];
let currentCountry = null;
let language = 'de'; // Default language
let selectedMode = 'all'; // Default mode
let countriesForGame = []; // Holds the filtered list for the current game session
let currentStreak = 0;

// Exports for modules that need to read/write state
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
export function setCurrentCountry(c) { currentCountry = c; window.currentCountry = c; /* Keep global alias if needed */ }
export function setLanguage(l) { language = l; }
export function setSelectedMode(m) { selectedMode = m; }
export function setCountriesForGame(arr) { countriesForGame = arr; }
export function setCurrentStreak(streak) { currentStreak = streak; }

// This function specifically sets the game list based on mode selection and resets the streak.
export function setGameCountries(arr) {
  countriesForGame = arr;
  setCurrentStreak(0); // Reset streak when changing modes
  document.getElementById('winningStreak').textContent = 0; // Update UI immediately
}

async function loadCountries() {
  try {
    // Fetch all necessary fields at once
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,translations,flags,continents,subregion,population,area,capital,region,cca3,demonyms,currencies,languages');
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    // Pre-filter countries to ensure essential data exists
    const filteredData = data.filter(
      c => c.translations?.deu?.common &&
           c.name?.common &&
           c.flags?.svg &&
           Array.isArray(c.continents) && c.continents.length > 0 // Ensure continents array exists and is not empty
    );

    // Check if any countries remain after filtering
    if (!filteredData || filteredData.length === 0) {
        console.error("No valid countries found after filtering API data.");
        document.body.innerHTML = `<h1>Error</h1><p>Could not load valid country data. Please try refreshing the page.</p>`;
        return; // Stop execution if no data is usable
    }

    setCountries(filteredData);

    // Initialize UI elements after data is ready
    initStartScreen(); // Setup start screen listeners
    setupUIListeners(); // Setup main game UI listeners

  } catch (e) {
    console.error('Error loading or processing country data:', e);
    // Display a user-friendly error message on the page
    document.body.innerHTML = `<h1>Error</h1><p>Failed to load country data. Please check your internet connection and try refreshing the page. Details: ${e.message}</p>`;
  }
}

// Start loading data when the DOM is ready
document.addEventListener('DOMContentLoaded', loadCountries);