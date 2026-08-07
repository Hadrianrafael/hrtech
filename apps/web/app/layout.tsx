import './globals.css';

export const metadata = {
  title: 'HR Tech',
  description: 'HR Tech — Desenvolvimento de Sistemas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
