import React, { useState } from 'react';
import { Button } from './button';

interface FillBlankQuestionProps {
  question: string;
  blankPositions: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  explanation?: string;
  hints?: string[];
}

export function FillBlankQuestion({
  question,
  blankPositions,
  correctAnswer,
  onAnswer,
  explanation,
  hints = []
}: FillBlankQuestionProps) {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  // Parse the question to create blanks
  const questionParts = question.split('___');
  const numberOfBlanks = questionParts.length - 1;

  const handleInputChange = (blankIndex: number, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [blankIndex]: value
    }));
  };

  const handleSubmit = () => {
    // Combine all answers for blanks
    const fullAnswer = Object.values(userAnswers).join(' ').trim();
    onAnswer(fullAnswer);
  };

  const isComplete = Object.keys(userAnswers).length === numberOfBlanks && 
                    Object.values(userAnswers).every(answer => answer.trim().length > 0);

  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setHintIndex(prev => prev + 1);
    }
    setShowHint(true);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-800">📝 Fill in the Blanks</h3>
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

      {/* Question with Input Fields */}
      <div className="mb-6">
        <div className="text-lg leading-relaxed text-gray-800 mb-4">
          {questionParts.map((part, index) => (
            <span key={index}>
              {part}
              {index < numberOfBlanks && (
                <input
                  type="text"
                  className="inline-block mx-2 px-3 py-1 border-2 border-purple-300 rounded-lg bg-white 
                           focus:border-purple-500 focus:outline-none min-w-[120px] text-center font-semibold"
                  placeholder={`Word ${index + 1}`}
                  value={userAnswers[index] || ''}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && isComplete && handleSubmit()}
                />
              )}
            </span>
          ))}
        </div>
      </div>

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

      {/* Word Bank (if available) */}
      {blankPositions && blankPositions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-purple-700 mb-2">Word Bank:</div>
          <div className="flex flex-wrap gap-2">
            {blankPositions.map((word, index) => (
              <span
                key={index}
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-200"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`${
            isComplete 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } px-8 py-2 rounded-lg font-semibold transition-colors`}
        >
          {isComplete ? '✓ Submit Answer' : `Fill ${numberOfBlanks - Object.keys(userAnswers).length} more blank${numberOfBlanks - Object.keys(userAnswers).length !== 1 ? 's' : ''}`}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4">
        <div className="text-center text-sm text-purple-600 mb-2">
          Progress: {Object.keys(userAnswers).length}/{numberOfBlanks} blanks filled
        </div>
        <div className="bg-purple-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-purple-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(userAnswers).length / numberOfBlanks) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}