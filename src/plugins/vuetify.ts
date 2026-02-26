/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
// import { VNumberInput } from 'vuetify/labs/VNumberInput'
import { VFileUpload } from 'vuetify/labs/VFileUpload'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    // VNumberInput
    VFileUpload
  },
  theme: {
    defaultTheme: 'softDark',
    themes: {
      softDark: {
        dark: true,
        colors: {
          background: '#0F172A',  // slate-900-ish
          surface: '#111C33',     // slightly lighter
          'surface-variant': '#172554',
          'on-surface': '#E5E7EB',
          'on-background': '#E5E7EB',

          primary: '#22D3EE',     // cyan-400
          secondary: '#A78BFA',   // violet-400
          accent: '#34D399',      // emerald-400

          error: '#FB7185',       // rose-400
          warning: '#FBBF24',     // amber-400
          info: '#60A5FA',        // blue-400
          success: '#34D399',

          // Optional: for borders/lines in components that use "outline"
          outline: 'rgba(148, 163, 184, 0.28)', // slate-400 alpha
        },
      },
      graphiteDark: {
        dark: true,
        colors: {
          background: '#1F232B',  // graphite
          surface: '#262B35',     // raised surface
          'surface-variant': '#2E3442',

          'on-background': '#E6EAF2',
          'on-surface': '#E6EAF2',

          primary: '#4CC9F0',     // cyan-ish
          secondary: '#B8A1FF',   // soft violet
          accent: '#55D6BE',      // mint

          error: '#FF6B8B',
          warning: '#F6C177',
          info: '#7AA2F7',
          success: '#5AD6A6',

          outline: 'rgba(255, 255, 255, 0.12)',
        },
      }
    }
  },
  defaults: {
    VBtn: { variant: 'text' },
    VTextField: { variant: 'outlined' },
    VCard: { rounded: 'lg', elevation: 0 },
    VChip: { size: 'small', variant: 'outlined' },
  }
})
