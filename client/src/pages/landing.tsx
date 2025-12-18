import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Target, Mic, Sparkles, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-coral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-coral-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-coral-500 bg-clip-text text-transparent">
              MindfulCoach
            </span>
          </div>
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-gradient-to-r from-violet-500 to-coral-400 hover:from-violet-600 hover:to-coral-500 text-white"
            data-testid="button-login"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </header>

        <main className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Personal
            <span className="block bg-gradient-to-r from-violet-600 to-coral-500 bg-clip-text text-transparent">
              Growth Companion
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Track your mood, build healthy habits, journal your thoughts, and grow with the support of an AI coach that understands you.
          </p>
          <Button
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            className="bg-gradient-to-r from-violet-500 to-coral-400 hover:from-violet-600 hover:to-coral-500 text-white text-lg px-8 py-6"
            data-testid="button-get-started"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </main>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <FeatureCard
            icon={<Heart className="w-8 h-8 text-violet-500" />}
            title="Mood Tracking"
            description="Check in daily with how you're feeling. See patterns and trends over time."
          />
          <FeatureCard
            icon={<Target className="w-8 h-8 text-coral-500" />}
            title="Habit Building"
            description="Build positive habits with daily tracking and streak motivation."
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8 text-violet-500" />}
            title="Journaling"
            description="Express your thoughts freely with guided prompts tailored to you."
          />
          <FeatureCard
            icon={<Mic className="w-8 h-8 text-coral-500" />}
            title="AI Voice Coach"
            description="Talk to your personal AI coach who knows your journey and supports you."
          />
        </section>

        <section className="text-center mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            For Coaches Too
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Life coaches can invite their clients to track progress together. View client data (with permission), assign homework, and provide personalized support.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100">
              <p className="font-medium text-gray-800">Client Dashboard</p>
              <p className="text-sm text-gray-500">See your clients' progress at a glance</p>
            </div>
            <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100">
              <p className="font-medium text-gray-800">Invite System</p>
              <p className="text-sm text-gray-500">Share a link for clients to connect</p>
            </div>
            <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100">
              <p className="font-medium text-gray-800">Assign Homework</p>
              <p className="text-sm text-gray-500">Give personalized tasks to clients</p>
            </div>
          </div>
        </section>

        <footer className="text-center text-gray-500 text-sm">
          <p>Built with care for your wellbeing</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
