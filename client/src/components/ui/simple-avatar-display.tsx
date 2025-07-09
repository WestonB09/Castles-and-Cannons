import { cn } from "@/lib/utils";

export const simpleAvatars = {
  "🏰": "Castle",
  "🛡️": "Knight", 
  "🔫": "Cannon",
  "🧝‍♂️": "Elf",
  "👹": "Goblin",
  "🐉": "Dragon",
  "🧙‍♂️": "Wizard",
  "🐴": "Horse",
  "⚔️": "Sword",
  "🏹": "Archer",
  "👑": "Crown",
  "🦅": "Eagle",
  "🗡️": "Warrior",
  "🔥": "Fire",
  "⚡": "Lightning",
  "💎": "Gem",
  "🌟": "Star",
  "🎯": "Target",
  "🦄": "Unicorn",
  "👸": "Princess",
  "🌙": "Moon",
  "🦁": "Lion",
  "🏔️": "Giant",
  "🐻": "Bear"
};

interface SimpleAvatarDisplayProps {
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function SimpleAvatarDisplay({ 
  avatar, 
  size = "md", 
  className 
}: SimpleAvatarDisplayProps) {
  const containerSizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const iconSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl", 
    xl: "text-4xl"
  };

  // Use avatar if valid, otherwise default to knight
  const displayAvatar = avatar && Object.keys(simpleAvatars).includes(avatar) ? avatar : "🛡️";

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full border-2 border-gray-200 bg-white",
      containerSizes[size],
      className
    )}>
      <span className={iconSizes[size]}>
        {displayAvatar}
      </span>
    </div>
  );
}