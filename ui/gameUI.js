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
import { showStartScreen } from './startScreen.js'; // Import showStartScreen

let flagHideTimer = null;
let blackoutActive = false;
let flagRevealQueued = false;

// Displays the current win streak for the selected mode
export function displayCurrentStreak() {
    const streakEl = document.getElementById('winningStreak');
    const streakContainer = document.getElementById('streak-container');
    // Ensure selectedMode is valid before accessing winStreaks
    const currentModeStreak = (selectedMode && winStreaks[selectedMode]) ? winStreaks[selectedMode] : 0;

    // console.log(`Displaying streak for mode '${selectedMode}': ${currentModeStreak}`); // Can be verbose

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

// Sets up all event listeners for the game UI elements
export function setupUIListeners() {
  console.log("setupUIListeners: Setting up listeners for game controls.");

  // Helper to add listener if element exists
  const addListener = (id, event, handler) => {
      const element = document.getElementById(id);
      if (element) {
          element.addEventListener(event, handler);
      } else {
          console.warn(`Element with ID "${id}" not found for listener setup.`);
      }
  };

  addListener('submitBtn', 'click', checkGuess);
  addListener('nextBtn', 'click', loadNewFlag);
  addListener('grayscaleToggle', 'change', applyEffects);
  addListener('glitchToggle', 'change', applyEffects);
  addListener('pixelateToggle', 'change', applyEffects);
  addListener('invertToggle', 'change', applyEffects);

  addListener('languageSelect', 'change', e => {
      setLanguage(e.target.value);
      updateUI(); // Update all game UI texts
      // If flag list modal is open, update its content language
      if (document.getElementById('flag-list-modal')?.style.display === 'block') {
          import('./flagListModal.js').then(mod => {
              mod.fillFlagListContent(); // Regenerate list with new language
              setTimeout(mod.initFlagListHover, 0); // Re-init hover effects
          }).catch(err => console.error("Error loading flagListModal module for language change:", err));
      }
  });

  addListener('timeSelect', 'change', () => {
      // Apply timer immediately if a flag is currently displayed and game is active
      if (window.currentCountry && document.getElementById('flag')?.style.visibility === 'visible') {
         applyTimerToCurrentFlag();
      }
  });

  addListener('guessInput', 'keydown', e => {
      if (e.key === 'Enter' && !document.getElementById('submitBtn')?.disabled) {
          e.preventDefault(); // Prevent form submission if wrapped in form
          checkGuess();
      }
  });

  addListener('showFlagListBtn', 'click', showFlagListModal);
  addListener('closeFlagList', 'click', () => {
      const modal = document.getElementById('flag-list-modal');
      if(modal) modal.style.display = 'none';
  });
  addListener('modal-backdrop', 'click', () => {
      const modal = document.getElementById('flag-list-modal');
      if(modal) modal.style.display = 'none';
  });

  // Listener for the "Back" button within the game UI
  addListener('backToStartBtn', 'click', () => {
      console.log("backToStartBtn (from game UI) clicked. Returning to start screen (mode selection).");
      // Call showStartScreen without arguments, which defaults to showing the 'mode' selection step
      showStartScreen();
  });

  // Initial display of streak when listeners are set up
  displayCurrentStreak();
  console.log("setupUIListeners: Finished setting up game listeners.");
}

// Initializes the game UI after mode and language are selected
export function setupGameForSelectedOptions() {
  console.log("setupGameForSelectedOptions: Preparing game UI.");
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
      langSelect.value = language; // Set dropdown to current language
  } else {
      console.warn("Language select dropdown (#languageSelect) not found during game setup.");
  }
  updateUI(); // Set all initial texts
  displayCurrentStreak(); // Display streak for the chosen mode
  loadNewFlag(); // Load the first flag
}

