import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Trophy, Star, Crown, Target } from "lucide-react";
import type { Achievement, StudentAchievement } from "@shared/schema";

interface AchievementTreeProps {
  studentId: number;
  studentName: string;
}

interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number;
  canUnlock: boolean;
}

export function AchievementTree({ studentId, studentName }: AchievementTreeProps) {
  const { data: allAchievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  const { data: studentAchievements = [] } = useQuery<(StudentAchievement & { achievement: Achievement })[]>({
    queryKey: ['/api/students', studentId, 'achievements'],
  });

  // Calculate achievement progress and unlock status
  const achievementsWithProgress: AchievementWithProgress[] = allAchievements.map(achievement => {
    const studentAchievement = studentAchievements.find(sa => sa.achievementId === achievement.id);
    const completedIds = studentAchievements.filter(sa => sa.isCompleted).map(sa => sa.achievementId);
    
    // Check if prerequisites are met
    const canUnlock = !achievement.prerequisites || 
                     achievement.prerequisites.length === 0 || 
                     achievement.prerequisites.every(prereqId => completedIds.includes(prereqId));

    return {
      ...achievement,
      isUnlocked: !!studentAchievement,
      isCompleted: studentAchievement?.isCompleted || false,
      progress: studentAchievement?.progress || 0,
      canUnlock
    };
  });

  // Group achievements by tier
  const achievementsByTier = achievementsWithProgress.reduce((acc, achievement) => {
    const tier = achievement.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(achievement);
    return acc;
  }, {} as Record<number, AchievementWithProgress[]>);

  const getTierIcon = (tier: number) => {
    switch (tier) {
      case 1: return <Target className="h-5 w-5" />;
      case 2: return <Trophy className="h-5 w-5" />;
      case 3: return <Star className="h-5 w-5" />;
      case 4: return <Crown className="h-5 w-5" />;
      case 5: return <Crown className="h-6 w-6 text-yellow-500" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return "from-gray-400 to-gray-600";
      case 2: return "from-blue-400 to-blue-600";
      case 3: return "from-purple-400 to-purple-600";
      case 4: return "from-orange-400 to-orange-600";
      case 5: return "from-yellow-400 to-yellow-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const totalAchievements = allAchievements.length;
  const completedAchievements = achievementsWithProgress.filter(a => a.isCompleted).length;
  const totalPoints = achievementsWithProgress
    .filter(a => a.isCompleted)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-indigo-600" />
            Achievement Progress for {studentName}
          </CardTitle>
          <CardDescription>
            Track your journey through the achievement progression tree
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{completedAchievements}</div>
              <div className="text-sm text-gray-600">of {totalAchievements} completed</div>
              <Progress 
                value={(completedAchievements / totalAchievements) * 100} 
                className="mt-2 h-2"
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{totalPoints}</div>
              <div className="text-sm text-gray-600">achievement points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {Math.max(...Object.keys(achievementsByTier).map(Number).filter(tier => 
                  achievementsByTier[tier].some(a => a.isCompleted)
                ), 0)}
              </div>
              <div className="text-sm text-gray-600">highest tier reached</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Tree by Tiers */}
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map(tier => {
          const tierAchievements = achievementsByTier[tier] || [];
          if (tierAchievements.length === 0) return null;

          const tierName = tier === 1 ? "Foundation" : 
                          tier === 2 ? "Advanced" : 
                          tier === 3 ? "Expert" : 
                          tier === 4 ? "Elite" : "Legendary";

          return (
            <div key={tier} className="space-y-4">
              {/* Tier Header */}
              <div className={`bg-gradient-to-r ${getTierColor(tier)} text-white rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTierIcon(tier)}
                    <div>
                      <h3 className="text-xl font-bold">Tier {tier}: {tierName}</h3>
                      <p className="text-sm opacity-90">
                        {tierAchievements.filter(a => a.isCompleted).length} of {tierAchievements.length} completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {tierAchievements.filter(a => a.isCompleted).reduce((sum, a) => sum + (a.points || 0), 0)} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier Achievements */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tierAchievements.map(achievement => (
                  <Card 
                    key={achievement.id} 
                    className={`transition-all duration-200 ${
                      achievement.isCompleted 
                        ? 'border-green-300 bg-green-50 shadow-md' 
                        : achievement.canUnlock 
                          ? 'border-blue-300 bg-blue-50 hover:shadow-md' 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <CardTitle className="text-sm font-semibold leading-tight">
                              {achievement.name}
                            </CardTitle>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getRarityColor(achievement.rarity)} mt-1`}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {achievement.isCompleted ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                          ) : achievement.canUnlock ? (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="text-xs text-gray-600 mt-1">
                            {achievement.points}pts
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs mb-3">
                        {achievement.description}
                      </CardDescription>
                      
                      {/* Prerequisites */}
                      {achievement.prerequisites && achievement.prerequisites.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-600 mb-1">Prerequisites:</div>
                          <div className="flex flex-wrap gap-1">
                            {achievement.prerequisites.map(prereqId => {
                              const prereq = allAchievements.find(a => a.id === prereqId);
                              const isCompleted = studentAchievements.some(sa => 
                                sa.achievementId === prereqId && sa.isCompleted
                              );
                              return prereq ? (
                                <Badge 
                                  key={prereqId} 
                                  variant="outline" 
                                  className={`text-xs ${isCompleted ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                                >
                                  {prereq.icon} {prereq.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {achievement.isUnlocked && !achievement.isCompleted && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}