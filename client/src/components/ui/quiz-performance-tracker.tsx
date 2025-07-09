import React from 'react';

interface QuizPerformanceProps {
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  averageAccuracy: number;
  recentPerformance: boolean[];
}

export function QuizPerformanceTracker({
  totalQuestions,
  correctAnswers,
  currentStreak,
  longestStreak,
  averageAccuracy,
  recentPerformance
}: QuizPerformanceProps) {
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-800">📊 Learning Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-blue-600">Streak:</span>
          <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-sm font-bold">
            🔥 {currentStreak}
          </div>
        </div>
      </div>

      {/* Performance Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
          <div className="text-xs text-gray-600">Accuracy</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
          <div className="text-xs text-gray-600">Total Questions</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-purple-600">{longestStreak}</div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-indigo-600">{correctAnswers}</div>
          <div className="text-xs text-gray-600">Correct Answers</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress to Mastery</span>
          <span>{Math.min(100, accuracy).toFixed(0)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              accuracy >= 90 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              accuracy >= 75 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              accuracy >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${Math.min(100, accuracy)}%` }}
          />
        </div>
      </div>

      {/* Recent Performance Indicator */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">Recent Performance (Last 10)</div>
        <div className="flex space-x-1">
          {recentPerformance.slice(-10).map((correct, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full ${
                correct ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={correct ? 'Correct' : 'Incorrect'}
            />
          ))}
          {recentPerformance.length < 10 && 
            Array.from({ length: 10 - recentPerformance.length }).map((_, index) => (
              <div key={`empty-${index}`} className="w-4 h-4 rounded-full bg-gray-200" />
            ))
          }
        </div>
      </div>

      {/* Performance Message */}
      <div className="text-center">
        <div className={`text-sm font-semibold ${
          accuracy >= 90 ? 'text-green-700' :
          accuracy >= 75 ? 'text-blue-700' :
          accuracy >= 60 ? 'text-yellow-700' :
          'text-red-700'
        }`}>
          {accuracy >= 90 ? '🌟 Excellent mastery! You are a learning champion!' :
           accuracy >= 75 ? '🎯 Great progress! Keep up the excellent work!' :
           accuracy >= 60 ? '📈 Good improvement! Focus on understanding patterns!' :
           '💪 Keep practicing! Every mistake is a learning opportunity!'}
        </div>
      </div>
    </div>
  );
}