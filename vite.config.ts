import { defineConfig } from 'vite'

// Mak build la. Vercel bay VERCEL_GIT_COMMIT_SHA nan bati a; an lokal li di "local".
// Li parèt nan pye paj la epi nan window.__NOUIE_BUILD — konsa, lè yon aparèy di
// « fiks la pa mache », nou ka wè nan yon segonn si l ap kouri ansyen bundle la.
const buildId = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)

export default defineConfig({
  define: {
    __NOUIE_BUILD__: JSON.stringify(buildId),
  },
})
