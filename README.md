# Hide X Posts from Country

![Extension Demonstration](demo.gif)

A Chrome extension that automatically hides posts from specific countries on X (formerly Twitter). Select which countries to block through an easy-to-use popup interface, and the extension will hide posts from users in those locations.

## Sponsor

Shiori, the best AI Chat App on the market.

[![Shiori AI](https://www.shiori.ai/og-image.png)](https://shiori.ai/?ref=github-hide-x-posts)

## Features

- 🌍 Hide posts from 50+ countries
- 🔍 Search and filter countries easily
- 💾 Automatic caching of user locations
- ⚡ Real-time post filtering
- 🎨 Clean, Twitter-like interface

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension directory
6. The extension icon should appear in your Chrome toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Search for countries you want to block
3. Check the boxes next to countries to block their posts
4. Visit X/Twitter - posts from blocked countries will be automatically hidden
5. To unblock a country, simply uncheck it in the popup

## How It Works

The extension:
1. Monitors the X/Twitter timeline for new posts
2. Extracts the username from each post
3. Fetches the user's location from Twitter's API (with caching)
4. Matches the location against selected countries
5. Hides posts from users in blocked countries

Location data is cached for 30 days to minimize API requests and improve performance.

## Technical Details

### Files

- `manifest.json` - Extension configuration
- `content.js` - Main script that runs on X/Twitter pages
- `popup.html` - Settings interface HTML
- `popup.js` - Settings interface logic
- `styles.css` - Styles for hidden posts
- `create-icons.html` - Icon generator utility

### Permissions

- `storage` - Save blocked countries and location cache
- `activeTab` - Access X/Twitter pages
- Host permissions for `twitter.com` and `x.com`

### Browser Compatibility

- Chrome/Chromium-based browsers (Manifest V3)
- Edge, Brave, Opera (untested but should work)

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- Location information is fetched directly from Twitter's API
- The extension only processes data on X/Twitter pages

## Limitations

- Country detection relies on user-entered location text
- Not all users have location information in their profiles
- Location text matching uses common patterns (may not catch all variations)
- For better accuracy, consider integrating a geocoding service

## Future Enhancements

- Support for more countries and location patterns
- Integration with geocoding APIs for better accuracy
- Statistics dashboard
- Export/import blocked country lists
- Whitelist specific accounts

## Troubleshooting

### Posts not being hidden

- Make sure you've selected countries in the popup
- Check that the extension is enabled
- Refresh the X/Twitter page
- Some users may not have location information in their profiles

### Performance issues

- The extension caches location data to minimize API calls
- Clear the cache by removing and reinstalling the extension if needed

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
