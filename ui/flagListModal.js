import { i18n } from '../utils/i18n.js';
import { countries, language } from '../script.js';

export function showFlagListModal() {
  const modal = document.getElementById('flag-list-modal');
  modal.style.display = 'block';
  fillFlagListContent();
  document.getElementById('closeFlagList').title = i18n[language].modalClose;
  document.querySelector('[data-i18n="flagListTitle"]').textContent = i18n[language].flagListTitle;
  setTimeout(initFlagListHover, 0);
}

export function fillFlagListContent() {
  const flagListContent = document.getElementById('flagListContent');
  if (!countries.length) {
    flagListContent.innerHTML = "<div>Keine Länder gefunden.</div>";
    return;
  }
  const byContinent = {};
  countries.forEach(c => {
    if (!Array.isArray(c.continents)) return;
    c.continents.forEach(cont => {
      if (!byContinent[cont]) byContinent[cont] = [];
      byContinent[cont].push(c);
    });
  });
  const order = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania", "Antarctic", "Americas"];
  let html = '';
  for (const contKey of order) {
    let continentCountries = [];
    if (contKey === "North America") {
      continentCountries = countries.filter(c => c.continents.includes("Americas") && c.subregion === "North America");
      if (!continentCountries.length) continue;
    } else if (contKey === "South America") {
      continentCountries = countries.filter(c => c.continents.includes("Americas") && c.subregion === "South America");
      if (!continentCountries.length) continue;
    } else if (byContinent[contKey]) {
      continentCountries = byContinent[contKey];
    }
    if (!continentCountries || !continentCountries.length) continue;
    const sorted = continentCountries.slice().sort((a, b) => {
      const nameA = (language === 'de' ? a.translations.deu.common : a.name.common);
      const nameB = (language === 'de' ? b.translations.deu.common : b.name.common);
      return nameA.localeCompare(nameB, language);
    });
    html += `<div class="flag-list-continent"><h4>${i18n[language].continents[contKey] || contKey}</h4>\n`;
    for (const c of sorted) {
      html += `<div class="flag-list-entry" 
        data-cca3="${c.cca3 || ''}" 
        data-flag="${encodeURIComponent(c.flags.svg)}"
        data-countryname="${encodeURIComponent(language === 'de' ? c.translations.deu.common : c.name.common)}"
        data-countryname-de="${encodeURIComponent(c.translations.deu.common)}"
        data-countryname-en="${encodeURIComponent(c.name.common)}"
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
      let svgData = '';
      if (/\.svg$/i.test(c.flags.svg)) {
        svgData = `<img src="${c.flags.svg}" alt="${i18n[language].flagAlt(language === 'de' ? c.translations.deu.common : c.name.common)}" width="34" height="22">`;
      } else {
        svgData = `<span>${i18n[language].flagListNoSVG}</span>`;
      }
      html += svgData + `<span class="flag-list-countryname">${language === 'de' ? c.translations.deu.common : c.name.common
        }</span>`;
      if (language === 'de' && c.name.common !== c.translations.deu.common) {
        html += `<span class="flag-list-countryname-sub">(${c.name.common})</span>`;
      } else if (language === 'en' && c.translations.deu.common !== c.name.common) {
        html += `<span class="flag-list-countryname-sub">(${c.translations.deu.common})</span>`;
      }
      html += `</div>\n`;
    }
    html += `</div>\n`;
  }
  flagListContent.innerHTML = html;
}

export function initFlagListHover() {
  removeFlagListHoverPopup();
  const entries = document.querySelectorAll('.flag-list-entry');
  for (const entry of entries) {
    entry.addEventListener('mouseenter', flagListEntryMouseEnter);
    entry.addEventListener('mouseleave', flagListEntryMouseLeave);
    entry.addEventListener('mousemove', flagListEntryMouseMove);
    entry.addEventListener('focus', flagListEntryMouseEnter);
    entry.addEventListener('blur', flagListEntryMouseLeave);
  }
}

function removeFlagListHoverPopup() {
  const popup = document.getElementById('flag-hover-popup');
  if (popup) popup.remove();
}

function flagListEntryMouseEnter(e) {
  const target = e.currentTarget;
  const flagUrl = decodeURIComponent(target.getAttribute('data-flag'));
  const cca3 = target.getAttribute('data-cca3');
  const c = countries.find(c=>c.cca3 === cca3);
  const displayName = decodeURIComponent(language==="de" ? target.getAttribute('data-countryname-de') : target.getAttribute('data-countryname-en'));
  let html =
    `<div class="flag-hover-img">
      <img src="${flagUrl}" width="183" height="116" alt="${displayName}" />
    </div>
    <div class="flag-hover-meta">
      ${c ? getCountryDetailText(c) : ""}
    </div>`;
  let popup = document.createElement('div');
  popup.id = 'flag-hover-popup';
  popup.innerHTML = html;
  popup.className = 'flag-hover-popup info-redesign';
  document.body.appendChild(popup);
  positionFlagHoverPopup(e);
  // Name row is bold, so for long country names we set the popup width
  const nameRow = popup.querySelector('.flag-detail-row b');
  if (nameRow && nameRow.scrollWidth > nameRow.clientWidth) {
    popup.style.minWidth = (nameRow.scrollWidth + 135) + 'px';
    popup.style.maxWidth = '540px';
    nameRow.style.maxWidth = (nameRow.scrollWidth + 26) + "px";
  }
}

function flagListEntryMouseLeave(e) {
  removeFlagListHoverPopup();
}

function flagListEntryMouseMove(e) {
  positionFlagHoverPopup(e);
}

function positionFlagHoverPopup(e) {
  const popup = document.getElementById('flag-hover-popup');
  if (!popup) return;
  let x = e.clientX + 20;
  let y = e.clientY + 11;
  const rect = popup.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 10) x = window.innerWidth - rect.width - 10;
  if (y + rect.height > window.innerHeight - 10) y = window.innerHeight - rect.height - 10;
  if (x < 6) x = 6;
  if (y < 6) y = 6;
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
}

// Minimal, just for displaying in the flag list popup
function formatNum(n) {
  if (!n && n !== 0) return "";
  return n.toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
}

function getCountryDetailText(c) {
  // Only include: Name, Capital, Languages, Population, Area
  const l18n = i18n[language].flagListData;
  let result = '';
  const countryName = (language === 'de')
    ? c.translations.deu.common
    : c.name.common;
  result += `<div class="flag-detail-row"><b>${countryName}</b></div>`;
  const cap = Array.isArray(c.capital) ? c.capital.join(', ') : (c.capital || "");
  if (cap) result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.capital}:</span> <span>${cap}</span></div>`;
  if (c.languages) {
    const langs = Object.values(c.languages).join(', ');
    result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.languages}:</span> <span>${langs}</span></div>`;
  }
  if (c.population) result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.population}:</span> <span>${formatNum(Number(c.population))}</span></div>`;
  if (c.area) result += `<div class="flag-detail-row"><span class="flag-detail-label">${l18n.area}:</span> <span>${formatNum(Number(c.area))} km²</span></div>`;
  return result;
}