// Updates all text elements in the game UI based on the current language
export function updateUI() {
  console.log(`updateUI: Updating game UI texts for language: ${language}`);
  const currentLangData = i18n[language];
  if (!currentLangData) {
      console.error(`i18n data for language "${language}" not found!`);
      return;
  }

  document.documentElement.lang = language; // Set page language

  // Helper function to set text content safely
  const setText = (selector, key, isPlaceholder = false) => {
      const element = document.querySelector(selector);
      if (element) {
          const text = currentLangData[key] || `Missing key: ${key}`;
          if (isPlaceholder) {
              element.placeholder = text;
          } else {
              element.textContent = text;
          }
      } else {
          console.warn(`Element "${selector}" not found for i18n key "${key}".`);
      }
  };
   // Helper function to set text content for element identified by ID safely
   const setTextById = (id, key, isPlaceholder = false) => {
       const element = document.getElementById(id);
       if (element) {
           const text = currentLangData[key] || `Missing key: ${key}`;
           if (isPlaceholder) {
               element.placeholder = text;
           } else {
               // Handle buttons that might contain spans
               const span = element.querySelector('span[data-i18n]');
               if (span) {
                   span.textContent = text;
               } else {
                  element.textContent = text;
               }
           }
       } else {
           console.warn(`Element with ID "${id}" not found for i18n key "${key}".`);
       }
   };


  setText('h1[data-i18n="title"]', 'title'); // Main title (might be hidden by CSS)
  setTextById('guessInput', 'placeholder', true);
  setText('.toggle-label[data-i18n="grayscaleLabel"]', 'grayscaleLabel');
  setText('.toggle-label[data-i18n="glitchLabel"]', 'glitchLabel');
  setText('.toggle-label[data-i18n="pixelateLabel"]', 'pixelateLabel');
  setText('.toggle-label[data-i18n="invertLabel"]', 'invertLabel');
  setText('#timer-label span[data-i18n="timeLabel"]', 'timeLabel');
  setText('#submitBtn span[data-i18n="checkBtn"]', 'checkBtn');
  setText('#nextBtn span[data-i18n="nextBtn"]', 'nextBtn');
  setText('#showFlagListBtn span[data-i18n="flagListBtn"]', 'flagListBtn');
  setText('#backToStartBtn span[data-i18n="backToStartBtn"]', 'backToStartBtn');
  setText('#streak-container span[data-i18n="winStreak"]', 'winStreak');

  // Update flag list modal title if it exists in the DOM
  const flagListTitle = document.querySelector('#flag-list-modal h3[data-i18n="flagListTitle"]');
  if (flagListTitle) {
      flagListTitle.textContent = currentLangData.flagListTitle || 'Missing flagListTitle key';
  }
  const flagListCloseBtn = document.getElementById('closeFlagList');
   if (flagListCloseBtn) {
       flagListCloseBtn.title = currentLangData.modalClose || 'Close';
   }


  // Update alt text for the current flag if it's loaded
  if (window.currentCountry) {
      const flagEl = document.getElementById('flag');
      if (flagEl) {
          const name = language === 'de'
              ? (window.currentCountry.translations?.deu?.common || window.currentCountry.name?.common)
              : (window.currentCountry.name?.common || window.currentCountry.translations?.deu?.common);
          flagEl.alt = currentLangData.flagAlt ? currentLangData.flagAlt(name || 'Unknown') : `Flag of ${name || 'Unknown'}`;
      }
  }
  console.log("updateUI: Finished updating game UI texts.");
}

// Adjusts the UI layout based on the detected platform (PC/Android)
// THIS FUNCTION NEEDS TO BE CALLED AFTER `setUserPlatform` is set in script.js
export function updateUserInterfaceForPlatform() {
    console.log(`updateUserInterfaceForPlatform: Adjusting layout for platform: ${userPlatform}`);
    const body = document.body;

    if (!body) {
        console.error("Cannot update UI for platform: Body element not found.");
        return;
    }

    // --- NEU: CSS Klassen am body setzen ---
    if (userPlatform === 'android') {
        body.classList.add('platform-android');
        body.classList.remove('platform-pc'); // Ensure PC class is removed
        console.log("Applied Android specific layout class.");
    } else { // Default to PC layout
        body.classList.add('platform-pc'); // Explizit setzen für Klarheit
        body.classList.remove('platform-android');
        console.log("Applied PC specific layout class.");
    }
    // -------------------------------------

    // Re-display streak in case its position changed based on the new body class
    displayCurrentStreak();
}


