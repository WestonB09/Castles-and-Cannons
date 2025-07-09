import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBattleAnimation } from "@/hooks/use-battle-animation";
import { AchievementPanel } from "@/components/ui/achievement-panel";
import { AchievementNotification } from "@/components/ui/achievement-notification";
import { SimpleAvatarCreator } from "@/components/ui/simple-avatar-creator";
import { SimpleAvatarDisplay } from "@/components/ui/simple-avatar-display";
import { BattleResultModal } from "@/components/ui/battle-result-modal";
import { ReadingQuestion } from "@/components/ui/reading-question";
import { WinterFestivalBanner } from "@/components/ui/winter-festival-banner";
import { AccessibilityPanel } from "@/components/ui/accessibility-panel";
import { useAccessibility } from "@/hooks/use-accessibility";
import { apiRequest } from "@/lib/queryClient";
import type { Student, StudentArmyPoints, Achievement } from "@shared/schema";

interface LeaderboardEntry {
  student: Student;
  totalPoints: number;
  victories: number;
  totalBattles: number;
}

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
}

export default function Home() {
  const { speak, readElementText, autoReadContent, isTTSEnabled } = useAccessibility();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<"units" | "battles">("units");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  // Start with Elephant class expanded, others collapsed
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set(['Rabbit', 'Bear', 'Snake', 'Husky', 'Scorpion', 'Panda', 'Octopus', 'Demo']));
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [currentMode, setCurrentMode] = useState<"army" | "question">("army");
  const [difficultyLevel, setDifficultyLevel] = useState<"adaptive" | "easy" | "moderate" | "hard">("adaptive");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [questionResult, setQuestionResult] = useState<any>(null);
  const [showBattleResultModal, setShowBattleResultModal] = useState(false);
  const [battleResultData, setBattleResultData] = useState<BattleResult | null>(null);
  const { isActive: isAttackingCustom, battleData, startBattle, endBattle } = useBattleAnimation();

  // No cleanup needed - handled by custom hook

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch army points for selected student
  const { data: armyPoints, isLoading: armyPointsLoading, error: armyPointsError } = useQuery<StudentArmyPoints>({
    queryKey: [`/api/students/${selectedStudent?.id}/army-points`],  
    enabled: !!selectedStudent,
    refetchInterval: isAttackingCustom ? false : 5000, // Stop refetching during battle
    refetchOnWindowFocus: !isAttackingCustom, // Prevent focus refetch during battle
  });


  // Fetch leaderboard data
  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: isAttackingCustom ? false : 10000, // Stop refetching during battle
    refetchOnWindowFocus: !isAttackingCustom, // Prevent focus refetch during battle
  });

  // Update army points mutation
  const updateArmyPointsMutation = useMutation({
    mutationFn: async ({ studentId, updates }: { studentId: number; updates: Partial<StudentArmyPoints> }) => {
      const response = await fetch(`/api/students/${studentId}/army-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${selectedStudent?.id}/army-points`] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Battle mutation
  const battleMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await fetch(`/api/students/${studentId}/battle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyLevel }),
      });
      return response.json();
    },
    onSuccess: (data: BattleResult) => {
      // Store battle result data first
      setBattleResultData(data);
      
      // Calculate total units for battle duration
      const totalUnits = (armyPoints?.castle || 0) + (armyPoints?.cannon || 0) + 
                        (armyPoints?.knight || 0) + (armyPoints?.infantry || 0) + 
                        (armyPoints?.archer || 0);
      
      // Start custom battle animation (isolated from React Query)
      startBattle(data, totalUnits);
      
      // Handle achievements and results after animation completes
      setTimeout(() => {
        setShowBattleResultModal(true);
        
        // Handle new achievements
        if (data.newAchievements && data.newAchievements.length > 0) {
          setNewAchievements(data.newAchievements);
        }
        
        // Update cache after battle animation completes
        queryClient.invalidateQueries({ queryKey: [`/api/students/${selectedStudent?.id}/army-points`] });
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      }, totalUnits <= 5 ? 15500 : 30500); // Small buffer after animation
    },
  });

  // Avatar update mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async ({ studentId, avatar }: { studentId: number; avatar: string }) => {
      const response = await fetch(`/api/students/${studentId}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      // Update the selected student with the new avatar
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent, avatar: data.avatar });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });

  // Question answer mutation
  const answerQuestionMutation = useMutation({
    mutationFn: async ({ studentId, questionId, selectedAnswer, difficulty }: { 
      studentId: number; 
      questionId: number; 
      selectedAnswer: string;
      difficulty: string;
    }) => {
      const response = await fetch(`/api/students/${studentId}/answer-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedAnswer }),
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      // Set result for immediate feedback
      setQuestionResult({
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        message: data.correct ? "Correct! Well done!" : `Incorrect. The correct answer is: ${data.correctAnswer}`,
        unitEarned: data.unitReward
      });

      if (data.newAchievements && data.newAchievements.length > 0) {
        setNewAchievements(prev => [...prev, ...data.newAchievements]);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/students", selectedStudent?.id, "army-points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    if (autoReadContent && isTTSEnabled) {
      speak(`Selected student ${student.name} from ${student.className} class`);
    }
  };

  const handleBattle = () => {
    if (!selectedStudent || !armyPoints) return;
    
    const totalUnits = getTotalUnits();
    if (totalUnits === 0) {
      alert("Build your army first! Add some units before battle.");
      return;
    }
    
    setIsAttacking(true);
    battleMutation.mutate(selectedStudent.id);
    
    setTimeout(() => {
      setIsAttacking(false);
    }, 3000);
  };

  const getTotalUnits = () => {
    if (!armyPoints) return 0;
    return (armyPoints.castle || 0) + (armyPoints.cannon || 0) + (armyPoints.knight || 0) + 
           (armyPoints.infantry || 0) + (armyPoints.archer || 0);
  };

  const getTotalPower = () => {
    if (!armyPoints) return 0;
    
    const basePower = getTotalUnits();
    
    // Add special units power if they exist
    const specialUnitsPower = 0; // This would be calculated from special units in the future
    
    return basePower + specialUnitsPower;
  };

  const updateArmyPoints = (type: keyof StudentArmyPoints, increment: number) => {
    if (!selectedStudent || !armyPoints) return;
    
    const currentValue = armyPoints[type] || 0;
    const newValue = Math.max(0, currentValue + increment);
    
    updateArmyPointsMutation.mutate({
      studentId: selectedStudent.id,
      updates: { [type]: newValue }
    });
  };

  const toggleClassCollapse = (className: string) => {
    setCollapsedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(className)) {
        newSet.delete(className);
      } else {
        newSet.add(className);
      }
      return newSet;
    });
  };

  // Get difficulty info based on class and override
  const getDifficultyInfo = (className: string, overrideLevel?: string) => {
    const effectiveLevel = overrideLevel === 'adaptive' ? getClassDifficulty(className) : overrideLevel || getClassDifficulty(className);
    
    switch (effectiveLevel) {
      case 'easy':
        return { level: 'Easy', color: 'text-green-600' };
      case 'moderate':
        return { level: 'Moderate', color: 'text-yellow-600' };
      case 'hard':
        return { level: 'Hard', color: 'text-red-600' };
      default:
        return { level: 'Easy', color: 'text-green-600' };
    }
  };

  const getClassDifficulty = (className: string) => {
    const easyClasses = ['Snake', 'Rabbit', 'Husky'];
    const moderateClasses = ['Panda', 'Bear'];
    const hardClasses = ['Scorpion', 'Elephant', 'Octopus'];
    
    if (easyClasses.includes(className)) return 'easy';
    if (moderateClasses.includes(className)) return 'moderate';
    if (hardClasses.includes(className)) return 'hard';
    return 'easy'; // Default for Demo class
  };

  const fetchQuestion = async () => {
    if (!selectedStudent) return;
    
    setQuestionLoading(true);
    try {
      const effectiveDifficulty = difficultyLevel === 'adaptive' ? getClassDifficulty(selectedStudent.className) : difficultyLevel;
      const response = await fetch(`/api/students/${selectedStudent.id}/question?difficulty=${effectiveDifficulty}`);
      const data = await response.json();
      setCurrentQuestion(data);
      if (autoReadContent && isTTSEnabled) {
        speak("New question loaded. Listen carefully.");
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleQuestionSubmit = () => {
    if (!selectedStudent || !currentQuestion || !selectedAnswer) return;
    
    const effectiveDifficulty = difficultyLevel === 'adaptive' ? getClassDifficulty(selectedStudent.className) : difficultyLevel;
    
    answerQuestionMutation.mutate({
      studentId: selectedStudent.id,
      questionId: currentQuestion.id,
      selectedAnswer: selectedAnswer,
      difficulty: effectiveDifficulty
    });
  };

  const resetQuestion = () => {
    setCurrentQuestion(null);
    setSelectedAnswer("");
    setQuestionResult(null);
  };

  // Group students by class
  const studentsByClass = students.reduce((acc, student) => {
    if (!acc[student.className]) {
      acc[student.className] = [];
    }
    acc[student.className].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  // Order classes with Demo at the bottom
  const orderedClasses = Object.keys(studentsByClass).sort((a, b) => {
    if (a === 'Demo') return 1;
    if (b === 'Demo') return -1;
    return a.localeCompare(b);
  });

  // Filter and sort leaderboard by class and type
  const filteredLeaderboard = selectedClassFilter === "All" 
    ? leaderboard 
    : leaderboard.filter(entry => entry.student.className === selectedClassFilter);

  // Sort leaderboard based on type selection
  const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => {
    if (leaderboardType === "units") {
      // Sort by total points, then by victories as tiebreaker
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.victories - a.victories;
    } else {
      // Sort by victories, then by total points as tiebreaker
      if (b.victories !== a.victories) {
        return b.victories - a.victories;
      }
      return b.totalPoints - a.totalPoints;
    }
  });

  // Display limited leaderboard initially
  const displayedLeaderboard = showAllLeaderboard ? sortedLeaderboard : sortedLeaderboard.slice(0, 25);

  if (studentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏰</div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen floating-clouds">
      {/* Achievement Notifications */}
      {newAchievements.length > 0 && (
        <AchievementNotification 
          achievements={newAchievements}
          onClose={() => setNewAchievements([])}
        />
      )}

      {/* Header */}
      <header className="medieval-card shadow-lg border-b-2 border-amber-600">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🏰⚔️🔫</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Castles & Cannons</h1>
                <p className="text-gray-600 text-sm">Strategic Battle Learning Game</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                📊 Analytics Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Winter Festival Banner */}
        <WinterFestivalBanner />

        {/* Avatar Creator Modal */}
        {selectedStudent && showAvatarCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <SimpleAvatarCreator
              studentId={selectedStudent.id}
              currentAvatar={selectedStudent.avatar as string}
              onSave={(avatar: string) => {
                console.log('Saving avatar for student:', selectedStudent.id, 'Avatar:', avatar);
                updateAvatarMutation.mutate({ studentId: selectedStudent.id, avatar });
                setShowAvatarCreator(false);
              }}
              onClose={() => setShowAvatarCreator(false)}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="medieval-card rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xl">⚔️</span>
            <h2 className="text-lg font-semibold text-gray-900">How to Play</h2>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            Select a student → Build their army → Battle the AI! Each unit type has tactical advantages in combat.
          </p>
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">🏰 Castles defend and coordinate</span>
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded">🔫 Cannons for siege warfare</span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🛡️ Knights charge infantry</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">⚔️ Infantry counter archers</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">🏹 Archers provide ranged support</span>
          </div>
        </div>

        {/* Student Selection */}
        <div className="medieval-card rounded-lg shadow-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Student</h2>
          <div className="space-y-2">
            {orderedClasses.map((className) => {
              const classStudents = studentsByClass[className];
              return (
                <div key={className} className="space-y-2">
                  <button
                    onClick={() => toggleClassCollapse(className)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {className === 'Elephant' ? '🐘' : 
                         className === 'Rabbit' ? '🐰' :
                         className === 'Bear' ? '🐻' :
                         className === 'Snake' ? '🐍' :
                         className === 'Husky' ? '🐕' :
                         className === 'Scorpion' ? '🦂' :
                         className === 'Panda' ? '🐼' :
                         className === 'Octopus' ? '🐙' : '👩‍🏫'}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {className} Class ({classStudents.length})
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {collapsedClasses.has(className) ? '▶' : '▼'}
                    </span>
                  </button>

                  {!collapsedClasses.has(className) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ml-4">
                      {classStudents.map((student) => (
                        <Button
                          key={student.id}
                          onClick={() => selectStudent(student)}
                          variant={selectedStudent?.id === student.id ? "default" : "outline"}
                          className="h-auto p-3 flex flex-col items-center space-y-2"
                        >
                          <SimpleAvatarDisplay 
                            avatar={student.avatar as string} 
                            size="sm" 
                            className="border-0"
                          />
                          <div className="font-medium text-sm">{student.name}</div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Army Dashboard */}
        {selectedStudent && (
          <div className="medieval-card rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <SimpleAvatarDisplay 
                  avatar={selectedStudent.avatar as string} 
                  size="lg"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}'s Army</h2>
                  <p className="text-gray-600 text-sm">Build your forces and prepare for battle!</p>
                  <Button
                    onClick={() => setShowAvatarCreator(true)}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                  >
                    🎨 Customize Avatar
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Army Power</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {armyPointsLoading ? "..." : getTotalPower()}
                </div>
              </div>
            </div>

            {/* Mode Selection Tabs with Difficulty Selector */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentMode("army")}
                  variant={currentMode === "army" ? "default" : "outline"}
                  className="flex items-center space-x-2"
                >
                  <span>⚔️</span>
                  <span>Army Building</span>
                </Button>
                <Button
                  onClick={() => setCurrentMode("question")}
                  variant={currentMode === "question" ? "default" : "outline"}
                  className="flex items-center space-x-2"
                >
                  <span>📚</span>
                  <span>Question Mode</span>
                </Button>
              </div>
              
              {/* Adaptive Difficulty Level Selector */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm">
                <span className="text-sm font-bold text-gray-800">🎯 Difficulty Level:</span>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value as any)}
                  className="text-sm border-2 border-gray-300 rounded-lg px-3 py-2 bg-white min-w-[160px] font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="adaptive">🔄 Adaptive (Class-based)</option>
                  <option value="easy">🟢 Easy Override</option>
                  <option value="moderate">🟡 Moderate Override</option>
                  <option value="hard">🔴 Hard Override</option>
                </select>
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  difficultyLevel === 'adaptive' ? 
                    `${getDifficultyInfo(selectedStudent.className, difficultyLevel).color} bg-blue-100` :
                    `${getDifficultyInfo(selectedStudent.className, difficultyLevel).color} bg-orange-100`
                }`}>
                  {difficultyLevel === 'adaptive' ? 
                    `Auto: ${getDifficultyInfo(selectedStudent.className, difficultyLevel).level}` :
                    `Override: ${getDifficultyInfo(selectedStudent.className, difficultyLevel).level}`
                  }
                </div>
              </div>
            </div>

            {/* Question Mode Content */}
            {currentMode === "question" && (
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-2 border-blue-200">
                <div className="text-center mb-6">
                  <div className="text-2xl mb-2">📚</div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">English Learning Center</h3>
                  <div className="text-sm text-blue-600">
                    {selectedStudent && (() => {
                      const diffInfo = getDifficultyInfo(selectedStudent.className, difficultyLevel);
                      return (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Current Level:</span>
                          <span className={`font-bold ${diffInfo.color}`}>
                            {diffInfo.level}
                          </span>
                          {difficultyLevel === 'adaptive' && (
                            <span className="text-xs text-gray-500">
                              (Based on {selectedStudent.className} class)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {!currentQuestion ? (
                  <div className="text-center">
                    <Button
                      onClick={fetchQuestion}
                      disabled={questionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                    >
                      {questionLoading ? "Loading..." : "🎲 Get New Question"}
                    </Button>
                    <p className="text-sm text-blue-600 mt-2">
                      Answer correctly to earn army units!
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <ReadingQuestion
                      question={currentQuestion}
                      selectedAnswer={selectedAnswer}
                      onAnswerSelect={handleAnswerSelect}
                      onSubmit={handleQuestionSubmit}
                      isSubmitting={answerQuestionMutation.isPending}
                      result={questionResult}
                    />
                    {questionResult && (
                      <div className="mt-4 text-center">
                        <Button onClick={resetQuestion} className="mr-2">
                          Next Question
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Army Building Mode Content - Enhanced Dynamic Units */}
            {currentMode === "army" && armyPoints && (
              <div className="space-y-6 mb-6">
                {/* Army Overview Stats */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl animate-pulse">⚔️</div>
                      <div>
                        <h3 className="text-xl font-bold text-amber-800">Army Command Center</h3>
                        <p className="text-amber-600">Build your forces and prepare for conquest</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-700 animate-bounce">{getTotalUnits()}</div>
                      <div className="text-sm text-amber-600">Total Units</div>
                    </div>
                  </div>
                  
                  {/* Power Progress Bar */}
                  <div className="mt-4 bg-amber-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${Math.min(100, (getTotalPower() / 100) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-amber-700 mt-1">
                    Battle Power: {getTotalPower()}/100
                  </div>
                </div>

                {/* Dynamic Army Units Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Castle - Small Keep to Legendary Stronghold */}
                  <Card className="relative bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden">
                    {/* Sparkle Effects */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
                    <div className="absolute top-3 right-3 w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                    <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 animate-bounce"></div>
                    
                    {/* Unit Level Badge */}
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      LVL {Math.floor(armyPoints.castle / 3) + 1}
                    </div>
                    
                    <CardContent className="p-4 text-center relative">
                    <div className={`mb-2 ${
                      armyPoints.castle < 3 ? 'text-2xl' :
                      armyPoints.castle < 6 ? 'text-3xl' :
                      armyPoints.castle < 10 ? 'text-4xl' :
                      armyPoints.castle < 15 ? 'text-5xl' : 'text-6xl'
                    } transition-all duration-300 group-hover:animate-pulse`}>🏰</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Castle</h3>
                    <div className="text-2xl font-bold text-purple-600 mb-2 group-hover:animate-bounce">{armyPoints.castle}</div>
                    <div className="text-xs text-purple-700 font-medium mb-3">
                      {armyPoints.castle === 0 ? 'No Castle' :
                       getTotalUnits() < 6 ? 'Stone Hut' :
                       armyPoints.castle < 3 ? 'Small Keep' :
                       armyPoints.castle < 6 ? 'Stone Castle' :
                       armyPoints.castle < 10 ? 'Great Fortress' :
                       armyPoints.castle < 15 ? 'Mighty Citadel' : 'Legendary Stronghold'}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => updateArmyPoints('castle', -1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-purple-600 border-purple-200"
                        disabled={!armyPoints.castle}
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('castle', 1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-purple-600 border-purple-200"
                      >
                        +1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('castle', 5)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-purple-600 border-purple-200"
                      >
                        +5
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Cannon - Master Gunner */}
                <Card className="relative bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <div className={`mb-2 ${
                      armyPoints.cannon < 3 ? 'text-2xl' :
                      armyPoints.cannon < 6 ? 'text-3xl' :
                      armyPoints.cannon < 10 ? 'text-4xl' :
                      armyPoints.cannon < 15 ? 'text-5xl' : 'text-6xl'
                    }`}>👨‍🔧🔫</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Master Gunner</h3>
                    <div className="text-2xl font-bold text-red-600 mb-2">{armyPoints.cannon}</div>
                    <div className="text-xs text-red-700 font-medium mb-3">
                      {armyPoints.cannon === 0 ? 'No Artillery' :
                       getTotalUnits() < 6 ? 'Novice' :
                       armyPoints.cannon < 3 ? 'Novice' :
                       armyPoints.cannon < 6 ? 'Expert' :
                       armyPoints.cannon < 10 ? 'Master' :
                       armyPoints.cannon < 15 ? 'Grand Master' : 'Artillery Lord'}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => updateArmyPoints('cannon', -1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 border-red-200"
                        disabled={!armyPoints.cannon}
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('cannon', 1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 border-red-200"
                      >
                        +1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('cannon', 5)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 border-red-200"
                      >
                        +5
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Knight - Knight Commander */}
                <Card className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <div className={`mb-2 ${
                      armyPoints.knight < 3 ? 'text-2xl' :
                      armyPoints.knight < 6 ? 'text-3xl' :
                      armyPoints.knight < 10 ? 'text-4xl' :
                      armyPoints.knight < 15 ? 'text-5xl' : 'text-6xl'
                    }`}>🏇</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Knight Commander</h3>
                    <div className="text-2xl font-bold text-yellow-600 mb-2">{armyPoints.knight}</div>
                    <div className="text-xs text-yellow-700 font-medium mb-3">
                      {armyPoints.knight === 0 ? 'No Knights' :
                       getTotalUnits() < 6 ? 'Squire' :
                       armyPoints.knight < 3 ? 'Squire' :
                       armyPoints.knight < 6 ? 'Knight' :
                       armyPoints.knight < 10 ? 'Knight Captain' :
                       armyPoints.knight < 15 ? 'Paladin' : 'Grand Paladin'}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => updateArmyPoints('knight', -1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-yellow-600 border-yellow-200"
                        disabled={!armyPoints.knight}
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('knight', 1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-yellow-600 border-yellow-200"
                      >
                        +1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('knight', 5)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-yellow-600 border-yellow-200"
                      >
                        +5
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Infantry - Master Swordsman */}
                <Card className="relative bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <div className={`mb-2 ${
                      armyPoints.infantry < 3 ? 'text-2xl' :
                      armyPoints.infantry < 6 ? 'text-3xl' :
                      armyPoints.infantry < 10 ? 'text-4xl' :
                      armyPoints.infantry < 15 ? 'text-5xl' : 'text-6xl'
                    }`}>🧙‍♂️⚔️</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Master Swordsman</h3>
                    <div className="text-2xl font-bold text-green-600 mb-2">{armyPoints.infantry}</div>
                    <div className="text-xs text-green-700 font-medium mb-3">
                      {armyPoints.infantry === 0 ? 'No Infantry' :
                       getTotalUnits() < 6 ? 'Recruit' :
                       armyPoints.infantry < 3 ? 'Recruit' :
                       armyPoints.infantry < 6 ? 'Veteran' :
                       armyPoints.infantry < 10 ? 'Elite' :
                       armyPoints.infantry < 15 ? 'Champion' : 'Legendary'}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => updateArmyPoints('infantry', -1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600 border-green-200"
                        disabled={!armyPoints.infantry}
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('infantry', 1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600 border-green-200"
                      >
                        +1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('infantry', 5)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600 border-green-200"
                      >
                        +5
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Archer - Master Archer */}
                <Card className="relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <div className={`mb-2 ${
                      armyPoints.archer < 3 ? 'text-2xl' :
                      armyPoints.archer < 6 ? 'text-3xl' :
                      armyPoints.archer < 10 ? 'text-4xl' :
                      armyPoints.archer < 15 ? 'text-5xl' : 'text-6xl'
                    }`}>🧝‍♂️🏹</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Master Archer</h3>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{armyPoints.archer}</div>
                    <div className="text-xs text-blue-700 font-medium mb-3">
                      {armyPoints.archer === 0 ? 'No Archers' :
                       getTotalUnits() < 6 ? 'Bowman' :
                       armyPoints.archer < 3 ? 'Bowman' :
                       armyPoints.archer < 6 ? 'Marksman' :
                       armyPoints.archer < 10 ? 'Sharpshooter' :
                       armyPoints.archer < 15 ? 'Eagle Eye' : 'Legendary Archer'}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => updateArmyPoints('archer', -1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-200"
                        disabled={!armyPoints.archer}
                      >
                        -1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('archer', 1)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-200"
                      >
                        +1
                      </Button>
                      <Button
                        onClick={() => updateArmyPoints('archer', 5)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-200"
                      >
                        +5
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievement Panel */}
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">🏆</div>
                      <Button
                        onClick={() => setShowAchievements(!showAchievements)}
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-200"
                      >
                        {showAchievements ? "Hide" : "View"}
                      </Button>
                    </div>
                    <h3 className="font-semibold text-amber-800 mb-1">Achievements</h3>
                    <p className="text-xs text-amber-600 mb-3">Battle badges and progress</p>
                  </CardContent>
                </Card>
                </div>
              </div>
            )}

            {/* Battle Button */}
            {currentMode === "army" && !isAttacking && (
              <div className="text-center">
                <Button
                  onClick={handleBattle}
                  disabled={battleMutation.isPending || getTotalUnits() === 0}
                  className="px-8 py-4 text-lg font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  ⚔️ BATTLE THE GOBLIN ARMY!
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Total Units: {getTotalUnits()} | Battle Power: {getTotalPower()}
                </p>
              </div>
            )}

            {/* Enhanced Battle Animation with Dynamic Scaling */}
            {isAttackingCustom && armyPoints && (
              <div className="bg-gradient-to-r from-green-100 to-orange-100 rounded-xl shadow-lg border-2 border-orange-300 p-8 mb-6 text-center medieval-card">
                <div className="text-6xl mb-4 animate-bounce">⚔️</div>
                {(() => {
                  const totalUnits = getTotalUnits();
                  const battleScale = totalUnits < 10 ? 'Skirmish' : totalUnits < 25 ? 'Battle' : totalUnits < 50 ? 'Major Battle' : 'Epic War';
                  const battleDuration = Math.max(15, Math.min(35, totalUnits * 1.2));
                  
                  return (
                    <>
                      <h3 className="text-2xl font-bold text-orange-800 mb-4 animate-pulse">
                        {battleScale} Raging! ({totalUnits} units engaged)
                      </h3>
                      <div className="text-sm text-gray-600 mb-4">
                        Battle Duration: {Math.floor(battleDuration)}s | Scale: {battleScale}
                      </div>
                    </>
                  );
                })()}
                
                {/* Advanced battle scene */}
                <div className="bg-gradient-to-b from-green-200 to-green-300 rounded-lg p-4 relative overflow-hidden min-h-[300px]">
                  <div className="text-sm text-gray-600 mb-4">⚔️ Live Battle Simulation ⚔️</div>
                  
                  {/* Enhanced Battlefield with Tactical Movement */}
                  <div className="relative h-64 bg-gradient-to-r from-blue-100 via-green-200 to-red-100 overflow-visible">
                    {/* Battlefield zones */}
                    <div className="absolute inset-0 flex">
                      {/* Player controlled territory */}
                      <div className="w-1/3 bg-blue-100 bg-opacity-50 border-r border-blue-300"></div>
                      {/* Contested middle ground */}
                      <div className="w-1/3 bg-yellow-100 bg-opacity-50 border-r border-yellow-300 relative">
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">Battle Zone</div>
                      </div>
                      {/* Goblin territory */}
                      <div className="w-1/3 bg-red-100 bg-opacity-50"></div>
                    </div>

                    {/* Player Units Advancing to Center */}
                    <div className="absolute left-8 top-8">
                      {armyPoints.castle > 0 && Array.from({ length: Math.min(3, armyPoints.castle) }).map((_, i) => (
                        <div key={`castle-${i}`} className="text-2xl mb-2" 
                             style={{ animation: 'advanceToCenter 4s ease-in-out infinite', animationDelay: `${i * 0.5}s` }}>
                          🏰
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-16 top-20">
                      {armyPoints.cannon > 0 && Array.from({ length: Math.min(4, armyPoints.cannon) }).map((_, i) => (
                        <div key={`cannon-${i}`} className="text-xl mb-1"
                             style={{ animation: 'advanceToCenter 3.5s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}>
                          🔫
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-12 top-32">
                      {armyPoints.knight > 0 && Array.from({ length: Math.min(3, armyPoints.knight) }).map((_, i) => (
                        <div key={`knight-${i}`} className="text-xl mb-1"
                             style={{ animation: 'advanceToCenter 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}>
                          🏇
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-6 top-44">
                      {armyPoints.infantry > 0 && Array.from({ length: Math.min(5, armyPoints.infantry) }).map((_, i) => (
                        <div key={`infantry-${i}`} className="text-lg mb-1"
                             style={{ animation: 'advanceToCenter 3.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}>
                          🧙‍♂️⚔️
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-10 top-56">
                      {armyPoints.archer > 0 && Array.from({ length: Math.min(4, armyPoints.archer) }).map((_, i) => (
                        <div key={`archer-${i}`} className="text-lg mb-1"
                             style={{ animation: 'advanceToCenter 2.8s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}>
                          🧝‍♂️🏹
                        </div>
                      ))}
                    </div>

                    {/* Goblin Army Advancing from Right */}
                    <div className="absolute right-8 top-12">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={`goblin-${i}`} className="text-xl mb-2"
                             style={{ animation: 'advanceFromRight 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}>
                          👹
                        </div>
                      ))}
                    </div>

                    {/* Central Battle Zone - Combat Contact Point */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {/* Main battle clash */}
                        <div className="text-4xl mb-2"
                             style={{ animation: 'combatClash 2s ease-out infinite' }}>
                          💥
                        </div>
                        {/* Secondary explosions */}
                        <div className="text-2xl mb-1"
                             style={{ animation: 'combatClash 1.8s ease-out infinite', animationDelay: '0.5s' }}>
                          ⚡
                        </div>
                        <div className="text-2xl"
                             style={{ animation: 'combatClash 2.2s ease-out infinite', animationDelay: '1s' }}>
                          🔥
                        </div>
                        {/* Battle smoke */}
                        <div className="absolute -top-4 -left-4 text-3xl opacity-70"
                             style={{ animation: 'battleSmoke 3s ease-out infinite' }}>
                          💨
                        </div>
                        <div className="absolute -top-2 -right-4 text-2xl opacity-60"
                             style={{ animation: 'battleSmoke 2.5s ease-out infinite', animationDelay: '1.2s' }}>
                          💨
                        </div>
                      </div>
                    </div>

                    {/* Flying Projectiles */}
                    <div className="absolute left-12 top-20">
                      {armyPoints.archer > 0 && Array.from({ length: Math.min(8, armyPoints.archer * 2) }).map((_, i) => (
                        <div key={`arrow-${i}`} className="text-sm"
                             style={{ 
                               animation: 'flyRight 2s linear infinite', 
                               animationDelay: `${i * 0.4}s`,
                               top: `${Math.random() * 200}px`,
                               left: `${Math.random() * 50}px`
                             }}>
                          🏹
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-16 top-24">
                      {armyPoints.cannon > 0 && Array.from({ length: Math.min(6, armyPoints.cannon) }).map((_, i) => (
                        <div key={`cannonball-${i}`} className="text-lg"
                             style={{ 
                               animation: 'flyRight 1.5s linear infinite', 
                               animationDelay: `${i * 0.6}s`,
                               top: `${Math.random() * 180}px`
                             }}>
                          ⚫
                        </div>
                      ))}
                    </div>

                    {/* Battle Effects */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 8 }).map((_, i) => {
                        const effects = ['💥', '⚡', '🔥', '💢', '✨'];
                        const effect = effects[Math.floor(Math.random() * effects.length)];
                        return (
                          <div key={`effect-${i}`} className="absolute text-2xl"
                               style={{
                                 top: `${Math.random() * 200}px`,
                                 left: `${40 + Math.random() * 120}px`,
                                 animation: 'smokeUp 2s ease-out infinite',
                                 animationDelay: `${i * 0.5}s`
                               }}>
                            {effect}
                          </div>
                        );
                      })}
                    </div>

                    {/* Smoke Effects */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const smokeTypes = ['💨', '☁️', '🌫️', '💫'];
                        const smoke = smokeTypes[Math.floor(Math.random() * smokeTypes.length)];
                        return (
                          <div key={`smoke-${i}`} className="absolute text-xl opacity-70"
                               style={{
                                 top: `${Math.random() * 220}px`,
                                 left: `${Math.random() * 300}px`,
                                 animation: 'smokeUp 3s ease-out infinite',
                                 animationDelay: `${i * 0.8}s`
                               }}>
                            {smoke}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Battle progress */}
                  <div className="mb-4">
                    <div className="text-sm text-orange-600 mb-2">
                      {getTotalPower() <= 15 ? "⚡ Swift Strike - 15 seconds" : "🔥 Major Siege - 30 seconds"}
                    </div>
                    <div className="bg-orange-200 rounded-full h-3 overflow-hidden border border-orange-400">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                           style={{ 
                             animation: `progressBar ${getTotalPower() <= 15 ? '15s' : '30s'} linear forwards`
                           }}>
                      </div>
                    </div>
                  </div>

                  <div className="text-orange-700 font-semibold animate-pulse">
                    Epic battle in progress... Your army fights the Goblin forces!<br />
                    <span className="text-sm">Watch your units advance and engage in combat!</span>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement Panel */}
            {showAchievements && selectedStudent && (
              <div className="mt-6">
                <AchievementPanel studentId={selectedStudent.id} />
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Battle Leaderboard</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() => setLeaderboardType("units")}
                variant={leaderboardType === "units" ? "default" : "outline"}
                size="sm"
              >
                🏰 Units
              </Button>
              <Button
                onClick={() => setLeaderboardType("battles")}
                variant={leaderboardType === "battles" ? "default" : "outline"}
                size="sm"
              >
                ⚔️ Victories
              </Button>
            </div>
          </div>

          {/* Class Filter */}
          <div className="mb-4">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="All">All Classes</option>
              {orderedClasses.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {displayedLeaderboard.map((entry, index) => (
              <div
                key={entry.student.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                  <SimpleAvatarDisplay avatar={entry.student.avatar as string} size="sm" />
                  <div>
                    <div className="font-medium text-gray-900">{entry.student.name}</div>
                    <div className="text-xs text-gray-500">{entry.student.className} Class</div>
                  </div>
                </div>
                <div className="text-right">
                  {leaderboardType === "units" ? (
                    <div className="text-lg font-bold text-blue-600">{entry.totalPoints}</div>
                  ) : (
                    <div className="text-lg font-bold text-green-600">{entry.victories}</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {leaderboardType === "units" ? "units" : `${entry.totalBattles} battles`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showAllLeaderboard && filteredLeaderboard.length > 25 && (
            <div className="text-center mt-4">
              <Button
                onClick={() => setShowAllLeaderboard(true)}
                variant="outline"
                size="sm"
              >
                View All Students ({filteredLeaderboard.length})
              </Button>
            </div>
          )}
        </div>

        {/* Battle Result Modal */}
        <BattleResultModal
          isOpen={showBattleResultModal}
          onClose={() => {
            setShowBattleResultModal(false);
            setBattleResultData(null);
          }}
          result={battleResultData}
          studentName={selectedStudent?.name || "Student"}
        />

        {/* Accessibility Panel */}
        <AccessibilityPanel />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl mb-2">🏰⚔️🔫</div>
          <p className="text-gray-300">Castles and Cannons - Making learning an adventure!</p>
          <p className="text-gray-400 text-sm mt-2">Educational Battle Game for Classroom Engagement</p>
        </div>
      </footer>
    </div>
  );
}