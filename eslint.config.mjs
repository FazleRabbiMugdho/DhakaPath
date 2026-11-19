import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { globalIgnores } from "eslint/config";

// The demo store intentionally freezes a boot timestamp once and seeds state
// from it, so React Compiler's purity/effect rules are disabled here. All other
// Next.js core-web-vitals and TypeScript rules remain enabled.
const config = [
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