// Loads a new random flag from the filtered list for the current mode
export function loadNewFlag() {
  console.log(`loadNewFlag: Loading new flag for mode '${selectedMode}'. Available countries: ${countriesForGame?.length || 0}`);
  blackoutActive = false; // Reset blackout state
  flagRevealQueued = false; // Reset queue state
  clearTimeout(flagHideTimer); // Clear any pending hide timer

  // Get references to UI elements
  const flagContainer = document.getElementById('flag-container');
  const flagBlackout = document.getElementById('flag-blackout');
  const flagImg = document.getElementById('flag');
  const guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Check if essential elements exist
  if (!flagContainer || !flagBlackout || !flagImg || !guessInput || !resultEl || !submitBtn || !nextBtn) {
      console.error("loadNewFlag: Critical UI elements missing. Cannot load new flag.");
      if(resultEl) {
          resultEl.textContent = "Fehler: UI-Elemente fehlen.";
          resultEl.style.color = 'red';
      }
      return;
  }

  // Reset UI state for the new flag
  flagContainer.classList.remove('blackout'); // Remove visual blackout effect
  flagBlackout.style.display = 'none';       // Hide the blackout overlay
  flagImg.style.visibility = 'hidden';       // Hide image until loaded
  flagImg.removeAttribute('src');            // Remove previous source
  flagImg.alt = '';                          // Clear alt text
  resultEl.textContent = '';                 // Clear previous result message
  guessInput.value = '';                     // Clear input field
  guessInput.disabled = true;                // Disable input until flag loads
  submitBtn.disabled = true;                 // Disable submit button
  nextBtn.disabled = true;                   // Disable next button initially
  applyEffects();                            // Reapply visual effects if toggles are active

  // Check if there are countries available for the selected mode
  if (!countriesForGame || countriesForGame.length === 0) {
    console.error(`loadNewFlag: No countries available in 'countriesForGame' for mode '${selectedMode}'!`);
    resultEl.textContent = i18n[language]?.errorNoCountriesForMode || "Error: No countries available for this mode.";
    resultEl.style.color = 'red';
    // Keep next button disabled, maybe enable back button?
    document.getElementById('backToStartBtn').disabled = false;
    return;
  }

  // Select a random country
  const randomIndex = Math.floor(Math.random() * countriesForGame.length);
  const country = countriesForGame[randomIndex];
  setCurrentCountry(country); // Update global state

  // Prepare alt text based on current language
  const nameForAlt = language === 'de'
      ? (country?.translations?.deu?.common || country?.name?.common)
      : (country?.name?.common || country?.translations?.deu?.common);
  flagImg.alt = i18n[language]?.flagAlt ? i18n[language].flagAlt(nameForAlt || 'Unknown') : `Flag of ${nameForAlt || 'Unknown'}`;

  console.log(`loadNewFlag: Selected country: ${nameForAlt || 'Name N/A'}, Flag SVG: ${country?.flags?.svg}`);

  // Check if flag SVG URL exists
  if (!country?.flags?.svg) {
      console.error("loadNewFlag: Selected country is missing the SVG flag URL!", country);
      resultEl.textContent = i18n[language]?.errorFlagUrlMissing || "Error: Flag image URL missing for selected country.";
      resultEl.style.color = 'orange';
      setCurrentCountry(null); // Invalidate current country
      // Enable next button to allow skipping this broken entry
      nextBtn.disabled = false;
      // Optionally, trigger loading another flag after a short delay
      // setTimeout(loadNewFlag, 1500);
      return;
  }

  // Set flagRevealQueued to true before setting src
  flagRevealQueued = true;

  // --- Image Loading Logic ---
  flagImg.onload = () => {
    console.log("loadNewFlag: Flag image loaded successfully:", flagImg.src);
    // Only reveal if still queued (prevents revealing if user clicked Next quickly)
    if (flagRevealQueued) {
        flagImg.style.visibility = 'visible'; // Make flag visible
        guessInput.disabled = false;        // Enable input
        submitBtn.disabled = false;         // Enable submit
        // guessInput.focus(); // <<< DIESE ZEILE WURDE ENTFERNT/AUSKOMMENTIERT
        applyTimerToCurrentFlag();          // Start the visibility timer if applicable
        flagRevealQueued = false;           // Mark as revealed
    } else {
        console.log("loadNewFlag: Flag loaded, but reveal was cancelled (likely user clicked Next).");
    }
    // Clean up listeners
    flagImg.onload = null;
    flagImg.onerror = null;
  };

  flagImg.onerror = () => {
    console.error("loadNewFlag: Error loading flag image:", flagImg.src);
    resultEl.textContent = i18n[language]?.errorLoadingFlag || "Error loading flag image.";
    resultEl.style.color = 'orange';
    flagRevealQueued = false; // Cancel reveal
    setCurrentCountry(null); // Invalidate current country
    // Enable Next button so user can proceed
    nextBtn.disabled = false;
    // Clean up listeners
    flagImg.onload = null;
    flagImg.onerror = null;
    // Maybe try loading another flag automatically?
    // setTimeout(loadNewFlag, 2000);
  };

  // Set the src attribute to start loading the image
  flagImg.src = country.flags.svg;
  // Note: nextBtn remains disabled until the timer finishes OR user guesses OR flag fails to load.
}


