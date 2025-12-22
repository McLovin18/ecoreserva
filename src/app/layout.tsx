import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import "./styles/cosmetic-theme.css";
import ClientLayout from "./ClientLayout";
import NavbarComponent from './components/Navbar';
import PayPalProvider from "./components/paypalProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EcoReserva - Reservas de departamentos y hospedajes",
    template: "%s | EcoReserva"
  },
  description: "EcoReserva es una plataforma para buscar y reservar departamentos y hospedajes de forma segura, sencilla y sostenible.",
  keywords: [
    "EcoReserva",
    "reservas de departamentos",
    "hospedaje sostenible",
    "alojamiento ecológico",
    "departamentos turísticos",
    "arriendo por temporada",

  ],
  authors: [{ name: "EcoReserva" }],
  creator: "EcoReserva",
  publisher: "EcoReserva",
  applicationName: "EcoReserva",
  category: "Reservas y turismo",
  classification: "Plataforma de reservas de departamentos y hospedajes",
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://ecoreserva.vercel.app",
    siteName: "EcoReserva",
    title: "EcoReserva - Reservas de departamentos y hospedajes",
    description: "Reserva departamentos y hospedajes ecológicos en destinos únicos con EcoReserva.",
    images: [
      {
        url: "/logoShop1.png",
        width: 1200,
        height: 630,
        alt: "EcoReserva - Plataforma de reservas de departamentos y hospedajes",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ecoreserva",
    creator: "@ecoreserva",
    title: "EcoReserva - Reservas de departamentos y hospedajes",
    description: "Encuentra y reserva departamentos y hospedajes sostenibles con EcoReserva.",
    images: ["/logoShop1.png"],
  },
  verification: {
    google: "google-site-verification-code", // Reemplazar con tu código real
    // yandex: "yandex-verification-code",
    // yahoo: "yahoo-site-verification-code",
  },
  alternates: {
    canonical: "https://ecoreserva.vercel.app/",
    languages: {
      'es-ES': 'https://ecoreserva.vercel.app/',
    },
  },
  other: {
    'theme-color': '#0B7285',
    'color-scheme': 'light',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'EcoReserva',
    'format-detection': 'telephone=no',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0B7285',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logoShop1.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logoShop1.png" />
        <link rel="shortcut icon" href="/logoShop1.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logoShop1.png" />
        <meta name="theme-color" content="#0B7285" />
        <meta name="msapplication-TileColor" content="#0B7285" />
        <meta name="msapplication-TileImage" content="/logoShop1.png" />
        <meta
          name="description"
          content="Busca y reserva departamentos y hospedajes sostenibles en EcoReserva. Encuentra tu próximo destino con filtros por ubicación, fechas y número de huéspedes."
        />

      </head>
      <body  className={`${geistSans.variable} ${geistMono.variable}`}>
          <ClientLayout>
            <NavbarComponent />
            <PayPalProvider>
              {children}
            </PayPalProvider>
          </ClientLayout>

      </body>
    </html>
  );
}
