import {
  Bot,
  Briefcase,
  CheckSquare,
  ChevronRight,
  Compass,
  MessageSquare,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface LandingPageProps {
  onBack: () => void;
  onGetStarted: () => void;
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
    color: "bg-blue-500/20 text-blue-400",
    title: "Team Messenger",
    desc: "Groups, DMs, file sharing, and task requests. Your whole team in one place.",
  },
  {
    icon: CheckSquare,
    color: "bg-emerald-500/20 text-emerald-400",
    title: "5W Activity Builder",
    desc: "Structure every task with Who, What, When, Where, Why. Never miss context.",
  },
  {
    icon: Briefcase,
    color: "bg-amber-500/20 text-amber-400",
    title: "GST Business Suite",
    desc: "Invoices, estimates, proposals with auto CGST/SGST/IGST calculation.",
  },
  {
    icon: Bot,
    color: "bg-purple-500/20 text-purple-400",
    title: "AI Assistant",
    desc: "Natural language commands to create tasks, send invoices, and get guidance.",
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

export default function LandingPage({
  onBack,
  onGetStarted,
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
    <div className="min-h-screen bg-[#1a1a1a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Compass className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg tracking-wider">SAARATHI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/50 hover:text-white transition-colors"
            data-ocid="landing.link"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            data-ocid="landing.primary_button"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-sm text-amber-400 mb-6">
            <span>🇮🇳</span> Built for Indian Small Businesses
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Your Business,{" "}
            <span className="text-amber-400">Guided Forward.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            SAARATHI brings your team, tasks, GST invoices, and AI assistance
            together in one platform. Built for Indian businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onGetStarted}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3.5 rounded-xl text-lg transition-all hover:scale-[1.02]"
              data-ocid="landing.primary_button"
            >
              Start for Free <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all border border-white/10"
              data-ocid="landing.secondary_button"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-10 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Everything your business needs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-[#222] border border-white/8 rounded-2xl p-5 hover:border-amber-500/30 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-3`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Demo Slideshow */}
      <section className="px-6 py-10 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          See it in action
        </h2>
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
          {/* Slide header */}
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
          {/* Mock screen */}
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
          {/* Dot indicators */}
          <div className="flex justify-center gap-2 pb-4">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide
                    ? "bg-amber-400 w-6"
                    : "bg-white/20 hover:bg-white/40"
                }`}
                data-ocid="landing.toggle"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-10 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Real use cases for Indian businesses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-[#222] border border-white/8 rounded-2xl p-5"
            >
              <div className="text-3xl mb-3">{uc.emoji}</div>
              <h3 className="font-semibold text-white mb-2">{uc.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {uc.scenario}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Ready to get started?</h2>
          <p className="text-white/50 mb-8">
            Join Indian businesses already using SAARATHI to streamline their
            operations.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-[1.02]"
            data-ocid="landing.primary_button"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6 text-center text-xs text-white/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white/50">SAARATHI</span>
        </div>
        © {new Date().getFullYear()}. Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-amber-400/60"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
