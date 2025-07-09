import React, { useState } from 'react';
import { Button } from './button';

interface ListeningQuestionProps {
  question: string;
  answers: string[];
  correctAnswer: string;
  onAnswer: (answer: string) => void;
  audioDescription?: string;
  explanation?: string;
  hints?: string[];
}

export function ListeningQuestion({
  question,
  answers,
  correctAnswer,
  onAnswer,
  audioDescription,
  explanation,
  hints = []
}: ListeningQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const playAudio = () => {
    setIsPlaying(true);
    // Simulate audio playback
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-800">🎧 Listening Comprehension</h3>
        {hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={showNextHint}
            disabled={hintIndex >= hints.length - 1 && showHint}
            className="text-blue-600 border-blue-300"
          >
            💡 Need a Hint?
          </Button>
        )}
      </div>

      {/* Audio Player Simulation */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={playAudio}
            disabled={isPlaying}
            className={`${
              isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white px-6 py-2 rounded-lg`}
          >
            {isPlaying ? '🔊 Playing...' : '▶️ Play Audio'}
          </Button>
        </div>
        
        {audioDescription && (
          <div className="mt-3 text-sm text-blue-600 text-center italic">
            Audio: {audioDescription}
          </div>
        )}
        
        {isPlaying && (
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-3000 ease-linear"
                style={{ width: '100%', animation: 'progress 3s linear' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="text-gray-700 mb-4">{question}</div>

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
      <div className="grid grid-cols-1 gap-3 mb-6">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(answer)}
            className={`p-4 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
              selectedAnswer === answer
                ? 'bg-blue-200 border-blue-500 text-blue-800 font-semibold'
                : 'bg-white border-blue-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedAnswer === answer 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-blue-300'
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
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } px-8 py-2 rounded-lg font-semibold transition-colors`}
        >
          {selectedAnswer ? '✓ Submit Answer' : 'Select an answer first'}
        </Button>
      </div>

      {/* Listening Tip */}
      <div className="mt-4 text-center">
        <div className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <span className="font-semibold">Listening Tip:</span> Focus on key words and main ideas. You can replay the audio if needed.
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}