// Applies the selected timer duration to hide the current flag
function applyTimerToCurrentFlag() {
    clearTimeout(flagHideTimer); // Clear any previous timer

    const flagImg = document.getElementById('flag');
    const flagContainer = document.getElementById('flag-container');
    const flagBlackout = document.getElementById('flag-blackout');
    const nextBtn = document.getElementById('nextBtn');
    const timeSelect = document.getElementById('timeSelect');

    // Ensure all necessary elements are present
    if (!flagImg || !flagContainer || !flagBlackout || !nextBtn || !timeSelect) {
        console.warn("applyTimerToCurrentFlag: Missing required elements for timer logic.");
        if(nextBtn) nextBtn.disabled = false; // Ensure user can proceed if elements are missing
        return;
    }

    // Only apply timer if flag is actually visible
    if (flagImg.style.visibility !== 'visible') {
       console.log("applyTimerToCurrentFlag: Flag not visible yet, timer deferred.");
       // nextBtn should still be disabled here until flag is loaded or fails
       return;
    }

    const timeValue = timeSelect.value;

    if (timeValue !== "Infinity") {
        const durationMs = Number(timeValue) * 1000;
        console.log(`applyTimerToCurrentFlag: Setting timer to hide flag in ${durationMs}ms.`);
        // Disable Next button while timer is active
        nextBtn.disabled = true;

        flagHideTimer = setTimeout(() => {
            // Check if the game state hasn't changed (user hasn't guessed/navigated away)
            if (document.getElementById('submitBtn')?.disabled === false) {
                 console.log("Timer finished. Hiding flag.");
                 blackoutActive = true; // Set state
                 flagContainer.classList.add('blackout'); // Apply visual effect
                 flagBlackout.style.display = 'block';   // Show overlay
                 flagImg.style.visibility = 'hidden';   // Hide image
                 nextBtn.disabled = false;              // Enable Next button NOW
            } else {
                 console.log("Timer finished, but game state changed (guess submitted or next flag loaded). Flag not hidden by timer.");
                 // nextBtn should already be enabled by checkGuess or loadNewFlag
            }
        }, durationMs);
    } else {
        // Timer set to Infinity, ensure flag remains visible and Next button is enabled
        console.log("applyTimerToCurrentFlag: Timer set to Infinity. Flag remains visible.");
        blackoutActive = false;
        flagContainer.classList.remove('blackout');
        flagBlackout.style.display = 'none';
        // Ensure flag is visible (might have been hidden previously)
        // flagImg.style.visibility = 'visible'; // Only if sure it should be visible
        nextBtn.disabled = false; // Enable Next button
    }
}


