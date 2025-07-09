import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AchievementBadge } from "./achievement-badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { Trophy, Target, Sword, Users } from "lucide-react";
import type { Achievement, StudentAchievement } from "@shared/schema";

interface AchievementPanelProps {
  studentId: number;
  studentName: string;
}

export function AchievementPanel({ studentId, studentName }: AchievementPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: allAchievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  const { data: studentAchievements = [] } = useQuery<(StudentAchievement & { achievement: Achievement })[]>({
    queryKey: ['/api/students', studentId, 'achievements'],
  });

  const unlockedAchievements = new Set(studentAchievements.map(sa => sa.achievementId));
  
  const categories = [
    { id: "all", name: "All", icon: Trophy },
    { id: "progression", name: "Progression", icon: Target },
    { id: "battle", name: "Battle", icon: Sword },
    { id: "army", name: "Army", icon: Users },
  ];

  const filteredAchievements = selectedCategory === "all" 
    ? allAchievements 
    : allAchievements.filter(a => a.category === selectedCategory);

  const achievementsByRarity = {
    common: filteredAchievements.filter(a => a.rarity === "common"),
    rare: filteredAchievements.filter(a => a.rarity === "rare"),
    epic: filteredAchievements.filter(a => a.rarity === "epic"),
    legendary: filteredAchievements.filter(a => a.rarity === "legendary"),
  };

  const unlockedCount = filteredAchievements.filter(a => unlockedAchievements.has(a.id)).length;
  const totalCount = filteredAchievements.length;
  const progressPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>{studentName}'s Achievements</span>
          </div>
          <Badge variant="secondary">
            {unlockedCount}/{totalCount} ({progressPercentage}%)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => {
              const CategoryIcon = category.icon;
              const categoryCount = category.id === "all" 
                ? allAchievements.filter(a => unlockedAchievements.has(a.id)).length
                : allAchievements.filter(a => a.category === category.id && unlockedAchievements.has(a.id)).length;
              
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <CategoryIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryCount}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{unlockedCount}/{totalCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Achievement Grid by Rarity */}
            {Object.entries(achievementsByRarity).map(([rarity, achievements]) => {
              if (achievements.length === 0) return null;
              
              const rarityColors = {
                common: "text-gray-600 dark:text-gray-400",
                rare: "text-blue-600 dark:text-blue-400",
                epic: "text-purple-600 dark:text-purple-400",
                legendary: "text-yellow-600 dark:text-yellow-400"
              };

              return (
                <div key={rarity} className="space-y-3">
                  <h4 className={`font-semibold capitalize ${rarityColors[rarity as keyof typeof rarityColors]}`}>
                    {rarity} Achievements ({achievements.filter(a => unlockedAchievements.has(a.id)).length}/{achievements.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {achievements.map((achievement) => (
                      <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={unlockedAchievements.has(achievement.id)}
                        size="md"
                        showTooltip={true}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}