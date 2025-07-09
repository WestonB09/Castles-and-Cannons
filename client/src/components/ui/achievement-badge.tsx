import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Achievement } from "@shared/schema";

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const rarityColors = {
  common: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600",
  rare: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600",
  epic: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-600",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-600"
};

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
  lg: "text-base px-4 py-2"
};

export function AchievementBadge({ 
  achievement, 
  isUnlocked = false, 
  size = "md", 
  showTooltip = true 
}: AchievementBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-2 border-2 font-medium transition-all duration-200",
        sizeClasses[size],
        isUnlocked 
          ? rarityColors[achievement.rarity as keyof typeof rarityColors]
          : "bg-gray-50 text-gray-400 border-gray-200 opacity-60 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700",
        !isUnlocked && "grayscale"
      )}
    >
      <span className={cn("text-lg", size === "sm" && "text-base", size === "lg" && "text-xl")}>
        {achievement.icon}
      </span>
      <span className="truncate">
        {achievement.name}
      </span>
      {!isUnlocked && (
        <span className="text-xs opacity-75">🔒</span>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{achievement.icon}</span>
              <span className="font-semibold">{achievement.name}</span>
              <Badge variant="secondary" className="text-xs">
                {achievement.rarity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {!isUnlocked && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Not yet unlocked
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}