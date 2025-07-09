import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Trophy, Sparkles, Snowflake } from "lucide-react";
import type { SeasonalEvent, SpecialUnit, StudentSpecialUnit } from "@shared/schema";

interface SeasonalEventsPanelProps {
  studentId: number;
  studentName: string;
}

interface SpecialUnitWithProgress extends SpecialUnit {
  quantity: number;
  isUnlocked: boolean;
  canUnlock: boolean;
}

export function SeasonalEventsPanel({ studentId, studentName }: SeasonalEventsPanelProps) {
  const { data: activeEvents = [] } = useQuery<SeasonalEvent[]>({
    queryKey: ['/api/seasonal-events/active'],
  });

  const { data: studentSpecialUnits = [] } = useQuery<(StudentSpecialUnit & { specialUnit: SpecialUnit })[]>({
    queryKey: ['/api/students', studentId, 'special-units'],
  });

  const { data: allSpecialUnits = [] } = useQuery<SpecialUnit[]>({
    queryKey: ['/api/special-units'],
  });

  // Calculate special unit progress
  const specialUnitsWithProgress: SpecialUnitWithProgress[] = allSpecialUnits.map(unit => {
    const studentUnit = studentSpecialUnits.find(su => su.specialUnitId === unit.id);
    return {
      ...unit,
      quantity: studentUnit?.quantity || 0,
      isUnlocked: !!studentUnit,
      canUnlock: true // Simplified for now
    };
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'mythical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUnitTypeIcon = (unitType: string) => {
    switch (unitType) {
      case 'dragon': return '🐉';
      case 'wizard': return '🧙‍♂️';
      case 'siege': return '⛄';
      case 'mythical': return '✨';
      default: return '⚔️';
    }
  };

  if (activeEvents.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Seasonal Events for {studentName}
          </CardTitle>
          <CardDescription>
            No active seasonal events at the moment. Check back later for special units and rewards!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Events */}
      {activeEvents.map(event => {
        const eventUnits = specialUnitsWithProgress.filter(unit => unit.eventId === event.id);
        const unlockedCount = eventUnits.filter(unit => unit.isUnlocked).length;
        
        return (
          <Card key={event.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{event.icon}</span>
                    {event.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {event.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Active Event
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Event Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Special Units Unlocked</span>
                  <span>{unlockedCount} of {eventUnits.length}</span>
                </div>
                <Progress 
                  value={eventUnits.length > 0 ? (unlockedCount / eventUnits.length) * 100 : 0} 
                  className="h-2"
                />
              </div>

              {/* Special Units */}
              {eventUnits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Event Special Units</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventUnits.map(unit => (
                      <Card 
                        key={unit.id}
                        className={`transition-all duration-200 ${
                          unit.isUnlocked 
                            ? 'border-green-300 bg-green-50' 
                            : unit.canUnlock 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{unit.icon}</span>
                              <div>
                                <CardTitle className="text-sm font-semibold">
                                  {unit.name}
                                </CardTitle>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mt-1 ${getRarityColor(unit.rarity)}`}
                                >
                                  {unit.rarity}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              {unit.isUnlocked ? (
                                <div className="text-green-600 font-bold">
                                  ×{unit.quantity}
                                </div>
                              ) : (
                                <div className="text-gray-400">
                                  🔒
                                </div>
                              )}
                              <div className="text-xs text-gray-600 mt-1">
                                {unit.power} power
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-xs">
                            {unit.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Timeline */}
              <div className="mt-6 p-4 bg-white/50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Event runs until {new Date(event.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Student's Special Units Collection */}
      {studentSpecialUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              {studentName}'s Special Units Collection
            </CardTitle>
            <CardDescription>
              Rare units earned through seasonal events and special achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {studentSpecialUnits.map(({ specialUnit, quantity }) => (
                <div 
                  key={specialUnit.id}
                  className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg text-center"
                >
                  <div className="text-2xl mb-2">{specialUnit.icon}</div>
                  <div className="font-semibold text-sm">{specialUnit.name}</div>
                  <div className="text-xs text-gray-600 mb-1">×{quantity}</div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRarityColor(specialUnit.rarity)}`}
                  >
                    {specialUnit.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}