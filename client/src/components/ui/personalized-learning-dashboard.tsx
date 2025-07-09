import React from 'react';
import { Button } from './button';

interface TopicMastery {
  [topic: string]: {
    level: number; // 0-100
    questionsAnswered: number;
    accuracy: number;
    lastPracticed: string;
  };
}

interface PersonalizedLearningProps {
  studentId: number;
  topicMastery: TopicMastery;
  weakAreas: string[];
  strongAreas: string[];
  preferredQuestionTypes: string[];
  adaptiveDifficulty: string;
  learningStyle: string;
  studyPlan: any;
  onSelectTopic: (topic: string) => void;
  onUpdatePreferences: (preferences: any) => void;
}

export function PersonalizedLearningDashboard({
  studentId,
  topicMastery,
  weakAreas,
  strongAreas,
  preferredQuestionTypes,
  adaptiveDifficulty,
  learningStyle,
  studyPlan,
  onSelectTopic,
  onUpdatePreferences
}: PersonalizedLearningProps) {
  
  const topicCategories = {
    'Grammar': ['verb_tenses', 'articles', 'prepositions', 'sentence_structure'],
    'Vocabulary': ['synonyms', 'antonyms', 'idioms', 'word_formation'],
    'Reading': ['comprehension', 'inference', 'main_idea', 'details'],
    'Speaking': ['pronunciation', 'fluency', 'conversation', 'presentation'],
    'Listening': ['audio_comprehension', 'accent_recognition', 'note_taking'],
    'Writing': ['essay_structure', 'punctuation', 'paragraph_writing', 'creative_writing']
  };

  const getMasteryColor = (level: number) => {
    if (level >= 90) return 'bg-green-500';
    if (level >= 75) return 'bg-blue-500';
    if (level >= 60) return 'bg-yellow-500';
    if (level >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 90) return 'Master';
    if (level >= 75) return 'Advanced';
    if (level >= 60) return 'Intermediate';
    if (level >= 40) return 'Beginner';
    return 'Needs Practice';
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-indigo-800">Personalized Learning Path</h3>
        <div className="text-sm text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
          {adaptiveDifficulty} Level
        </div>
      </div>

      {/* Learning Style Indicator */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-indigo-700 mb-2">Your Learning Style</div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">
            {learningStyle === 'visual' ? '👁️' :
             learningStyle === 'auditory' ? '👂' :
             learningStyle === 'kinesthetic' ? '🤚' : '📝'}
          </span>
          <span className="text-indigo-800 font-medium capitalize">{learningStyle || 'Visual'} Learner</span>
        </div>
      </div>

      {/* Topic Mastery Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(topicCategories).map(([category, topics]) => {
          const categoryAverage = topics.reduce((acc, topic) => {
            const mastery = topicMastery[topic];
            return acc + (mastery ? mastery.level : 0);
          }, 0) / topics.length;

          return (
            <div key={category} className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">{category}</h4>
                <span className={`text-xs px-2 py-1 rounded-full text-white ${getMasteryColor(categoryAverage)}`}>
                  {getMasteryLabel(categoryAverage)}
                </span>
              </div>
              
              <div className="space-y-2">
                {topics.map(topic => {
                  const mastery = topicMastery[topic] || { level: 0, questionsAnswered: 0, accuracy: 0 };
                  return (
                    <div key={topic} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{topic.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getMasteryColor(mastery.level)}`}
                            style={{ width: `${mastery.level}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{mastery.level}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Focus Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Weak Areas - Need Improvement */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Focus Areas (Need Practice)
          </h4>
          <div className="space-y-2">
            {weakAreas.slice(0, 3).map((area, index) => (
              <button
                key={index}
                onClick={() => onSelectTopic(area)}
                className="w-full text-left p-3 bg-white rounded-lg border border-red-200 hover:border-red-400 transition-colors"
              >
                <div className="font-medium text-red-800 capitalize">{area.replace('_', ' ')}</div>
                <div className="text-sm text-red-600">
                  {topicMastery[area] ? 
                    `${topicMastery[area].accuracy}% accuracy, ${topicMastery[area].questionsAnswered} questions` :
                    'Start practicing'
                  }
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Strong Areas - Maintain Skills */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
            <span className="mr-2">🌟</span>
            Strong Areas (Keep Practicing)
          </h4>
          <div className="space-y-2">
            {strongAreas.slice(0, 3).map((area, index) => (
              <button
                key={index}
                onClick={() => onSelectTopic(area)}
                className="w-full text-left p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors"
              >
                <div className="font-medium text-green-800 capitalize">{area.replace('_', ' ')}</div>
                <div className="text-sm text-green-600">
                  {topicMastery[area] ? 
                    `${topicMastery[area].accuracy}% accuracy, Level ${topicMastery[area].level}` :
                    'Continue excelling'
                  }
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Type Preferences */}
      <div className="mb-6">
        <h4 className="font-semibold text-indigo-700 mb-3">Preferred Question Types</h4>
        <div className="flex flex-wrap gap-2">
          {['multiple_choice', 'fill_blank', 'drag_drop', 'image_based'].map(type => (
            <button
              key={type}
              onClick={() => {
                const newPrefs = preferredQuestionTypes.includes(type) 
                  ? preferredQuestionTypes.filter(t => t !== type)
                  : [...preferredQuestionTypes, type];
                onUpdatePreferences({ preferredQuestionTypes: newPrefs });
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                preferredQuestionTypes.includes(type)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
            >
              {type === 'multiple_choice' ? '📝 Multiple Choice' :
               type === 'fill_blank' ? '📝 Fill Blanks' :
               type === 'drag_drop' ? '🔗 Drag & Drop' :
               '🖼️ Image Questions'}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Study Plan */}
      {studyPlan && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">📅</span>
            Today's Study Plan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {studyPlan.dailyTopics?.map((topic: string, index: number) => (
              <button
                key={index}
                onClick={() => onSelectTopic(topic)}
                className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-left"
              >
                <div className="font-medium text-blue-800 capitalize">{topic.replace('_', ' ')}</div>
                <div className="text-sm text-blue-600">
                  {studyPlan.targetQuestions || 5} questions
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="mt-6 text-center">
        <div className="text-sm text-indigo-600">
          Overall Progress: {Object.values(topicMastery).length > 0 ? 
            Math.round(Object.values(topicMastery).reduce((acc: number, topic: any) => acc + topic.level, 0) / Object.values(topicMastery).length) : 0}% mastery across all topics
        </div>
      </div>
    </div>
  );
}