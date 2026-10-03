/// <reference types="vite/client" />

interface ManifestPluginOptions {
  name?: string;
  short_name?: string;
  icons?: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
}

declare module "@vitejs/plugin-react" {
  // keep config type loose
}
