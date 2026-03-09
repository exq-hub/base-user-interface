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
import { useErrorStore } from '@/stores/error'
import { HttpError } from '@/services/http'

const app = createApp(App)

app.config.warnHandler = (msg, instance, trace) => {
  if (msg.includes('Slot "default" invoked outside of the render function')) return
  console.warn(msg + trace)
}

registerPlugins(app)

app.config.errorHandler = (err) => {
  console.error(err)
  if (err instanceof HttpError) {
    const detail = JSON.stringify(
      { method: err.method, url: err.url, ...(err.body !== undefined && { body: err.body }) },
      null, 2
    )
    useErrorStore().show(err, detail)
  } else {
    useErrorStore().show(err)
  }
}

app.mount('#app')
