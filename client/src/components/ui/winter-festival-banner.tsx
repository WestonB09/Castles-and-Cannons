import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Snowflake, Gift, Zap } from "lucide-react";

interface WinterFestivalBannerProps {
  studentName: string;
  questionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
}

export function WinterFestivalBanner({ 
  studentName, 
  questionsAnswered, 
  correctAnswers, 
  currentStreak 
}: WinterFestivalBannerProps) {
  const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
  
  // Winter Festival Special Unit Requirements
  const icedragonRequirement = 10; // 10 correct answers in a row
  const frostWizardRequirement = 15; // 15 correct answers today
  const snowGolemRequirement = 50; // 50+ total army power

  const hasIceDragon = currentStreak >= icedragonRequirement;
  const hasFrostWizard = correctAnswers >= frostWizardRequirement;
  
  const specialUnitsEarned = [
    hasIceDragon && "Ice Dragon 🐉",
    hasFrostWizard && "Frost Wizard 🧙‍♂️",
    accuracy >= 80 && questionsAnswered >= 20 && "Snow Golem ⛄"
  ].filter(Boolean);

  return (
    <Card className="bg-gradient-to-r from-blue-100 via-white to-blue-100 border-blue-300 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-200 rounded-full">
              <Snowflake className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">❄️ Winter Magic Festival</CardTitle>
              <CardDescription className="text-blue-700">
                Limited-time event! Earn special units through English mastery
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white">
            Active Event
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Student Progress */}
        <div className="bg-white/50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">{studentName}'s Festival Progress</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentStreak}</div>
              <div className="text-sm text-blue-700">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{correctAnswers}</div>
              <div className="text-sm text-blue-700">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(accuracy)}%</div>
              <div className="text-sm text-blue-700">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Special Units Available */}
        <div>
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Winter Special Units
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Ice Dragon */}
            <div className={`p-3 rounded-lg border-2 transition-all ${
              hasIceDragon 
                ? 'border-green-400 bg-green-50' 
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">🐉</div>
                {hasIceDragon ? (
                  <Badge className="bg-green-600 text-white text-xs">Unlocked!</Badge>
                ) : (
                  <div className="text-xs text-gray-500">🔒</div>
                )}
              </div>
              <div className="font-semibold text-sm">Ice Dragon</div>
              <div className="text-xs text-gray-600 mb-2">Power: 15 | Legendary</div>
              <div className="text-xs text-blue-700">
                Requirement: {icedragonRequirement} answer streak
              </div>
              <Progress 
                value={Math.min((currentStreak / icedragonRequirement) * 100, 100)} 
                className="h-1 mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentStreak}/{icedragonRequirement}
              </div>
            </div>

            {/* Frost Wizard */}
            <div className={`p-3 rounded-lg border-2 transition-all ${
              hasFrostWizard 
                ? 'border-green-400 bg-green-50' 
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">🧙‍♂️</div>
                {hasFrostWizard ? (
                  <Badge className="bg-green-600 text-white text-xs">Unlocked!</Badge>
                ) : (
                  <div className="text-xs text-gray-500">🔒</div>
                )}
              </div>
              <div className="font-semibold text-sm">Frost Wizard</div>
              <div className="text-xs text-gray-600 mb-2">Power: 12 | Epic</div>
              <div className="text-xs text-blue-700">
                Requirement: {frostWizardRequirement} correct answers
              </div>
              <Progress 
                value={Math.min((correctAnswers / frostWizardRequirement) * 100, 100)} 
                className="h-1 mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {correctAnswers}/{frostWizardRequirement}
              </div>
            </div>

            {/* Snow Golem */}
            <div className={`p-3 rounded-lg border-2 transition-all ${
              accuracy >= 80 && questionsAnswered >= 20
                ? 'border-green-400 bg-green-50' 
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">⛄</div>
                {accuracy >= 80 && questionsAnswered >= 20 ? (
                  <Badge className="bg-green-600 text-white text-xs">Unlocked!</Badge>
                ) : (
                  <div className="text-xs text-gray-500">🔒</div>
                )}
              </div>
              <div className="font-semibold text-sm">Snow Golem</div>
              <div className="text-xs text-gray-600 mb-2">Power: 10 | Rare</div>
              <div className="text-xs text-blue-700">
                Requirement: 80% accuracy (20+ questions)
              </div>
              <Progress 
                value={questionsAnswered >= 20 ? accuracy : (questionsAnswered / 20) * 100} 
                className="h-1 mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {questionsAnswered >= 20 ? `${Math.round(accuracy)}% accuracy` : `${questionsAnswered}/20 questions`}
              </div>
            </div>
          </div>
        </div>

        {/* Special Units Earned */}
        {specialUnitsEarned.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Special Units Earned
            </h4>
            <div className="flex flex-wrap gap-2">
              {specialUnitsEarned.map((unit, index) => (
                <Badge key={index} className="bg-yellow-600 text-white">
                  {unit}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-orange-700 mt-2">
              These powerful units add extra strength to your army in battles!
            </div>
          </div>
        )}

        {/* Event Timer */}
        <div className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          🕒 Winter Festival ends February 28th, 2025 - Limited time to earn special units!
        </div>
      </CardContent>
    </Card>
  );
}