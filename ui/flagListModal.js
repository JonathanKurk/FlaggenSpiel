import { i18n } from '../utils/i18n.js';
import { countries, language } from '../script.js'; // Importiere 'countries' und 'language'

// Zeigt das Modal an und füllt es
export function showFlagListModal() {
  const modal = document.getElementById('flag-list-modal');
  if (!modal) return;
  modal.style.display = 'block';
  fillFlagListContent();
  const closeBtn = document.getElementById('closeFlagList');
  if (closeBtn) closeBtn.title = i18n[language].modalClose;
  const titleEl = document.querySelector('#flag-list-modal [data-i18n="flagListTitle"]');
  if (titleEl) titleEl.textContent = i18n[language].flagListTitle;
  setTimeout(initFlagListHover, 0);
}

// Füllt den Inhalt der Flaggenliste, gruppiert nach Kontinenten
export function fillFlagListContent() {
  const flagListContent = document.getElementById('flagListContent');
  if (!flagListContent) return;

  if (!countries || countries.length === 0) {
    flagListContent.innerHTML = `<div>${i18n[language].flagListNoData || 'Keine Länderdaten gefunden.'}</div>`;
    return;
  }

  const continentOrder = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania", "Antarctic"];
  let html = '';

  for (const continentKey of continentOrder) {
    let countriesForContinent = [];

    if (continentKey === "North America") {
      countriesForContinent = countries.filter(c =>
        (c.continents?.includes("North America")) ||
        (c.continents?.includes("Americas") && c.subregion === "North America")
      );
    } else if (continentKey === "South America") {
      countriesForContinent = countries.filter(c =>
        (c.continents?.includes("South America")) ||
        (c.continents?.includes("Americas") && c.subregion === "South America")
      );
    } else {
      countriesForContinent = countries.filter(c => c.continents?.includes(continentKey));
    }

    if (!countriesForContinent || countriesForContinent.length === 0) {
      continue;
    }

    const sortedCountries = countriesForContinent.slice().sort((a, b) => {
      const nameA = (language === 'de' ? a.translations?.deu?.common : a.name?.common) || a.name?.common || '';
      const nameB = (language === 'de' ? b.translations?.deu?.common : b.name?.common) || b.name?.common || '';
      return nameA.localeCompare(nameB, language);
    });

    html += `<div class="flag-list-continent"><h4>${i18n[language].continents[continentKey] || continentKey}</h4>\n`;

    for (const c of sortedCountries) {
      const displayName = (language === 'de' ? c.translations?.deu?.common : c.name?.common) || c.name?.common;
      const altName = (language === 'de' ? c.name?.common : c.translations?.deu?.common);
      const showAltName = altName && altName !== displayName;
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

      if (flagSvgUrl) {
        html += `<img src="${flagSvgUrl}" alt="${i18n[language].flagAlt(displayName || 'Unbekannt')}" width="34" height="22" loading="lazy">`;
      } else {
        html += `<span class="flag-list-no-svg-placeholder">${i18n[language].flagListNoSVG || 'SVG?'}</span>`;
      }

      html += `<span class="flag-list-countryname">${displayName || 'Unbekannter Name'}</span>`;

      if (showAltName) {
        html += `<span class="flag-list-countryname-sub">(${altName})</span>`;
      }

      html += `</div>\n`;
    }
    html += `</div>\n`;
  }

  flagListContent.innerHTML = html;
}

// Initialisiert die Hover-Effekte für die Listeneinträge
export function initFlagListHover() {
  removeFlagListHoverPopup();
  const entries = document.querySelectorAll('.flag-list-entry');
  entries.forEach(entry => {
    entry.addEventListener('mouseenter', flagListEntryMouseEnter);
    entry.addEventListener('mouseleave', flagListEntryMouseLeave);
    entry.addEventListener('mousemove', flagListEntryMouseMove);
    entry.addEventListener('focus', flagListEntryMouseEnter);
    entry.addEventListener('blur', flagListEntryMouseLeave);
  });
}

// Entfernt das Flaggen-Info-Popup
function removeFlagListHoverPopup() {
  const popup = document.getElementById('flag-hover-popup');
  if (popup) popup.remove();
}

