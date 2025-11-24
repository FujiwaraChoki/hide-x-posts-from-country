// This script runs in the page context and has access to cookies
// It can make authenticated requests to Twitter's API

(function() {
  console.log('X Posts Hider: Page script loaded');

  // Helper to get cookie value
  function getCookie(name) {
    const matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  // Listen for location requests from content script
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data.type !== 'GET_USER_LOCATION') return;

    const { username, requestId } = event.data;

    try {
      // Use AboutAccountQuery as suggested by the reference repo
      // This endpoint seems to be more stable for location data
      const queryId = 'XRqGa7EeokUU5kppkh13EA';
      const url = `/i/api/graphql/${queryId}/AboutAccountQuery`;

      // Note: 'screenName' (camelCase) is used for this query, not 'screen_name'
      const variables = {
        screenName: username
      };

      // Get CSRF token from cookies
      const csrfToken = getCookie('ct0');

      const response = await fetch(`${url}?variables=${encodeURIComponent(JSON.stringify(variables))}`, {
        method: 'GET',
        headers: {
          'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
          'x-twitter-active-user': 'yes',
          'x-twitter-auth-type': 'OAuth2Session',
          'x-twitter-client-language': 'en',
          'x-csrf-token': csrfToken || '',
          'content-type': 'application/json'
        }
      });

      if (!response.ok) {
        // Try to read error body if possible
        const errorText = await response.text().catch(() => '');
        console.error(`X Posts Hider: API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Path from reference repo: data.user_result_by_screen_name.result.about_profile.account_based_in
      const result = data?.data?.user_result_by_screen_name?.result;

      if (!result) {
        // User might not exist or be suspended
         throw new Error('User not found');
      }

      // Some users might not have location data
      const location = result.about_profile?.account_based_in || '';

      window.postMessage({
        type: 'USER_LOCATION_RESPONSE',
        requestId,
        username,
        location,
        success: true
      }, '*');

    } catch (error) {
      console.error(`X Posts Hider: Error fetching location for ${username}:`, error);
      window.postMessage({
        type: 'USER_LOCATION_RESPONSE',
        requestId,
        username,
        error: error.message
      }, '*');
    }
  });
})();
