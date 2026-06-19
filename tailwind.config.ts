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
                // ============================================
                // MENUXPRO PREMIUM CAFÉ PALETTE
                // Brand: Warm luxury meets Tunisian/Qatar hospitality
                // ============================================
                
                // Core Brand Colors
                background: '#FCFBF9',
                espresso: '#3A322D',
                'soft-beige': '#EFE4D8',
                accent: '#C9A07E',
                warm: '#D8B18C',
                terra: '#A9795F',
                olive: '#8FA48B',
                white: '#FFFFFF',
                
                // Primary (Espresso-based)
                primary: {
                    DEFAULT: '#3A322D',
                    foreground: '#FCFBF9',
                    container: '#5A4B42',
                    fixed: '#EFE4D8',
                    'fixed-dim': '#D8C4B8',
                },
                
                // Secondary (Soft Beige/Warm)
                secondary: {
                    DEFAULT: '#EFE4D8',
                    foreground: '#3A322D',
                    container: '#F7EFE7',
                    fixed: '#E6C8A8',
                    'fixed-dim': '#D8B18C',
                },
                
                // Surface Colors
                surface: {
                    DEFAULT: '#FFFFFF',
                    dim: '#F4EEE7',
                    bright: '#FFFFFF',
                    tint: '#C9A07E',
                    container: {
                        DEFAULT: '#F4EEE7',
                        low: '#FAF6EF',
                        lowest: '#FFFFFF',
                        high: '#EFE4D8',
                        highest: '#E8DED4',
                    },
                },
                
                // Outline
                outline: {
                    DEFAULT: '#7A6D63',
                    variant: '#E8DED4',
                },
                
                // Error/Destructive (Muted, not harsh)
                error: {
                    DEFAULT: '#B85C4A',
                    foreground: '#FFFFFF',
                    container: '#FFF7F2',
                },
                
                // Success (Soft green)
                success: {
                    DEFAULT: '#6B8E6B',
                    foreground: '#FFFFFF',
                    container: '#E8F0E8',
                },
                
                // Warning (Warm amber/orange)
                warning: {
                    DEFAULT: '#A9795F',
                    foreground: '#FFFFFF',
                    container: '#FFF5EB',
                },
                
                // Text colors
                foreground: '#3A322D',
                'on-surface': '#3A322D',
                'on-surface-variant': '#7A6D63',
                'on-background': '#3A322D',
                
                // Legacy shadcn/ui compatibility
                card: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#3A322D',
                },
                popover: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#3A322D',
                },
                muted: {
                    DEFAULT: '#F4EEE7',
                    foreground: '#7A6D63',
                },
                destructive: {
                    DEFAULT: '#B85C4A',
                    foreground: '#FFFFFF',
                },
                border: '#E8DED4',
                input: '#E8DED4',
                ring: '#C9A07E',
                
                // Landing Page Tokens
                lp: {
                    cream: '#FCFBF9',
                    'cream-2': '#EFE4D8',
                    paper: '#FAF6EF',
                    ink: '#3A322D',
                    'ink-2': '#51453D',
                    muted: '#7A6D63',
                    line: 'rgba(58,50,45,0.07)',
                    'line-2': 'rgba(58,50,45,0.14)',
                    indigo: '#3A322D',
                    'indigo-2': '#5A4B42',
                    ochre: '#C9A07E',
                    'ochre-2': '#E6C8A8',
                    terra: '#A9795F',
                },
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
                DEFAULT: '0.5rem',
                sm: '0.5rem',
                md: '1rem',
                lg: '1.5rem',
                xl: '2rem',
                '2xl': '2.5rem',
                '3xl': '3rem',
                '4xl': '4rem',
                full: '9999px',
            },
            boxShadow: {
                'soft': '0 8px 24px rgba(58, 50, 45, 0.08)',
                'elevated': '0 18px 45px rgba(58, 50, 45, 0.14)',
                'luxury': '0 24px 80px rgba(58, 50, 45, 0.08)',
                'card': '0px 4px 24px rgba(58, 50, 45, 0.04)',
                'card-hover': '0px 8px 40px rgba(58, 50, 45, 0.08)',
                'button': '0px 4px 12px rgba(58, 50, 45, 0.08)',
                'dropdown': '0px 8px 32px rgba(58, 50, 45, 0.12)',
                'glow': '0 0 28px rgba(201, 160, 126, 0.18)',
                'glow-primary': '0 0 28px rgba(201, 160, 126, 0.22)',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #3A322D, #5A4B42)',
                'gradient-warm': 'linear-gradient(135deg, #C9A07E, #E6C8A8)',
                'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(252,251,249,0.42))',
                'gradient-menux': 'linear-gradient(180deg, #FCFBF9 0%, #EFE4D8 100%)',
            },
            animation: {
                'pulse-border': 'pulse-border 2s infinite',
                'fade-in': 'fade-in 0.3s ease-out forwards',
                'slide-in-up': 'slide-in-up 0.4s ease-out forwards',
                'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
                'scale-up': 'scale-up 0.2s ease-out forwards',
                'shimmer': 'shimmer 1.5s infinite',
                'float': 'float 3s ease-in-out infinite',
                'breathing': 'breathing 3s ease-in-out infinite',
            },
            keyframes: {
                'pulse-border': {
                    '0%': { boxShadow: '0 0 0 0 rgba(201, 160, 126, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(201, 160, 126, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(201, 160, 126, 0)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-in-up': {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-in-right': {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'scale-up': {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'breathing': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.02)', opacity: '0.9' },
                },
            },
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;
