import {
  Bot,
  Briefcase,
  CheckSquare,
  ChevronRight,
  Compass,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const SLIDES = [
  {
    title: "Messenger — Team Collaboration",
    desc: "Group chats, DMs, and file sharing. Send invoices and task requests directly from chat.",
    color: "from-blue-900/60 to-blue-800/30",
    icon: MessageSquare,
    iconColor: "text-blue-400",
    mockContent: (
      <div className="space-y-2 p-3">
        <div className="flex gap-2 items-start">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0" />
          <div className="bg-white/10 rounded-xl rounded-tl-none px-3 py-2 text-xs text-white/80 max-w-[80%]">
            Team — can everyone confirm attendance for tomorrow?
          </div>
        </div>
        <div className="flex gap-2 items-start flex-row-reverse">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex-shrink-0" />
          <div className="bg-amber-500/20 rounded-xl rounded-tr-none px-3 py-2 text-xs text-white/80 max-w-[80%]">
            Confirmed ✓ I'll be there at 10am
          </div>
        </div>
        <div className="bg-white/5 border border-amber-500/30 rounded-xl p-2 text-xs">
          <div className="text-amber-400 font-semibold mb-1">
            📋 Task Request
          </div>
          <div className="text-white/70">Q3 GST Review — Due: 31 Dec</div>
          <div className="flex gap-1 mt-2">
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px]">
              Accept
            </span>
            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px]">
              Deny
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "5W Activities — Structured Tasks",
    desc: "Create tasks with Who, What, When, Where, Why. Pin locations on map and attach documents.",
    color: "from-emerald-900/60 to-emerald-800/30",
    icon: CheckSquare,
    iconColor: "text-emerald-400",
    mockContent: (
      <div className="space-y-2 p-3">
        <div className="bg-white/5 rounded-xl p-2 border border-emerald-500/20">
          <div className="text-emerald-400 text-xs font-bold mb-2">
            NEW ACTIVITY
          </div>
          <div className="space-y-1 text-xs text-white/70">
            <div>
              <span className="text-white/40">WHO:</span> Priya Sharma, Ravi
              Kumar
            </div>
            <div>
              <span className="text-white/40">WHAT:</span> Client Meeting —
              Patel Industries
            </div>
            <div>
              <span className="text-white/40">WHEN:</span> Tomorrow, 10:00 AM
            </div>
            <div>
              <span className="text-white/40">WHERE:</span> 📍 Mumbai Office,
              Andheri
            </div>
            <div>
              <span className="text-white/40">WHY:</span> Q4 contract renewal
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px]">
            Meeting
          </span>
          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px]">
            In Progress
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "Business Suite — GST Invoices",
    desc: "Create GST-compliant invoices, estimates, and proposals. Auto CGST/SGST/IGST calculation.",
    color: "from-amber-900/60 to-amber-800/30",
    icon: Briefcase,
    iconColor: "text-amber-400",
    mockContent: (
      <div className="p-3">
        <div className="bg-white/5 rounded-xl p-2 border border-amber-500/20">
          <div className="flex justify-between mb-2">
            <span className="text-amber-400 text-xs font-bold">
              INV-2024-001
            </span>
            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 rounded">
              Paid
            </span>
          </div>
          <div className="text-xs text-white/70 mb-2">
            Mehta Exports Pvt Ltd
          </div>
          <div className="space-y-1 text-[10px] text-white/50">
            <div className="flex justify-between">
              <span>Consulting Services × 10</span>
              <span>₹50,000</span>
            </div>
            <div className="flex justify-between">
              <span>CGST @9%</span>
              <span>₹4,500</span>
            </div>
            <div className="flex justify-between">
              <span>SGST @9%</span>
              <span>₹4,500</span>
            </div>
            <div className="flex justify-between font-bold text-white/80">
              <span>Total</span>
              <span>₹59,000</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "AI Assistant — Smart Automation",
    desc: "Type commands in natural language. AI creates tasks, sends invoices, and guides you.",
    color: "from-purple-900/60 to-purple-800/30",
    icon: Bot,
    iconColor: "text-purple-400",
    mockContent: (
      <div className="space-y-2 p-3">
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3 text-purple-400" />
          </div>
          <div className="bg-purple-500/10 rounded-xl rounded-tl-none px-3 py-2 text-xs text-white/80">
            Hi! Try: "Ask Priya to confirm meeting with Patel Industries
            tomorrow"
          </div>
        </div>
        <div className="flex gap-2 flex-row-reverse">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex-shrink-0" />
          <div className="bg-white/10 rounded-xl rounded-tr-none px-3 py-2 text-xs text-white/80">
            Send Mehta invoice to Ravi
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3 text-purple-400" />
          </div>
          <div className="bg-purple-500/10 rounded-xl rounded-tl-none px-3 py-2 text-xs text-white/80">
            ✅ Invoice sent to Ravi Kumar in Messenger!
          </div>
        </div>
      </div>
    ),
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    title: "Team Messenger",
    desc: "Groups, DMs, file sharing, and task requests. Your whole team in one place.",
    bullets: [
      "Hierarchical groups & subgroups (10 levels)",
      "Send invoices & task requests in chat",
      "Download media, docs & invoices from chat",
    ],
  },
  {
    icon: CheckSquare,
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    title: "5W Activity Builder",
    desc: "Structure every task with Who, What, When, Where, Why. Never miss context.",
    bullets: [
      "OpenStreetMap-based location pin",
      "Attach PDFs, images & business docs",
      "Status tracking & scheduler calendar",
    ],
  },
  {
    icon: Briefcase,
    color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    title: "GST Business Suite",
    desc: "Invoices, estimates, proposals with auto CGST/SGST/IGST calculation.",
    bullets: [
      "Auto GST switching (CGST/SGST/IGST)",
      "Client & product master lists",
      "PDF export & Messenger sharing",
    ],
  },
  {
    icon: Bot,
    color: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    title: "AI Assistant",
    desc: "Natural language commands to create tasks, send invoices, and get guidance.",
    bullets: [
      "Parses natural language to create 5W tasks",
      "Smart disambiguation for contacts/invoices",
      "Proactive onboarding & GST guidance",
    ],
  },
];

