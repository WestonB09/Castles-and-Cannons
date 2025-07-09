import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Sword, Shield, Target, Crown, Star, X } from 'lucide-react';

interface BattleResult {
  victory: boolean;
  totalPower: number;
  message: string;
  battleDetails?: string[];
  difficultyTier?: string;
  aiArmy?: {
    castle: number;
    cannon: number;
    knight: number;
    infantry: number;
    archer: number;
  };
  newAchievements?: Achievement[];
  battleResult?: {
    id: number;
    studentId: number;
    totalPower: number;
    victory: boolean;
    createdAt: string;
  };
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  requirement: string;
  points: number;
}

interface BattleResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BattleResult | null;
  studentName: string;
}

export function BattleResultModal({ isOpen, onClose, result, studentName }: BattleResultModalProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (isOpen && result) {
      setCurrentPhase(0);
      setShowDetails(false);
      setShowAchievements(false);
      
      // Cinematic sequence timing
      const sequence = [
        { phase: 1, delay: 500 },   // Show result announcement
        { phase: 2, delay: 1500 },  // Show power and difficulty
        { phase: 3, delay: 2500 },  // Show battle summary
        { phase: 4, delay: 3500 },  // Show achievements (if any)
      ];

      sequence.forEach(({ phase, delay }) => {
        setTimeout(() => {
          if (phase === 3) setShowDetails(true);
          if (phase === 4 && result.newAchievements && result.newAchievements.length > 0) {
            setShowAchievements(true);
          }
          setCurrentPhase(phase);
        }, delay);
      });
    }
  }, [isOpen, result]);

  if (!result) return null;

  const getBattlePhaseStyles = (phase: number) => {
    if (currentPhase >= phase) {
      return "opacity-100 transform translate-y-0 scale-100";
    }
    return "opacity-0 transform translate-y-8 scale-95";
  };

  const getResultIcon = () => {
    if (result.victory) {
      return <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />;
    }
    return <Shield className="w-16 h-16 text-blue-500 animate-pulse" />;
  };

  const getResultColor = () => {
    return result.victory ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-blue-400 to-purple-500";
  };

  const getDifficultyColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tutorial': return 'bg-green-100 text-green-800';
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Animated Background */}
          <div className={`absolute inset-0 ${getResultColor()} opacity-10 animate-pulse`} />
          
          {/* Header with Close Button */}
          <div className="relative p-6 pb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 z-10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="relative p-6 space-y-6">
            
            {/* Phase 1: Result Announcement */}
            <div className={`text-center transition-all duration-1000 ease-out ${getBattlePhaseStyles(1)}`}>
              <div className="flex justify-center mb-4">
                {getResultIcon()}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {result.victory ? "🏆 VICTORY!" : "⚔️ VALIANT EFFORT!"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {studentName}'s Battle Report
              </p>
            </div>

            {/* Phase 2: Power and Difficulty Stats */}
            <div className={`transition-all duration-1000 ease-out delay-200 ${getBattlePhaseStyles(2)}`}>
              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{result.totalPower}</div>
                    <div className="text-sm text-muted-foreground">Total Power</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Sword className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <Badge className={getDifficultyColor(result.difficultyTier || 'Unknown')}>
                      {result.difficultyTier || 'Unknown'}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Difficulty</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Phase 3: Battle Summary */}
            <div className={`transition-all duration-1000 ease-out delay-400 ${getBattlePhaseStyles(3)}`}>
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                    Battle Summary
                  </h3>
                  <p className="text-base mb-4 p-3 bg-muted rounded-lg">
                    {result.message}
                  </p>
                  
                  {/* Enemy Army Composition */}
                  {result.aiArmy && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Enemy Forces:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.aiArmy.castle > 0 && (
                          <Badge variant="outline">🏰 {result.aiArmy.castle}</Badge>
                        )}
                        {result.aiArmy.cannon > 0 && (
                          <Badge variant="outline">🔫 {result.aiArmy.cannon}</Badge>
                        )}
                        {result.aiArmy.knight > 0 && (
                          <Badge variant="outline">🏇 {result.aiArmy.knight}</Badge>
                        )}
                        {result.aiArmy.infantry > 0 && (
                          <Badge variant="outline">⚔️ {result.aiArmy.infantry}</Badge>
                        )}
                        {result.aiArmy.archer > 0 && (
                          <Badge variant="outline">🏹 {result.aiArmy.archer}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Battle Details */}
                  {showDetails && result.battleDetails && result.battleDetails.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Battle Details:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {result.battleDetails.map((detail, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 bg-muted/50 rounded animate-fade-in"
                            style={{ animationDelay: `${index * 200}ms` }}
                          >
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Phase 4: New Achievements */}
            {showAchievements && result.newAchievements && result.newAchievements.length > 0 && (
              <div className={`transition-all duration-1000 ease-out delay-600 ${getBattlePhaseStyles(4)}`}>
                <Card className="border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500 animate-spin" />
                      New Achievements Unlocked!
                    </h3>
                    <div className="space-y-3">
                      {result.newAchievements.map((achievement, index) => (
                        <div
                          key={achievement.id}
                          className="flex items-center p-3 bg-white rounded-lg shadow-sm animate-bounce"
                          style={{ animationDelay: `${index * 300}ms` }}
                        >
                          <div className="text-2xl mr-3">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{achievement.name}</div>
                            <div className="text-sm text-muted-foreground">{achievement.description}</div>
                          </div>
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex justify-center transition-all duration-1000 ease-out delay-800 ${getBattlePhaseStyles(4)}`}>
              <Button onClick={onClose} size="lg" className="min-w-32">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}