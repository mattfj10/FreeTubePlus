import i18n from '../../i18n/index'

const STORAGE_KEY = 'freetube-tabs-v1'
const APP_NAME = 'FreeTube'

function formatTabTitle(title) {
  return title === APP_NAME ? title : `${title} - ${APP_NAME}`
}

function getFallbackTabTitle(path) {
  if (path === '/' || path === '/subscriptions') {
    return formatTabTitle(i18n.global.t('Subscriptions.Subscriptions'))
  }

  if (path === '/subscribedchannels') {
    return formatTabTitle(i18n.global.t('Channels.Channels'))
  }

  if (path === '/trending') {
    return formatTabTitle(i18n.global.t('Trending.Trending'))
  }

  if (path === '/popular') {
    return formatTabTitle(i18n.global.t('Most Popular'))
  }

  if (path === '/userplaylists') {
    return formatTabTitle(i18n.global.t('Your Playlists'))
  }

  if (path === '/history') {
    return formatTabTitle(i18n.global.t('History.History'))
  }

  if (path === '/settings/profile') {
    return formatTabTitle(i18n.global.t('Profile Settings'))
  }

  if (path === '/settings') {
    return formatTabTitle(i18n.global.t('Settings.Settings'))
  }

  if (path === '/about') {
    return formatTabTitle(i18n.global.t('About.About'))
  }

  if (path.startsWith('/search/')) {
    return formatTabTitle(i18n.global.t('Search Results'))
  }

  if (path.startsWith('/playlist/')) {
    return formatTabTitle(i18n.global.t('Playlist'))
  }

  if (path.startsWith('/channel/')) {
    return formatTabTitle(i18n.global.t('Channel'))
  }

  if (path.startsWith('/watch/')) {
    return formatTabTitle(i18n.global.t('Watch'))
  }

  if (path.startsWith('/hashtag/')) {
    return formatTabTitle(i18n.global.t('Hashtag'))
  }

  if (path.startsWith('/post/')) {
    return formatTabTitle(i18n.global.t('Post'))
  }

  return formatTabTitle(i18n.global.t('New Tab'))
}

/**
 * @param {number} id
 * @param {string} path
 * @param {Record<string, string>} query
 * @param {string} title
 */
function createTab(id, path, query = {}, title = '') {
  return {
    id,
    title: title || getFallbackTabTitle(path),
    path,
    query,
    searchQueryText: '',
    lastVisitedAt: Date.now()
  }
}

function getLandingPath(rootGetters) {
  return `/${rootGetters.getLandingPage || 'subscriptions'}`
}

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      nextTabId: state.nextTabId
    }))
  } catch {
    // Ignore storage errors and keep runtime tab state.
  }
}

/**
 * @param {unknown} value
 */
function isValidTab(value) {
  return typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    typeof value.path === 'string' &&
    typeof value.query === 'object' &&
    value.query !== null
}

const state = {
  tabs: [],
  activeTabId: null,
  nextTabId: 1
}

const getters = {
  getTabs(state) {
    return state.tabs
  },

  getActiveTabId(state) {
    return state.activeTabId
  },

  getActiveTab(state) {
    return state.tabs.find((tab) => tab.id === state.activeTabId) ?? null
  },

  getTabById: (state) => (id) => {
    return state.tabs.find((tab) => tab.id === id) ?? null
  },

  getHasMultipleTabs(state) {
    return state.tabs.length > 1
  }
}

