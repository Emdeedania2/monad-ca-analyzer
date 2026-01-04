import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                monad: {
                    purple: "#836EF9",
                    DEFAULT: "#200052",
                    dark: "#0F0026",
                    light: "#A08CFF"
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "monad-gradient": "linear-gradient(to right, #200052, #836EF9)",
            },
        },
    },
    plugins: [],
};
export default config;
