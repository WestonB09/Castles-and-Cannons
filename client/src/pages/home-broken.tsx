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
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);
  const [currentMode, setCurrentMode] = useState<"army" | "question">("army");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [questionResult, setQuestionResult] = useState<any>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<"easy" | "moderate" | "hard" | "adaptive">("adaptive");
  const [showBattleResultModal, setShowBattleResultModal] = useState(false);
  const [battleResultData, setBattleResultData] = useState<BattleResult | null>(null);
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Update selected student when students data changes
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      const updatedStudent = students.find(s => s.id === selectedStudent.id);
      if (updatedStudent && updatedStudent.avatar !== selectedStudent.avatar) {
        setSelectedStudent(updatedStudent);
      }
    }
  }, [students.length]);

  // Fetch army points for selected student
  const { data: armyPoints, isLoading: armyPointsLoading } = useQuery<StudentArmyPoints>({
    queryKey: [`/api/students/${selectedStudent?.id}/army-points`],
    enabled: !!selectedStudent,
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Fetch student question history for Winter Festival progress
  const { data: studentQuestionHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/students/${selectedStudent?.id}/question-history`],
    enabled: !!selectedStudent,
  });

  // Add point mutation
  const addPointMutation = useMutation({
    mutationFn: async ({ studentId, unitType }: { studentId: number; unitType: string }) => {
      const response = await apiRequest("POST", `/api/students/${studentId}/add-point`, {
        unitType,
      });
      return response.json();
    },
    onMutate: async ({ studentId, unitType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/students/${studentId}/army-points`] });
      
      // Snapshot the previous value
      const previousArmyPoints = queryClient.getQueryData([`/api/students/${studentId}/army-points`]);
      
      // Optimistically update the cache
      queryClient.setQueryData([`/api/students/${studentId}/army-points`], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          [unitType]: (old[unitType] || 0) + 1
        };
      });
      
      return { previousArmyPoints };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousArmyPoints) {
        queryClient.setQueryData([`/api/students/${variables.studentId}/army-points`], context.previousArmyPoints);
      }
    },
    onSuccess: (data, variables) => {
      // Ensure we have the correct server data
      queryClient.setQueryData([`/api/students/${variables.studentId}/army-points`], data);
      // Update other related queries
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  // Battle simulation mutation
  const battleMutation = useMutation({
    mutationFn: async (studentId: number) => {
      setIsAttacking(true);
      
      // Battle duration - shortened to 20 seconds for perfecting animations
      const battleDuration = 20000; // 20 seconds for all battles while perfecting animations
      
      // Add delay for animation effect
      await new Promise(resolve => setTimeout(resolve, battleDuration));
      const difficulty = difficultyLevel === 'adaptive' ? undefined : difficultyLevel;
      const response = await apiRequest("POST", `/api/students/${studentId}/battle`, {
        body: JSON.stringify({ difficulty })
      });
      return response.json();
    },
    onSuccess: (data: BattleResult) => {
      setIsAttacking(false);
      setBattleResultData(data);
      setShowBattleResultModal(true);
      
      // Show achievement notifications if any new achievements were unlocked
      if (data.newAchievements && data.newAchievements.length > 0) {
        setNewAchievements(data.newAchievements);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", selectedStudent?.id, "achievements"] });
    },
    onError: () => {
      setIsAttacking(false);
    },
  });

  // Get English question mutation
  const getQuestionMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const difficulty = difficultyLevel === 'adaptive' ? undefined : difficultyLevel;
      const response = await apiRequest("GET", `/api/students/${studentId}/question${difficulty ? `?difficulty=${difficulty}` : ''}`);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentQuestion(data);
      setSelectedAnswer("");
      setQuestionResult(null);
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ studentId, questionId, selectedAnswer }: { studentId: number; questionId: number; selectedAnswer: string }) => {
      setIsSubmittingAnswer(true);
      const response = await apiRequest("POST", `/api/students/${studentId}/answer-question`, {
        questionId,
        selectedAnswer,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmittingAnswer(false);
      setQuestionResult(data);
      
      // Show achievement notifications if any new achievements were unlocked
      if (data.newAchievements && data.newAchievements.length > 0) {
        setNewAchievements(data.newAchievements);
      }
      
      // Invalidate relevant queries
      if (selectedStudent) {
        queryClient.invalidateQueries({ queryKey: [`/api/students/${selectedStudent.id}/army-points`] });
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/students", selectedStudent.id, "achievements"] });
      }
    },
    onError: () => {
      setIsSubmittingAnswer(false);
    },
  });

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setBattleResult(null);
  };

  const givePoint = (unitType: string) => {
    if (!selectedStudent) return;
    addPointMutation.mutate({
      studentId: selectedStudent.id,
      unitType,
    });
  };

  const simulateBattle = () => {
    if (!selectedStudent) return;
    battleMutation.mutate(selectedStudent.id);
  };

  const getNewQuestion = () => {
    if (!selectedStudent) return;
    getQuestionMutation.mutate(selectedStudent.id);
  };

  const submitAnswer = () => {
    if (!selectedStudent || !currentQuestion || !selectedAnswer) return;
    submitAnswerMutation.mutate({
      studentId: selectedStudent.id,
      questionId: currentQuestion.id,
      selectedAnswer,
    });
  };

  const getDifficultyInfo = (className: string, overrideDifficulty?: string) => {
    if (overrideDifficulty && overrideDifficulty !== 'adaptive') {
      const difficultyMap = {
        'easy': { level: 'Easy', color: 'text-green-600', description: 'Basic vocabulary and simple grammar' },
        'moderate': { level: 'Moderate', color: 'text-yellow-600', description: 'Intermediate grammar and vocabulary' },
        'hard': { level: 'Hard', color: 'text-red-600', description: 'Advanced grammar and complex vocabulary' }
      };
      return difficultyMap[overrideDifficulty as keyof typeof difficultyMap];
    }
    
    const classLower = className.toLowerCase();
    if (['snake', 'rabbit', 'husky'].includes(classLower)) {
      return { level: 'Easy', color: 'text-green-600', description: 'Basic vocabulary and simple grammar' };
    } else if (['panda', 'bear', 'octopus'].includes(classLower)) {
      return { level: 'Moderate', color: 'text-yellow-600', description: 'Intermediate grammar and vocabulary' };
    } else if (['scorpion', 'elephant'].includes(classLower)) {
      return { level: 'Hard', color: 'text-red-600', description: 'Advanced grammar and complex vocabulary' };
    }
    return { level: 'Moderate', color: 'text-yellow-600', description: 'Standard difficulty level' };
  };

  const getTotalPower = () => {
    if (!armyPoints) return 0;
    return (armyPoints.castle || 0) + (armyPoints.cannon || 0) + (armyPoints.knight || 0) + 
           (armyPoints.infantry || 0) + (armyPoints.archer || 0);
  };

  // Group students by class and order with Demo at bottom
  const studentsByClass = students?.reduce((acc, student) => {
    if (!acc[student.className]) acc[student.className] = [];
    acc[student.className].push(student);
    return acc;
  }, {} as Record<string, Student[]>) || {};

  // Order classes with Demo always at the bottom
  const orderedClasses = Object.keys(studentsByClass).sort((a, b) => {
    if (a === 'Demo') return 1;
    if (b === 'Demo') return -1;
    return a.localeCompare(b);
  });

  // Filter and sort leaderboard
  const filteredLeaderboard = leaderboard?.filter(entry => 
    selectedClassFilter === "All" || entry.student.className === selectedClassFilter
  ) || [];

  const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => {
    if (leaderboardType === "units") {
      return b.totalPoints - a.totalPoints;
    } else {
      return b.victories - a.victories;
    }
  });

  // Toggle class collapse
  const toggleClassCollapse = (className: string) => {
    const newCollapsed = new Set(collapsedClasses);
    if (newCollapsed.has(className)) {
      newCollapsed.delete(className);
    } else {
      newCollapsed.add(className);
    }
    setCollapsedClasses(newCollapsed);
  };

  const getClassStyles = (className: string) => {
    switch (className) {
      case 'Elephant':
        return 'border-blue-300 bg-blue-50 text-blue-800';
      case 'Rabbit':
        return 'border-green-300 bg-green-50 text-green-800';
      case 'Bear':
        return 'border-amber-300 bg-amber-50 text-amber-800';
      case 'Snake':
        return 'border-green-500 bg-green-100 text-green-800';
      case 'Husky':
        return 'border-blue-600 bg-blue-100 text-blue-900';
      case 'Scorpion':
        return 'border-red-500 bg-red-100 text-red-800';
      case 'Panda':
        return 'border-gray-800 bg-gray-100 text-gray-900';
      case 'Octopus':
        return 'border-purple-500 bg-purple-100 text-purple-800';
      case 'Demo':
        return 'border-purple-300 bg-purple-50 text-purple-800';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-800';
    }
  };

  // Remove debug logging since the issue is fixed
  // console.log('Army points data:', armyPoints);
  // console.log('Selected student:', selectedStudent);

  const unitTypes = [
    { key: 'castle', name: 'Castle', emoji: '🏰', color: 'purple' },
    { key: 'cannon', name: 'Cannon', emoji: '🔫', color: 'red' },
    { key: 'knight', name: 'Knight', emoji: '🛡️', color: 'yellow' },
    { key: 'infantry', name: 'Infantry', emoji: '🗡️', color: 'green' },
    { key: 'archer', name: 'Archer', emoji: '🏹', color: 'blue' },
  ];

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
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🏰</div>
              <div>
                <h1 className="text-3xl font-bold">Castles and Cannons</h1>
                <p className="text-blue-100 text-sm">Educational Battle Game</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Elephant Class Online</span>
              </div>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                >
                  📊 Student Dashboard
                </Button>
              </Link>
              {selectedStudent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAchievementPanel(!showAchievementPanel)}
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                >
                  🏆 Achievements
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Winter Festival Banner */}
        {selectedStudent && (
          <div className="mb-6">
            <WinterFestivalBanner
              studentName={selectedStudent.name}
              questionsAnswered={Array.isArray(studentQuestionHistory) ? studentQuestionHistory.length : 0}
              correctAnswers={Array.isArray(studentQuestionHistory) ? studentQuestionHistory.filter((q: any) => q.isCorrect).length : 0}
              currentStreak={(() => {
                if (!Array.isArray(studentQuestionHistory) || studentQuestionHistory.length === 0) return 0;
                let streak = 0;
                for (let i = studentQuestionHistory.length - 1; i >= 0; i--) {
                  if (studentQuestionHistory[i]?.isCorrect) {
                    streak++;
                  } else {
                    break;
                  }
                }
                return streak;
              })()}
            />
          </div>
        )}

        {/* Compact Layout for Reduced Scrolling */}
        <div className="space-y-6">
          {/* Compact Instructions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xl">⚔️</span>
              <h2 className="text-lg font-semibold text-gray-900">How to Play</h2>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Select student → Build army → Battle AI! Each unit has tactical advantages.
            </p>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">🏰 Castles defend</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">🔫 Cannons siege</span>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🛡️ Knights vs infantry</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">⚔️ Infantry vs archers</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">🏹 Archers ranged</span>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Student Selection */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-80 overflow-y-auto sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Student</h2>
                  {orderedClasses.map((className) => {
                    const classStudents = studentsByClass[className];
                    return (
                      <div key={className} className="space-y-1">
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
                       className === 'Octopus' ? '🐙' :
                       className === 'Demo' ? '👩‍🏫' : '👤'}
                    </span>
                    <h3 className="font-semibold text-gray-700">
                      {className} Class ({classStudents.length})
                    </h3>
                  </div>
                  <span className="text-gray-500 text-lg">
                    {collapsedClasses.has(className) ? '▶' : '▼'}
                  </span>
                </button>
                
                {!collapsedClasses.has(className) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-4">
                    {classStudents.map((student) => (
                      <Button
                        key={student.id}
                        onClick={() => selectStudent(student)}
                        variant={selectedStudent?.id === student.id ? "default" : "outline"}
                        className={`h-auto p-3 flex flex-col items-center space-y-2 transition-all duration-200 hover:scale-105 ${getClassStyles(student.className)}`}
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
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
                      const diffInfo = getDifficultyInfo(selectedStudent.className);
                      return (
                        <div>
                          <span className={`font-semibold ${diffInfo.color}`}>
                            {selectedStudent.className} Class - {diffInfo.level} Level
                          </span>
                          <div className="text-xs mt-1">{diffInfo.description}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {!currentQuestion && !questionResult && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Answer English questions correctly to earn army units!</p>
                    <div className="mb-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <strong>Current Setting:</strong> {
                          difficultyLevel === 'adaptive' ? 
                            `Adaptive mode automatically adjusting to ${selectedStudent.className} Class level` :
                            `Manual override set to ${difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)} difficulty`
                        }
                      </div>
                    </div>
                    <Button
                      onClick={getNewQuestion}
                      disabled={getQuestionMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                    >
                      {getQuestionMutation.isPending ? "Loading Question..." : "🎯 Get New Question"}
                    </Button>
                  </div>
                )}

                {currentQuestion && !questionResult && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-600 capitalize">
                          {currentQuestion.category} • {currentQuestion.difficulty}
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          Reward: +1 {currentQuestion.unitReward}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        {currentQuestion.question}
                      </h4>
                      
                      <div className="space-y-2 mb-4">
                        {currentQuestion.answers.map((answer: string, index: number) => (
                          <label
                            key={index}
                            className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="answer"
                              value={answer}
                              checked={selectedAnswer === answer}
                              onChange={(e) => setSelectedAnswer(e.target.value)}
                              className="text-blue-600"
                            />
                            <span className="text-gray-700">{answer}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={submitAnswer}
                          disabled={!selectedAnswer || isSubmittingAnswer}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          {isSubmittingAnswer ? "Submitting..." : "Submit Answer"}
                        </Button>
                        <Button
                          onClick={() => {
                            setCurrentQuestion(null);
                            setSelectedAnswer("");
                            setQuestionResult(null);
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {questionResult && (
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 border-2 ${
                      questionResult.correct 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">
                          {questionResult.correct ? "🎉" : "❌"}
                        </div>
                        <h4 className={`text-xl font-bold ${
                          questionResult.correct ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {questionResult.correct ? "Correct!" : "Incorrect"}
                        </h4>
                        
                        {questionResult.correct ? (
                          <div className="text-green-700 mt-2">
                            {questionResult.unitReward ? (
                              <p>Great job! You earned +1 {questionResult.unitReward}!</p>
                            ) : (
                              <div>
                                <p>Correct answer! 🎯</p>
                                {questionResult.threshold50Reached && (
                                  <p className="text-sm mt-1 text-orange-600 font-medium">
                                    You have 50+ units! Now you need 2 correct answers to earn 1 unit.
                                    {questionResult.nextUnitIn && (
                                      <span className="block">Next unit in {questionResult.nextUnitIn} more correct answer{questionResult.nextUnitIn > 1 ? 's' : ''}.</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                            {questionResult.newAchievements?.length > 0 && (
                              <p className="text-sm font-medium mt-1">
                                🏆 New achievements unlocked!
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-700 mt-2">
                            <p>The correct answer was: <strong>{questionResult.correctAnswer}</strong></p>
                            <p className="text-sm mt-1">Keep practicing to improve!</p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={getNewQuestion}
                          disabled={getQuestionMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                        >
                          {getQuestionMutation.isPending ? "Loading..." : "Next Question"}
                        </Button>
                        <Button
                          onClick={() => {
                            setCurrentQuestion(null);
                            setSelectedAnswer("");
                            setQuestionResult(null);
                          }}
                          variant="outline"
                        >
                          Finish
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Army Visualization */}
            {currentMode === "army" && armyPoints && (
              <div className="bg-gradient-to-b from-green-100 to-green-200 rounded-xl p-6 mb-6 border-2 border-green-300">
                <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">🏰 {selectedStudent.name}'s Kingdom 🏰</h3>
                
                {/* Castle Display */}
                <div className="flex justify-center mb-4">
                  <div className="text-center">
                    <div className={`${
                      armyPoints.castle >= 20 ? 'text-8xl' :
                      armyPoints.castle >= 15 ? 'text-7xl' :
                      armyPoints.castle >= 10 ? 'text-6xl' :
                      armyPoints.castle >= 5 ? 'text-5xl' : 
                      armyPoints.castle >= 1 ? 'text-4xl' : 'text-2xl'
                    } animate-pulse`}>🏰</div>
                    <div className="text-stone-700 font-bold text-lg mt-2">
                      {armyPoints.castle === 0 ? 'No Fortress' :
                       armyPoints.castle < 5 ? 'Small Keep' :
                       armyPoints.castle < 10 ? 'Stone Castle' :
                       armyPoints.castle < 15 ? 'Great Fortress' :
                       armyPoints.castle < 20 ? 'Mighty Citadel' : 'Legendary Stronghold'}
                    </div>
                    <div className="text-stone-600 text-sm">({armyPoints.castle} fortifications)</div>
                  </div>
                </div>

                {/* Army Formation Display */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Cannons */}
                  {armyPoints.cannon > 0 && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-center text-white font-semibold mb-2">Master Gunner</div>
                      <div className="flex justify-center">
                        <div className="text-center relative">
                          <div className={`${
                            armyPoints.cannon >= 20 ? 'text-6xl' :
                            armyPoints.cannon >= 15 ? 'text-5xl' :
                            armyPoints.cannon >= 10 ? 'text-4xl' :
                            armyPoints.cannon >= 5 ? 'text-3xl' : 'text-2xl'
                          } animate-bounce`}>👨‍🔧</div>
                          <div className={`absolute -top-1 -right-1 ${
                            armyPoints.cannon >= 20 ? 'text-2xl' :
                            armyPoints.cannon >= 15 ? 'text-xl' :
                            armyPoints.cannon >= 10 ? 'text-lg' :
                            armyPoints.cannon >= 5 ? 'text-base' : 'text-sm'
                          }`}>🔫</div>
                          <div className="text-yellow-400 font-bold text-sm mt-1">
                            {armyPoints.cannon < 5 ? 'Novice' :
                             armyPoints.cannon < 10 ? 'Expert' :
                             armyPoints.cannon < 15 ? 'Master' :
                             armyPoints.cannon < 20 ? 'Grand Master' : 'Artillery Lord'}
                          </div>
                          <div className="text-white text-xs">({armyPoints.cannon} cannons)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Knights */}
                  {armyPoints.knight > 0 && (
                    <div className="bg-blue-600 rounded-lg p-3">
                      <div className="text-center text-white font-semibold mb-2">Knight Commander</div>
                      <div className="flex justify-center">
                        <div className="text-center">
                          <div className={`${
                            armyPoints.knight >= 20 ? 'text-6xl' :
                            armyPoints.knight >= 15 ? 'text-5xl' :
                            armyPoints.knight >= 10 ? 'text-4xl' :
                            armyPoints.knight >= 5 ? 'text-3xl' : 'text-2xl'
                          } animate-pulse`}>🏇</div>
                          <div className="text-yellow-400 font-bold text-sm mt-1">
                            {armyPoints.knight < 5 ? 'Squire' :
                             armyPoints.knight < 10 ? 'Knight' :
                             armyPoints.knight < 15 ? 'Knight Captain' :
                             armyPoints.knight < 20 ? 'Paladin' : 'Grand Paladin'}
                          </div>
                          <div className="text-white text-xs">({armyPoints.knight} cavalry)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Infantry - Master Swordsman */}
                  {armyPoints.infantry > 0 && (
                    <div className="bg-red-600 rounded-lg p-3">
                      <div className="text-center text-white font-semibold mb-2">Master Swordsman</div>
                      <div className="flex justify-center">
                        <div className="text-center relative">
                          <div className={`${
                            armyPoints.infantry >= 20 ? 'text-6xl' :
                            armyPoints.infantry >= 15 ? 'text-5xl' :
                            armyPoints.infantry >= 10 ? 'text-4xl' :
                            armyPoints.infantry >= 5 ? 'text-3xl' : 'text-2xl'
                          } animate-pulse`}>🧙‍♂️</div>
                          <div className={`absolute -top-1 -right-1 ${
                            armyPoints.infantry >= 20 ? 'text-2xl' :
                            armyPoints.infantry >= 15 ? 'text-xl' :
                            armyPoints.infantry >= 10 ? 'text-lg' :
                            armyPoints.infantry >= 5 ? 'text-base' : 'text-sm'
                          }`}>⚔️</div>
                          <div className="text-yellow-400 font-bold text-sm mt-1">
                            {armyPoints.infantry < 5 ? 'Recruit' :
                             armyPoints.infantry < 10 ? 'Veteran' :
                             armyPoints.infantry < 15 ? 'Elite' :
                             armyPoints.infantry < 20 ? 'Champion' : 'Legendary'}
                          </div>
                          <div className="text-white text-xs">({armyPoints.infantry} units)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Archers */}
                  {armyPoints.archer > 0 && (
                    <div className="bg-green-600 rounded-lg p-3">
                      <div className="text-center text-white font-semibold mb-2">Master Archer</div>
                      <div className="flex justify-center">
                        <div className="text-center relative">
                          <div className={`${
                            armyPoints.archer >= 20 ? 'text-6xl' :
                            armyPoints.archer >= 15 ? 'text-5xl' :
                            armyPoints.archer >= 10 ? 'text-4xl' :
                            armyPoints.archer >= 5 ? 'text-3xl' : 'text-2xl'
                          } animate-bounce`}>🧝‍♂️</div>
                          <div className={`absolute -top-1 -right-1 ${
                            armyPoints.archer >= 20 ? 'text-2xl' :
                            armyPoints.archer >= 15 ? 'text-xl' :
                            armyPoints.archer >= 10 ? 'text-lg' :
                            armyPoints.archer >= 5 ? 'text-base' : 'text-sm'
                          }`}>🏹</div>
                          <div className="text-yellow-400 font-bold text-sm mt-1">
                            {armyPoints.archer < 5 ? 'Bowman' :
                             armyPoints.archer < 10 ? 'Marksman' :
                             armyPoints.archer < 15 ? 'Sharpshooter' :
                             armyPoints.archer < 20 ? 'Eagle Eye' : 'Legendary Archer'}
                          </div>
                          <div className="text-white text-xs">({armyPoints.archer} bowmen)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Army Status */}
                <div className="mt-4 text-center">
                  {(armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer) === 0 ? (
                    <div className="text-gray-600 italic">Empty kingdom - start building your army!</div>
                  ) : (armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer) < 5 ? (
                    <div className="text-orange-700 font-semibold">🏘️ Small settlement</div>
                  ) : (armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer) < 15 ? (
                    <div className="text-blue-700 font-semibold">🏘️ Growing village</div>
                  ) : (armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer) < 30 ? (
                    <div className="text-purple-700 font-semibold">🏰 Fortified town</div>
                  ) : (
                    <div className="text-yellow-700 font-bold">👑 Mighty kingdom!</div>
                  )}
                </div>
              </div>
            )}

            {/* Army Units Grid - Only show in army mode */}
            {currentMode === "army" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {unitTypes.map((unit) => (
                  <Card 
                    key={unit.key} 
                    className={`relative bg-gradient-to-br from-${unit.color}-50 to-${unit.color}-100 border-2 border-${unit.color}-200 hover:shadow-lg transition-all duration-200`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{unit.emoji}</div>
                      <h3 className="font-semibold text-gray-900 mb-1">{unit.name}</h3>
                      <div className={`text-2xl font-bold text-${unit.color}-600 mb-3`}>
                        {armyPointsLoading ? "..." : armyPoints ? (armyPoints[unit.key as keyof StudentArmyPoints] || 0) : 0}
                      </div>
                      <Button
                        onClick={() => givePoint(unit.key)}
                        disabled={addPointMutation.isPending}
                        className={`relative w-full bg-${unit.color}-500 hover:bg-${unit.color}-600 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 text-sm`}
                        size="sm"
                      >
                        <span className="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold mr-2">+1</span>
                        {unit.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Battle Section - Only show in army mode */}
            {currentMode === "army" && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">⚔️</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Ready for Battle?</h3>
                    <p className="text-gray-600 text-sm">Challenge the Goblin army with your forces!</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {difficultyLevel === 'adaptive' ? 
                        'Adaptive difficulty: AI strength scales with your battle experience' :
                        `Override active: Using ${difficultyLevel} difficulty for all battles`
                      }
                    </div>
                  </div>
                </div>
                <Button
                  onClick={simulateBattle}
                  disabled={battleMutation.isPending || !selectedStudent}
                  className={`bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                    isAttacking ? 'animate-pulse scale-110' : ''
                  }`}
                >
                  {isAttacking ? "⚔️ Attacking Goblins..." : battleMutation.isPending ? "⚔️ Processing..." : "🗡️ Attack Goblin Army"}
                </Button>
              </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Battle Animation with Dynamic Scaling */}
        {isAttacking && armyPoints && (
          <div className="bg-gradient-to-r from-green-100 to-orange-100 rounded-xl shadow-lg border-2 border-orange-300 p-8 mb-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">⚔️</div>
            {(() => {
              const totalUnits = armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer;
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
            <div className="bg-gradient-to-b from-green-200 to-green-300 rounded-lg p-6 mb-4 relative overflow-hidden min-h-[300px]">
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
                  {/* Enemy territory */}
                  <div className="w-1/3 bg-red-100 bg-opacity-50"></div>
                </div>

                {/* Your Army Formation - Dynamic based on unit count */}
                <div className="absolute left-4 top-8">
                  <div className="text-xs font-medium text-blue-700 mb-2">Your Forces</div>
                  <div className="space-y-2">
                    {/* Castles stay in base - multiple if many */}
                    {armyPoints && armyPoints.castle > 0 && (
                      <div className="flex flex-wrap">
                        <div className="text-2xl animate-pulse">🏰</div>
                        {armyPoints.castle > 2 && <div className="text-lg animate-pulse" style={{animationDelay: '0.3s'}}>🏰</div>}
                        {armyPoints.castle > 5 && <div className="text-base animate-pulse" style={{animationDelay: '0.6s'}}>🏰</div>}
                      </div>
                    )}
                    {/* Cannons in defensive position - more cannons = more firepower */}
                    {armyPoints && armyPoints.cannon > 0 && (
                      <div className="flex flex-wrap space-x-1">
                        <div className="text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>🔫</div>
                        {armyPoints.cannon > 2 && <div className="text-xl animate-bounce" style={{animationDelay: '0.4s'}}>🔫</div>}
                        {armyPoints.cannon > 5 && <div className="text-lg animate-bounce" style={{animationDelay: '0.6s'}}>🔫</div>}
                        {armyPoints.cannon > 8 && <div className="text-base animate-bounce" style={{animationDelay: '0.8s'}}>🔫</div>}
                      </div>
                    )}
                    {/* Archers stay back and shoot - archer formations */}
                    {armyPoints && armyPoints.archer > 0 && (
                      <div className="flex flex-wrap space-x-1">
                        <div className="text-2xl animate-bounce" style={{animationDelay: '0.8s'}}>🏹</div>
                        {armyPoints.archer > 3 && <div className="text-xl animate-bounce" style={{animationDelay: '1.0s'}}>🏹</div>}
                        {armyPoints.archer > 6 && <div className="text-lg animate-bounce" style={{animationDelay: '1.2s'}}>🏹</div>}
                        {armyPoints.archer > 10 && <div className="text-base animate-bounce" style={{animationDelay: '1.4s'}}>🏹</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Your advancing units - Warfare 1917 Style */}
                <div className="absolute left-8 top-8">

                  
                  {/* Swordsmen Regiment - Victory advance in final phase */}
                  {armyPoints && armyPoints.infantry > 0 && (
                    <div className="flex flex-col space-y-1">
                      <div className="text-lg transform relative"
                           style={{
                             animation: 'victoryAdvance 20s ease-in-out infinite, marchingStep 0.8s ease-in-out infinite',
                             animationDelay: '0s'
                           }}>
                        <span>🧙‍♂️🧙‍♂️🧙‍♂️</span>
                        <span className="absolute -top-1 left-1 text-xs">⚔️⚔️⚔️</span>
                      </div>
                      {armyPoints.infantry > 3 && (
                        <div className="text-lg transform relative"
                             style={{
                               animation: 'victoryAdvance 20s ease-in-out infinite, marchingStep 0.8s ease-in-out infinite',
                               animationDelay: '1s'
                             }}>
                          <span>🧙‍♂️🧙‍♂️</span>
                          <span className="absolute -top-1 left-1 text-xs">⚔️⚔️</span>
                        </div>
                      )}
                      {armyPoints.infantry > 6 && (
                        <div className="text-lg transform relative"
                             style={{
                               animation: 'troopAdvanceToCenter 18s ease-in-out infinite, marchingStep 0.9s ease-in-out infinite',
                               animationDelay: '2s'
                             }}>
                          <span>🧙‍♂️</span>
                          <span className="absolute -top-1 left-1 text-xs">⚔️</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="absolute left-8 top-16">
                  {/* Knights cavalry - Deep pursuit in final phase */}
                  {armyPoints && armyPoints.knight > 0 && (
                    <div className="text-2xl transform"
                         style={{
                           animation: 'victoryAdvance 20s ease-in-out infinite, marchingStep 1.2s ease-in-out infinite',
                           animationDelay: '1.5s'
                         }}>🏇🏇</div>
                  )}
                  {armyPoints && armyPoints.knight > 2 && (
                    <div className="text-xl transform mt-1"
                         style={{
                           animation: 'victoryAdvance 20s ease-in-out infinite, marchingStep 1.1s ease-in-out infinite',
                           animationDelay: '2.5s'
                         }}>🏇</div>
                  )}
                </div>

                <div className="absolute left-8 top-24">
                  {/* Archers - Cautious advance in final phase */}
                  {armyPoints && armyPoints.archer > 0 && (
                    <div className="text-lg transform relative"
                         style={{
                           animation: 'archerAdvance 20s ease-in-out infinite',
                           animationDelay: '1.2s'
                         }}>
                      <span>🧝‍♂️🧝‍♂️🧝‍♂️</span>
                      <span className="absolute -top-1 left-2 text-xs">🏹🏹🏹</span>
                    </div>
                  )}
                  {armyPoints && armyPoints.archer > 3 && (
                    <div className="text-lg transform relative mt-1"
                         style={{
                           animation: 'archerAdvance 20s ease-in-out infinite',
                           animationDelay: '2s'
                         }}>
                      <span>🧝‍♂️🧝‍♂️</span>
                      <span className="absolute -top-1 left-1 text-xs">🏹🏹</span>
                    </div>
                  )}
                </div>

                {/* Goblin Army Formation */}
                <div className="absolute right-4 top-8">
                  <div className="text-xs font-medium text-red-700 mb-2">Goblin Horde</div>
                  <div className="space-y-2">
                    <div className="text-2xl animate-bounce" style={{animationDelay: '0.1s'}}>👹</div>
                    <div className="text-2xl animate-bounce" style={{animationDelay: '0.7s'}}>🏹</div>
                  </div>
                </div>

                {/* Goblin advancing units with retreat in final phase */}
                <div className="absolute right-8 top-8">
                  {/* Goblin horde - strategic retreat in final 5 seconds */}
                  <div className="flex flex-col space-y-1">
                    <div className="text-lg transform"
                         style={{
                           animation: 'goblinRetreat 20s ease-in-out infinite, marchingStep 0.9s ease-in-out infinite',
                           animationDelay: '0.2s'
                         }}>👹👹👹</div>
                    <div className="text-lg transform"
                         style={{
                           animation: 'goblinRetreat 20s ease-in-out infinite, marchingStep 0.9s ease-in-out infinite',
                           animationDelay: '0.6s'
                         }}>👹👹</div>
                  </div>
                </div>
                
                <div className="absolute right-8 top-16">
                  {/* Goblin warriors with randomized retreat patterns */}
                  <div className="text-2xl transform"
                       style={{
                         animation: `${Math.random() > 0.4 ? 'retreatScatter' : 'goblinRetreat'} 20s ease-in-out infinite, ${Math.random() > 0.5 ? 'chaosMovement' : 'marchingStep'} ${0.9 + Math.random() * 0.4}s ease-in-out infinite`,
                         animationDelay: `${1.0 + Math.random() * 1.5}s`
                       }}>👹👹</div>
                </div>

                <div className="absolute right-8 top-24">
                  {/* Goblin archers with varied covering tactics */}
                  <div className="text-lg transform"
                       style={{
                         animation: `${Math.random() > 0.5 ? 'retreatScatter' : 'defendFormation'} 20s ease-in-out infinite, chaosMovement ${1.2 + Math.random() * 0.6}s ease-in-out infinite`,
                         animationDelay: `${1.5 + Math.random() * 2}s`
                       }}>🏹👹🏹</div>
                </div>
                
                {/* Goblin castle - retreat destination */}
                <div className="absolute right-2 top-12">
                  <div className="text-3xl animate-pulse" style={{animationDelay: '15s'}}>🏰</div>
                  <div className="text-xs text-red-600 text-center mt-1">Goblin Fort</div>
                </div>

                {/* Central Battle Zone - Units making contact */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  {/* Combat zone background */}
                  <div className="relative bg-red-400 bg-opacity-20 rounded-full w-32 h-32 border-2 border-red-600 border-solid">
                    
                    {/* Student units with dynamic melee combat */}
                    {armyPoints && (armyPoints.infantry > 0 || armyPoints.knight > 0) && (
                      <div className="absolute -left-4 top-1/2 transform -translate-y-1/2">
                        {armyPoints.infantry > 0 && (
                          <div className="text-xl relative"
                               style={{
                                 animation: `${Math.random() > 0.5 ? 'spiralAttack' : 'chaosMovement'} ${0.8 + Math.random() * 0.6}s ease-in-out infinite`,
                                 animationDelay: `${Math.random() * 0.5}s`
                               }}>
                            <span>🧙‍♂️</span>
                            <span className="absolute -top-1 -right-1 text-sm">⚔️</span>
                          </div>
                        )}
                        {armyPoints.knight > 0 && (
                          <div className="text-xl mt-1"
                               style={{
                                 animation: `${Math.random() > 0.4 ? 'chargeWave' : 'spiralAttack'} ${1.0 + Math.random() * 0.5}s ease-in-out infinite`,
                                 animationDelay: `${0.3 + Math.random() * 0.4}s`
                               }}>🏇</div>
                        )}
                      </div>
                    )}
                    
                    {/* Goblin units with desperate fighting patterns */}
                    <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                      <div className="text-xl relative"
                           style={{
                             animation: `${Math.random() > 0.6 ? 'retreatScatter' : 'chaosMovement'} ${0.9 + Math.random() * 0.4}s ease-in-out infinite`,
                             animationDelay: `${0.5 + Math.random() * 0.3}s`
                           }}>
                        <span>👹</span>
                        <span className="absolute -top-1 -right-1 text-sm">⚔️</span>
                      </div>
                      <div className="text-lg mt-1 relative"
                           style={{
                             animation: `${Math.random() > 0.7 ? 'defendFormation' : 'chaosMovement'} ${1.1 + Math.random() * 0.5}s ease-in-out infinite`,
                             animationDelay: `${0.8 + Math.random() * 0.4}s`
                           }}>
                        <span>👹</span>
                        <span className="absolute -top-1 -right-1 text-xs">🏹</span>
                      </div>
                    </div>
                    
                    {/* Multiple losing units disappearing in smoke with varied effects */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                      <div className="text-lg"
                           style={{
                             animation: 'unitDisappear 4s ease-out infinite, smokeUp 2s ease-out infinite',
                             animationDelay: '2s'
                           }}>👹💨</div>
                    </div>
                    <div className="absolute right-0 top-1/4 transform -translate-y-1/2">
                      <div className="text-lg"
                           style={{
                             animation: 'unitDisappear 3.5s ease-out infinite, smokeUp 2.2s ease-out infinite',
                             animationDelay: '3s'
                           }}>👹✨</div>
                    </div>
                    <div className="absolute left-1/4 bottom-0">
                      <div className="text-lg"
                           style={{
                             animation: 'unitDisappear 4.5s ease-out infinite, smokeUp 1.8s ease-out infinite',
                             animationDelay: '4s'
                           }}>👹💫</div>
                    </div>
                    <div className="absolute right-1/4 top-0">
                      <div className="text-lg"
                           style={{
                             animation: 'unitDisappear 3.8s ease-out infinite, smokeUp 2.5s ease-out infinite',
                             animationDelay: '2.5s'
                           }}>👹💨</div>
                    </div>
                    
                    {/* Contact point explosion */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-3xl"
                           style={{
                             animation: 'combatClash 1.5s ease-out infinite',
                             animationDelay: '0s'
                           }}>💥</div>
                    </div>
                  </div>
                </div>
                
                {/* Projectiles flying across battlefield */}
                <div className="absolute left-12 top-20">
                  {/* Arrows from archers */}
                  {armyPoints && armyPoints.archer > 0 && (
                    <>
                      <div className="text-lg"
                           style={{
                             animation: 'projectileCrossScreen 2.5s linear infinite',
                             animationDelay: '0.5s'
                           }}>🏹</div>
                      <div className="text-lg"
                           style={{
                             animation: 'projectileCrossScreen 2.8s linear infinite',
                             animationDelay: '1.2s'
                           }}>🏹</div>
                      <div className="text-lg"
                           style={{
                             animation: 'projectileCrossScreen 2.3s linear infinite',
                             animationDelay: '2s'
                           }}>🏹</div>
                    </>
                  )}
                </div>
                
                <div className="absolute left-12 top-28">
                  {/* Cannonballs from artillery */}
                  {armyPoints && armyPoints.cannon > 0 && (
                    <>
                      <div className="text-xl"
                           style={{
                             animation: 'projectileCrossScreen 2.2s ease-out infinite',
                             animationDelay: '0.8s'
                           }}>⚫</div>
                      <div className="text-xl"
                           style={{
                             animation: 'projectileCrossScreen 2.5s ease-out infinite',
                             animationDelay: '2.1s'
                           }}>⚫</div>
                      <div className="text-lg"
                           style={{
                             animation: 'projectileCrossScreen 1.9s ease-out infinite',
                             animationDelay: '3.5s'
                           }}>🔥</div>
                    </>
                  )}
                </div>

                {/* Secondary battle effects */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                  <div className="text-2xl animate-ping" style={{animationDelay: '0.8s'}}>⚡</div>
                </div>
                <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
                  <div className="text-3xl animate-pulse" style={{animationDelay: '1.2s'}}>💥</div>
                </div>

                {/* Enhanced Dynamic Flying Projectiles - Scales with Army Size */}
                {/* Your Arrows - Intensity scales with archer count */}
                {armyPoints && armyPoints.archer > 0 && (
                  <>
                    {Array.from({ length: Math.min((armyPoints.archer || 0) * 2, 12) }, (_, i) => {
                      const topOffset = 8 + Math.random() * 30; 
                      const delay = Math.random() * 3; 
                      const duration = 1.1 + Math.random() * 1.0; 
                      const trajectories = ['flyRight', 'arcRight', 'zigzagRight'];
                      const trajectory = trajectories[Math.floor(Math.random() * trajectories.length)];
                      const arrowTypes = armyPoints.archer > 10 ? ['🏹', '🗿', '⚡'] : ['🏹'];
                      const arrowType = arrowTypes[Math.floor(Math.random() * arrowTypes.length)];
                      
                      return (
                        <div key={`arrow-${i}`} className="absolute left-20 transform"
                             style={{
                               top: `${topOffset}px`,
                               animation: `${trajectory} ${duration}s linear infinite`,
                               animationDelay: `${delay}s`
                             }}>
                          <span className={armyPoints.archer > 15 ? "text-xl" : "text-lg"}>
                            {arrowType}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Massive volley for large archer armies */}
                    {armyPoints.archer > 20 && (
                      <div className="absolute left-16 top-12">
                        <div className="text-3xl" style={{
                          animation: 'massiveBarrage 2.5s ease-out infinite',
                          animationDelay: '0.5s'
                        }}>🏹🏹🏹🏹🏹</div>
                      </div>
                    )}
                  </>
                )}

                {/* Enhanced Cannon Artillery - Scales with cannon count */}
                {armyPoints && armyPoints.cannon > 0 && (
                  <>
                    {Array.from({ length: Math.min((armyPoints.cannon || 0) * 1.5, 8) }, (_, i) => {
                      const topOffset = 15 + Math.random() * 20;
                      const delay = Math.random() * 4;
                      const duration = 0.8 + Math.random() * 0.8;
                      const sizes = armyPoints.cannon > 10 ? ['text-xl', 'text-2xl', 'text-3xl'] : ['text-xl', 'text-2xl'];
                      const size = sizes[Math.floor(Math.random() * sizes.length)];
                      const projectiles = armyPoints.cannon > 5 ? ['⚫', '💣', '🔥', '💥'] : ['⚫', '💣'];
                      const projectile = projectiles[Math.floor(Math.random() * projectiles.length)];
                      const trajectory = Math.random() > 0.7 ? 'massiveBarrage' : 'arcRight';
                      
                      return (
                        <div key={`cannon-${i}`} className="absolute left-24 transform"
                             style={{
                               top: `${topOffset}px`,
                               animation: `${trajectory} ${duration}s ease-out infinite`,
                               animationDelay: `${delay}s`
                             }}>
                          <span className={size}>{projectile}</span>
                        </div>
                      );
                    })}
                    
                    {/* Heavy artillery barrage for large cannon armies */}
                    {armyPoints.cannon > 15 && (
                      <>
                        <div className="absolute left-20 top-16">
                          <div className="text-4xl" style={{
                            animation: 'massiveBarrage 1.8s ease-out infinite',
                            animationDelay: '0.2s'
                          }}>💣💥💣</div>
                        </div>
                        <div className="absolute left-18 top-24">
                          <div className="text-3xl" style={{
                            animation: 'arcRight 2.2s ease-out infinite',
                            animationDelay: '1.5s'
                          }}>🔥💥🔥</div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Goblin Projectiles - Varied return fire */}
                {Array.from({ length: 3 }, (_, i) => {
                  const topOffset = 14 + Math.random() * 18;
                  const delay = Math.random() * 2.5;
                  const duration = 1.4 + Math.random() * 0.7;
                  const projectile = Math.random() > 0.7 ? '🪓' : '🏹'; // Mix axes and arrows
                  return (
                    <div key={`goblin-${i}`} className="absolute right-20 transform"
                         style={{
                           top: `${topOffset}px`,
                           animation: `flyLeft ${duration}s linear infinite`,
                           animationDelay: `${delay}s`
                         }}>
                      <span className="text-lg">{projectile}</span>
                    </div>
                  );
                })}

                {/* Dynamic Battle Impact Effects - Scales with Total Army Size */}
                {(() => {
                  if (!armyPoints) return null;
                  const totalUnits = (armyPoints.castle || 0) + (armyPoints.cannon || 0) + (armyPoints.knight || 0) + (armyPoints.infantry || 0) + (armyPoints.archer || 0);
                  const effectCount = Math.min(Math.max(3, Math.floor(totalUnits / 3) || 3), 15);
                  const effects = totalUnits > 30 ? ['💥', '⚡', '🔥', '💢', '✨', '💫', '🌟', '🔆'] : 
                                  totalUnits > 15 ? ['💥', '⚡', '🔥', '💢', '✨'] : ['💥', '⚡', '🔥'];
                  const animations = ['animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce'];
                  const sizes = totalUnits > 40 ? ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'] :
                                totalUnits > 20 ? ['text-2xl', 'text-3xl', 'text-4xl'] : ['text-2xl', 'text-3xl'];
                  
                  return Array.from({ length: effectCount }, (_, i) => {
                    const effect = effects[Math.floor(Math.random() * effects.length)];
                    const animation = animations[Math.floor(Math.random() * animations.length)];
                    const size = sizes[Math.floor(Math.random() * sizes.length)];
                    const topOffset = 15 + Math.random() * 70;
                    const leftOffset = 25 + Math.random() * 50;
                    const delay = Math.random() * 4;
                    
                    return (
                      <div key={`effect-${i}`} className="absolute transform"
                           style={{
                             top: `${topOffset}%`,
                             left: `${leftOffset}%`,
                             animationDelay: `${delay}s`
                           }}>
                        <div className={`${size} ${animation}`}>{effect}</div>
                      </div>
                    );
                  });
                })()}

                {/* Dynamic Smoke and Environmental Effects */}
                {[...Array(4)].map((_, i) => {
                  const effects = ['💨', '☁️', '🌫️', '💭'];
                  const effect = effects[Math.floor(Math.random() * effects.length)];
                  const topOffset = 20 + Math.random() * 40;
                  const leftOffset = Math.random() > 0.5 ? 16 + Math.random() * 20 : 70 + Math.random() * 20;
                  const delay = 1 + Math.random() * 3;
                  const duration = 1.8 + Math.random() * 1.2;
                  const opacity = 0.5 + Math.random() * 0.3;
                  
                  return (
                    <div key={`smoke-${i}`} className="absolute transform"
                         style={{
                           top: `${topOffset}px`,
                           left: `${leftOffset}%`,
                           animation: `smokeUp ${duration}s ease-out infinite`,
                           animationDelay: `${delay}s`
                         }}>
                      <span className="text-xl" style={{opacity}}>{effect}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Battle progress */}
            <div className="mb-4">
              <div className="text-sm text-orange-600 mb-2">
                {getTotalPower() <= 5 ? "⚡ Swift Strike - 15 seconds" : "🔥 Major Siege - 30 seconds"}
              </div>
              <div className="bg-orange-200 rounded-full h-3 overflow-hidden border border-orange-400">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full animate-pulse" 
                     style={{
                       animation: `progressBar ${getTotalPower() <= 5 ? '15' : '30'}s linear infinite`
                     }}></div>
              </div>
            </div>
            
            <p className="text-orange-600 text-sm animate-pulse">
              {Math.random() > 0.7 ? "⚡ Lightning fast skirmish!" : 
               Math.random() > 0.5 ? "🔥 Intense battlefield chaos!" :
               Math.random() > 0.3 ? "⚔️ Steel clashes with fury!" :
               "🏹 Arrows fill the air!"}
            </p>
          </div>
        )}

        {/* Battle Results */}
        {battleResult && !isAttacking && (
          <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 ${
            battleResult.victory ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {/* Victory Animation - Goblin Castle Collapse */}
            {battleResult.victory && (
              <div className="text-center mb-6 relative overflow-hidden">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Victory!</h3>
                
                {/* Goblin Castle Collapse Animation */}
                <div className="bg-gradient-to-b from-gray-300 to-green-400 rounded-lg p-6 mb-4 relative">
                  <div className="text-lg font-bold text-red-800 mb-3">Goblin Stronghold Falls!</div>
                  
                  {/* Castle collapsing animation */}
                  <div className="relative h-20 flex justify-center items-end">
                    <div className="text-6xl transform transition-all duration-3000"
                         style={{
                           animation: 'castleCollapse 3s ease-in forwards',
                           transformOrigin: 'bottom center'
                         }}>
                      🏰
                    </div>
                    
                    {/* Smoke puffs */}
                    <div className="absolute inset-0 flex justify-center items-center">
                      <span className="text-4xl opacity-0"
                            style={{
                              animation: 'smokeAppear 3s ease-out forwards',
                              animationDelay: '1s'
                            }}>💨</span>
                    </div>
                    <div className="absolute top-2 left-1/3 transform -translate-x-1/2">
                      <span className="text-2xl opacity-0"
                            style={{
                              animation: 'smokeAppear 2.5s ease-out forwards',
                              animationDelay: '1.5s'
                            }}>💨</span>
                    </div>
                    <div className="absolute top-2 right-1/3 transform translate-x-1/2">
                      <span className="text-2xl opacity-0"
                            style={{
                              animation: 'smokeAppear 2.5s ease-out forwards',
                              animationDelay: '1.8s'
                            }}>💨</span>
                    </div>
                    
                    {/* Sparkle effects */}
                    <div className="absolute top-4 left-1/4">
                      <span className="text-lg opacity-0"
                            style={{
                              animation: 'sparkle 2s ease-out forwards',
                              animationDelay: '2s'
                            }}>✨</span>
                    </div>
                    <div className="absolute top-6 right-1/4">
                      <span className="text-lg opacity-0"
                            style={{
                              animation: 'sparkle 2s ease-out forwards',
                              animationDelay: '2.3s'
                            }}>✨</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-green-800 mt-2 animate-pulse">
                    The goblin fortress crumbles to dust!
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{battleResult.message}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Your Army Power: {battleResult.totalPower || 0} vs Goblin Army Power: {battleResult.aiArmy ? 
                    ((battleResult.aiArmy.castle || 0) + (battleResult.aiArmy.cannon || 0) + (battleResult.aiArmy.knight || 0) + 
                     (battleResult.aiArmy.infantry || 0) + (battleResult.aiArmy.archer || 0)) : 'Unknown'}
                </p>
              </div>
            )}

            {/* Defeat Display */}
            {!battleResult.victory && (
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">💥</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Defeat!</h3>
                <p className="text-gray-600 mb-4">{battleResult.message}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Your Army Power: {battleResult.totalPower || 0} vs Goblin Army Power: {battleResult.aiArmy ? 
                    ((battleResult.aiArmy.castle || 0) + (battleResult.aiArmy.cannon || 0) + (battleResult.aiArmy.knight || 0) + 
                     (battleResult.aiArmy.infantry || 0) + (battleResult.aiArmy.archer || 0)) : 'Unknown'}
                </p>
              </div>
            )}

            {/* Battle Details */}
            {battleResult.battleDetails && battleResult.battleDetails.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">Battle Report</h4>
                <div className="space-y-2">
                  {battleResult.battleDetails.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-white rounded px-3 py-2 border-l-4 border-blue-400">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goblin Army Composition */}
            {battleResult.aiArmy && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Goblin Army</h4>
                  {battleResult.difficultyTier && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      battleResult.difficultyTier === 'Beginner' ? 'bg-green-100 text-green-800' :
                      battleResult.difficultyTier === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                      battleResult.difficultyTier === 'Advanced' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {battleResult.difficultyTier} Battle
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏰</div>
                    <div className="text-sm font-medium">{battleResult.aiArmy.castle || 0}</div>
                    <div className="text-xs text-gray-500">Castle</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔫</div>
                    <div className="text-sm font-medium">{battleResult.aiArmy.cannon || 0}</div>
                    <div className="text-xs text-gray-500">Cannon</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="text-sm font-medium">{battleResult.aiArmy.knight || 0}</div>
                    <div className="text-xs text-gray-500">Knight</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">⚔️</div>
                    <div className="text-sm font-medium">{battleResult.aiArmy.infantry || 0}</div>
                    <div className="text-xs text-gray-500">Infantry</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏹</div>
                    <div className="text-sm font-medium">{battleResult.aiArmy.archer || 0}</div>
                    <div className="text-xs text-gray-500">Archer</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={() => setBattleResult(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Continue Building Army
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Leaderboard with Multiple Views */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">🏆</div>
            <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
          </div>
          
          {/* Leaderboard Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={leaderboardType === "units" ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType("units")}
            >
              Units
            </Button>
            <Button
              variant={leaderboardType === "battles" ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType("battles")}
            >
              Battles Won
            </Button>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
            >
              <option value="All">All Classes</option>
              <option value="Elephant">Elephant</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Bear">Bear</option>
              <option value="Snake">Snake</option>
              <option value="Husky">Husky</option>
              <option value="Scorpion">Scorpion</option>
              <option value="Panda">Panda</option>
              <option value="Octopus">Octopus</option>
              <option value="Demo">Demo</option>
            </select>
          </div>

          {leaderboardLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(showAllLeaderboard ? sortedLeaderboard : sortedLeaderboard.slice(0, 25)).map((entry, index) => (
                <div 
                  key={entry.student.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${getClassStyles(entry.student.className)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    } rounded-full flex items-center justify-center font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {entry.student.className === 'Demo' ? '👩‍🏫' :
                         entry.student.className === 'Bear' ? '🐻' :
                         entry.student.className === 'Elephant' ? '🐘' :
                         entry.student.className === 'Rabbit' ? '🐰' :
                         entry.student.className === 'Snake' ? '🐍' :
                         entry.student.className === 'Husky' ? '🐕' :
                         entry.student.className === 'Scorpion' ? '🦂' :
                         entry.student.className === 'Panda' ? '🐼' : '👤'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{entry.student.name}</div>
                        <div className="text-xs text-gray-500">{entry.student.className} Class</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {leaderboardType === "units" ? entry.totalPoints : entry.victories}
                    </div>
                    <div className="text-xs text-gray-500">
                      {leaderboardType === "units" ? `${entry.victories}W/${entry.totalBattles}B` : `${entry.totalPoints} units`}
                    </div>
                  </div>
                </div>
              ))}
              {sortedLeaderboard.length > 25 && !showAllLeaderboard && (
                <div className="text-center pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing top 25 of {sortedLeaderboard.length} students
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowAllLeaderboard(true)}
                  >
                    View All Students
                  </Button>
                </div>
              )}
              {showAllLeaderboard && sortedLeaderboard.length > 25 && (
                <div className="text-center pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing all {sortedLeaderboard.length} students
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowAllLeaderboard(false)}
                  >
                    Show Top 25
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Achievement Panel */}
        {selectedStudent && showAchievementPanel && (
          <div className="mt-6">
            <AchievementPanel 
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          </div>
        )}

        {/* Avatar Creator Modal */}
        {selectedStudent && showAvatarCreator && (
          <SimpleAvatarCreator
            student={selectedStudent}
            isOpen={showAvatarCreator}
            onClose={() => setShowAvatarCreator(false)}
          />
        )}

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
