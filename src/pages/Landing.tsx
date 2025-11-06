import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, Camera, TrendingUp, MessageSquare, Award, Activity } from "lucide-react";
import heroImage from "@/assets/hero-health.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "AI Food Recognition",
      description: "Snap a photo of your meal and get instant nutritional analysis powered by advanced AI.",
    },
    {
      icon: Brain,
      title: "Smart AI Coach",
      description: "Get personalized health advice and meal plans from your AI-powered health mentor.",
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your calories, macros, and fitness goals with beautiful interactive charts.",
    },
    {
      icon: MessageSquare,
      title: "24/7 Chat Support",
      description: "Ask questions anytime and get instant, expert health and nutrition guidance.",
    },
    {
      icon: Award,
      title: "Gamified Goals",
      description: "Stay motivated with streaks, achievements, and a personalized health score.",
    },
    {
      icon: Activity,
      title: "Activity Integration",
      description: "Connect your wearables and track all your health metrics in one place.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Health Mentor</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button variant="hero" onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your AI-Powered
                <span className="gradient-primary bg-clip-text text-transparent"> Personal Health Coach</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your health journey with AI-powered food recognition, personalized nutrition plans, and 24/7 expert guidance.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="lg" onClick={() => navigate("/signup")}>
                  Start Your Journey
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")}>
                  View Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Privacy first</span>
                </div>
              </div>
            </div>
            <div className="animate-fade-in">
              <img
                src={heroImage}
                alt="AI Health Mentor - People engaging in healthy activities"
                className="rounded-2xl shadow-health-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI features designed to make healthy living effortless and enjoyable.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-health-md transition-all duration-300 hover:-translate-y-1 gradient-card border-border/50"
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="gradient-primary p-12 text-center text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Health?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of users who've already started their journey to a healthier, happier life.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-background text-foreground hover:bg-background/90"
              onClick={() => navigate("/signup")}
            >
              Get Started for Free
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">AI Health Mentor</span>
          </div>
          <p className="text-sm">
            Your AI-powered personal health coach. Built with ❤️ for a healthier world.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