const USE_CASES = [
  {
    emoji: "🏭",
    title: "Manufacturing Business",
    scenario:
      "Rajesh creates a delivery task for his factory team, attaches the purchase order, and sends the GST invoice to the client — all from one platform.",
  },
  {
    emoji: "🛒",
    title: "Trading Company",
    scenario:
      "Priya uses AI to create multiple client tasks at once, tracks their status on the scheduler, and shares daily summaries with her team on Messenger.",
  },
  {
    emoji: "💼",
    title: "Consulting Firm",
    scenario:
      "Amit manages client proposals, sends GST estimates, and coordinates project tasks — with full GST compliance built in at every step.",
  },
];

const STATS = [
  { label: "4 Powerful Modules", icon: Zap },
  { label: "GST Compliant", icon: CheckSquare },
  { label: "AI-Powered", icon: Bot },
  { label: "Built for India 🇮🇳", icon: Users },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create your workspace",
    desc: "Register in seconds and set up your business profile with your GSTIN and team details.",
    color: "text-amber-400",
  },
  {
    step: "02",
    title: "Connect your team",
    desc: "Add contacts, create groups and subgroups in Messenger. Invite via WhatsApp with a single link.",
    color: "text-blue-400",
  },
  {
    step: "03",
    title: "Work smarter with AI",
    desc: "Use natural language to create tasks, generate GST invoices, and coordinate your team — all from one chat panel.",
    color: "text-emerald-400",
  },
];

