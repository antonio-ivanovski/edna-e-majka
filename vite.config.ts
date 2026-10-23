import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // Must come before the React plugin so route generation and server
    // function compilation run first.
    //
    // Lazy file routes are on by default: the plugin keeps each route's
    // loader/validateSearch/beforeLoad in the route tree and emits its
    // component as a separate chunk that is fetched with that page, so the
    // entry bundle stays free of pages nobody is on. Large libraries that are
    // only needed behind an interaction are loaded with `React.lazy` inside
    // the components that use them (see the cooperation and sign-in dialogs).
    tanstackStart(),
    // After TanStack: the Cloudflare plugin contributes the worker
    // environment (bindings, `resolve.builtins` for `cloudflare:*` modules).
    // A later plugin's environment config wins, so it has to come last.
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    viteReact(),
  ],
})
