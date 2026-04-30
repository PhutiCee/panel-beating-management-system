import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import Providers from './components/Providers';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins', display: 'swap' });

export const metadata = {
  title: 'Mangena Panel Beater MS',
  description: 'Workshop Management Information System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <Providers>
          <div className="layout-root">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
