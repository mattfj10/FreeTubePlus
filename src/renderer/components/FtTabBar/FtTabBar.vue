<template>
  <div class="tabBar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tabButton"
      :class="{ isActive: tab.id === activeTabId }"
      :title="tab.title || fallbackTitle"
      type="button"
      @click="$emit('activate-tab', tab.id)"
    >
      <span class="tabTitle">{{ tab.title || fallbackTitle }}</span>
      <span
        class="closeButton"
        :title="t('Close')"
        role="button"
        tabindex="0"
        @click.stop="$emit('close-tab', tab.id)"
        @keydown.enter.stop="$emit('close-tab', tab.id)"
      >
        <FontAwesomeIcon :icon="['fas', 'xmark']" />
      </span>
    </button>

    <button
      class="newTabButton"
      type="button"
      :title="t('New Tab')"
      @click="$emit('create-tab')"
    >
      <FontAwesomeIcon :icon="['fas', 'plus']" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeTabId: {
    type: Number,
    default: null
  }
})

defineEmits(['create-tab', 'activate-tab', 'close-tab'])

const { t } = useI18n()
const fallbackTitle = computed(() => t('New Tab'))
</script>

<style scoped>
.tabBar {
  align-items: center;
  background-color: var(--card-bg-color);
  border-block-end: 1px solid var(--tertiary-color);
  display: flex;
  gap: 6px;
  inline-size: 100%;
  inset-block-start: 60px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 6px 10px;
  position: sticky;
  scrollbar-width: thin;
  z-index: 3;
}

.tabButton {
  align-items: center;
  background-color: var(--tertiary-color);
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--primary-text-color);
  cursor: pointer;
  display: inline-flex;
  flex: 0 1 220px;
  gap: 10px;
  max-inline-size: 220px;
  min-inline-size: 0;
  padding: 6px 10px;
}

.tabButton.isActive {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-with-main-color);
}

.tabTitle {
  flex: 1 1 auto;
  overflow: hidden;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.closeButton {
  align-items: center;
  border-radius: 50%;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
  padding: 3px;
}

.closeButton:hover {
  background-color: var(--side-nav-hover-color);
}

.newTabButton {
  align-items: center;
  background-color: transparent;
  border: 1px solid var(--tertiary-color);
  border-radius: 8px;
  color: var(--primary-text-color);
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
  padding: 6px 10px;
}

@media only screen and (width <= 680px) {
  .tabBar {
    inset-block-start: 60px;
    padding-inline: 8px;
  }

  .tabButton {
    flex-basis: 180px;
    max-inline-size: 180px;
  }
}
</style>
