import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAccessibility } from '@/hooks/use-accessibility';

interface AccessibleButtonProps extends ButtonProps {
  speakText?: string;
  'aria-label'?: string;
}

export function AccessibleButton({ 
  children, 
  onClick, 
  speakText, 
  'aria-label': ariaLabel,
  ...props 
}: AccessibleButtonProps) {
  const { speak, isTTSEnabled } = useAccessibility();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Speak the button text when clicked
    if (isTTSEnabled) {
      const textToSpeak = speakText || ariaLabel || (typeof children === 'string' ? children : 'Button clicked');
      speak(textToSpeak);
    }

    // Call the original onClick handler
    if (onClick) {
      onClick(event);
    }
  };

  const handleMouseEnter = () => {
    // Optionally speak on hover for better accessibility
    if (isTTSEnabled) {
      const textToSpeak = speakText || ariaLabel || (typeof children === 'string' ? children : 'Button');
      speak(`Button: ${textToSpeak}`);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      aria-label={ariaLabel}
      className={`focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${props.className || ''}`}
    >
      {children}
    </Button>
  );
}