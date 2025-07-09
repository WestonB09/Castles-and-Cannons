import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  isHighContrast: boolean;
  isTTSEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  autoReadContent: boolean;
  toggleHighContrast: () => void;
  toggleTTS: () => void;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  setSpeechVolume: (volume: number) => void;
  setAutoReadContent: (enabled: boolean) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  readElementText: (element: HTMLElement | null) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [autoReadContent, setAutoReadContent] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsHighContrast(settings.isHighContrast || false);
      setIsTTSEnabled(settings.isTTSEnabled || false);
      setSpeechRate(settings.speechRate || 1);
      setSpeechPitch(settings.speechPitch || 1);
      setSpeechVolume(settings.speechVolume || 1);
      setAutoReadContent(settings.autoReadContent || false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      isHighContrast,
      isTTSEnabled,
      speechRate,
      speechPitch,
      speechVolume,
      autoReadContent,
    };
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [isHighContrast, isTTSEnabled, speechRate, speechPitch, speechVolume, autoReadContent]);

  // Apply high contrast mode to document
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
  };

  const toggleTTS = () => {
    setIsTTSEnabled(!isTTSEnabled);
    if (isTTSEnabled) {
      // Stop any current speech when disabling TTS
      speechSynthesis.cancel();
    }
  };

  const speak = (text: string) => {
    if (!isTTSEnabled || !text.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Clean up text for better speech synthesis
    const cleanText = text
      .replace(/[^\w\s.,!?;:-]/g, ' ') // Remove special characters except punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;

    // Try to use a clear English voice
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en-') && voice.localService
    ) || voices.find(voice => voice.lang.startsWith('en-'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
  };

  const readElementText = (element: HTMLElement | null) => {
    if (!element || !isTTSEnabled) return;

    // Get text content from element, prioritizing aria-label and alt text
    const ariaLabel = element.getAttribute('aria-label');
    const altText = element.getAttribute('alt');
    const title = element.getAttribute('title');
    const textContent = element.textContent?.trim();

    const textToRead = ariaLabel || altText || title || textContent || '';
    
    if (textToRead) {
      speak(textToRead);
    }
  };

  const value: AccessibilityContextType = {
    isHighContrast,
    isTTSEnabled,
    speechRate,
    speechPitch,
    speechVolume,
    autoReadContent,
    toggleHighContrast,
    toggleTTS,
    setSpeechRate,
    setSpeechPitch,
    setSpeechVolume,
    setAutoReadContent,
    speak,
    stopSpeaking,
    readElementText,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}