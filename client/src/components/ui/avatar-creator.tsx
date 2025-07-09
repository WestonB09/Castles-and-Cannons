import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Student } from "@shared/schema";

interface AvatarConfig {
  body: string;
  hair: string;
  eyes: string;
  outfit: string;
  accessory: string;
  background: string;
}

interface AvatarCreatorProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

const avatarOptions = {
  body: [
    { id: 'light', name: 'Light', emoji: '👤' },
    { id: 'medium', name: 'Medium', emoji: '👤' },
    { id: 'dark', name: 'Dark', emoji: '👤' },
    { id: 'robot', name: 'Robot', emoji: '🤖' },
  ],
  hair: [
    { id: 'short-brown', name: 'Short Brown', emoji: '💇‍♂️' },
    { id: 'long-blonde', name: 'Long Blonde', emoji: '👱‍♀️' },
    { id: 'curly-black', name: 'Curly Black', emoji: '👩‍🦱' },
    { id: 'spiky-red', name: 'Spiky Red', emoji: '👨‍🦰' },
    { id: 'bald', name: 'Bald', emoji: '👨‍🦲' },
    { id: 'ponytail', name: 'Ponytail', emoji: '👧' },
  ],
  eyes: [
    { id: 'brown', name: 'Brown', emoji: '👁️' },
    { id: 'blue', name: 'Blue', emoji: '👁️' },
    { id: 'green', name: 'Green', emoji: '👁️' },
    { id: 'hazel', name: 'Hazel', emoji: '👁️' },
    { id: 'glasses', name: 'Glasses', emoji: '🤓' },
    { id: 'sunglasses', name: 'Sunglasses', emoji: '😎' },
  ],
  outfit: [
    { id: 'casual', name: 'Casual', emoji: '👕' },
    { id: 'formal', name: 'Formal', emoji: '👔' },
    { id: 'sporty', name: 'Sporty', emoji: '👟' },
    { id: 'knight', name: 'Knight Armor', emoji: '⚔️' },
    { id: 'wizard', name: 'Wizard Robes', emoji: '🧙‍♂️' },
    { id: 'pirate', name: 'Pirate', emoji: '🏴‍☠️' },
  ],
  accessory: [
    { id: 'none', name: 'None', emoji: '🚫' },
    { id: 'crown', name: 'Crown', emoji: '👑' },
    { id: 'hat', name: 'Hat', emoji: '🎩' },
    { id: 'headband', name: 'Headband', emoji: '🎀' },
    { id: 'cape', name: 'Cape', emoji: '🦸‍♂️' },
    { id: 'necklace', name: 'Necklace', emoji: '📿' },
  ],
  background: [
    { id: 'castle', name: 'Castle', emoji: '🏰' },
    { id: 'forest', name: 'Forest', emoji: '🌲' },
    { id: 'mountains', name: 'Mountains', emoji: '⛰️' },
    { id: 'beach', name: 'Beach', emoji: '🏖️' },
    { id: 'space', name: 'Space', emoji: '🌌' },
    { id: 'classroom', name: 'Classroom', emoji: '🏫' },
  ],
};

const defaultAvatar: AvatarConfig = {
  body: 'light',
  hair: 'short-brown',
  eyes: 'brown',
  outfit: 'casual',
  accessory: 'none',
  background: 'castle',
};

