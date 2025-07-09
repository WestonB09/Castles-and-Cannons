import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [showBattleResultModal, setShowBattleResultModal] = useState(false);
  const [battleResultData, setBattleResultData] = useState<BattleResult | null>(null);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch army points for selected student
  const { data: armyPoints, isLoading: armyPointsLoading } = useQuery<StudentArmyPoints>({
    queryKey: ["/api/students", selectedStudent?.id, "army-points"],
    enabled: !!selectedStudent,
  });

  // Fetch leaderboard data
  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Update army points mutation
  const updateArmyPointsMutation = useMutation({
    mutationFn: async ({ studentId, updates }: { studentId: number; updates: Partial<StudentArmyPoints> }) => {
      return apiRequest(`/api/students/${studentId}/army-points`, {
        method: "POST",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", selectedStudent?.id, "army-points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Battle mutation
  const battleMutation = useMutation({
    mutationFn: async (studentId: number) => {
      return apiRequest(`/api/students/${studentId}/battle`, {
        method: "POST",
        body: JSON.stringify({ difficultyLevel }),
      });
    },
    onSuccess: (data: BattleResult) => {
      setBattleResultData(data);
      setShowBattleResultModal(true);
      
      // Handle new achievements
      if (data.newAchievements && data.newAchievements.length > 0) {
        setNewAchievements(data.newAchievements);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/students", selectedStudent?.id, "army-points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Avatar update mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async ({ studentId, avatar }: { studentId: number; avatar: string }) => {
      return apiRequest(`/api/students/${studentId}/avatar`, {
        method: "POST",
        body: JSON.stringify({ avatar }),
      });
    },
    onSuccess: (data) => {
      // Update the selected student with the new avatar
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent, avatar: data.avatar });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });

  // Question answer mutation
  const answerQuestionMutation = useMutation({
    mutationFn: async ({ studentId, questionId, isCorrect, difficulty }: { 
      studentId: number; 
      questionId: number; 
      isCorrect: boolean;
      difficulty: string;
    }) => {
      return apiRequest(`/api/students/${studentId}/question-answer`, {
        method: "POST",
        body: JSON.stringify({ questionId, isCorrect, difficulty }),
      });
    },
    onSuccess: (data) => {
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
      const response = await apiRequest(`/api/questions/random?difficulty=${effectiveDifficulty}&studentId=${selectedStudent.id}`);
      setCurrentQuestion(response);
      if (autoReadContent && isTTSEnabled) {
        speak("New question loaded. Listen carefully.");
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleQuestionAnswer = (isCorrect: boolean) => {
    if (!selectedStudent || !currentQuestion) return;
    
    const effectiveDifficulty = difficultyLevel === 'adaptive' ? getClassDifficulty(selectedStudent.className) : difficultyLevel;
    
    answerQuestionMutation.mutate({
      studentId: selectedStudent.id,
      questionId: currentQuestion.id,
      isCorrect,
      difficulty: effectiveDifficulty
    });
    
    setCurrentQuestion(null);
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

  // Filter leaderboard by class
  const filteredLeaderboard = selectedClassFilter === "All" 
    ? leaderboard 
    : leaderboard.filter(entry => entry.student.className === selectedClassFilter);

  // Display limited leaderboard initially
  const displayedLeaderboard = showAllLeaderboard ? filteredLeaderboard : filteredLeaderboard.slice(0, 25);

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
    <div className="min-h-screen bg-gray-50">
      {/* Achievement Notifications */}
      {newAchievements.length > 0 && (
        <AchievementNotification 
          achievements={newAchievements}
          onClose={() => setNewAchievements([])}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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
        <WinterFestivalBanner selectedStudent={selectedStudent} />

        {/* Avatar Creator Modal */}
        {selectedStudent && showAvatarCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <SimpleAvatarCreator
              student={selectedStudent}
              onSave={(avatar) => {
                console.log('Saving avatar for student:', selectedStudent.id, 'Avatar:', avatar);
                updateAvatarMutation.mutate({ studentId: selectedStudent.id, avatar });
                setShowAvatarCreator(false);
              }}
              onClose={() => setShowAvatarCreator(false)}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
                            student={student} 
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <SimpleAvatarDisplay 
                  student={selectedStudent} 
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
                      onAnswer={handleQuestionAnswer}
                      isLoading={answerQuestionMutation.isPending}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Army Building Mode Content */}
            {currentMode === "army" && armyPoints && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Castle */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">🏰</div>
                      <div className="text-2xl font-bold text-purple-600">{armyPoints.castle || 0}</div>
                    </div>
                    <h3 className="font-semibold text-purple-800 mb-1">Castles</h3>
                    <p className="text-xs text-purple-600 mb-3">Defensive command centers</p>
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

                {/* Cannon */}
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">🔫</div>
                      <div className="text-2xl font-bold text-red-600">{armyPoints.cannon || 0}</div>
                    </div>
                    <h3 className="font-semibold text-red-800 mb-1">Cannons</h3>
                    <p className="text-xs text-red-600 mb-3">Heavy siege artillery</p>
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

                {/* Knight */}
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">🛡️</div>
                      <div className="text-2xl font-bold text-yellow-600">{armyPoints.knight || 0}</div>
                    </div>
                    <h3 className="font-semibold text-yellow-800 mb-1">Knights</h3>
                    <p className="text-xs text-yellow-600 mb-3">Elite heavy cavalry</p>
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

                {/* Infantry */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">⚔️</div>
                      <div className="text-2xl font-bold text-green-600">{armyPoints.infantry || 0}</div>
                    </div>
                    <h3 className="font-semibold text-green-800 mb-1">Infantry</h3>
                    <p className="text-xs text-green-600 mb-3">Shield wall formations</p>
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

                {/* Archer */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">🏹</div>
                      <div className="text-2xl font-bold text-blue-600">{armyPoints.archer || 0}</div>
                    </div>
                    <h3 className="font-semibold text-blue-800 mb-1">Archers</h3>
                    <p className="text-xs text-blue-600 mb-3">Ranged support units</p>
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
            )}

            {/* Battle Button */}
            {currentMode === "army" && (
              <div className="text-center">
                <Button
                  onClick={handleBattle}
                  disabled={isAttacking || battleMutation.isPending || getTotalUnits() === 0}
                  className={`px-8 py-4 text-lg font-bold ${
                    isAttacking 
                      ? "bg-red-600 animate-pulse" 
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                >
                  {isAttacking ? "⚔️ ATTACKING..." : "⚔️ BATTLE THE GOBLIN ARMY!"}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Total Units: {getTotalUnits()} | Battle Power: {getTotalPower()}
                </p>
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
                  <SimpleAvatarDisplay student={entry.student} size="sm" />
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