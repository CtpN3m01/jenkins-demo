import "./globals.css";

export const metadata = {
  title: "Jenkins Next.js Demo",
  description: "Demo simple de CI/CD con Jenkins, Docker y Next.js"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
