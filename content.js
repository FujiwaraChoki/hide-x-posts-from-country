// Cache for user locations (username -> country code)
const locationCache = new Map();
const processingUsers = new Set();
const pendingRequests = new Map();
let requestIdCounter = 0;

// Load blocked countries and cache from storage
let blockedCountries = new Set();
let showOverlay = false;

// Inject page script to make authenticated API calls
function injectPageScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('pageScript.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
  console.log('X Posts Hider: Page script injected');
}

// Listen for messages from page script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type !== 'USER_LOCATION_RESPONSE') return;

  const { requestId, username, location, error, success } = event.data;
  const resolver = pendingRequests.get(requestId);

  if (resolver) {
    pendingRequests.delete(requestId);
    processingUsers.delete(username);

    if (success && location !== undefined) {
      const countryCode = extractCountryCode(location);
      const cacheEntry = {
        country: countryCode,
        location: location,
        timestamp: Date.now()
      };
      locationCache.set(username, cacheEntry);
      resolver.resolve(cacheEntry);
    } else {
      console.warn(`Failed to get location for ${username}:`, error);
      resolver.resolve(null);
    }
  }
});

// Initialize extension
async function init() {
  // Inject page script first
  injectPageScript();

  const data = await chrome.storage.local.get(['blockedCountries', 'locationCache', 'showOverlay']);

  if (data.blockedCountries) {
    blockedCountries = new Set(data.blockedCountries);
  }

  if (data.showOverlay !== undefined) {
    showOverlay = data.showOverlay;
  }

  if (data.locationCache) {
    Object.entries(data.locationCache).forEach(([user, location]) => {
      locationCache.set(user, location);
    });
  }

  console.log('Hide Posts from Country: Initialized', {
    blockedCountries: Array.from(blockedCountries),
    showOverlay: showOverlay,
    cachedUsers: locationCache.size
  });

  startObserving();
}

// Save cache periodically
setInterval(() => {
  const cacheObj = Object.fromEntries(locationCache);
  chrome.storage.local.set({ locationCache: cacheObj });
}, 30000); // Save every 30 seconds

// Extract username from tweet element
function extractUsername(element) {
  const usernameElement = element.querySelector('[data-testid="User-Name"]');
  if (!usernameElement) return null;

  const link = usernameElement.querySelector('a[href*="/"]');
  if (!link) return null;

  const href = link.getAttribute('href');
  const match = href.match(/^\/([^\/]+)/);

  if (match && match[1]) {
    const username = match[1];
    // Filter out system routes
    const systemRoutes = ['home', 'explore', 'notifications', 'messages', 'i', 'compose', 'settings', 'search'];
    if (systemRoutes.includes(username.toLowerCase())) return null;
    if (username.length === 0 || username.length > 20) return null;
    return username;
  }

  return null;
}

// Get user location via page script
async function getUserLocation(username) {
  if (locationCache.has(username)) {
    return locationCache.get(username);
  }

  if (processingUsers.has(username)) {
    return null;
  }

  processingUsers.add(username);

  return new Promise((resolve) => {
    const requestId = ++requestIdCounter;
    pendingRequests.set(requestId, { resolve, username });

    // Send request to page script
    window.postMessage({
      type: 'GET_USER_LOCATION',
      username: username,
      requestId: requestId
    }, '*');

    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        processingUsers.delete(username);
        console.warn(`Timeout fetching location for ${username}`);
        resolve(null);
      }
    }, 10000);
  });
}

