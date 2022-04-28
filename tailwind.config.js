module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#31315C",
        secondary: "#303050"
      },
      fontFamily: {
        rubik: ["Rubik", "sans-serif"]
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