// Checks the user's guess against the correct country name
function checkGuess() {
  clearTimeout(flagHideTimer); // Stop the timer immediately
  blackoutActive = false; // Reset blackout state as result is shown

  const guessInput = document.getElementById('guessInput');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  const nextBtn = document.getElementById('nextBtn');
  const winningStreakEl = document.getElementById('winningStreak');
  const flagContainer = document.getElementById('flag-container');
  const flagBlackout = document.getElementById('flag-blackout');
  const flagImg = document.getElementById('flag');

  // --- Essential Checks ---
  if (!guessInput || !resultEl || !submitBtn || !nextBtn || !winningStreakEl || !flagContainer || !flagBlackout || !flagImg) {
       console.error("checkGuess: Critical UI elements missing!");
       if(resultEl) resultEl.textContent = "Interner UI Fehler!";
       return;
  }
  if (!window.currentCountry) {
      console.error("checkGuess: 'currentCountry' data is missing!");
      resultEl.textContent = "Fehler: Keine Länderdaten!";
      submitBtn.disabled = true; // Prevent further attempts
      nextBtn.disabled = false; // Allow moving to next
      return;
  }
  // --- End Checks ---

  const userAnswer = guessInput.value.trim().toLowerCase();
  const currentCountryData = window.currentCountry;

  // Determine correct answer based on language
  const correctDe = currentCountryData.translations?.deu?.common?.toLowerCase();
  const correctEn = currentCountryData.name?.common?.toLowerCase();
  // Primary correct answer for comparison
  const correctPrimary = language === 'de' ? correctDe : correctEn;
  // Secondary answer (the other language) for flexibility, if available
  const correctSecondary = language === 'de' ? correctEn : correctDe;

  // Name to display in the "wrong answer" message
  const correctNameForDisplay = language === 'de'
      ? (currentCountryData.translations?.deu?.common || currentCountryData.name?.common)
      : (currentCountryData.name?.common || currentCountryData.translations?.deu?.common);

  let isCorrect = false;
  if (correctPrimary && userAnswer === correctPrimary) {
      isCorrect = true;
  } else if (correctSecondary && userAnswer === correctSecondary) {
      // Accept answer in the other language if primary doesn't match
      console.log(`Accepted secondary language answer: ${userAnswer}`);
      isCorrect = true;
  }


  let streakIncreased = false;
  const currentModeStreak = winStreaks[selectedMode] || 0;

  // Update result text and streak
  if (isCorrect) {
    resultEl.textContent = i18n[language].correct || "Correct!";
    resultEl.style.color = 'green';
    winStreaks[selectedMode] = currentModeStreak + 1;
    saveWinStreaks(); // Save updated streak
    streakIncreased = true;
    console.log(`Correct guess! Streak for '${selectedMode}' is now ${winStreaks[selectedMode]}`);
  } else {
    resultEl.textContent = i18n[language].wrong ? i18n[language].wrong(correctNameForDisplay || 'N/A') : `Wrong! Correct: ${correctNameForDisplay || 'N/A'}`;
    resultEl.style.color = 'red';
    // Reset streak only if it was positive
    if (currentModeStreak > 0) {
       winStreaks[selectedMode] = 0;
       saveWinStreaks(); // Save reset streak
       console.log(`Wrong guess! Streak for '${selectedMode}' reset to 0.`);
    }
  }

  // Update and potentially animate streak display
  displayCurrentStreak();
  if (streakIncreased && (winStreaks[selectedMode] || 0) > 0) {
      winningStreakEl.classList.add('streak-pulse');
      // Remove class after animation completes (match CSS duration)
      setTimeout(() => {
          winningStreakEl?.classList.remove('streak-pulse');
      }, 400);
  }

  // Reveal flag if it was hidden by the timer
  if (flagContainer.classList.contains('blackout')) {
    console.log("checkGuess: Revealing flag that was hidden by timer.");
    flagContainer.classList.remove('blackout');
    flagBlackout.style.display = 'none';
    flagImg.style.visibility = 'visible';
  }

  // Disable input/submit, enable next
  submitBtn.disabled = true;
  guessInput.disabled = true;
  nextBtn.disabled = false;

  // --- Auto-load next flag after a delay ---
  // Clear previous auto-next timer if any
  if (window.autoNextTimer) clearTimeout(window.autoNextTimer);

  window.autoNextTimer = setTimeout(() => {
      // Check if the user hasn't already clicked "Next" or navigated away
      // We can check if the result message is still visible and next button is enabled
      const currentResultText = document.getElementById('result')?.textContent;
      const isNextEnabled = !document.getElementById('nextBtn')?.disabled;

      if (currentResultText && isNextEnabled) {
           console.log("Auto-loading next flag after delay.");
           loadNewFlag();
      } else {
           console.log("Auto-next cancelled, user likely clicked Next or navigated away.");
      }
  }, 2500); // 2.5 seconds delay

  // Make next button clear the auto-next timer if clicked manually
  // Remove previous listener before adding a new one to prevent duplicates
  if (window.nextBtnClickHandler) {
      nextBtn.removeEventListener('click', window.nextBtnClickHandler);
  }
  window.nextBtnClickHandler = () => {
      console.log("Manual 'Next Flag' click.");
      clearTimeout(window.autoNextTimer); // Cancel auto-next
      loadNewFlag(); // Load immediately
      // Remove this specific listener after it's used
      nextBtn.removeEventListener('click', window.nextBtnClickHandler);
      window.nextBtnClickHandler = null; // Clear reference
  };
  nextBtn.addEventListener('click', window.nextBtnClickHandler);
}


// Applies visual effects based on toggle switch states
function applyEffects() {
  const flagContainer = document.getElementById('flag-container');
  if (!flagContainer) {
       console.warn("applyEffects: Flag container not found.");
       return;
  }

  // Helper function to toggle class based on checkbox state
  const toggleEffectClass = (element, toggleId, className) => {
      const toggle = document.getElementById(toggleId);
      if (toggle) {
          if (toggle.checked) {
              element.classList.add(className);
          } else {
              element.classList.remove(className);
          }
      } else {
          console.warn(`Toggle switch with ID "${toggleId}" not found.`);
      }
  };

  toggleEffectClass(flagContainer, 'grayscaleToggle', 'grayscale');
  toggleEffectClass(flagContainer, 'invertToggle', 'invert');
  toggleEffectClass(flagContainer, 'pixelateToggle', 'pixelate');
  toggleEffectClass(flagContainer, 'glitchToggle', 'glitch');

  // console.log("Applied visual effects based on toggles."); // Can be verbose
}
// --- END OF FILE ui/gameUI.js ---
