import { i18n } from '../utils/i18n.js';
import { countries, language } from '../script.js'; // Importiere 'countries' und 'language'

// Zeigt das Modal an und füllt es
export function showFlagListModal() {
  const modal = document.getElementById('flag-list-modal');
  if (!modal) return; // Sicherheitscheck
  modal.style.display = 'block';
  fillFlagListContent(); // Inhalt füllen
  // UI-Texte aktualisieren
  const closeBtn = document.getElementById('closeFlagList');
  if (closeBtn) closeBtn.title = i18n[language].modalClose;
  const titleEl = document.querySelector('#flag-list-modal [data-i18n="flagListTitle"]');
  if (titleEl) titleEl.textContent = i18n[language].flagListTitle;
  // Hover-Effekte initialisieren (mit kleiner Verzögerung)
  setTimeout(initFlagListHover, 0);
}

// Füllt den Inhalt der Flaggenliste, gruppiert nach Kontinenten
export function fillFlagListContent() {
  const flagListContent = document.getElementById('flagListContent');
  if (!flagListContent) return; // Sicherheitscheck

  // Prüfen, ob Länderdaten vorhanden sind
  if (!countries || countries.length === 0) {
    flagListContent.innerHTML = `<div>${i18n[language].flagListNoData || 'Keine Länderdaten gefunden.'}</div>`; // Fallback-Text
    return;
  }

  // Definiere die gewünschte Reihenfolge der Kontinente im Output
  const continentOrder = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania", "Antarctic"];
  let html = ''; // String für das generierte HTML

  // Iteriere durch die gewünschte Reihenfolge
  for (const continentKey of continentOrder) {
    let countriesForContinent = []; // Array für die Länder dieses Kontinents

    // === Angepasste Filterlogik ===
    if (continentKey === "North America") {
      countriesForContinent = countries.filter(c =>
        (c.continents?.includes("North America")) || // Direkter Treffer für Kontinent
        (c.continents?.includes("Americas") && c.subregion === "North America") // Oder Kontinent "Americas" und Subregion "North America"
      );
    } else if (continentKey === "South America") {
      countriesForContinent = countries.filter(c =>
        (c.continents?.includes("South America")) || // Direkter Treffer für Kontinent
        (c.continents?.includes("Americas") && c.subregion === "South America") // Oder Kontinent "Americas" und Subregion "South America"
      );
    } else {
      // Standardfilter für andere Kontinente
      countriesForContinent = countries.filter(c => c.continents?.includes(continentKey));
    }
    // ============================

    // Überspringe diesen Kontinent, wenn keine Länder gefunden wurden
    if (!countriesForContinent || countriesForContinent.length === 0) {
      continue;
    }

    // Sortiere die gefundenen Länder alphabetisch nach dem Namen in der aktuellen Sprache
    const sortedCountries = countriesForContinent.slice().sort((a, b) => {
      // Namen sicher abrufen, mit Fallback auf Englisch oder leeren String
      const nameA = (language === 'de' ? a.translations?.deu?.common : a.name?.common) || a.name?.common || '';
      const nameB = (language === 'de' ? b.translations?.deu?.common : b.name?.common) || b.name?.common || '';
      return nameA.localeCompare(nameB, language); // Korrekter Vergleich mit localeCompare
    });

    // Füge die Überschrift für den Kontinent hinzu (übersetzt)
    html += `<div class="flag-list-continent"><h4>${i18n[language].continents[continentKey] || continentKey}</h4>\n`;

    // Füge jeden Ländereintrag für diesen Kontinent hinzu
    for (const c of sortedCountries) {
      // Namen für Anzeige und Fallback
      const displayName = (language === 'de' ? c.translations?.deu?.common : c.name?.common) || c.name?.common;
      const altName = (language === 'de' ? c.name?.common : c.translations?.deu?.common);
      const showAltName = altName && altName !== displayName; // Nur anzeigen, wenn unterschiedlich

      // SVG-URL sicher abrufen
      const flagSvgUrl = c.flags?.svg || '';

      html += `<div class="flag-list-entry"
        data-cca3="${c.cca3 || ''}"
        data-flag="${encodeURIComponent(flagSvgUrl)}"
        data-countryname="${encodeURIComponent(displayName || '')}"
        data-countryname-de="${encodeURIComponent(c.translations?.deu?.common || '')}"
        data-countryname-en="${encodeURIComponent(c.name?.common || '')}"
        data-capital="${encodeURIComponent(Array.isArray(c.capital) ? c.capital.join(', ') : (c.capital || ''))}"
        data-population="${c.population || ''}"
        data-area="${c.area || ''}"
        data-region="${encodeURIComponent(c.region || '')}"
        data-subregion="${encodeURIComponent(c.subregion || '')}"
        data-demonyms-de="${encodeURIComponent(c.demonyms?.deu?.m || '')}"
        data-demonyms-en="${encodeURIComponent(c.demonyms?.eng?.m || '')}"
        data-currencies='${encodeURIComponent(JSON.stringify(c.currencies||{}))}'
        data-languages='${encodeURIComponent(JSON.stringify(c.languages||{}))}'
      >`;

      // Flaggenbild oder Hinweis, wenn SVG fehlt
      if (flagSvgUrl) {
        html += `<img src="${flagSvgUrl}" alt="${i18n[language].flagAlt(displayName || 'Unbekannt')}" width="34" height="22" loading="lazy">`; // lazy loading hinzugefügt
      } else {
        html += `<span class="flag-list-no-svg-placeholder">${i18n[language].flagListNoSVG || 'SVG?'}</span>`; // Platzhalter-Text
      }

      // Ländername
      html += `<span class="flag-list-countryname">${displayName || 'Unbekannter Name'}</span>`;

      // Alternativer Name (in Klammern), wenn vorhanden und unterschiedlich
      if (showAltName) {
        html += `<span class="flag-list-countryname-sub">(${altName})</span>`;
      }

      html += `</div>\n`; // Schließt .flag-list-entry
    }
    html += `</div>\n`; // Schließt .flag-list-continent
  }

  // Setze das generierte HTML in das Container-Element
  flagListContent.innerHTML = html;
}

