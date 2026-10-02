/** Stable host id for the injected sidebar. */
export const SIDEBAR_HOST_ID = 'vendelo-fb-root'

/** Width reserved for the sidebar when open (px). */
export const SIDEBAR_WIDTH_PX = 360

/** localStorage key for open/collapsed preference. */
export const SIDEBAR_OPEN_STORAGE_KEY = 'vendelo360:fb-sidebar-open:v1'

/** chrome.storage.local key for publish draft (survives group navigations). */
export const PUBLISH_DRAFT_STORAGE_KEY = 'vendelo360:fb-publish-draft:v1'

/**
 * chrome.storage.local key for per-tab publish sessions.
 * Value: Record<string, TabPublishSession> keyed by String(tabId).
 */
export const TAB_SESSIONS_STORAGE_KEY = 'vendelo360:fb-tab-sessions:v1'