export default function LandingPage({
  onGetStarted,
  onSignIn,
}: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-widest">SAARATHI</span>
            <div className="text-[10px] text-white/35 tracking-wider hidden sm:block">
              by Tattva Innovation
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSignIn}
            className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5"
            data-ocid="landing.link"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all"
            data-ocid="landing.primary_button"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-28 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 text-sm text-amber-400 mb-8">
            <span>🇮🇳</span> Built for Indian Small Businesses
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Your Business,
            <br />
            <span className="text-amber-500">Guided Forward.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-4 leading-relaxed">
            SAARATHI brings your team, tasks, GST invoices, and AI assistance
            together in one platform purpose-built for Indian businesses.
          </p>
          <p className="text-sm text-white/30 mb-10">
            Messenger · 5W Activities · GST Business Suite · AI Assistant
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onGetStarted}
              className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-9 py-4 rounded-2xl text-lg transition-all hover:scale-[1.02] shadow-lg shadow-amber-900/40"
              data-ocid="landing.primary_button"
            >
              Start for Free <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center justify-center gap-2 bg-white/6 hover:bg-white/10 text-white font-semibold px-9 py-4 rounded-2xl text-lg transition-all border border-white/10"
              data-ocid="landing.secondary_button"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats chips */}
      <section className="px-6 pb-12 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-2xl px-4 py-3"
              >
                <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white/80">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-14 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold tracking-widest text-amber-500/70 uppercase mb-3">
            How It Works
          </div>
          <h2 className="text-3xl font-black">Up and running in minutes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-amber-500/30 via-blue-500/30 to-emerald-500/30" />
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative bg-[#1a1a1a] border border-white/8 rounded-2xl p-6 text-center"
            >
              <div
                className={`text-5xl font-black ${step.color} opacity-60 mb-4`}
              >
                {step.step}
              </div>
              <h3 className="font-bold text-white text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-14 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold tracking-widest text-amber-500/70 uppercase mb-3">
            Features
          </div>
          <h2 className="text-3xl font-black">
            Everything your business needs
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`bg-[#1a1a1a] border rounded-2xl p-5 hover:border-white/20 transition-colors ${f.color.split(" ")[2] || "border-white/8"}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${f.color.split(" ").slice(0, 2).join(" ")} border flex items-center justify-center mb-4`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed mb-3">
                  {f.desc}
                </p>
                <ul className="space-y-1.5">
                  {f.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-1.5 text-xs text-white/35"
                    >
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Demo Slideshow */}
      <section className="px-6 py-14 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-widest text-amber-500/70 uppercase mb-3">
            Live Demo
          </div>
          <h2 className="text-3xl font-black">See it in action</h2>
        </div>
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
          <div
            className={`bg-gradient-to-r ${slide.color} px-6 py-4 flex items-center gap-3`}
          >
            <div
              className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${slide.iconColor}`}
            >
              <SlideIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                {slide.title}
              </div>
              <div className="text-xs text-white/50">{slide.desc}</div>
            </div>
          </div>
          <div className="relative min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {slide.mockContent}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-2 pb-4">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentSlide
                    ? "bg-amber-400 w-6"
                    : "bg-white/20 hover:bg-white/40 w-2"
                }`}
                data-ocid="landing.toggle"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-14 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-widest text-amber-500/70 uppercase mb-3">
            Use Cases
          </div>
          <h2 className="text-3xl font-black">Real businesses, real results</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-6 hover:border-amber-500/25 transition-colors"
            >
              <div className="text-4xl mb-4">{uc.emoji}</div>
              <h3 className="font-bold text-white mb-2">{uc.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">
                {uc.scenario}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-10 text-center"
          style={{
            background:
              "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)",
          }}
        >
          <h2 className="text-3xl font-black text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-white/60 mb-8 text-base">
            Join Indian businesses already using SAARATHI to streamline their
            operations.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="bg-white text-amber-800 font-black px-10 py-4 rounded-2xl text-lg transition-all hover:scale-[1.02] hover:bg-amber-50 shadow-xl"
            data-ocid="landing.primary_button"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm tracking-widest text-white/70">
            SAARATHI
          </span>
        </div>
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} SAARATHI. Created by{" "}
          <span className="text-white/45 font-semibold">Tattva Innovation</span>
        </p>
      </footer>
    </div>
  );
}
