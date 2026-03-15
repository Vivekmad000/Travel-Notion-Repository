const fs = require('fs');

// Hard-code the final correct landing page content directly
const content = `import { SignUpButton, SignInButton } from "@clerk/nextjs";

function WaveDecoration() {
  return (
    <svg viewBox="0 0 200 30" className="w-full" preserveAspectRatio="none" aria-hidden>
      <path d="M0,15 C40,30 80,0 120,15 C160,30 180,5 200,15 L200,30 L0,30 Z"
        style={{ fill: "var(--tv-cream)" }} />
    </svg>
  );
}

function CompassSketch() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" className="opacity-20" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="2"/>
      <circle cx="40" cy="40" r="3" style={{ fill: "var(--tv-navy)" }}/>
      <polygon points="40,10 44,40 40,36 36,40" style={{ fill: "var(--tv-orange)" }}/>
      <polygon points="40,70 36,40 40,44 44,40" style={{ fill: "var(--tv-navy)" }}/>
      <line x1="40" y1="10" x2="40" y2="70" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1" strokeDasharray="3 2"/>
      <line x1="10" y1="40" x2="70" y2="40" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1" strokeDasharray="3 2"/>
      <text x="40" y="7" textAnchor="middle" fontSize="6" style={{ fill: "var(--tv-navy)" }} fontFamily="Georgia,serif">N</text>
      <text x="40" y="77" textAnchor="middle" fontSize="6" style={{ fill: "var(--tv-navy)" }} fontFamily="Georgia,serif">S</text>
      <text x="5" y="43" textAnchor="middle" fontSize="6" style={{ fill: "var(--tv-navy)" }} fontFamily="Georgia,serif">W</text>
      <text x="75" y="43" textAnchor="middle" fontSize="6" style={{ fill: "var(--tv-navy)" }} fontFamily="Georgia,serif">E</text>
    </svg>
  );
}

function OliveBranch() {
  return (
    <svg viewBox="0 0 120 60" width="120" height="60" className="opacity-25" aria-hidden>
      <path d="M10,50 Q30,20 60,15 Q90,10 110,5" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.5"/>
      <ellipse cx="35" cy="28" rx="8" ry="5" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.2" transform="rotate(-30 35 28)"/>
      <ellipse cx="55" cy="20" rx="8" ry="5" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.2" transform="rotate(-20 55 20)"/>
      <ellipse cx="75" cy="14" rx="7" ry="4" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.2" transform="rotate(-15 75 14)"/>
      <ellipse cx="93" cy="9"  rx="6" ry="4" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.2" transform="rotate(-10 93 9)"/>
    </svg>
  );
}

function NoteSketch() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <rect x="8" y="6" width="32" height="36" rx="3" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="2"/>
      <line x1="14" y1="16" x2="34" y2="16" style={{ stroke: "var(--tv-orange)" }} strokeWidth="1.5"/>
      <line x1="14" y1="22" x2="34" y2="22" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.5"/>
      <line x1="14" y1="28" x2="26" y2="28" style={{ stroke: "var(--tv-navy)" }} strokeWidth="1.5"/>
      <circle cx="36" cy="36" r="6" style={{ fill: "var(--tv-orange)" }} opacity="0.8"/>
      <line x1="33" y1="36" x2="39" y2="36" stroke="white" strokeWidth="1.5"/>
      <line x1="36" y1="33" x2="36" y2="39" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

function CollabSketch() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <circle cx="16" cy="18" r="7" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="2"/>
      <circle cx="32" cy="18" r="7" fill="none" style={{ stroke: "var(--tv-orange)" }} strokeWidth="2"/>
      <path d="M4,38 Q16,28 16,28 Q24,32 32,28 Q44,38 44,38" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="2"/>
      <line x1="24" y1="12" x2="24" y2="34" style={{ stroke: "var(--tv-orange-light)" }} strokeWidth="1" strokeDasharray="3 2"/>
    </svg>
  );
}

function MapSketch() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <path d="M8,8 L18,12 L30,8 L40,12 L40,40 L30,36 L18,40 L8,36 Z" fill="none" style={{ stroke: "var(--tv-navy)" }} strokeWidth="2"/>
      <line x1="18" y1="12" x2="18" y2="40" style={{ stroke: "var(--tv-border)" }} strokeWidth="1"/>
      <line x1="30" y1="8"  x2="30" y2="36" style={{ stroke: "var(--tv-border)" }} strokeWidth="1"/>
      <circle cx="22" cy="22" r="4" fill="none" style={{ stroke: "var(--tv-orange)" }} strokeWidth="1.5"/>
      <line x1="22" y1="26" x2="22" y2="32" style={{ stroke: "var(--tv-orange)" }} strokeWidth="1.5"/>
    </svg>
  );
}

const features = [
  {
    icon: <NoteSketch />,
    title: "Rich Notes",
    desc: "Write with headings, images, code blocks, and file uploads \\u2014 all in a Notion-like editor.",
  },
  {
    icon: <CollabSketch />,
    title: "Real-time Collab",
    desc: "Share a plan with friends, see live cursors, and edit together from anywhere.",
  },
  {
    icon: <MapSketch />,
    title: "Travel Map",
    desc: "Pin cities, colour countries, and watch your travel story come to life on an interactive map.",
  },
];

export default function Home() {
  return (
    <div style={{ background: "var(--tv-cream)", minHeight: "100vh" }}>

      {/* NAVBAR */}
      <nav
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--tv-cream)", borderBottom: "1px solid var(--tv-border)" }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", color: "var(--tv-navy)", letterSpacing: "0.02em" }}>
          TravelVerse
        </span>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button
              style={{ color: "var(--tv-navy)", fontFamily: "var(--font-body)", background: "transparent", border: "none", cursor: "pointer" }}
              className="text-sm font-medium px-4 py-2 rounded-full hover:opacity-70 transition-opacity"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              style={{ background: "var(--tv-orange)", color: "#fff", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
              className="text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Get started
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="px-6 pt-20 pb-0 text-center"
          style={{ background: "linear-gradient(160deg, #EDE5D4 0%, #F5F0E8 60%, #F0E8D8 100%)" }}
        >
          <div className="absolute top-8 left-8 hidden md:block">
            <OliveBranch />
          </div>
          <div className="absolute top-12 right-12 hidden md:block">
            <CompassSketch />
          </div>

          <p
            className="uppercase mb-3"
            style={{ fontFamily: "var(--font-heading)", color: "var(--tv-orange)", fontSize: "0.9rem", letterSpacing: "0.18em" }}
          >
            Your travel companion
          </p>

          <h1
            className="text-6xl md:text-8xl mb-6"
            style={{ fontFamily: "var(--font-display)", color: "var(--tv-navy)", lineHeight: 1.1 }}
          >
            Plan Your<br />Adventures
          </h1>

          <p
            className="text-xl md:text-2xl mb-10 max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-heading)", color: "var(--tv-muted)", fontStyle: "italic" }}
          >
            Organize trips, write rich notes, collaborate with friends\\u00a0\\u2014 all in one beautiful workspace.
          </p>

          <div className="flex gap-4 justify-center mb-16 flex-wrap">
            <SignUpButton mode="modal">
              <button
                className="font-semibold text-base px-8 py-3 rounded-full hover:opacity-90 transition-opacity shadow-md"
                style={{ background: "var(--tv-orange)", color: "#fff", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
              >
                Start for free \\u2192
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button
                className="font-semibold text-base px-8 py-3 rounded-full hover:opacity-70 transition-opacity"
                style={{ border: "2px solid var(--tv-navy)", color: "var(--tv-navy)", fontFamily: "var(--font-body)", background: "transparent", cursor: "pointer" }}
              >
                Sign in
              </button>
            </SignInButton>
          </div>

          <div style={{ marginBottom: "-2px" }}>
            <WaveDecoration />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-20" style={{ background: "var(--tv-cream)" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold mb-3 text-center"
            style={{ fontFamily: "var(--font-heading)", color: "var(--tv-navy)" }}
          >
            Everything you need for the journey
          </h2>
          <p
            className="mb-14 text-lg text-center"
            style={{ fontFamily: "var(--font-body)", color: "var(--tv-muted)", fontStyle: "italic" }}
          >
            Simple, beautiful, and built for travellers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-8 flex flex-col items-start gap-4 hover:shadow-md transition-shadow"
                style={{ background: "var(--tv-card)", border: "1.5px solid var(--tv-border)", borderRadius: "1.25rem" }}
              >
                {f.icon}
                <h3
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--tv-navy)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: "var(--font-body)", color: "var(--tv-muted)" }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="px-6 py-20 text-center" style={{ background: "var(--tv-navy)" }}>
        <h2
          className="mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--tv-cream)", fontSize: "3rem", lineHeight: 1.1 }}
        >
          Ready to explore?
        </h2>
        <p
          className="text-lg mb-8"
          style={{ fontFamily: "var(--font-heading)", color: "var(--tv-orange-light)", fontStyle: "italic" }}
        >
          Join TravelVerse and bring your adventures to life.
        </p>
        <SignUpButton mode="modal">
          <button
            className="font-bold text-base px-10 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: "var(--tv-cream)", color: "var(--tv-navy)", fontFamily: "var(--font-body)", border: "none", cursor: "pointer" }}
          >
            Create a free account \\u2192
          </button>
        </SignUpButton>
      </section>

      {/* FOOTER */}
      <footer
        className="px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ background: "var(--tv-cream)", borderTop: "1px solid var(--tv-border)" }}
      >
        <span style={{ fontFamily: "var(--font-display)", color: "var(--tv-navy)", fontSize: "1.4rem" }}>
          TravelVerse
        </span>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--tv-muted)", fontSize: "0.8rem" }}>
          \\u00a9 2025 TravelVerse. Built with \\u2600\\ufe0f &amp; wanderlust.
        </p>
      </footer>

    </div>
  );
}
`;

fs.writeFileSync('C:/Users/vivek/repos/travelnotion/app/page.tsx', content, 'utf8');
console.log('Done');
