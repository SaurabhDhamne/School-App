import './globals.css';

export const metadata = {
  title: 'MySchool - School Management & Teacher Portal',
  description: 'Digital gradebook, attendance tracking, and classroom administration for MySchool.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F7FB] text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
