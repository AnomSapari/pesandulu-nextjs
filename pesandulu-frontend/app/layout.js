import "./globals.css";

export const metadata = {
  title: "PesanDulu - SaaS Kuliner",
  description: "Aplikasi pemesanan kuliner mandiri dan monitor dapur",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}