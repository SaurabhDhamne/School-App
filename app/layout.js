import './globals.css';

export const metadata = {
  title: 'EduSnap AI - Smart Paper-to-Digital School Assistant',
  description: 'AI-powered marks and attendance scanner for teachers. Convert handwritten registers to digital reports in seconds.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F7FB] text-slate-800 antialiased selection:bg-[#FF8A00] selection:text-white">
        {children}
      </body>
    </html>
  );
}
