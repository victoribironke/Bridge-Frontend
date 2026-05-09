// import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// export default defineConfig({
//   tanstackStart: {
//     server: { entry: "server" },
//   },
// });

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
});
