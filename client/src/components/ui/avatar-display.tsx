import { cn } from "@/lib/utils";

interface AvatarConfig {
  body: string;
  hair: string;
  eyes: string;
  outfit: string;
  accessory: string;
  background: string;
}

interface AvatarDisplayProps {
  avatar?: AvatarConfig | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBackground?: boolean;
}

const avatarOptions = {
  body: {
    'light': '👤',
    'medium': '👤', 
    'dark': '👤',
    'robot': '🤖',
  },
  hair: {
    'short-brown': '💇‍♂️',
    'long-blonde': '👱‍♀️',
    'curly-black': '👩‍🦱',
    'spiky-red': '👨‍🦰',
    'bald': '👨‍🦲',
    'ponytail': '👧',
  },
  eyes: {
    'brown': '👁️',
    'blue': '👁️',
    'green': '👁️',
    'hazel': '👁️',
    'glasses': '🤓',
    'sunglasses': '😎',
  },
  outfit: {
    'casual': '👕',
    'formal': '👔',
    'sporty': '👟',
    'knight': '⚔️',
    'wizard': '🧙‍♂️',
    'pirate': '🏴‍☠️',
  },
  accessory: {
    'none': '',
    'crown': '👑',
    'hat': '🎩',
    'headband': '🎀',
    'cape': '🦸‍♂️',
    'necklace': '📿',
  },
  background: {
    'castle': '🏰',
    'forest': '🌲',
    'mountains': '⛰️',
    'beach': '🏖️',
    'space': '🌌',
    'classroom': '🏫',
  },
};

const defaultAvatar: AvatarConfig = {
  body: 'light',
  hair: 'short-brown',
  eyes: 'brown',
  outfit: 'casual',
  accessory: 'none',
  background: 'castle',
};

export function AvatarDisplay({ 
  avatar, 
  size = "md", 
  className,
  showBackground = false 
}: AvatarDisplayProps) {
  const config = avatar || defaultAvatar;
  
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const iconSizes = {
    sm: { main: "text-lg", secondary: "text-xs", tertiary: "text-xs", outfit: "text-sm" },
    md: { main: "text-2xl", secondary: "text-sm", tertiary: "text-sm", outfit: "text-lg" },
    lg: { main: "text-4xl", secondary: "text-lg", tertiary: "text-lg", outfit: "text-2xl" },
    xl: { main: "text-6xl", secondary: "text-2xl", tertiary: "text-xl", outfit: "text-3xl" }
  };

  const getAvatarEmoji = (type: keyof typeof avatarOptions, value: string) => {
    return avatarOptions[type][value as keyof typeof avatarOptions[typeof type]] || '';
  };

  const body = getAvatarEmoji('body', config.body);
  const hair = getAvatarEmoji('hair', config.hair);
  const eyes = getAvatarEmoji('eyes', config.eyes);
  const outfit = getAvatarEmoji('outfit', config.outfit);
  const accessory = config.accessory !== 'none' ? getAvatarEmoji('accessory', config.accessory) : '';
  const background = showBackground ? getAvatarEmoji('background', config.background) : '';

  return (
    <div className={cn(
      "relative rounded-lg border-2 border-muted flex items-center justify-center overflow-hidden",
      sizeClasses[size],
      className
    )}>
      {/* Background */}
      {showBackground && background && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center opacity-20",
          iconSizes[size].main
        )}>
          {background}
        </div>
      )}
      
      {/* Character Stack */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Main body */}
        <div className={cn("relative", iconSizes[size].main)}>
          {body}
          
          {/* Hair overlay - positioned above head */}
          {hair && (
            <div className={cn(
              "absolute -top-1 left-1/2 transform -translate-x-1/2",
              iconSizes[size].secondary
            )}>
              {hair}
            </div>
          )}
          
          {/* Eyes overlay - positioned on upper face area */}
          {eyes && (
            <div className={cn(
              "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4",
              iconSizes[size].tertiary
            )}>
              {eyes}
            </div>
          )}
          
          {/* Accessory overlay - positioned above hair */}
          {accessory && (
            <div className={cn(
              "absolute -top-2 left-1/2 transform -translate-x-1/2",
              iconSizes[size].secondary
            )}>
              {accessory}
            </div>
          )}
        </div>
        
        {/* Outfit positioned as body extension for natural connection */}
        {outfit && (
          <div className={cn(
            "relative -mt-1 z-10",
            iconSizes[size].outfit
          )}>
            {outfit}
          </div>
        )}
      </div>
    </div>
  );
}