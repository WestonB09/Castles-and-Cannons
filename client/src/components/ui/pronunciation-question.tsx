import React, { useState } from 'react';
import { Button } from './button';

interface PronunciationQuestionProps {
  question: string;
  answers: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  phoneticGuide?: string;
  explanation?: string;
  hints?: string[];
}

export function PronunciationQuestion({
  question,
  answers,
  correctAnswer,
  onAnswer,
  phoneticGuide,
  explanation,
  hints = []
}: PronunciationQuestionProps) {
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
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-800">🗣️ Pronunciation Practice</h3>
        {hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={showNextHint}
            disabled={hintIndex >= hints.length - 1 && showHint}
            className="text-purple-600 border-purple-300"
          >
            💡 Need a Hint?
          </Button>
        )}
      </div>

      <div className="text-gray-700 mb-4">{question}</div>

      {/* Phonetic Guide */}
      {phoneticGuide && (
        <div className="bg-purple-100 rounded-lg p-4 mb-4 border border-purple-200">
          <div className="text-center">
            <div className="font-semibold text-purple-800 mb-2">Pronunciation Guide:</div>
            <div className="text-lg font-mono text-purple-700">{phoneticGuide}</div>
          </div>
        </div>
      )}

      {/* Hint Display */}
      {showHint && hints[hintIndex] && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600 text-lg">💡</span>
            <div>
              <div className="font-semibold text-yellow-800">Hint {hintIndex + 1}:</div>
              <div className="text-yellow-700">{hints[hintIndex]}</div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(answer)}
            className={`p-4 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
              selectedAnswer === answer
                ? 'bg-purple-200 border-purple-500 text-purple-800 font-semibold'
                : 'bg-white border-purple-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedAnswer === answer 
                  ? 'border-purple-500 bg-purple-500' 
                  : 'border-purple-300'
              }`}>
                {selectedAnswer === answer && (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-lg font-medium">{answer}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className={`${
            selectedAnswer 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } px-8 py-2 rounded-lg font-semibold transition-colors`}
        >
          {selectedAnswer ? '✓ Submit Answer' : 'Select an answer first'}
        </Button>
      </div>

      {/* Pronunciation Tip */}
      <div className="mt-4 text-center">
        <div className="text-sm text-purple-600 bg-purple-50 rounded-lg p-3 border border-purple-200">
          <span className="font-semibold">Pronunciation Tip:</span> Listen carefully to the sounds and practice speaking them aloud.
        </div>
      </div>
    </div>
  );
}