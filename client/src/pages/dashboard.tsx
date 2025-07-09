import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { AchievementTree } from "@/components/ui/achievement-tree";
import { Trophy, Target, BookOpen, Sword, Castle, Shield, Crown, Zap } from "lucide-react";
import type { Student, StudentArmyPoints, BattleResult, Achievement, StudentAchievement, StudentQuestionHistory } from "@shared/schema";

interface DashboardStats {
  totalBattles: number;
  victories: number;
  winRate: number;
  totalPower: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
}

interface StudentProgress {
  student: Student;
  armyPoints: StudentArmyPoints;
  battleResults: BattleResult[];
  achievements: (StudentAchievement & { achievement: Achievement })[];
  questionHistory: StudentQuestionHistory[];
  stats: DashboardStats;
}

export default function Dashboard() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: studentProgress, isLoading: isLoadingProgress } = useQuery<StudentProgress>({
    queryKey: ['/api/students', selectedStudentId, 'dashboard'],
    enabled: !!selectedStudentId,
  });

  const getClassIcon = (className?: string) => {
    if (!className) return '🎓';
    const icons: Record<string, string> = {
      'Elephant': '🐘',
      'Rabbit': '🐰',
      'Bear': '🐻',
      'Snake': '🐍',
      'Husky': '🐕',
      'Scorpion': '🦂',
      'Panda': '🐼',
      'Octopus': '🐙',
      'Demo': '👩‍🏫'
    };
    return icons[className] || '🎓';
  };

  const getUnitIcon = (unitType: string) => {
    switch (unitType) {
      case 'castle': return <Castle className="h-4 w-4" />;
      case 'cannon': return <Zap className="h-4 w-4" />;
      case 'knight': return <Crown className="h-4 w-4" />;
      case 'infantry': return <Sword className="h-4 w-4" />;
      case 'archer': return <Target className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getMotivationalMessage = (stats: DashboardStats, student?: Student) => {
    if (!student) return "Keep learning and growing stronger!";
    if (stats.winRate >= 80) {
      return `Amazing work, ${student.name}! You're a true battle strategist!`;
    } else if (stats.winRate >= 60) {
      return `Great progress, ${student.name}! Keep building your army!`;
    } else if (stats.accuracy >= 80) {
      return `Excellent English skills, ${student.name}! Your knowledge is your strength!`;
    } else if (stats.currentStreak >= 3) {
      return `You're on fire, ${student.name}! Keep the streak going!`;
    } else {
      return `Every battle makes you stronger, ${student.name}! Keep learning!`;
    }
  };

  if (!selectedStudentId) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">📊</div>
                <div>
                  <h1 className="text-3xl font-bold">Student Dashboard</h1>
                  <p className="text-blue-100 text-sm">Personalized Progress & Achievements</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                  <Link href="/">🏠 Home</Link>
                </Button>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                  <Link href="/dashboard">📊 Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Select a student to view their personalized progress and achievements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map((student) => (
              <Card 
                key={student.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                onClick={() => setSelectedStudentId(student.id)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="text-3xl mb-2">{getClassIcon(student.className)}</div>
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <CardDescription>{student.className} Class</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" className="w-full">
                    View Progress
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (!studentProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">Failed to load student data</p>
          <Button onClick={() => setSelectedStudentId(null)} className="mt-4">
            Back to Student List
          </Button>
        </div>
      </div>
    );
  }

  const { student, armyPoints, stats, achievements } = studentProgress;

  // Add safety defaults for stats
  const safeStats: DashboardStats = {
    totalBattles: stats?.totalBattles || 0,
    victories: stats?.victories || 0,
    winRate: stats?.winRate || 0,
    totalPower: stats?.totalPower || 0,
    questionsAnswered: stats?.questionsAnswered || 0,
    correctAnswers: stats?.correctAnswers || 0,
    accuracy: stats?.accuracy || 0,
    currentStreak: stats?.currentStreak || 0,
    longestStreak: stats?.longestStreak || 0,
  };

  // Add safety defaults for other data
  const safeAchievements = achievements || [];
  const safeArmyPoints = armyPoints || {
    castle: 0,
    cannon: 0,
    knight: 0,
    infantry: 0,
    archer: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">📊</div>
              <div>
                <h1 className="text-3xl font-bold">{student?.name || 'Student'}'s Dashboard</h1>
                <p className="text-blue-100 text-sm">{student?.className || 'Class'} Progress</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/">🏠 Home</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white border-white hover:bg-white hover:text-blue-600"
                onClick={() => setSelectedStudentId(null)}
              >
                👥 All Students
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Motivational Message */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-lg font-medium text-gray-800">
              {getMotivationalMessage(safeStats, student)}
            </p>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Army Power</CardTitle>
              <Castle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeStats.totalPower}</div>
              <p className="text-xs text-muted-foreground">
                Combined unit strength
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Battle Win Rate</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeStats.winRate}%</div>
              <p className="text-xs text-muted-foreground">
                {safeStats.victories} of {safeStats.totalBattles} battles won
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">English Accuracy</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeStats.accuracy}%</div>
              <p className="text-xs text-muted-foreground">
                {safeStats.correctAnswers} of {safeStats.questionsAnswered} correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeStats.currentStreak}</div>
              <p className="text-xs text-muted-foreground">
                Longest: {safeStats.longestStreak} correct
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Army Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Army Composition</CardTitle>
            <CardDescription>Current military units and strength</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {[
                { key: 'castle', name: 'Castles', value: safeArmyPoints.castle },
                { key: 'cannon', name: 'Cannons', value: safeArmyPoints.cannon },
                { key: 'knight', name: 'Knights', value: safeArmyPoints.knight },
                { key: 'infantry', name: 'Infantry', value: safeArmyPoints.infantry },
                { key: 'archer', name: 'Archers', value: safeArmyPoints.archer },
              ].map((unit) => (
                <div key={unit.key} className="text-center">
                  <div className="flex justify-center mb-2">
                    {getUnitIcon(unit.key)}
                  </div>
                  <div className="text-2xl font-bold">{unit.value}</div>
                  <div className="text-sm text-muted-foreground">{unit.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Achievement Progress</CardTitle>
            <CardDescription>Track your learning journey and unlock new challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Recent Badges</TabsTrigger>
                <TabsTrigger value="tree">Progression Tree</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                {safeAchievements.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {safeAchievements.slice(0, 8).map((achievement) => (
                      <AchievementBadge
                        key={achievement.achievement.id}
                        achievement={achievement.achievement}
                        isUnlocked={achievement.isCompleted}
                        size="md"
                        showTooltip={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No achievements yet. Keep learning to earn your first badge!</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tree" className="mt-6">
                <AchievementTree 
                  studentId={selectedStudentId} 
                  studentName={student?.name || 'Student'} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}