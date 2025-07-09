import { useState, useCallback, useRef, useEffect } from 'react';

interface BattleAnimationState {
  isActive: boolean;
  startTime: number | null;
  duration: number;
  battleData: any | null;
}

export function useBattleAnimation() {
  const [battleState, setBattleState] = useState<BattleAnimationState>({
    isActive: false,
    startTime: null,
    duration: 0,
    battleData: null,
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(battleState);
  
  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = battleState;
  }, [battleState]);
  
  const startBattle = useCallback((battleData: any, totalUnits: number) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const duration = totalUnits <= 5 ? 15000 : 30000;
    const startTime = Date.now();
    
    console.log(`Battle animation starting - Duration: ${duration}ms, Units: ${totalUnits}, StartTime: ${startTime}`);
    
    setBattleState({
      isActive: true,
      startTime,
      duration,
      battleData,
    });
    
    // Set timer to end battle
    timerRef.current = setTimeout(() => {
      const currentState = stateRef.current;
      if (currentState.isActive && currentState.startTime === startTime) {
        const elapsedTime = Date.now() - startTime;
        console.log(`Battle animation ending - Elapsed: ${elapsedTime}ms, Expected: ${duration}ms`);
        
        setBattleState(prev => ({
          ...prev,
          isActive: false,
          startTime: null,
        }));
      }
    }, duration);
    
  }, []);
  
  const endBattle = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setBattleState({
      isActive: false,
      startTime: null,
      duration: 0,
      battleData: null,
    });
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return {
    isActive: battleState.isActive,
    battleData: battleState.battleData,
    startBattle,
    endBattle,
  };
}