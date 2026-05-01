export default {
  plugins: {
    // postcss-import lets us use plain `@import "tailwindcss/base"` (etc.)
    // instead of the `@tailwind` directive — which keeps generic CSS
    // linters happy without losing any Tailwind features.
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
