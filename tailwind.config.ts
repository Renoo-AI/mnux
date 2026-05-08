import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Menux Brand Colors
                background: '#FCFBF9',
                espresso: '#3A322D',
                accent: '#C9A07E',
                'soft-beige': '#EFE4D8',
                white: '#FFFFFF',
                
                // Semantic colors from HTML designs
                primary: {
                    DEFAULT: '#241d19',
                    container: '#3a322d',
                    fixed: '#eee0d8',
                    'fixed-dim': '#d1c4bd',
                },
                secondary: {
                    DEFAULT: '#79573a',
                    container: '#ffd1ad',
                    fixed: '#ffdcc1',
                    'fixed-dim': '#eabe9a',
                },
                tertiary: {
                    DEFAULT: '#231e17',
                    container: '#39332b',
                    fixed: '#ece1d5',
                    'fixed-dim': '#cfc5b9',
                },
                surface: {
                    DEFAULT: '#fef8f7',
                    dim: '#ded9d8',
                    bright: '#fef8f7',
                    variant: '#e6e1e0',
                    tint: '#665c57',
                    container: {
                        DEFAULT: '#f2edeb',
                        low: '#f8f2f1',
                        'lowest': '#ffffff',
                        high: '#ece7e6',
                        highest: '#e6e1e0',
                    },
                },
                outline: {
                    DEFAULT: '#7f756f',
                    variant: '#d1c4bd',
                },
                error: {
                    DEFAULT: '#ba1a1a',
                    container: '#ffdad6',
                },
                inverse: {
                    surface: '#32302f',
                    primary: '#d1c4bd',
                    'on-surface': '#f5f0ee',
                },
                
                // Text colors
                'on-primary': '#ffffff',
                'on-secondary': '#ffffff',
                'on-tertiary': '#ffffff',
                'on-surface': '#1d1b1b',
                'on-background': '#1d1b1b',
                'on-surface-variant': '#4d4540',
                'on-error': '#ffffff',
                
                // Container text colors
                'on-primary-container': '#a69a93',
                'on-secondary-container': '#79583b',
                'on-tertiary-container': '#a49b90',
                'on-error-container': '#93000a',
                
                // Fixed variant text colors
                'on-primary-fixed': '#211a16',
                'on-secondary-fixed': '#2d1601',
                'on-tertiary-fixed': '#201b14',
                'on-primary-fixed-variant': '#4e4540',
                'on-secondary-fixed-variant': '#5e4025',
                'on-tertiary-fixed-variant': '#4c463d',
                
                // Legacy shadcn/ui colors (for compatibility)
                foreground: '#1d1b1b',
                card: {
                    DEFAULT: '#ffffff',
                    foreground: '#1d1b1b',
                },
                popover: {
                    DEFAULT: '#ffffff',
                    foreground: '#1d1b1b',
                },
                muted: {
                    DEFAULT: '#f2edeb',
                    foreground: '#4d4540',
                },
                accent: {
                    DEFAULT: '#C9A07E',
                    foreground: '#241d19',
                },
                destructive: {
                    DEFAULT: '#ba1a1a',
                    foreground: '#ffffff',
                },
                border: '#d1c4bd',
                input: '#d1c4bd',
                ring: '#C9A07E',
            },
            fontFamily: {
                display: ['Playfair Display', 'serif'],
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                body: ['Plus Jakarta Sans', 'sans-serif'],
            },
            fontSize: {
                'display-xl': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
                'display-lg': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
                'headline-md': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
                'title-sm': ['20px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '600' }],
                'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
                'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
                'label-sm': ['14px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '500' }],
                'label-caps': ['12px', { lineHeight: '1.2', letterSpacing: '0.1em', fontWeight: '700' }],
            },
            spacing: {
                'xs': '4px',
                'sm': '8px',
                'md': '16px',
                'lg': '24px',
                'xl': '40px',
                'gutter': '20px',
                'container-margin': '32px',
                'section-padding': '120px',
            },
            borderRadius: {
                DEFAULT: '0.25rem',
                lg: '0.5rem',
                xl: '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
                full: '9999px',
            },
            boxShadow: {
                'luxury': '0 10px 40px -10px rgba(58, 50, 45, 0.15)',
                'card': '0px 10px 30px rgba(58, 50, 45, 0.05)',
                'card-hover': '0px 20px 40px rgba(58, 50, 45, 0.1)',
            },
            animation: {
                'pulse-border': 'pulse-border 2s infinite',
            },
            keyframes: {
                'pulse-border': {
                    '0%': { boxShadow: '0 0 0 0 rgba(201, 160, 126, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(201, 160, 126, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(201, 160, 126, 0)' },
                },
            },
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;
