import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0B2D29',
          secondary: '#E3F4DB',
          accent: '#FF97AD',
          tertiary: '#5D9743',
          neutralgreen: '#F6FFF2',
          neutralpink: '#FFFDFD',
          lightpink: '#FFD9E1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
