import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Camera, 
  MessageSquare, 
  TrendingUp, 
  Flame, 
  Apple,
  Droplet,
  Zap,
  Target,
  Award
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  const dailyStats = {
    calories: { current: 1650, target: 2000, unit: "kcal" },
    protein: { current: 85, target: 120, unit: "g" },
    water: { current: 6, target: 8, unit: "glasses" },
    steps: { current: 7500, target: 10000, unit: "steps" },
  };

  const aiTips = [
    "Great job staying hydrated! Try to drink 2 more glasses of water today.",
    "You're 350 calories under your target. Consider a healthy snack like nuts or fruit.",
    "Your protein intake is on track! Keep up the good work with lean proteins.",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Health Mentor</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Target className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Here's your health summary for today</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
                <Flame className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.calories.current}/{dailyStats.calories.target}
              </div>
              <Progress value={(dailyStats.calories.current / dailyStats.calories.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dailyStats.calories.target - dailyStats.calories.current} kcal remaining
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
                <Apple className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.protein.current}/{dailyStats.protein.target}g
              </div>
              <Progress value={(dailyStats.protein.current / dailyStats.protein.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dailyStats.protein.target - dailyStats.protein.current}g to goal
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hydration</CardTitle>
                <Droplet className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.water.current}/{dailyStats.water.target}
              </div>
              <Progress value={(dailyStats.water.current / dailyStats.water.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dailyStats.water.target - dailyStats.water.current} glasses left
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
                <Zap className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.steps.current.toLocaleString()}
              </div>
              <Progress value={(dailyStats.steps.current / dailyStats.steps.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {(dailyStats.steps.target - dailyStats.steps.current).toLocaleString()} steps to goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Insights */}
          <Card className="lg:col-span-2 shadow-health-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                AI Health Insights
              </CardTitle>
              <CardDescription>Personalized tips based on your progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiTips.map((tip, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-health-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Log your activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/upload")}
              >
                <Camera className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask AI Coach
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/progress")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Health Score */}
        <Card className="mt-6 gradient-primary text-primary-foreground shadow-health-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Today's Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">87</div>
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2">Great job! You're on track with your goals.</p>
                <Progress value={87} className="h-2 bg-primary-foreground/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
