import "./globals.css";

export const metadata = {
  title: "Skill Discovery Tool",
  description: "Describe what you're building, get matched to real existing skills that could help.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav>
            <a className="brand" href="/">
              Skill Discovery Tool
            </a>
            <a href="/how-to-write-a-good-skill">How to write a good skill</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
