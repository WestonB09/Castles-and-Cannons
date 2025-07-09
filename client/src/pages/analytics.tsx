import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy, 
  Target, 
  BookOpen, 
  Calendar,
  Download,
  Mail,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface StudentProgress {
  student: {
    id: number;
    name: string;
    className: string;
    avatar?: string;
  };
  stats: {
    totalBattles: number;
    victories: number;
    winRate: number;
    totalPower: number;
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    longestStreak: number;
    lastActive: string;
  };
  trends: {
    battlesThisWeek: number;
    accuracyTrend: number;
    engagementScore: number;
    improvementRate: number;
  };
  categories: {
    vocabulary: { correct: number; total: number };
    grammar: { correct: number; total: number };
    reading: { correct: number; total: number };
  };
}

interface ClassAnalytics {
  className: string;
  studentCount: number;
  averageAccuracy: number;
  totalBattles: number;
  averageEngagement: number;
  topPerformers: Array<{ name: string; metric: string; value: number }>;
  strugglingStudents: Array<{ name: string; issue: string; suggestion: string }>;
  weeklyProgress: Array<{ week: string; accuracy: number; battles: number }>;
}

export default function Analytics() {
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<string>('month');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  // Fetch student progress data
  const { data: studentProgress = [], isLoading: progressLoading } = useQuery<StudentProgress[]>({
    queryKey: ['/api/analytics/student-progress', selectedClass, timeframe],
  });

  // Fetch class analytics
  const { data: classAnalytics = [], isLoading: analyticsLoading } = useQuery<ClassAnalytics[]>({
    queryKey: ['/api/analytics/class-overview', timeframe],
  });

  // Get unique class names
  const classes = ['All', ...Array.from(new Set(studentProgress.map(p => p.student.className)))];

  // Filter students by selected class
  const filteredStudents = selectedClass === 'All' 
    ? studentProgress 
    : studentProgress.filter(p => p.student.className === selectedClass);

  const getPerformanceColor = (value: number, threshold: { good: number; fair: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const generateProgressReport = () => {
    // Trigger report generation
    console.log('Generating progress report for:', selectedClass, timeframe);
  };

  const exportData = () => {
    // Export analytics data
    console.log('Exporting analytics data');
  };

  if (progressLoading || analyticsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Student Progress Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into student learning and engagement</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateProgressReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button onClick={exportData} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Email Summary
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(className => (
              <SelectItem key={className} value={className}>{className}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Class Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Progress</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Metrics</TabsTrigger>
        </TabsList>

        {/* Class Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredStudents.length}</div>
                <p className="text-xs text-gray-600">Active learners</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Average Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredStudents.length > 0 
                    ? Math.round(filteredStudents.reduce((sum, s) => sum + s.stats.accuracy, 0) / filteredStudents.length)
                    : 0}%
                </div>
                <p className="text-xs text-gray-600">English questions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  Total Battles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredStudents.reduce((sum, s) => sum + s.stats.totalBattles, 0)}
                </div>
                <p className="text-xs text-gray-600">Completed battles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Questions Answered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredStudents.reduce((sum, s) => sum + s.stats.questionsAnswered, 0)}
                </div>
                <p className="text-xs text-gray-600">Total attempts</p>
              </CardContent>
            </Card>
          </div>

          {/* Class Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Class Performance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>High Performers (80%+ accuracy)</span>
                    <span>{filteredStudents.filter(s => s.stats.accuracy >= 80).length} students</span>
                  </div>
                  <Progress value={(filteredStudents.filter(s => s.stats.accuracy >= 80).length / filteredStudents.length) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Good Progress (60-79% accuracy)</span>
                    <span>{filteredStudents.filter(s => s.stats.accuracy >= 60 && s.stats.accuracy < 80).length} students</span>
                  </div>
                  <Progress value={(filteredStudents.filter(s => s.stats.accuracy >= 60 && s.stats.accuracy < 80).length / filteredStudents.length) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Needs Support (below 60% accuracy)</span>
                    <span>{filteredStudents.filter(s => s.stats.accuracy < 60).length} students</span>
                  </div>
                  <Progress value={(filteredStudents.filter(s => s.stats.accuracy < 60).length / filteredStudents.length) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Progress Tab */}
        <TabsContent value="individual" className="space-y-6">
          <div className="grid gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.student.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{student.student.avatar || '👤'}</div>
                      <div>
                        <CardTitle className="text-lg">{student.student.name}</CardTitle>
                        <p className="text-sm text-gray-600">{student.student.className} Class</p>
                      </div>
                    </div>
                    <Badge variant={student.stats.accuracy >= 80 ? 'default' : 
                                  student.stats.accuracy >= 60 ? 'secondary' : 'destructive'}>
                      {student.stats.accuracy}% Accuracy
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{student.stats.totalBattles}</div>
                      <div className="text-sm text-gray-600">Battles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{student.stats.winRate}%</div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{student.stats.currentStreak}</div>
                      <div className="text-sm text-gray-600">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{student.stats.totalPower}</div>
                      <div className="text-sm text-gray-600">Total Power</div>
                    </div>
                  </div>

                  {/* Subject Performance */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Subject Performance</h4>
                    {Object.entries(student.categories).map(([subject, data]) => (
                      <div key={subject} className="flex items-center justify-between">
                        <span className="capitalize text-sm">{subject}</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={data.total > 0 ? (data.correct / data.total) * 100 : 0} 
                            className="w-20 h-2" 
                          />
                          <span className="text-sm text-gray-600">
                            {data.correct}/{data.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trends */}
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(student.trends.accuracyTrend)}
                      <span>Accuracy trend</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Last active: {new Date(student.stats.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStudents
                    .sort((a, b) => b.stats.accuracy - a.stats.accuracy)
                    .slice(0, 5)
                    .map((student, index) => (
                      <div key={student.student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{index + 1}.</span>
                          <div className="text-lg">{student.student.avatar || '👤'}</div>
                          <div>
                            <div className="font-medium">{student.student.name}</div>
                            <div className="text-sm text-gray-600">{student.student.className}</div>
                          </div>
                        </div>
                        <Badge variant="default">{student.stats.accuracy}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Students Needing Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-red-500" />
                  Students Needing Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStudents
                    .filter(s => s.stats.accuracy < 60 || s.trends.engagementScore < 50)
                    .slice(0, 5)
                    .map((student) => (
                      <div key={student.student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">{student.student.avatar || '👤'}</div>
                          <div>
                            <div className="font-medium">{student.student.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.stats.accuracy < 60 ? 'Low accuracy' : 'Low engagement'}
                            </div>
                          </div>
                        </div>
                        <Badge variant="destructive">{student.stats.accuracy}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Performance by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['vocabulary', 'grammar', 'reading'].map((category) => {
                  const totalCorrect = filteredStudents.reduce((sum, s) => sum + s.categories[category as keyof typeof s.categories].correct, 0);
                  const totalQuestions = filteredStudents.reduce((sum, s) => sum + s.categories[category as keyof typeof s.categories].total, 0);
                  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                  
                  return (
                    <div key={category} className="text-center">
                      <div className="text-2xl font-bold capitalize">{category}</div>
                      <Progress value={accuracy} className="my-2" />
                      <div className="text-sm text-gray-600">{accuracy}% accuracy</div>
                      <div className="text-xs text-gray-500">{totalCorrect}/{totalQuestions} correct</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Metrics Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Daily Activity Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>High Engagement (Daily)</span>
                    <span>{filteredStudents.filter(s => s.trends.engagementScore >= 80).length} students</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Regular Activity (3-4x/week)</span>
                    <span>{filteredStudents.filter(s => s.trends.engagementScore >= 60 && s.trends.engagementScore < 80).length} students</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Infrequent Activity (1-2x/week)</span>
                    <span>{filteredStudents.filter(s => s.trends.engagementScore < 60).length} students</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streak Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Streaks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Students with 7+ day streaks</span>
                    <span>{filteredStudents.filter(s => s.stats.currentStreak >= 7).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Students with 3-6 day streaks</span>
                    <span>{filteredStudents.filter(s => s.stats.currentStreak >= 3 && s.stats.currentStreak < 7).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average streak length</span>
                    <span>
                      {filteredStudents.length > 0 
                        ? Math.round(filteredStudents.reduce((sum, s) => sum + s.stats.currentStreak, 0) / filteredStudents.length)
                        : 0} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}