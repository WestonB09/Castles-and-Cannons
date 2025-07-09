import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { simpleAvatars, SimpleAvatarDisplay } from "./simple-avatar-display";
import { Student } from "@shared/schema";

interface SimpleAvatarCreatorProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleAvatarCreator({ student, isOpen, onClose }: SimpleAvatarCreatorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    typeof student.avatar === 'string' ? student.avatar : "🛡️"
  );
  const queryClient = useQueryClient();

  const saveAvatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      const response = await apiRequest("PUT", `/api/students/${student.id}/avatar`, { avatar });
      return response.json();
    },
    onSuccess: (updatedStudent) => {
      // Invalidate all student-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.setQueryData(["/api/students"], (oldData: any) => {
        if (oldData) {
          return oldData.map((s: any) => s.id === student.id ? updatedStudent : s);
        }
        return oldData;
      });
      onClose();
    }
  });

  const handleSave = () => {
    saveAvatarMutation.mutate(selectedAvatar);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar - {student.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-600">Preview:</div>
            <SimpleAvatarDisplay avatar={selectedAvatar} size="xl" />
            <div className="mt-2 text-sm font-medium">
              {simpleAvatars[selectedAvatar as keyof typeof simpleAvatars]}
            </div>
          </div>

          {/* Avatar Selection Grid */}
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(simpleAvatars).map(([emoji, name]) => (
              <button
                key={emoji}
                onClick={() => setSelectedAvatar(emoji)}
                className={`
                  p-3 rounded-lg border-2 transition-all hover:scale-105
                  ${selectedAvatar === emoji 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                title={name}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-xs text-gray-600">{name}</div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveAvatarMutation.isPending}
            >
              {saveAvatarMutation.isPending ? "Saving..." : "Save Avatar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}