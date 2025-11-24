// List of countries with flags and codes
const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
];

let blockedCountries = new Set();
let filteredCountries = countries;
let showOverlay = false;

// Load settings from storage
async function loadSettings() {
  const data = await chrome.storage.local.get(['blockedCountries', 'showOverlay']);
  if (data.blockedCountries) {
    blockedCountries = new Set(data.blockedCountries);
  }
  if (data.showOverlay !== undefined) {
    showOverlay = data.showOverlay;
    document.getElementById('showOverlay').checked = showOverlay;
  }
  updateStats();
  renderCountries();
}

// Save settings to storage
async function saveSettings() {
  await chrome.storage.local.set({
    blockedCountries: Array.from(blockedCountries),
    showOverlay: showOverlay
  });
  updateStats();
}

// Update stats display
function updateStats() {
  document.getElementById('blockedCount').textContent = blockedCountries.size;
}

// Render country list
function renderCountries() {
  const listElement = document.getElementById('countryList');
  listElement.innerHTML = '';

  if (filteredCountries.length === 0) {
    listElement.innerHTML = '<div class="no-results">No countries found</div>';
    return;
  }

  filteredCountries.forEach(country => {
    const item = document.createElement('div');
    item.className = 'country-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = blockedCountries.has(country.code);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        blockedCountries.add(country.code);
      } else {
        blockedCountries.delete(country.code);
      }
      saveSettings();
    });

    const flag = document.createElement('span');
    flag.className = 'country-flag';
    flag.textContent = country.flag;

    const name = document.createElement('span');
    name.className = 'country-name';
    name.textContent = country.name;

    const code = document.createElement('span');
    code.className = 'country-code';
    code.textContent = country.code;

    item.appendChild(checkbox);
    item.appendChild(flag);
    item.appendChild(name);
    item.appendChild(code);

    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    listElement.appendChild(item);
  });
}

// Search functionality
document.getElementById('searchBox').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(query) ||
    country.code.toLowerCase().includes(query)
  );
  renderCountries();
});

// Overlay toggle functionality
document.getElementById('showOverlay').addEventListener('change', (e) => {
  showOverlay = e.target.checked;
  saveSettings();
});

// Initialize
loadSettings();
