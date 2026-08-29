import localFont from 'next/font/local'

export const sans = localFont({
  src: '../fonts/inter-latin-wght-normal.woff2',
  variable: '--font-sans',
  display: 'swap',
  weight: '100 900',
})

export const serif = localFont({
  src: [
    { path: '../fonts/eb-garamond-latin-wght-normal.woff2', style: 'normal' },
    { path: '../fonts/eb-garamond-latin-wght-italic.woff2', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
  weight: '400 800',
})

export const mono = localFont({
  src: '../fonts/jetbrains-mono-latin-wght-normal.woff2',
  variable: '--font-mono',
  display: 'swap',
  weight: '100 800',
})

export const fontClass = `${sans.variable} ${serif.variable} ${mono.variable}`
