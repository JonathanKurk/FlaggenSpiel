// --- START OF FILE script.js ---
import { i18n } from './utils/i18n.js';
import { initStartScreen, showGameScreen, showStartScreen } from './ui/startScreen.js';
import { setupUIListeners, updateUI, setupGameForSelectedOptions, updateUserInterfaceForPlatform, displayCurrentStreak } from './ui/gameUI.js';
import { checkPlatformChoice } from './platform.js';

let countries = [];
let currentCountry = null;
let language = 'de'; // Default language
let selectedMode = 'all'; // Default mode
let countriesForGame = [];
let winStreaks = {}; // Object to store streaks per mode
export let userPlatform = null; // Export userPlatform

export {
  countries,
  currentCountry,
  language,
  selectedMode,
  countriesForGame,
  winStreaks,
  // userPlatform // already exported above
};

// Function to load streaks from localStorage
function loadWinStreaks() {
    try {
        const storedStreaks = localStorage.getItem('flagGameWinStreaks');
        if (storedStreaks) {
            winStreaks = JSON.parse(storedStreaks);
            for (const mode in winStreaks) {
                if (typeof winStreaks[mode] !== 'number' || isNaN(winStreaks[mode])) {
                    winStreaks[mode] = 0; // Sanitize data
                }
            }
            console.log("Loaded win streaks:", winStreaks);
        } else {
            winStreaks = {};
            console.log("No win streaks found, starting fresh.");
        }
    } catch (e) {
        console.error("Error loading win streaks:", e);
        winStreaks = {};
    }
}

// Function to save streaks to localStorage
export function saveWinStreaks() {
    try {
        localStorage.setItem('flagGameWinStreaks', JSON.stringify(winStreaks));
    } catch (e) {
        console.error("Error saving win streaks:", e);
    }
}

// State setter functions
export function setCountries(data) { countries = data; }
export function setCurrentCountry(c) { currentCountry = c; window.currentCountry = c; } // window.currentCountry for debugging
export function setLanguage(l) {
    language = l;
    console.log(`Language set to: ${language}`);
    // Optionally update UI immediately if needed, though startScreen handles its part
    // updateUI(); // Maybe call this later when gameUI is fully visible
}
export function setSelectedMode(m) {
    console.log("Mode selected:", m);
    selectedMode = m;
    displayCurrentStreak(); // Update streak display for the new mode
}
export function setCountriesForGame(arr) { countriesForGame = arr; }
export function setUserPlatform(platform) {
    userPlatform = platform;
    console.log("User platform set to:", userPlatform);
    // Update UI based on platform (e.g., layout adjustments)
    // Needs updateUserInterfaceForPlatform() from gameUI.js
    updateUserInterfaceForPlatform();
}

// Function to set game countries (called by startScreen)
export function setGameCountries(arr) {
  countriesForGame = arr;
  displayCurrentStreak(); // Show streak for the selected mode when game countries are set
}


// Main function to load data and initialize
async function loadCountries() {
  try {
    console.log("Loading country data...");
    loadWinStreaks(); // Load streaks first

    // Fetch country data from API
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,translations,flags,continents,subregion,population,area,capital,region,cca3,demonyms,currencies,languages');
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Country data fetched successfully.");

    // Filter for valid countries (ensure necessary fields exist)
    const filteredData = data.filter(
      c => c.translations?.deu?.common && c.name?.common && c.flags?.svg && Array.isArray(c.continents) && c.continents.length > 0 && c.cca3
    );

    if (!filteredData || filteredData.length === 0) {
        console.error("No valid countries found after filtering API data.");
        document.body.innerHTML = `<h1>Error</h1><p>Could not load valid country data. Please try refreshing.</p>`;
        return;
    }
    console.log(`Valid countries found: ${filteredData.length}`);
    setCountries(filteredData);

    // Check platform choice (PC/Android)
    await checkPlatformChoice(); // Waits for user selection or localStorage check

    // Initialize the start screen logic (language/mode selection)
    initStartScreen();

    // Set up listeners for the main game UI (buttons, toggles etc.)
    setupUIListeners();

    // Initially show the start screen (language selection step)
    // No, initStartScreen handles showing the correct initial state
    // showStartScreen('language'); // This might override initial display logic in initStartScreen

    console.log("Initialization complete. Waiting for user interaction on start screen.");


  } catch (e) {
    console.error('Error during initialization:', e);
    document.body.innerHTML = `<h1>Initialization Error</h1><p>Failed to initialize the game. Please check the console for details and try refreshing. Error: ${e.message}</p>`;
  }
}

// Start the process when the DOM is ready
document.addEventListener('DOMContentLoaded', loadCountries);
// --- END OF FILE script.js ---
