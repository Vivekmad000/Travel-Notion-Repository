const fs = require("fs");

const page = `import { SignUpButton, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import { Header } from "./components/Header";

export default function Home() {
  return (
    <main style={{ backgroundColor: "var(--tv-cream)", minHeight: "100vh" }}>
      <Header />

      {/* ── Hero ── */}
      <section style={{ backgroundColor: "var(--tv-cream)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-12">

          {/* Left: text + CTAs */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-terracotta)" }}>
              Your travel companion
            </p>
            <h1 className="text-6xl md:text-7xl leading-tight mb-6" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)" }}>
              Your World,<br />Your Story.
            </h1>
            <p className="text-lg mb-4 leading-relaxed" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}>
              Plan trips, collaborate with friends in real-time,<br />
              and map every place you have ever been.
            </p>
            <p className="text-base mb-10" style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", opacity: 0.8 }}>
              The travel planning workspace you have always wanted.
            </p>
            <div className="flex flex-wrap gap-4">
              <SignUpButton mode="modal">
                <button className="px-8 py-3 rounded-full text-base font-bold transition-opacity hover:opacity-90" style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}>
                  Start for Free →
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-8 py-3 rounded-full text-base font-bold transition-opacity hover:opacity-80" style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "transparent", color: "var(--tv-navy)", border: "2px solid var(--tv-navy)" }}>
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>

          {/* Right: italy illustration */}
          <div className="flex-shrink-0 w-full md:w-[480px]">
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ border: "3px solid var(--tv-blue)" }}>
              <Image
                src="/assets/italy_background.png"
                alt="Mediterranean illustration"
                width={667}
                height={672}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ backgroundColor: "var(--tv-navy)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-4xl text-center mb-2" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>
            Everything you need
          </h2>
          <p className="text-center mb-14 text-base" style={{ fontFamily: "var(--font-fredoka)", color: "rgba(240,236,224,0.7)" }}>
            Built for travellers who love to plan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "/assets/plane.png", title: "Plan Your Trips", desc: "Create rich travel plans with notes, images, checklists, and itineraries — all in one Notion-like workspace." },
              { icon: "/assets/world.png", title: "Collaborate Live", desc: "Invite friends and edit travel plans together in real-time. Share view or edit access with anyone." },
              { icon: "/assets/city.png",  title: "Track Your World", desc: "Pin every city you have visited on an interactive map. Watch your world fill up as you explore." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-8" style={{ backgroundColor: "var(--tv-blue)" }}>
                <img src={icon} alt={title} width={52} height={52} className="mb-5" style={{ objectFit: "contain" }} />
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-nunito)", color: "rgba(240,236,224,0.8)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section style={{ backgroundColor: "var(--tv-terracotta)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-5xl mb-4" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>
            Ready to explore?
          </h2>
          <p className="text-lg mb-8" style={{ fontFamily: "var(--font-fredoka)", color: "rgba(240,236,224,0.9)" }}>
            Join Planora and start planning your next adventure today.
          </p>
          <SignUpButton mode="modal">
            <button className="px-10 py-3 rounded-full text-base font-bold transition-opacity hover:opacity-90" style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-navy)", color: "var(--tv-cream)" }}>
              Get Started Free →
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: "var(--tv-navy)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-xl" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>Planora</span>
          <p className="text-xs" style={{ fontFamily: "var(--font-nunito)", color: "rgba(240,236,224,0.5)" }}>
            © 2025 Planora. Made for wanderers.
          </p>
        </div>
      </footer>
    </main>
  );
}
`;
fs.writeFileSync("C:/Users/vivek/repos/travelnotion/app/page.tsx", page);
console.log("page.tsx done");
