/**
 * Shared extension runtime configuration.
 *
 * Update these two origins when moving from local development to deployed URLs.
 */
(function () {
    const BACKEND_ORIGIN = 'https://api.vantagecode.tech';
    const APP_ORIGIN = 'https://vantagecode.tech';
    const LEETCODE_ORIGIN = 'https://leetcode.com';

    const appHostname = new URL(APP_ORIGIN).hostname;
    const appHostnames = Array.from(new Set([
        appHostname,
        appHostname.startsWith('www.') ? appHostname.slice(4) : `www.${appHostname}`,
    ]));
    const appTabQueries = appHostnames.map((h) => `https://${h}/*`);

    const config = {
        BACKEND_ORIGIN,
        APP_ORIGIN,
        LEETCODE_ORIGIN,

        BACKEND_SYNC_URL: `${BACKEND_ORIGIN}/api/sync`,
        BACKEND_ATTEMPT_URL: `${BACKEND_ORIGIN}/api/sync/attempt`,
        BACKEND_USERS_URL: `${BACKEND_ORIGIN}/api/users`,

        LEETCODE_GRAPHQL_URL: `${LEETCODE_ORIGIN}/graphql`,

        APP_LOGIN_URL: `${APP_ORIGIN}/login`,
        APP_TAB_QUERY: `${APP_ORIGIN}/*`,
        APP_TAB_QUERIES: appTabQueries,
        LEETCODE_TAB_QUERY: `${LEETCODE_ORIGIN}/*`,

        APP_HOSTNAME: appHostname,
        APP_HOSTNAMES: appHostnames,
    };

    globalThis.VANTAGE_CONFIG = Object.freeze(config);
})();
