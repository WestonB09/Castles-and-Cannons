import React, { useState } from 'react';
import { useAccessibility } from '@/hooks/use-accessibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Eye, Volume2, Palette, Play, Pause, RotateCcw } from 'lucide-react';

export function AccessibilityPanel() {
  const {
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
  } = useAccessibility();

  const [testText] = useState("This is a test of the text-to-speech feature. Your voice settings will be applied to all game content.");

  const handleTestSpeech = () => {
    speak(testText);
  };

  const handleStopSpeech = () => {
    stopSpeaking();
  };

  const resetToDefaults = () => {
    setSpeechRate(1);
    setSpeechPitch(1);
    setSpeechVolume(1);
    setAutoReadContent(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white/95"
          aria-label="Open accessibility settings"
        >
          <Settings className="h-4 w-4 mr-2" />
          Accessibility
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize visual and audio settings to improve your learning experience.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Behavior
            </TabsTrigger>
          </TabsList>

          {/* Visual Settings */}
          <TabsContent value="visual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Accessibility</CardTitle>
                <CardDescription>
                  Adjust colors and contrast for better visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="high-contrast">High Contrast Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use black backgrounds with white text and bright colors for better visibility
                    </p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={isHighContrast}
                    onCheckedChange={toggleHighContrast}
                    aria-describedby="high-contrast-description"
                  />
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className={`p-3 rounded border ${isHighContrast ? 'bg-black text-white border-white' : 'bg-white text-black border-gray-300'}`}>
                    <p className="font-semibold">Sample Text</p>
                    <p className="text-sm">This shows how text will appear with your current settings.</p>
                    <Button size="sm" className="mt-2">Sample Button</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audio Settings */}
          <TabsContent value="audio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Text-to-Speech</CardTitle>
                <CardDescription>
                  Configure voice settings for reading game content aloud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="tts-enable">Enable Text-to-Speech</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the game to read text content aloud
                    </p>
                  </div>
                  <Switch
                    id="tts-enable"
                    checked={isTTSEnabled}
                    onCheckedChange={toggleTTS}
                  />
                </div>

                {isTTSEnabled && (
                  <>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="speech-rate">Speech Rate: {speechRate.toFixed(1)}x</Label>
                        <Slider
                          id="speech-rate"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[speechRate]}
                          onValueChange={(value) => setSpeechRate(value[0])}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">How fast the voice speaks</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speech-pitch">Speech Pitch: {speechPitch.toFixed(1)}</Label>
                        <Slider
                          id="speech-pitch"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[speechPitch]}
                          onValueChange={(value) => setSpeechPitch(value[0])}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">How high or low the voice sounds</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speech-volume">Speech Volume: {Math.round(speechVolume * 100)}%</Label>
                        <Slider
                          id="speech-volume"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[speechVolume]}
                          onValueChange={(value) => setSpeechVolume(value[0])}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">How loud the voice is</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleTestSpeech}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Test Voice
                      </Button>
                      <Button
                        onClick={handleStopSpeech}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        Stop
                      </Button>
                      <Button
                        onClick={resetToDefaults}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Settings */}
          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reading Behavior</CardTitle>
                <CardDescription>
                  Control when and how content is read aloud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-read">Auto-Read Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically read important content like questions and results
                    </p>
                  </div>
                  <Switch
                    id="auto-read"
                    checked={autoReadContent}
                    onCheckedChange={setAutoReadContent}
                    disabled={!isTTSEnabled}
                  />
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">How to Use Text-to-Speech:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Click any button or text to hear it read aloud</li>
                    <li>• Questions will be read automatically when enabled</li>
                    <li>• Battle results and achievements will be announced</li>
                    <li>• Hover over elements to hear descriptions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}