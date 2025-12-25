# @maskin25/captions-configurator

React Configurator component used in the captions.js demo.  
The package ships raw Tailwind CSS directives so the consuming app can keep using its own design tokens/theme.

## Usage

1. **Install**
   ```bash
   pnpm add @maskin25/captions-configurator
   ```

2. **Allow Tailwind to scan the package**

   Add the package files to your Tailwind `content` globs so utilities referenced inside the component are not purged:

   ```ts
   // tailwind.config.(ts|js)
   export default {
     content: [
       "./src/**/*.{ts,tsx}",
       "./node_modules/@maskin25/captions-configurator/dist/**/*.{js,jsx,ts,tsx}",
     ],
     // ...
   };
   ```

3. **Import the raw Tailwind directives**

   In your global Tailwind entry (`src/index.css`, `globals.css`, etc.) import the package stylesheet.  
   The file only contains Tailwind v4 directives (`@import "tailwindcss/preflight"` + `@import "tailwindcss/utilities"`) so it will be processed during your build.

   ```css
   /* globals.css */
   @import "@maskin25/captions-configurator/styles.css";
   ```

4. **Use the component**
   ```tsx
   import { Configurator } from "@maskin25/captions-configurator";

   export function Page() {
     return <Configurator />;
   }
   ```

With the `content` glob and stylesheet import in place, all Tailwind utilities used inside the Configurator (including arbitrary responsive classes) are generated in your application bundle.
