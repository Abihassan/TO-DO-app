/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.jsx",
    "./components/**/*.{js,jsx}",
    "./screens/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#FFF7ED",
        cloud: "#FFFFFF",
        ink: "#2B2140",
        inkSoft: "#6B6285",
        inkFaint: "#A79FC0",

        grape: {
          DEFAULT: "#7C3AED",
          light: "#A78BFA",
          dark: "#5B21B6",
        },
        bubble: {
          DEFAULT: "#EC4899",
          light: "#F9A8D4",
        },
        sunshine: {
          DEFAULT: "#FFC93C",
          light: "#FFE29A",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          light: "#FFB4B4",
        },
        teal: {
          DEFAULT: "#14B8A6",
          light: "#5EEAD4",
        },
        sky: {
          DEFAULT: "#3B82F6",
          light: "#93C5FD",
        },
        mint: {
          DEFAULT: "#22E584",
          light: "#86F5C0",
        },

        priorityHigh: "#FF3B5C",
        priorityMedium: "#FFB020",
        priorityLow: "#22C55E",
      },
      fontFamily: {
        display: ["Baloo2_700Bold"],
        heading: ["Baloo2_600SemiBold"],
        body: ["Nunito_600SemiBold"],
        bodyRegular: ["Nunito_400Regular"],
      },
    },
  },
  plugins: [],
};
