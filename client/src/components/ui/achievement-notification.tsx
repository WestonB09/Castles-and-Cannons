import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AchievementBadge } from "./achievement-badge";
import { Button } from "./button";
import { X } from "lucide-react";
import type { Achievement } from "@shared/schema";

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose?: () => void;
}

export function AchievementNotification({ achievements, onClose }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (achievements.length === 0) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < achievements.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Auto-close after showing all achievements
        setTimeout(() => {
          setVisible(false);
          onClose?.();
        }, 3000);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentIndex, achievements.length, onClose]);

  if (!visible || achievements.length === 0) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-1 rounded-lg shadow-2xl">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => {
                setVisible(false);
                onClose?.();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-4xl"
              >
                🎉
              </motion.div>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Achievement Unlocked!
                </h3>
                
                <motion.div
                  key={currentAchievement.id}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <AchievementBadge 
                    achievement={currentAchievement} 
                    isUnlocked={true}
                    size="lg"
                    showTooltip={false}
                  />
                </motion.div>
              </div>
              
              {achievements.length > 1 && (
                <div className="flex justify-center space-x-1">
                  {achievements.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex
                          ? "bg-orange-400"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}