const actions = {
  initializeTabs({ state, commit, dispatch, rootGetters }, { path = '/', query = {} } = {}) {
    if (state.tabs.length > 0) {
      return
    }

    const fallbackPath = path === '/' ? getLandingPath(rootGetters) : path

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const parsed = JSON.parse(saved)
        const tabs = Array.isArray(parsed.tabs) ? parsed.tabs.filter(isValidTab) : []
        const nextTabId = Number.isInteger(parsed.nextTabId) ? parsed.nextTabId : 1
        const activeTabId = Number.isInteger(parsed.activeTabId) ? parsed.activeTabId : null

        if (tabs.length > 0) {
          const highestId = Math.max(...tabs.map((tab) => tab.id))
          commit('setTabsState', {
            tabs: tabs.map((tab) => ({
              id: tab.id,
              title: typeof tab.title === 'string' && tab.title.length > 0 ? tab.title : getFallbackTabTitle(tab.path),
              path: tab.path,
              query: tab.query,
              searchQueryText: typeof tab.searchQueryText === 'string' ? tab.searchQueryText : '',
              lastVisitedAt: Number.isFinite(tab.lastVisitedAt) ? tab.lastVisitedAt : Date.now()
            })),
            activeTabId: tabs.some((tab) => tab.id === activeTabId) ? activeTabId : tabs[0].id,
            nextTabId: Math.max(nextTabId, highestId + 1)
          })
          return
        }
      }
    } catch {
      // Ignore restore errors and bootstrap a fresh tab state.
    }

    dispatch('createTab', { path: fallbackPath, query })
  },

  createTab({ state, commit, dispatch }, { path = '/subscriptions', query = {}, title = '', searchQueryText = '' } = {}) {
    const tab = createTab(state.nextTabId, path, query, title)
    tab.searchQueryText = searchQueryText
    commit('addTab', tab)
    commit('setActiveTabId', tab.id)
    dispatch('persistTabs')
    return tab
  },

  activateTab({ state, commit, dispatch }, tabId) {
    if (!state.tabs.some((tab) => tab.id === tabId)) {
      return
    }

    commit('setActiveTabId', tabId)
    dispatch('persistTabs')
  },

  closeTab({ state, commit, dispatch, rootGetters }, tabId) {
    const index = state.tabs.findIndex((tab) => tab.id === tabId)
    if (index === -1) {
      return null
    }

    commit('removeTab', tabId)

    if (state.tabs.length === 0) {
      const tab = createTab(state.nextTabId, getLandingPath(rootGetters), {})
      commit('addTab', tab)
      commit('setActiveTabId', tab.id)
      dispatch('persistTabs')
      return tab
    }

    if (state.activeTabId === tabId) {
      const fallbackTab = state.tabs[index] ?? state.tabs[index - 1] ?? state.tabs[0]
      commit('setActiveTabId', fallbackTab.id)
    }

    dispatch('persistTabs')
    return state.tabs.find((tab) => tab.id === state.activeTabId) ?? null
  },

  updateActiveTabRoute({ state, commit, dispatch }, { path, query = {}, title = '' }) {
    if (state.activeTabId == null || typeof path !== 'string') {
      return
    }

    commit('setTabRoute', {
      id: state.activeTabId,
      path,
      query,
      title: title || getFallbackTabTitle(path)
    })
    dispatch('persistTabs')
  },

  setActiveTabTitle({ state, commit, dispatch }, title) {
    if (state.activeTabId == null) {
      return
    }

    commit('setTabTitle', {
      id: state.activeTabId,
      title: typeof title === 'string' ? title : ''
    })
    dispatch('persistTabs')
  },

  persistTabs({ state }) {
    persistState(state)
  }
}

const mutations = {
  setTabsState(state, { tabs, activeTabId, nextTabId }) {
    state.tabs = tabs
    state.activeTabId = activeTabId
    state.nextTabId = nextTabId
  },

  addTab(state, tab) {
    state.tabs.push(tab)
    state.nextTabId += 1
  },

  removeTab(state, id) {
    state.tabs = state.tabs.filter((tab) => tab.id !== id)
  },

  setActiveTabId(state, id) {
    state.activeTabId = id
  },

  setTabRoute(state, { id, path, query, title }) {
    const tab = state.tabs.find((entry) => entry.id === id)
    if (tab != null) {
      tab.path = path
      tab.query = query
      tab.title = title
      tab.lastVisitedAt = Date.now()
    }
  },

  setTabTitle(state, { id, title }) {
    const tab = state.tabs.find((entry) => entry.id === id)
    if (tab != null) {
      tab.title = title
      tab.lastVisitedAt = Date.now()
    }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
