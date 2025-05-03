// --- START OF FILE platform.js ---
import { setUserPlatform } from './script.js';

// Funktion, die beim App-Start aufgerufen wird
export function checkPlatformChoice() {
    // Gibt ein Promise zurück, das aufgelöst wird, wenn die Plattform feststeht
    return new Promise((resolve) => {
        const platformChoice = localStorage.getItem('flagGamePlatform');
        const modal = document.getElementById('platform-select-modal');

        if (platformChoice) {
            // Wahl bereits getroffen, direkt setzen und Promise auflösen
            console.log("Platform choice found in localStorage:", platformChoice);
            setUserPlatform(platformChoice);
            // Sicherstellen, dass das Modal nicht sichtbar ist, falls es doch noch im DOM ist
            if (modal) modal.style.display = 'none';
            resolve(); // Signalisiert script.js, dass es weitergehen kann
        } else if (modal) {
            // Keine Wahl gespeichert UND Modal existiert im DOM -> Anzeigen
            console.log("No platform choice found, showing modal.");
            modal.style.display = 'flex'; // Modal sichtbar machen

            // Event Listener für die Buttons im Modal
            const pcButton = modal.querySelector('button[data-platform="pc"]');
            const androidButton = modal.querySelector('button[data-platform="android"]');

            // Funktion, die aufgerufen wird, wenn ein Button geklickt wird
            const handleChoice = (event) => {
                const chosenPlatform = event.target.dataset.platform;
                console.log("Platform chosen:", chosenPlatform);
                localStorage.setItem('flagGamePlatform', chosenPlatform); // Wahl speichern
                setUserPlatform(chosenPlatform); // Wahl im Skript setzen
                modal.style.display = 'none'; // Modal ausblenden

                // Wichtig: Listener entfernen, um Memory Leaks zu vermeiden
                pcButton.removeEventListener('click', handleChoice);
                androidButton.removeEventListener('click', handleChoice);

                resolve(); // Signalisiert script.js, dass es weitergehen kann
            };

            // Listener hinzufügen
            pcButton.addEventListener('click', handleChoice);
            androidButton.addEventListener('click', handleChoice);
        } else {
            // Fallback: Keine Wahl gespeichert und das Modal-Element wurde nicht gefunden
            console.warn("Platform choice modal element not found. Defaulting to PC.");
            setUserPlatform('pc'); // Standardmäßig PC annehmen
            resolve(); // Trotzdem auflösen, damit die App nicht blockiert
        }
    });
}
// --- END OF FILE platform.js ---
