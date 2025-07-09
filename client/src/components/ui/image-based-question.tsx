import React, { useState } from 'react';
import { Button } from './button';

interface ImageBasedQuestionProps {
  question: string;
  imageUrl: string;
  answers: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  explanation?: string;
  hints?: string[];
}

export function ImageBasedQuestion({
  question,
  imageUrl,
  answers,
  correctAnswer,
  onAnswer,
  explanation,
  hints = []
}: ImageBasedQuestionProps) {
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
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-orange-800">🖼️ Look and Learn</h3>
        {hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={showNextHint}
            disabled={hintIndex >= hints.length - 1 && showHint}
            className="text-orange-600 border-orange-300"
          >
            💡 Need a Hint?
          </Button>
        )}
      </div>

      <div className="text-gray-700 mb-4">{question}</div>

      {/* Image Display */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg p-4 shadow-lg border border-orange-200">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Question image"
              className="max-w-full h-auto max-h-64 rounded-lg object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2MEw5NSA3MEw4NSA4MEw3NSA3MEw4NSA2MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN0cm9rZSBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZT0iIzlDQTNBRiIgZD0iTTYwIDkwSDY0TTc2IDkwSDEyME0xMzIgOTBIMTM2Ii8+CjwvZXh0PgoK';
              }}
            />
          ) : (
            // Fallback placeholder for when no image URL is provided
            <div className="w-48 h-32 bg-orange-100 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-300">
              <div className="text-center text-orange-600">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm">Visual Example</div>
              </div>
            </div>
          )}
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

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(answer)}
            className={`p-4 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
              selectedAnswer === answer
                ? 'bg-orange-200 border-orange-500 text-orange-800 font-semibold'
                : 'bg-white border-orange-300 text-gray-700 hover:border-orange-400 hover:bg-orange-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedAnswer === answer 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-orange-300'
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

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className={`${
            selectedAnswer 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } px-8 py-2 rounded-lg font-semibold transition-colors`}
        >
          {selectedAnswer ? '✓ Submit Answer' : 'Select an answer first'}
        </Button>
      </div>

      {/* Visual Learning Tip */}
      <div className="mt-4 text-center">
        <div className="text-sm text-orange-600 bg-orange-50 rounded-lg p-3 border border-orange-200">
          <span className="font-semibold">Visual Learning Tip:</span> Study the image carefully and look for contextual clues that help answer the question.
        </div>
      </div>
    </div>
  );
}