import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{html,js}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
};

export default config;
