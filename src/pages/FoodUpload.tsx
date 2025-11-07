import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Activity, Camera, Upload, Loader2, Check, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAIRequest } from "@/lib/ai-logger";

interface NutritionData {
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
}

const FoodUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [mealType, setMealType] = useState("lunch");
  const [editMode, setEditMode] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setNutritionData(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setAnalyzing(true);
    const startTime = performance.now();

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(imageFile);
      const imageBase64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { imageBase64 }
      });

      if (error) throw error;

      const responseTime = performance.now() - startTime;

      setNutritionData(data);

      await logAIRequest({
        requestType: "food_analysis",
        responseTimeMs: Math.round(responseTime),
        status: "success",
      });

      toast({
        title: "Food analyzed!",
        description: "AI has identified your meal and calculated nutrition values.",
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      await logAIRequest({
        requestType: "food_analysis",
        responseTimeMs: Math.round(responseTime),
        status: "error",
        errorMessage: error.message,
      });

      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!nutritionData || !user) return;

    setSaving(true);

    try {
      const { error: mealError } = await supabase.from("meals").insert({
        user_id: user.id,
        meal_name: nutritionData.meal_name,
        meal_type: mealType,
        calories: nutritionData.calories,
        protein_g: nutritionData.protein_g,
        carbs_g: nutritionData.carbs_g,
        fats_g: nutritionData.fats_g,
        fiber_g: nutritionData.fiber_g,
        logged_at: new Date().toISOString(),
      });

      if (mealError) throw mealError;

      toast({
        title: "Meal logged!",
        description: "Your meal has been added to your daily log.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Health Mentor</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Log Your Meal</h1>
          <p className="text-muted-foreground mb-8">Upload a photo and let AI analyze the nutrition</p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Food Photo
                </CardTitle>
                <CardDescription>Take or upload a photo of your meal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Click to upload or take a photo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="w-full rounded-lg border border-border"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      Change Photo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {imagePreview && !nutritionData && (
              <Card>
                <CardHeader>
                  <CardTitle>Meal Type</CardTitle>
                  <CardDescription>Select when you ate this meal</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {imagePreview && !nutritionData && (
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                variant="hero"
                size="lg"
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Analyze Food
                  </>
                )}
              </Button>
            )}

            {nutritionData && (
              <Card className="border-primary/50 shadow-health-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      Nutrition Information
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {editMode ? "Done" : "Edit"}
                    </Button>
                  </div>
                  <CardDescription>AI-detected nutritional values</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Food Name</Label>
                    {editMode ? (
                      <Input
                        value={nutritionData.meal_name}
                        onChange={(e) =>
                          setNutritionData({ ...nutritionData, meal_name: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-semibold text-lg">{nutritionData.meal_name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Calories</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={nutritionData.calories}
                          onChange={(e) =>
                            setNutritionData({ ...nutritionData, calories: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <p className="text-2xl font-bold">{nutritionData.calories} kcal</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Protein</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={nutritionData.protein_g}
                          onChange={(e) =>
                            setNutritionData({ ...nutritionData, protein_g: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <p className="text-2xl font-bold">{nutritionData.protein_g}g</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Carbs</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={nutritionData.carbs_g}
                          onChange={(e) =>
                            setNutritionData({ ...nutritionData, carbs_g: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <p className="text-2xl font-bold">{nutritionData.carbs_g}g</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Fats</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={nutritionData.fats_g}
                          onChange={(e) =>
                            setNutritionData({ ...nutritionData, fats_g: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <p className="text-2xl font-bold">{nutritionData.fats_g}g</p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="hero"
                    size="lg"
                    className="w-full mt-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Save Meal
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FoodUpload;