export function AvatarCreator({ student, isOpen, onClose }: AvatarCreatorProps) {
  const [avatar, setAvatar] = useState<AvatarConfig>(
    (student.avatar as AvatarConfig) || defaultAvatar
  );
  const queryClient = useQueryClient();

  const saveAvatarMutation = useMutation({
    mutationFn: async (avatarConfig: AvatarConfig) => {
      const response = await apiRequest("PUT", `/api/students/${student.id}/avatar`, {
        avatar: avatarConfig,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${student.id}`] });
      onClose();
    },
  });

  const updateAvatarPart = (category: keyof AvatarConfig, value: string) => {
    setAvatar(prev => ({ ...prev, [category]: value }));
  };

  const getAvatarDisplay = (config: AvatarConfig) => {
    const body = avatarOptions.body.find(b => b.id === config.body)?.emoji || '👤';
    const hair = avatarOptions.hair.find(h => h.id === config.hair)?.emoji || '💇‍♂️';
    const eyes = avatarOptions.eyes.find(e => e.id === config.eyes)?.emoji || '👁️';
    const outfit = avatarOptions.outfit.find(o => o.id === config.outfit)?.emoji || '👕';
    const accessory = config.accessory !== 'none' ? 
      (avatarOptions.accessory.find(a => a.id === config.accessory)?.emoji || '') : '';
    const background = avatarOptions.background.find(b => b.id === config.background)?.emoji || '🏰';

    return { body, hair, eyes, outfit, accessory, background };
  };

  const avatarDisplay = getAvatarDisplay(avatar);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Create Your Avatar - {student.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avatar Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-64 h-64 mx-auto border-4 border-primary rounded-lg overflow-hidden">
                  {/* Background */}
                  <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-30">
                    {avatarDisplay.background}
                  </div>
                  
                  {/* Character */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                    <div className="text-6xl">{avatarDisplay.body}</div>
                    <div className="absolute top-8 text-3xl">{avatarDisplay.hair}</div>
                    <div className="absolute top-12 text-2xl">{avatarDisplay.eyes}</div>
                    <div className="absolute top-20 text-4xl">{avatarDisplay.outfit}</div>
                    {avatarDisplay.accessory && (
                      <div className="absolute top-6 text-3xl">{avatarDisplay.accessory}</div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-lg">{student.name}</h3>
                  <Badge variant="secondary">{student.className} Class</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={() => setAvatar(defaultAvatar)}
                variant="outline"
                className="flex-1"
              >
                Reset to Default
              </Button>
              <Button 
                onClick={() => saveAvatarMutation.mutate(avatar)}
                disabled={saveAvatarMutation.isPending}
                className="flex-1"
              >
                {saveAvatarMutation.isPending ? 'Saving...' : 'Save Avatar'}
              </Button>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <Tabs defaultValue="body" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="body">Character</TabsTrigger>
                <TabsTrigger value="outfit">Style</TabsTrigger>
                <TabsTrigger value="background">Scene</TabsTrigger>
              </TabsList>

              <TabsContent value="body" className="space-y-4">
                {/* Body Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Body Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {avatarOptions.body.map((option) => (
                        <Button
                          key={option.id}
                          variant={avatar.body === option.id ? "default" : "outline"}
                          onClick={() => updateAvatarPart('body', option.id)}
                          className="h-16 flex flex-col gap-1"
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hair */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hair Style</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.hair.map((option) => (
                        <Button
                          key={option.id}
                          variant={avatar.hair === option.id ? "default" : "outline"}
                          onClick={() => updateAvatarPart('hair', option.id)}
                          className="h-16 flex flex-col gap-1"
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Eyes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Eyes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.eyes.map((option) => (
                        <Button
                          key={option.id}
                          variant={avatar.eyes === option.id ? "default" : "outline"}
                          onClick={() => updateAvatarPart('eyes', option.id)}
                          className="h-16 flex flex-col gap-1"
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outfit" className="space-y-4">
                {/* Outfit */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Outfit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.outfit.map((option) => (
                        <Button
                          key={option.id}
                          variant={avatar.outfit === option.id ? "default" : "outline"}
                          onClick={() => updateAvatarPart('outfit', option.id)}
                          className="h-16 flex flex-col gap-1"
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Accessory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Accessory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.accessory.map((option) => (
                        <Button
                          key={option.id}
                          variant={avatar.accessory === option.id ? "default" : "outline"}
                          onClick={() => updateAvatarPart('accessory', option.id)}
                          className="h-16 flex flex-col gap-1"
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="background" className="space-y-4">
                {/* Background */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Background Scene</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.background.map((option) => (
                        <Button
                          key={option.id}
                          variant={avatar.background === option.id ? "default" : "outline"}
                          onClick={() => updateAvatarPart('background', option.id)}
                          className="h-16 flex flex-col gap-1"
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}