// Event-Handler für Mouse Enter auf einem Listeneintrag -> Popup anzeigen
function flagListEntryMouseEnter(e) {
  removeFlagListHoverPopup();
  const target = e.currentTarget;
  const cca3 = target.getAttribute('data-cca3');

  // --- DEBUG LOG: Welches Land wird gesucht? ---
  // console.log("Hovering over entry with cca3:", cca3);
  // --- END DEBUG LOG ---

  const country = countries.find(c => c.cca3 === cca3);

  if (!country) {
     // --- DEBUG LOG: Land nicht gefunden ---
     console.warn("Country object not found in 'countries' array for cca3:", cca3);
     // --- END DEBUG LOG ---
     return;
  }
   // --- DEBUG LOG: Land gefunden ---
   // console.log("Found country object:", country);
   // --- END DEBUG LOG ---


  const flagUrl = decodeURIComponent(target.getAttribute('data-flag'));
  const displayName = decodeURIComponent(target.getAttribute(`data-countryname-${language}`)) || decodeURIComponent(target.getAttribute('data-countryname'));

  // HTML für das Popup generieren (ruft getCountryDetailText auf)
  let popupHtml =
    `<div class="flag-hover-img">
      <img src="${flagUrl}" width="183" height="116" alt="${displayName}" loading="lazy"/>
    </div>
    <div class="flag-hover-meta">
      ${getCountryDetailText(country)}
    </div>`;

  let popup = document.createElement('div');
  popup.id = 'flag-hover-popup';
  popup.className = 'flag-hover-popup info-redesign';
  popup.innerHTML = popupHtml;
  document.body.appendChild(popup);

  positionFlagHoverPopup(e);

  const nameRow = popup.querySelector('.flag-detail-row b');
  if (nameRow && nameRow.scrollWidth > nameRow.clientWidth) {
    const requiredMetaWidth = nameRow.scrollWidth + 20;
    const imageWidth = popup.querySelector('.flag-hover-img img')?.offsetWidth || 180;
    const gap = 20;
    popup.style.minWidth = `${imageWidth + gap + requiredMetaWidth}px`;
    popup.style.maxWidth = '540px';
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
  const margin = 15;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  const rect = popup.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  if (x + rect.width > winWidth - margin) {
    x = e.clientX - rect.width - margin;
  }
  if (y + rect.height > winHeight - margin) {
    y = e.clientY - rect.height - margin;
  }
  if (x < margin) x = margin;
  if (y < margin) y = y + rect.height + margin; // Try displaying below if insufficient space above
  if (y + rect.height > winHeight) { // If still too low, put above
      y = e.clientY - rect.height - margin;
  }
   if (y < margin) y = margin; // Final check to prevent going off top

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

  // --- DEBUG LOG: Zeige das empfangene Länderobjekt ---
  // console.log("getCountryDetailText received country data:", c);
  // --- END DEBUG LOG ---

  const l18n = i18n[language].flagListData; // Übersetzte Labels holen
  let result = ''; // HTML-String initialisieren

  // Ländername (fett)
  const countryName = (language === 'de' ? c.translations?.deu?.common : c.name?.common) || c.name?.common || 'N/A';
  result += `<div class="flag-detail-row"><b>${countryName}</b></div>`;
  // console.log("Added country name:", countryName); // DEBUG

  // Hauptstadt
  const capital = Array.isArray(c.capital) ? c.capital.join(', ') : (c.capital || "");
  if (capital) {
    result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.capital || 'Capital'}:</span> <span>${capital}</span></div>`;
    // console.log("Added capital:", capital); // DEBUG
  } else {
    // console.log("No capital data found for:", countryName); // DEBUG
  }

  // Sprachen (sicherer Zugriff und Formatierung)
  if (c.languages && Object.keys(c.languages).length > 0) {
    const langs = Object.values(c.languages).join(', ');
    result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.languages || 'Languages'}:</span> <span>${langs}</span></div>`;
    // console.log("Added languages:", langs); // DEBUG
  } else {
     // console.log("No languages data found for:", countryName); // DEBUG
  }

  // Bevölkerung
  if (typeof c.population !== 'undefined' && c.population !== null) { // Explizitere Prüfung
     const formattedPopulation = formatNum(c.population);
     result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.population || 'Population'}:</span> <span>${formattedPopulation}</span></div>`;
     // console.log("Added population:", formattedPopulation); // DEBUG
  } else {
     // console.log("No population data found for:", countryName); // DEBUG
  }

  // Fläche
  if (typeof c.area !== 'undefined' && c.area !== null) { // Explizitere Prüfung
    const formattedArea = formatNum(c.area);
    result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.area || 'Area'}:</span> <span>${formattedArea} km²</span></div>`;
    // console.log("Added area:", formattedArea + " km²"); // DEBUG
  } else {
     // console.log("No area data found for:", countryName); // DEBUG
  }


  // --- DEBUG LOG: Zeige das generierte HTML ---
  // console.log("Generated detail HTML:", result);
  // --- END DEBUG LOG ---

  return result;
}