// Initialisiert die Hover-Effekte für die Listeneinträge
export function initFlagListHover() {
  removeFlagListHoverPopup(); // Bestehendes Popup entfernen
  const entries = document.querySelectorAll('.flag-list-entry');
  entries.forEach(entry => {
    entry.addEventListener('mouseenter', flagListEntryMouseEnter);
    entry.addEventListener('mouseleave', flagListEntryMouseLeave);
    entry.addEventListener('mousemove', flagListEntryMouseMove);
    entry.addEventListener('focus', flagListEntryMouseEnter); // Für Tastaturnavigation
    entry.addEventListener('blur', flagListEntryMouseLeave);  // Für Tastaturnavigation
  });
}

// Entfernt das Flaggen-Info-Popup
function removeFlagListHoverPopup() {
  const popup = document.getElementById('flag-hover-popup');
  if (popup) popup.remove();
}

// Event-Handler für Mouse Enter auf einem Listeneintrag -> Popup anzeigen
function flagListEntryMouseEnter(e) {
  removeFlagListHoverPopup(); // Sicherstellen, dass kein altes Popup da ist
  const target = e.currentTarget;
  const cca3 = target.getAttribute('data-cca3');
  const country = countries.find(c => c.cca3 === cca3); // Finde das volle Länderobjekt

  if (!country) return; // Nichts tun, wenn Land nicht gefunden wurde

  const flagUrl = decodeURIComponent(target.getAttribute('data-flag'));
  const displayName = decodeURIComponent(target.getAttribute(`data-countryname-${language}`)) || decodeURIComponent(target.getAttribute('data-countryname'));

  // HTML für das Popup generieren
  let popupHtml =
    `<div class="flag-hover-img">
      <img src="${flagUrl}" width="183" height="116" alt="${displayName}" loading="lazy"/>
    </div>
    <div class="flag-hover-meta">
      ${getCountryDetailText(country)}
    </div>`;

  // Popup-Element erstellen und hinzufügen
  let popup = document.createElement('div');
  popup.id = 'flag-hover-popup';
  popup.className = 'flag-hover-popup info-redesign'; // Klassen für Styling
  popup.innerHTML = popupHtml;
  document.body.appendChild(popup);

  // Popup positionieren
  positionFlagHoverPopup(e);

  // Breite anpassen, falls Ländername zu lang ist
  const nameRow = popup.querySelector('.flag-detail-row b');
  if (nameRow && nameRow.scrollWidth > nameRow.clientWidth) {
    // Mindestbreite des Popups anpassen, um Namen + Bildbreite unterzubringen
    const requiredMetaWidth = nameRow.scrollWidth + 20; // Name + etwas Puffer
    const imageWidth = popup.querySelector('.flag-hover-img img')?.offsetWidth || 180;
    const gap = 20; // Geschätzter Abstand zwischen Bild und Meta
    popup.style.minWidth = `${imageWidth + gap + requiredMetaWidth}px`;
    popup.style.maxWidth = '540px'; // Maximalbreite beibehalten
  }
}

