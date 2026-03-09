// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Custom Styles
import '@/styles/main.css'
import '@mdi/font/css/materialdesignicons.css'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from '@/App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

app.config.warnHandler = (msg, instance, trace) => {
  if (msg.includes('Slot "default" invoked outside of the render function')) return
  console.warn(msg + trace)
}

registerPlugins(app)

app.mount('#app')
