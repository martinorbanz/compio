/**
 * Shared Tailwind preset: grayscale (Tailwind's default gray) + one signature
 * accent color for active/selected elements, per the app's GUI concept.
 * Alternate accent suggestions (see README): teal `#0d9488`, violet `#7c3aed`.
 */
module.exports = {
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
};
