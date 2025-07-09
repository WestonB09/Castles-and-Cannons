import React, { useState } from 'react';
import { Button } from './button';

interface DragDropPair {
  left: string;
  right: string;
}

interface DragDropQuestionProps {
  question: string;
  pairs: DragDropPair[];
  onAnswer: (matches: { [key: string]: string }) => void;
  explanation?: string;
  hints?: string[];
}

export function DragDropQuestion({
  question,
  pairs,
  onAnswer,
  explanation,
  hints = []
}: DragDropQuestionProps) {
  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  // Shuffle the right side items
  const [shuffledRightItems] = useState(() => 
    [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5)
  );

  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, leftItem: string) => {
    e.preventDefault();
    if (draggedItem) {
      setMatches(prev => ({
        ...prev,
        [leftItem]: draggedItem
      }));
      setDraggedItem(null);
    }
  };

  const handleRemoveMatch = (leftItem: string) => {
    setMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[leftItem];
      return newMatches;
    });
  };

  const handleSubmit = () => {
    onAnswer(matches);
  };

  const isComplete = pairs.length === Object.keys(matches).length;
  const usedRightItems = new Set(Object.values(matches));

  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setHintIndex(prev => prev + 1);
    }
    setShowHint(true);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-800">🔗 Match the Pairs</h3>
        {hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={showNextHint}
            disabled={hintIndex >= hints.length - 1 && showHint}
            className="text-green-600 border-green-300"
          >
            💡 Need a Hint?
          </Button>
        )}
      </div>

      <div className="text-gray-700 mb-6">{question}</div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Items to match */}
        <div className="space-y-3">
          <h4 className="font-semibold text-green-700 text-center mb-4">Match these items:</h4>
          {pairs.map((pair, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 border-dashed transition-all ${
                matches[pair.left] 
                  ? 'bg-green-100 border-green-400' 
                  : 'bg-white border-green-300 hover:border-green-400'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, pair.left)}
            >
              <div className="font-medium text-gray-800 mb-2">{pair.left}</div>
              {matches[pair.left] && (
                <div className="flex items-center justify-between bg-green-200 rounded-lg p-2">
                  <span className="text-green-800 font-medium">{matches[pair.left]}</span>
                  <button
                    onClick={() => handleRemoveMatch(pair.left)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column - Options to drag */}
        <div className="space-y-3">
          <h4 className="font-semibold text-green-700 text-center mb-4">Drag from here:</h4>
          <div className="grid grid-cols-1 gap-3">
            {shuffledRightItems.map((item, index) => (
              <div
                key={index}
                draggable={!usedRightItems.has(item)}
                onDragStart={() => handleDragStart(item)}
                className={`p-3 rounded-lg border-2 cursor-move transition-all ${
                  usedRightItems.has(item)
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-teal-100 border-teal-300 hover:border-teal-400 hover:bg-teal-200'
                }`}
              >
                <div className="text-center font-medium">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress and Submit */}
      <div className="mt-6">
        <div className="text-center text-sm text-green-600 mb-2">
          Progress: {Object.keys(matches).length}/{pairs.length} pairs matched
        </div>
        <div className="bg-green-200 rounded-full h-2 overflow-hidden mb-4">
          <div 
            className="bg-green-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(matches).length / pairs.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`${
              isComplete 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } px-8 py-2 rounded-lg font-semibold transition-colors`}
          >
            {isComplete ? '✓ Submit Matches' : `Match ${pairs.length - Object.keys(matches).length} more pair${pairs.length - Object.keys(matches).length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Drag items from the right column to match with items on the left
      </div>
    </div>
  );
}