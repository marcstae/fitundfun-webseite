import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-img-element": "off",
      // ponytail: neue react-hooks-v7-Regel; unsere Effect-Muster (Mount-Guard,
      // Auth-Store-Sync, Pathname-Close) sind etabliert — Refactoring riskiert mehr als es spart.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".pb-local/**", "pb/pb_migrations/**"]),
]);

export default eslintConfig;