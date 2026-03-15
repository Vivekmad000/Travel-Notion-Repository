const fs = require("fs");

const css = `@import "tailwindcss";

:root {
  --background: #F6F1E6;
  --foreground: #0F2D3F;
  --tv-terracotta: #B65C3A;
  --tv-peach: #D9A07E;
  --tv-cream: #F6F1E6;
  --tv-blue: #2E6F95;
  --tv-navy: #0F2D3F;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-nunito);
  --font-mono: var(--font-nunito);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-nunito), "Nunito", sans-serif;
}

/* BlockNote slash menu */
.bn-suggestion-menu {
  max-height: 220px !important;
  overflow-y: auto !important;
  align-self: flex-start !important;
}
`;
fs.writeFileSync("C:/Users/vivek/repos/travelnotion/app/globals.css", css);
console.log("globals.css done");
