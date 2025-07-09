import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/hooks/use-accessibility';

interface ReadingQuestionProps {
  question: {
    id: number;
    question: string;
    answers: string[];
    category: string;
    difficulty: string;
    unitReward: string;
    passage?: string;
  };
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  result?: {
    correct: boolean;
    correctAnswer: string;
    message: string;
    unitEarned?: string;
  } | null;
}

export function ReadingQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  isSubmitting,
  result
}: ReadingQuestionProps) {
  const { speak, autoReadContent, isTTSEnabled } = useAccessibility();

  // Auto-read question when it loads
  useEffect(() => {
    if (autoReadContent && question) {
      const questionText = question.passage 
        ? `Reading passage: ${question.passage}. Question: ${question.question}`
        : `Question: ${question.question}`;
      speak(questionText);
    }
  }, [question, autoReadContent, speak]);

  // Read result when it's available
  useEffect(() => {
    if (autoReadContent && result) {
      const resultText = result.correct 
        ? `Correct! ${result.message}` 
        : `Incorrect. ${result.message}`;
      speak(resultText);
    }
  }, [result, autoReadContent, speak]);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'reading': return <BookOpen className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getUnitIcon = (unit: string) => {
    switch (unit.toLowerCase()) {
      case 'castle': return '🏰';
      case 'cannon': return '🔫';
      case 'knight': return '🏇';
      case 'infantry': return '⚔️';
      case 'archer': return '🏹';
      default: return '⭐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getCategoryIcon(question.category)}
          <Badge className={getDifficultyColor(question.difficulty)}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </Badge>
          <Badge variant="outline">
            {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Reward:</span>
          <span className="text-lg">{getUnitIcon(question.unitReward)}</span>
          <span>{question.unitReward}</span>
        </div>
      </div>

      {/* Reading Passage (if exists) */}
      {question.passage && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Reading Passage
              </div>
              {isTTSEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speak(question.passage!)}
                  aria-label="Read passage aloud"
                  className="flex items-center gap-1"
                >
                  <Volume2 className="w-4 h-4" />
                  Read Aloud
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed text-gray-700 whitespace-pre-line">
                {question.passage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>{question.question}</span>
            {isTTSEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => speak(question.question)}
                aria-label="Read question aloud"
                className="flex items-center gap-1 ml-4"
              >
                <Volume2 className="w-4 h-4" />
                Read Question
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          <div className="grid gap-3">
            {question.answers.map((answer, index) => {
              const isSelected = selectedAnswer === answer;
              const isCorrect = result && answer === result.correctAnswer;
              const isWrong = result && isSelected && !result.correct;
              
              let buttonClass = "text-left justify-start h-auto py-3 px-4 ";
              if (result) {
                if (isCorrect) {
                  buttonClass += "bg-green-100 border-green-500 text-green-800 hover:bg-green-100";
                } else if (isWrong) {
                  buttonClass += "bg-red-100 border-red-500 text-red-800 hover:bg-red-100";
                } else {
                  buttonClass += "bg-gray-50 text-gray-500 hover:bg-gray-50";
                }
              } else if (isSelected) {
                buttonClass += "bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-200";
              } else {
                buttonClass += "bg-white border-gray-200 hover:bg-gray-50";
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={buttonClass}
                  onClick={() => {
                    if (!result) {
                      onAnswerSelect(answer);
                      if (isTTSEnabled) {
                        speak(`Selected answer: ${answer}`);
                      }
                    }
                  }}
                  onMouseEnter={() => {
                    if (isTTSEnabled) {
                      speak(`Answer option: ${answer}`);
                    }
                  }}
                  disabled={!!result}
                  aria-label={`Answer option ${index + 1}: ${answer}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                      {isSelected && (
                        <div className={`w-3 h-3 rounded-full ${
                          result 
                            ? (isCorrect ? 'bg-green-600' : 'bg-red-600')
                            : 'bg-blue-600'
                        }`} />
                      )}
                      {result && isCorrect && !isSelected && (
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                      )}
                    </div>
                    <span className="text-left flex-1">{answer}</span>
                    {result && isCorrect && (
                      <span className="text-green-600">✓</span>
                    )}
                    {result && isWrong && (
                      <span className="text-red-600">✗</span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Submit Button */}
          {!result && (
            <div className="pt-4">
              <Button
                onClick={onSubmit}
                disabled={!selectedAnswer || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </Button>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.correct 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg ${result.correct ? 'text-green-600' : 'text-red-600'}`}>
                  {result.correct ? '✅' : '❌'}
                </span>
                <span className={`font-semibold ${result.correct ? 'text-green-800' : 'text-red-800'}`}>
                  {result.correct ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className={`${result.correct ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
              {result.unitEarned && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-green-700">Unit earned:</span>
                  <span className="text-lg">{getUnitIcon(result.unitEarned)}</span>
                  <span className="text-sm font-medium text-green-800">{result.unitEarned}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}