// Event-Handler für Mouse Leave -> Popup entfernen
function flagListEntryMouseLeave(e) {
  removeFlagListHoverPopup();
}

// Event-Handler für Mouse Move -> Popup-Position aktualisieren
function flagListEntryMouseMove(e) {
  positionFlagHoverPopup(e);
}

// Positioniert das Info-Popup relativ zum Mauszeiger
function positionFlagHoverPopup(e) {
  const popup = document.getElementById('flag-hover-popup');
  if (!popup) return;

  const margin = 15; // Abstand vom Mauszeiger und Fensterrand
  let x = e.clientX + margin;
  let y = e.clientY + margin;

  const rect = popup.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  // Kollisionserkennung mit Fensterrändern
  if (x + rect.width > winWidth - margin) {
    x = e.clientX - rect.width - margin; // Links vom Cursor anzeigen
  }
  if (y + rect.height > winHeight - margin) {
    y = e.clientY - rect.height - margin; // Oberhalb vom Cursor anzeigen
  }
  // Sicherstellen, dass es nicht aus dem Fenster oben/links ragt
  if (x < margin) x = margin;
  if (y < margin) y = margin;

  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
}

// Formatiert Zahlen für die Anzeige im Popup
function formatNum(n) {
  if (n === null || typeof n === 'undefined' || isNaN(n)) return "";
  return Number(n).toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
}

// Generiert den Detailtext für das Info-Popup
function getCountryDetailText(c) {
  if (!c) return ''; // Sicherheitscheck

  const l18n = i18n[language].flagListData; // Übersetzte Labels holen
  let result = '';

  // Ländername (fett)
  const countryName = (language === 'de' ? c.translations?.deu?.common : c.name?.common) || c.name?.common || 'N/A';
  result += `<div class="flag-detail-row"><b>${countryName}</b></div>`;

  // Hauptstadt
  const capital = Array.isArray(c.capital) ? c.capital.join(', ') : (c.capital || "");
  if (capital) result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.capital}:</span> <span>${capital}</span></div>`;

  // Sprachen (sicherer Zugriff und Formatierung)
  if (c.languages && Object.keys(c.languages).length > 0) {
    const langs = Object.values(c.languages).join(', ');
    result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.languages}:</span> <span>${langs}</span></div>`;
  }

  // Bevölkerung
  if (c.population) result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.population}:</span> <span>${formatNum(c.population)}</span></div>`;

  // Fläche
  if (c.area) result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.area}:</span> <span>${formatNum(c.area)} km²</span></div>`;

  return result;
}
