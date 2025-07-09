import React, { useState } from 'react';
import { Button } from './button';

interface ConversationQuestionProps {
  question: string;
  answers: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  scenario?: string;
  explanation?: string;
  hints?: string[];
}

export function ConversationQuestion({
  question,
  answers,
  correctAnswer,
  onAnswer,
  scenario,
  explanation,
  hints = []
}: ConversationQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const handleSubmit = () => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer);
    }
  };

  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setHintIndex(prev => prev + 1);
    }
    setShowHint(true);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-emerald-800">💬 Conversation Skills</h3>
        {hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={showNextHint}
            disabled={hintIndex >= hints.length - 1 && showHint}
            className="text-emerald-600 border-emerald-300"
          >
            💡 Need a Hint?
          </Button>
        )}
      </div>

      {scenario && (
        <div className="bg-emerald-100 rounded-lg p-4 mb-4 border border-emerald-200">
          <div className="font-semibold text-emerald-800 mb-2">Conversation Scenario:</div>
          <div className="text-emerald-700">{scenario}</div>
        </div>
      )}

      <div className="text-gray-700 mb-4">{question}</div>

      {showHint && hints[hintIndex] && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600 text-lg">💡</span>
            <div>
              <div className="font-semibold text-yellow-800">Communication Tip {hintIndex + 1}:</div>
              <div className="text-yellow-700">{hints[hintIndex]}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 mb-6">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(answer)}
            className={`p-4 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
              selectedAnswer === answer
                ? 'bg-emerald-200 border-emerald-500 text-emerald-800 font-semibold'
                : 'bg-white border-emerald-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedAnswer === answer 
                  ? 'border-emerald-500 bg-emerald-500' 
                  : 'border-emerald-300'
              }`}>
                {selectedAnswer === answer && (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-lg">{answer}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className={`${
            selectedAnswer 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } px-8 py-2 rounded-lg font-semibold transition-colors`}
        >
          {selectedAnswer ? '✓ Submit Response' : 'Choose your response'}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <div className="text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <span className="font-semibold">Social Skills Tip:</span> Consider the context, tone, and cultural appropriateness of your response.
        </div>
      </div>
    </div>
  );
}