// Extract country code from location string
function extractCountryCode(location) {
  if (!location) return null;

  // Common country mappings
  const countryPatterns = {
    'US': /\b(USA?|United States|America|US)\b/i,
    'GB': /\b(UK|United Kingdom|Britain|England|Scotland|Wales)\b/i,
    'CA': /\b(Canada|Canadian)\b/i,
    'AU': /\b(Australia|Australian)\b/i,
    'IN': /\b(India|Indian)\b/i,
    'DE': /\b(Germany|German|Deutschland)\b/i,
    'FR': /\b(France|French)\b/i,
    'JP': /\b(Japan|Japanese)\b/i,
    'BR': /\b(Brazil|Brazilian)\b/i,
    'MX': /\b(Mexico|Mexican)\b/i,
    'ES': /\b(Spain|Spanish|España)\b/i,
    'IT': /\b(Italy|Italian|Italia)\b/i,
    'RU': /\b(Russia|Russian)\b/i,
    'CN': /\b(China|Chinese)\b/i,
    'KR': /\b(Korea|Korean)\b/i,
    'NL': /\b(Netherlands|Dutch|Holland)\b/i,
    'SE': /\b(Sweden|Swedish)\b/i,
    'PL': /\b(Poland|Polish)\b/i,
    'TR': /\b(Turkey|Turkish)\b/i,
    'AR': /\b(Argentina|Argentine)\b/i,
  };

  for (const [code, pattern] of Object.entries(countryPatterns)) {
    if (pattern.test(location)) {
      return code;
    }
  }

  return null;
}

// Check if tweet should be hidden
async function shouldHideTweet(tweetElement) {
  const username = extractUsername(tweetElement);
  if (!username) return false;

  const locationData = await getUserLocation(username);
  if (!locationData || !locationData.country) return false;

  return blockedCountries.has(locationData.country);
}

// Hide tweet element
function hideTweet(tweetElement) {
  tweetElement.style.display = 'none';
  tweetElement.setAttribute('data-hidden-by-extension', 'true');
}

// Add overlay to tweet element
function addOverlayToTweet(tweetElement) {
  // Check if overlay already exists
  if (tweetElement.querySelector('.blocked-country-overlay')) {
    return;
  }

  tweetElement.style.position = 'relative';
  tweetElement.setAttribute('data-overlay-by-extension', 'true');

  const overlay = document.createElement('div');
  overlay.className = 'blocked-country-overlay';
  overlay.textContent = 'BLOCKED';

  tweetElement.appendChild(overlay);
}

// Remove overlay from tweet element
function removeOverlayFromTweet(tweetElement) {
  const overlay = tweetElement.querySelector('.blocked-country-overlay');
  if (overlay) {
    overlay.remove();
  }
  tweetElement.removeAttribute('data-overlay-by-extension');
  tweetElement.style.position = '';
}

// Block tweet (hide or add overlay based on settings)
function blockTweet(tweetElement) {
  if (showOverlay) {
    addOverlayToTweet(tweetElement);
  } else {
    hideTweet(tweetElement);
  }
}

// Process tweets
async function processTweets() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-processed])');

  for (const tweet of tweets) {
    tweet.setAttribute('data-processed', 'true');

    const shouldBlock = await shouldHideTweet(tweet);
    if (shouldBlock) {
      blockTweet(tweet);
    }
  }
}

// Observe DOM changes
function startObserving() {
  const observer = new MutationObserver(() => {
    processTweets();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial processing
  processTweets();
}

// Listen for storage changes (when user updates blocked countries or overlay setting)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    let shouldReprocess = false;

    if (changes.blockedCountries) {
      blockedCountries = new Set(changes.blockedCountries.newValue || []);
      console.log('Blocked countries updated:', Array.from(blockedCountries));
      shouldReprocess = true;
    }

    if (changes.showOverlay !== undefined) {
      showOverlay = changes.showOverlay.newValue;
      console.log('Show overlay updated:', showOverlay);
      shouldReprocess = true;
    }

    if (shouldReprocess) {
      // Re-process all tweets
      document.querySelectorAll('article[data-testid="tweet"]').forEach(tweet => {
        tweet.removeAttribute('data-processed');
        tweet.removeAttribute('data-hidden-by-extension');
        tweet.removeAttribute('data-overlay-by-extension');
        tweet.style.display = '';
        tweet.style.position = '';
        removeOverlayFromTweet(tweet);
      });

      processTweets();
    }
  }
});

// Start the extension
init();
