import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Target, Mic, Sparkles, ArrowRight, Flame, Wind, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-night-forest via-deep-pine to-night-forest">
      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-sage/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-ember/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal to-sage flex items-center justify-center shadow-lg glow-accent">
              <Flame className="w-7 h-7 text-night-forest" />
            </div>
            <div>
              <span className="text-2xl font-display font-bold text-gradient-nature">
                REWIRE
              </span>
              <p className="text-[10px] text-sage/60 uppercase tracking-widest">Wellness Coaching</p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-gradient-to-r from-teal to-sage hover:from-teal/90 hover:to-sage/90 text-night-forest font-semibold shadow-lg glow-accent"
            data-testid="button-login"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </header>

        <main className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-deep-pine/80 rounded-full border border-forest-floor/50 mb-8">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm text-sage">AI-Powered Wellness Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-birch mb-6">
            Ground Yourself.
            <span className="block text-gradient-nature mt-2">
              Transform Your Life.
            </span>
          </h1>
          <p className="text-xl text-sage/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your mood, build grounding habits, journal your thoughts, and grow with the support of an AI coach that truly understands your journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = "/api/login"}
              size="lg"
              className="bg-gradient-to-r from-teal to-sage hover:from-teal/90 hover:to-sage/90 text-night-forest text-lg px-8 py-6 font-semibold shadow-xl glow-accent"
              data-testid="button-get-started"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-sage/30 text-sage hover:bg-sage/10 text-lg px-8 py-6"
            >
              <Wind className="w-5 h-5 mr-2" />
              Try a Breathing Exercise
            </Button>
          </div>
        </main>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <FeatureCard
            icon={<Heart className="w-8 h-8" />}
            iconColor="text-coral"
            iconBg="bg-coral/20"
            title="Ground Check"
            description="Daily mood and energy check-ins. See patterns and trends to understand yourself better."
          />
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            iconColor="text-teal"
            iconBg="bg-teal/20"
            title="Daily Anchors"
            description="Build grounding habits with streak tracking and celebration of your progress."
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            iconColor="text-violet"
            iconBg="bg-violet/20"
            title="Reflection"
            description="Journal your thoughts with AI-powered prompts tailored to your emotional state."
          />
          <FeatureCard
            icon={<Mic className="w-8 h-8" />}
            iconColor="text-gold"
            iconBg="bg-gold/20"
            title="Coach Brian"
            description="Talk to your AI voice coach for daily 5-minute grounding conversations."
          />
        </section>

        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-deep-pine/80 rounded-full border border-forest-floor/50 mb-6">
            <Users className="w-4 h-4 text-sage" />
            <span className="text-sm text-sage">For Coaches & Teams</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-birch mb-4">
            Elevate Your Coaching Practice
          </h2>
          <p className="text-lg text-sage/80 max-w-xl mx-auto mb-8">
            Life coaches can invite clients to track progress together. View insights, assign practices, and provide personalized support.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="glass rounded-xl px-6 py-4 border border-forest-floor/30 card-hover-lift">
              <p className="font-semibold text-birch">Client Dashboard</p>
              <p className="text-sm text-sage/70">See your clients' progress at a glance</p>
            </div>
            <div className="glass rounded-xl px-6 py-4 border border-forest-floor/30 card-hover-lift">
              <p className="font-semibold text-birch">Brotherhood</p>
              <p className="text-sm text-sage/70">Build community and accountability</p>
            </div>
            <div className="glass rounded-xl px-6 py-4 border border-forest-floor/30 card-hover-lift">
              <p className="font-semibold text-birch">Practice Library</p>
              <p className="text-sm text-sage/70">Assign breathwork and meditations</p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="glass rounded-2xl p-8 border border-forest-floor/30 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-display font-bold text-gradient-warm">7+</p>
              <p className="text-sm text-sage/70">Breathing Techniques</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-gradient-nature">5min</p>
              <p className="text-sm text-sage/70">Daily Check-ins</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-teal">24/7</p>
              <p className="text-sm text-sage/70">AI Coach Available</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-gold">100%</p>
              <p className="text-sm text-sage/70">Privacy Focused</p>
            </div>
          </div>
        </section>

        <footer className="text-center text-sage/50 text-sm pb-8">
          <p>Built with intention for your wellbeing journey</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  iconColor,
  iconBg,
  title,
  description
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 border border-forest-floor/30 card-hover-lift group">
      <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <h3 className="text-lg font-display font-semibold text-birch mb-2">{title}</h3>
      <p className="text-sage/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
