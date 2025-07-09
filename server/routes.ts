import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentArmyPointsSchema, insertBattleResultSchema, insertStudentQuestionHistorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with default students and achievements
  await (storage as any).initializeDefaultStudents();
  await storage.initializeDefaultAchievements();
  
  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Get student army points
  app.get("/api/students/:id/army-points", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const armyPoints = await storage.getStudentArmyPoints(studentId);
      
      if (!armyPoints) {
        // Return default points if none exist
        const defaultPoints = {
          studentId,
          castle: 0,
          cannon: 0,
          knight: 0,
          infantry: 0,
          archer: 0,
        };
        res.json(defaultPoints);
      } else {
        res.json(armyPoints);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch army points" });
    }
  });

  // Update student army points
  app.post("/api/students/:id/army-points", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const updates = insertStudentArmyPointsSchema.parse({
        ...req.body,
        studentId,
      });
      
      const updatedPoints = await storage.updateStudentArmyPoints(studentId, updates);
      res.json(updatedPoints);
    } catch (error) {
      console.error("Error updating army points:", error);
      res.status(400).json({ message: "Invalid army points data" });
    }
  });

  // Update student avatar (simplified version)
  app.put("/api/students/:id/avatar", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const avatar = req.body?.avatar; // Extract avatar string from request body
      
      if (!avatar) {
        return res.status(400).json({ error: "Avatar data is required" });
      }
      
      console.log(`Updating avatar for student ${studentId}:`, avatar);
      
      const updatedStudent = await storage.updateStudentAvatar(studentId, avatar);
      res.json(updatedStudent);
    } catch (error) {
      console.error("Error updating student avatar:", error);
      res.status(500).json({ error: "Failed to update student avatar" });
    }
  });

  // Add points to specific unit type
  app.post("/api/students/:id/add-point", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { unitType } = req.body;
      
      if (!['castle', 'cannon', 'knight', 'infantry', 'archer'].includes(unitType)) {
        return res.status(400).json({ message: "Invalid unit type" });
      }

      // Get current points
      const currentPoints = await storage.getStudentArmyPoints(studentId);
      const current = currentPoints || {
        studentId,
        castle: 0,
        cannon: 0,
        knight: 0,
        infantry: 0,
        archer: 0,
      };

      // Increment the specific unit type
      const updates = {
        ...current,
        [unitType]: (current[unitType as keyof typeof current] as number) + 1,
      };

      const updatedPoints = await storage.updateStudentArmyPoints(studentId, updates);
      res.json(updatedPoints);
    } catch (error) {
      console.error("Error adding point:", error);
      res.status(500).json({ message: "Failed to add point" });
    }
  });

  // Simulate battle
  app.post("/api/students/:id/battle", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { difficulty: overrideDifficulty } = req.body;
      const armyPoints = await storage.getStudentArmyPoints(studentId);
      
      if (!armyPoints) {
        return res.status(404).json({ message: "Student army points not found" });
      }

      // Generate AI army based on battle experience progression
      const playerTotalUnits = (armyPoints.castle || 0) + (armyPoints.cannon || 0) + 
                              (armyPoints.knight || 0) + (armyPoints.infantry || 0) + 
                              (armyPoints.archer || 0);
      
      // Get battle history to determine experience level
      const battleHistory = await storage.getStudentBattleResults(studentId);
      const totalBattles = battleHistory.length;
      const victories = battleHistory.filter(battle => battle.victory).length;
      
      // Determine difficulty tier and AI strength with proper initialization
      let aiTotalUnits: number = Math.max(5, Math.floor(playerTotalUnits * 0.75)); // Default fallback
      let difficultyTier: string = "Intermediate"; // Default fallback
      
      // Check for difficulty override first
      if (overrideDifficulty && ['easy', 'moderate', 'hard'].includes(overrideDifficulty)) {
        if (overrideDifficulty === 'easy') {
          difficultyTier = "Easy Override";
          aiTotalUnits = Math.max(2, Math.floor(playerTotalUnits * (0.5 + Math.random() * 0.2)));
        } else if (overrideDifficulty === 'moderate') {
          difficultyTier = "Moderate Override";
          aiTotalUnits = Math.max(5, Math.floor(playerTotalUnits * (0.75 + Math.random() * 0.2)));
        } else if (overrideDifficulty === 'hard') {
          difficultyTier = "Hard Override";
          aiTotalUnits = Math.max(8, Math.floor(playerTotalUnits * (1.0 + Math.random() * 0.25)));
        }
      } else {
        // Use gradual victory-based progression with very slow increase
        if (victories <= 2) {
          // First 3 battles: Easy (60-75% of player strength)
          difficultyTier = "Novice";
          aiTotalUnits = Math.max(2, Math.floor(playerTotalUnits * (0.6 + Math.random() * 0.15)));
        } else if (victories <= 8) {
          // After 3-8 victories: Gradual increase (65-80% of player strength)
          difficultyTier = "Apprentice";
          const progressionFactor = 0.65 + (victories - 3) * 0.025; // Very slow 2.5% increase per victory
          aiTotalUnits = Math.max(3, Math.floor(playerTotalUnits * (progressionFactor + Math.random() * 0.1)));
        } else if (victories <= 15) {
          // After 9-15 victories: Moderate challenge (75-90% of player strength)
          difficultyTier = "Veteran";
          const progressionFactor = 0.75 + (victories - 9) * 0.02; // Slow 2% increase per victory
          aiTotalUnits = Math.max(5, Math.floor(playerTotalUnits * (progressionFactor + Math.random() * 0.1)));
        } else if (victories <= 25) {
          // After 16-25 victories: Advanced challenge (85-105% of player strength)
          difficultyTier = "Elite";
          const progressionFactor = 0.85 + (victories - 16) * 0.02; // 2% increase per victory
          aiTotalUnits = Math.max(8, Math.floor(playerTotalUnits * (progressionFactor + Math.random() * 0.1)));
        } else if (victories <= 50) {
          // After 26-50 victories: Master challenge (105-125% of player strength)
          difficultyTier = "Master";
          const progressionFactor = 1.05 + (victories - 26) * 0.008; // Very slow 0.8% increase per victory
          aiTotalUnits = Math.max(10, Math.floor(playerTotalUnits * (progressionFactor + Math.random() * 0.1)));
        } else {
          // After 50+ victories: Champion goblins (150-200% of player strength unless special units)
          difficultyTier = "Champion";
          
          // Check for special units to balance champion difficulty
          const specialUnits = await storage.getStudentSpecialUnits(studentId);
          const hasSpecialUnits = specialUnits && specialUnits.length > 0;
          
          if (hasSpecialUnits) {
            // Reduced difficulty with special units (100-130% of player strength)
            aiTotalUnits = Math.max(12, Math.floor(playerTotalUnits * (1.0 + Math.random() * 0.3)));
          } else {
            // Full champion difficulty without special units (150-200% of player strength)
            aiTotalUnits = Math.max(15, Math.floor(playerTotalUnits * (1.5 + Math.random() * 0.5)));
          }
        }
      }
      
      // Distribute AI units randomly but ensure at least 1 of each type
      const aiArmy = {
        castle: Math.max(1, Math.floor(Math.random() * Math.max(2, Math.floor(aiTotalUnits * 0.25)))),
        cannon: Math.max(1, Math.floor(Math.random() * Math.max(2, Math.floor(aiTotalUnits * 0.2)))),
        knight: Math.max(1, Math.floor(Math.random() * Math.max(2, Math.floor(aiTotalUnits * 0.2)))),
        infantry: Math.max(1, Math.floor(Math.random() * Math.max(2, Math.floor(aiTotalUnits * 0.25)))),
        archer: Math.max(1, Math.floor(Math.random() * Math.max(2, Math.floor(aiTotalUnits * 0.2)))),
      };
      
      // Adjust total to match target
      const currentAiTotal = aiArmy.castle + aiArmy.cannon + aiArmy.knight + aiArmy.infantry + aiArmy.archer;
      const difference = aiTotalUnits - currentAiTotal;
      if (difference > 0) {
        // Add extra units randomly
        const unitTypes = ['castle', 'cannon', 'knight', 'infantry', 'archer'];
        for (let i = 0; i < difference; i++) {
          const randomType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
          aiArmy[randomType as keyof typeof aiArmy]++;
        }
      }

      // Calculate strategic battle outcome
      const battleOutcome = await calculateBattleOutcome(armyPoints, aiArmy, studentId, storage);
      
      // Record battle result
      const battleResult = await storage.createBattleResult({
        studentId,
        totalPower: battleOutcome.playerPower,
        victory: battleOutcome.victory,
        createdAt: new Date().toISOString(),
      });

      // Check for new achievements after battle
      const newAchievements = await storage.checkAndUnlockAchievements(studentId);

      res.json({
        victory: battleOutcome.victory,
        totalPower: battleOutcome.playerPower,
        message: battleOutcome.message,
        battleDetails: battleOutcome.battleDetails,
        aiArmy,
        difficultyTier,
        battleResult,
        newAchievements,
      });
    } catch (error) {
      console.error("Error simulating battle:", error);
      res.status(500).json({ message: "Failed to simulate battle" });
    }
  });

  // Get all achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get student achievements
  app.get("/api/students/:id/achievements", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const achievements = await storage.getStudentAchievements(studentId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student achievements" });
    }
  });

  // Get comprehensive dashboard data for a student
  app.get("/api/students/:id/dashboard", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const armyPoints = await storage.getStudentArmyPoints(studentId);
      const battleResults = await storage.getStudentBattleResults(studentId);
      const achievements = await storage.getStudentAchievements(studentId);
      const questionHistory = await storage.getStudentQuestionHistory(studentId);

      // Calculate comprehensive stats
      const totalBattles = battleResults.length;
      const victories = battleResults.filter(b => b.victory).length;
      const winRate = totalBattles > 0 ? Math.round((victories / totalBattles) * 100) : 0;
      const totalPower = (armyPoints?.castle || 0) + (armyPoints?.cannon || 0) + 
                        (armyPoints?.knight || 0) + (armyPoints?.infantry || 0) + 
                        (armyPoints?.archer || 0);
      
      const questionsAnswered = questionHistory.length;
      const correctAnswers = questionHistory.filter(q => q.isCorrect).length;
      const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Sort question history by most recent first
      const sortedHistory = [...questionHistory].sort((a, b) => 
        new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime()
      );

      // Calculate current streak (from most recent)
      for (const question of sortedHistory) {
        if (question.isCorrect) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      for (const question of questionHistory) {
        if (question.isCorrect) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      const stats = {
        totalBattles,
        victories,
        winRate,
        totalPower,
        questionsAnswered,
        correctAnswers,
        accuracy,
        currentStreak,
        longestStreak,
      };

      res.json({
        student,
        armyPoints: armyPoints || { castle: 0, cannon: 0, knight: 0, infantry: 0, archer: 0 },
        battleResults,
        achievements,
        questionHistory,
        stats,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Check and unlock achievements for a student
  app.post("/api/students/:id/check-achievements", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const newAchievements = await storage.checkAndUnlockAchievements(studentId);
      res.json(newAchievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // Get student question history
  app.get("/api/students/:id/question-history", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const questionHistory = await storage.getStudentQuestionHistory(studentId);
      res.json(questionHistory);
    } catch (error) {
      console.error('Error fetching question history:', error);
      res.status(500).json({ message: "Failed to fetch question history" });
    }
  });

  // Get a random English question based on student's class difficulty
  app.get("/api/students/:id/question", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      const overrideDifficulty = req.query.difficulty as string;
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Determine difficulty based on override or adaptive class-based system
      let difficulty: string;
      
      if (overrideDifficulty && ['easy', 'moderate', 'hard'].includes(overrideDifficulty)) {
        difficulty = overrideDifficulty;
      } else {
        // Use adaptive class-based difficulty
        const className = student.className.toLowerCase();
        
        if (['snake', 'rabbit', 'husky'].includes(className)) {
          difficulty = 'easy';
        } else if (['panda', 'bear', 'octopus'].includes(className)) {
          difficulty = 'moderate';
        } else if (['scorpion', 'elephant'].includes(className)) {
          difficulty = 'hard';
        } else {
          difficulty = 'moderate'; // Default for demo class
        }
      }

      const question = await storage.getRandomQuestionByDifficulty(difficulty, studentId);
      
      if (!question) {
        return res.status(404).json({ message: "No questions available for this difficulty" });
      }

      // Shuffle the answers for display
      const allAnswers = [question.correctAnswer, ...question.wrongAnswers];
      const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

      res.json({
        id: question.id,
        question: question.question,
        answers: shuffledAnswers,
        category: question.category,
        difficulty: question.difficulty,
        unitReward: question.unitReward
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  // Submit answer to English question
  app.post("/api/students/:id/answer-question", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { questionId, selectedAnswer } = req.body;
      
      // Get the question to check the correct answer
      const allQuestions = await storage.getAllEnglishQuestions();
      const question = allQuestions.find(q => q.id === questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const isCorrect = selectedAnswer === question.correctAnswer;
      
      // Record the answer in history
      await storage.recordQuestionAnswer({
        studentId,
        questionId,
        isCorrect
      });

      let armyPoints = null;
      
      // Award unit if answer is correct
      if (isCorrect) {
        const currentPoints = await storage.getStudentArmyPoints(studentId);
        
        // Calculate total current units
        const totalUnits = (currentPoints?.castle || 0) + (currentPoints?.cannon || 0) + 
                          (currentPoints?.knight || 0) + (currentPoints?.infantry || 0) + 
                          (currentPoints?.archer || 0);
        
        // Get student's question history to check for threshold rule
        const questionHistory = await storage.getStudentQuestionHistory(studentId);
        const correctAnswers = questionHistory.filter(q => q.isCorrect).length;
        
        let shouldAwardUnit = false;
        
        if (totalUnits < 50) {
          // Before 50 units: 1 unit per correct answer
          shouldAwardUnit = true;
        } else {
          // After 50 units: 1 unit per 2 correct answers
          // Count correct answers since reaching 50 units
          shouldAwardUnit = (correctAnswers + 1) % 2 === 0;
        }
        
        if (shouldAwardUnit) {
          const updates = {
            [question.unitReward]: (currentPoints?.[question.unitReward as keyof typeof currentPoints] || 0) + 1
          };
          
          armyPoints = await storage.updateStudentArmyPoints(studentId, updates);
          
          // Check for new achievements after gaining units
          const newAchievements = await storage.checkAndUnlockAchievements(studentId);
          
          res.json({
            correct: true,
            unitReward: question.unitReward,
            correctAnswer: question.correctAnswer,
            armyPoints,
            newAchievements,
            threshold50Reached: totalUnits >= 50
          });
        } else {
          // Correct answer but no unit awarded due to threshold rule
          res.json({
            correct: true,
            unitReward: null,
            correctAnswer: question.correctAnswer,
            armyPoints: currentPoints,
            newAchievements: [],
            threshold50Reached: true,
            nextUnitIn: 2 - ((correctAnswers + 1) % 2)
          });
        }
      } else {
        res.json({
          correct: false,
          correctAnswer: question.correctAnswer,
          unitReward: null,
          armyPoints: null,
          newAchievements: []
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Helper function for strategic battle calculations
  async function calculateBattleOutcome(playerArmy: any, aiArmy: any, studentId: number, storage: any) {
    let battleDetails = [];
    let playerCasualties = 0;
    let aiCasualties = 0;

    // Get player's special units
    const specialUnits = await storage.getStudentSpecialUnits ? await storage.getStudentSpecialUnits(studentId) : [];
    
    // Calculate special units power
    let specialPower = 0;
    let specialUnitsUsed = [];
    
    for (const unit of specialUnits) {
      if (unit.specialUnit) {
        const power = unit.specialUnit.power || 0;
        const quantity = unit.quantity || 0;
        const totalPower = power * quantity;
        specialPower += totalPower;
        
        if (quantity > 0) {
          specialUnitsUsed.push({
            name: unit.specialUnit.name,
            icon: unit.specialUnit.icon,
            quantity: quantity,
            power: totalPower
          });
        }
      }
    }

    // Each unit has equal base strength (1 point = 1 unit) + special units
    const playerTotal = (playerArmy.castle || 0) + (playerArmy.cannon || 0) + 
                       (playerArmy.knight || 0) + (playerArmy.infantry || 0) + 
                       (playerArmy.archer || 0) + specialPower;
    
    const aiTotal = aiArmy.castle + aiArmy.cannon + aiArmy.knight + aiArmy.infantry + aiArmy.archer;

    // Determine overall winner based on total strength
    const playerWillWin = playerTotal > aiTotal;
    
    // Calculate battle phases with tactical advantages
    
    // Declare all unit variables at the beginning to avoid redeclaration errors
    const playerArchers = playerArmy.archer || 0;
    const aiArchers = aiArmy.archer || 0;
    const playerCannons = playerArmy.cannon || 0;
    const aiCannons = aiArmy.cannon || 0;
    const playerCastles = playerArmy.castle || 0;
    const aiCastles = aiArmy.castle || 0;
    const playerKnights = playerArmy.knight || 0;
    const aiKnights = aiArmy.knight || 0;
    const playerInfantry = playerArmy.infantry || 0;
    const aiInfantry = aiArmy.infantry || 0;
    
    // Special Units Phase: Winter Magic Unleashed!
    if (specialUnitsUsed.length > 0) {
      battleDetails.push("❄️ Winter Festival special units join the battle!");
      for (const unit of specialUnitsUsed) {
        if (unit.quantity > 0) {
          battleDetails.push(`${unit.icon} ${unit.quantity}x ${unit.name} (${unit.power} power) unleashes magical attacks!`);
        }
      }
      battleDetails.push("✨ Magical frost energy overwhelms enemy positions!");
    }

    // Phase 1: Ranged Combat (Archers vs Archers)
    
    if (playerArchers > 0 || aiArchers > 0) {
      const archerDiff = playerArchers - aiArchers;
      if (archerDiff > 0) {
        battleDetails.push("🏹 Your archers gained ranged superiority! Enemy units vanished in smoke puffs!");
        aiCasualties += Math.min(archerDiff, aiTotal - aiCasualties);
      } else if (archerDiff < 0) {
        battleDetails.push("🏹 Enemy archers dominated the ranged battle! Some of your units disappeared in gentle smoke!");
        playerCasualties += Math.min(Math.abs(archerDiff), playerTotal - playerCasualties);
      } else {
        battleDetails.push("🏹 Archers exchanged volleys with equal effect!");
      }
    }

    // Phase 2: Siege Warfare (Cannons vs Castles)

    if (playerCannons > aiCastles) {
      battleDetails.push("🔫 Your cannons breached the enemy fortifications! Enemy units vanished in puffs of fire!");
      aiCasualties += Math.min(playerCannons - aiCastles, aiTotal - aiCasualties);
    } else if (aiCastles > playerCannons && playerCannons > 0) {
      battleDetails.push("🏰 Enemy walls withstood your siege!");
    }

    if (aiCannons > playerCastles) {
      battleDetails.push("💥 Enemy cannons breached your defenses! Some units disappeared in harmless smoke!");
      playerCasualties += Math.min(aiCannons - playerCastles, playerTotal - playerCasualties);
    } else if (playerCastles > aiCannons && aiCannons > 0) {
      battleDetails.push("🏰 Your castle walls held strong!");
    }

    // Phase 3: Infantry Anti-Archer Defense (Infantry counters Archers)

    if (playerInfantry > 0 && aiArchers > 0) {
      const advantage = Math.min(playerInfantry, aiArchers);
      if (advantage > 0) {
        battleDetails.push("🛡️ Your infantry formed shield walls and charged the enemy archers! Enemy units vanished in defensive smoke!");
        aiCasualties += Math.min(advantage, aiTotal - aiCasualties);
      }
    }

    if (aiInfantry > 0 && playerArchers > 0) {
      const advantage = Math.min(aiInfantry, playerArchers);
      if (advantage > 0) {
        battleDetails.push("⚔️ Enemy infantry overwhelmed your archer positions! Some units disappeared in tactical smoke!");
        playerCasualties += Math.min(advantage, playerTotal - playerCasualties);
      }
    }

    // Phase 4: Cavalry Charge (Knights vs Infantry)

    if (playerKnights > 0 && aiInfantry > 0) {
      const advantage = Math.min(playerKnights, aiInfantry);
      battleDetails.push("🏇 Your knights charged through enemy infantry formations! Enemy units vanished in sparkly clouds!");
      aiCasualties += Math.min(advantage, aiTotal - aiCasualties);
    }

    if (aiKnights > 0 && playerInfantry > 0) {
      const advantage = Math.min(aiKnights, playerInfantry);
      battleDetails.push("🐎 Enemy cavalry broke through your infantry lines! Some units disappeared in gentle puffs!");
      playerCasualties += Math.min(advantage, playerTotal - playerCasualties);
    }

    // Phase 5: Melee Combat (Remaining forces clash)
    const remainingPlayer = playerTotal - playerCasualties;
    const remainingAi = aiTotal - aiCasualties;

    if (remainingPlayer > remainingAi) {
      battleDetails.push("⚔️ Your forces overwhelmed the enemy in melee!");
    } else if (remainingAi > remainingPlayer) {
      battleDetails.push("⚔️ Enemy forces pushed back your army!");
    } else {
      battleDetails.push("⚔️ Forces clashed with equal determination!");
    }

    // Determine battle outcome with logical retreat and castle defensive bonuses
    let victory;
    let message;
    
    // Castle defensive bonus: reduces losses when retreating (player attacking)
    const playerCastleCount = playerArmy.castle || 0;
    const castleDefenseBonus = Math.min(playerCastleCount * 0.15, 0.5); // Max 50% loss reduction
    
    if (playerWillWin) {
      victory = true;
      
      // Calculate victory casualties - even winning battles have costs
      let victoryCasualties = 0;
      let victoryMessage = "";
      
      if (playerTotal > aiTotal * 1.5) {
        // Decisive victory - minimal casualties (5-15% of total force)
        const baseCasualtyRate = 0.05 + Math.random() * 0.10; // 5-15%
        const protectedRate = Math.max(0.05, baseCasualtyRate - castleDefenseBonus); // Castle protection
        victoryCasualties = Math.floor(playerTotal * protectedRate);
        
        message = `🏆 Decisive victory! You captured the Goblin stronghold but lost ${victoryCasualties} units in the assault.`;
        victoryMessage = victoryCasualties <= 1 ? "Almost no casualties!" : `${victoryCasualties} units vanished in combat smoke during the final assault.`;
        
        battleDetails.push("🏰 You captured the Goblin stronghold as their forces disappeared!");
        battleDetails.push("💨 Goblin units vanished in clouds of smoke!");
        
      } else {
        // Close victory - moderate casualties (10-25% of total force)
        const baseCasualtyRate = 0.10 + Math.random() * 0.15; // 10-25%
        const protectedRate = Math.max(0.08, baseCasualtyRate - castleDefenseBonus); // Castle protection
        victoryCasualties = Math.floor(playerTotal * protectedRate);
        
        message = `🎉 Hard-fought victory! You defeated the Goblins but lost ${victoryCasualties} units in the fierce battle.`;
        victoryMessage = `${victoryCasualties} of your units disappeared in combat smoke during the intense fighting.`;
        
        battleDetails.push("🏃 The remaining Goblin army retreated to fight another day!");
        battleDetails.push("💨 Several Goblin units vanished in harmless smoke clouds!");
      }
      
      if (playerCastleCount > 0) {
        const unitsSaved = Math.floor(victoryCasualties * castleDefenseBonus);
        if (unitsSaved > 0) {
          battleDetails.push(`🏰 Your ${playerCastleCount} castle(s) provided protection - saved ${unitsSaved} units from being lost!`);
        } else {
          battleDetails.push(`🏰 Your ${playerCastleCount} castle(s) provided strategic command advantage!`);
        }
      }
      
      battleDetails.push(`⚔️ Victory cost: ${victoryMessage}`);
      
      // Actually deduct the lost units from player's army
      await applyBattleCasualties(storage, studentId, playerArmy, victoryCasualties);
    } else {
      victory = false;
      
      // Calculate retreat losses with castle protection
      const baseLossRate = aiTotal > playerTotal * 1.5 ? 0.4 : 0.25; // 40% or 25% base loss
      const actualLossRate = Math.max(0.1, baseLossRate - castleDefenseBonus); // Minimum 10% loss
      const unitsLost = Math.floor(playerTotal * actualLossRate);
      
      if (playerCastleCount > 0) {
        // Castles provide better retreat coordination
        const archersSaved = Math.min(playerArmy.archer || 0, Math.floor(playerCastleCount * 0.5));
        const castlesSaved = Math.min(playerCastleCount, Math.floor(playerCastleCount * 0.3));
        
        if (archersSaved > 0) {
          battleDetails.push(`🏹 Your castles coordinated the retreat - ${archersSaved} archer(s) safely withdrew!`);
        }
        if (castlesSaved > 0) {
          battleDetails.push(`🏰 ${castlesSaved} castle(s) provided secure fallback positions!`);
        }
        
        if (aiTotal > playerTotal * 1.5) {
          message = `💔 Your army retreated with minimal losses thanks to castle coordination! Only ${unitsLost} units disappeared in smoke against the Goblins.`;
          battleDetails.push("🏃 Your castles enabled an organized tactical withdrawal from the Goblin assault!");
        } else {
          message = `⚔️ Close battle against the Goblins! Your castles minimized retreat losses - only ${unitsLost} units vanished in gentle puffs.`;
          battleDetails.push("🛡️ Castle defenses allowed most units to retreat safely from the Goblin attack!");
        }
      } else {
        // No castle protection - standard retreat
        if (aiTotal > playerTotal * 1.5) {
          message = `💔 Without castle coordination, ${unitsLost} units disappeared in puffs of smoke during the retreat from the Goblins!`;
          battleDetails.push("🏃 Your forces retreated but lacked defensive coordination against the Goblins!");
        } else {
          message = `⚔️ A hard-fought battle against the Goblins! ${unitsLost} units disappeared in smoke during withdrawal.`;
          battleDetails.push("🛡️ Your army fought bravely but needed better defensive positions against the Goblins!");
        }
      }
      
      battleDetails.push("💨 Lost units simply vanished in harmless puffs of smoke!");
      
      // Apply defeat casualties
      const defeatCasualties = Math.floor(playerTotal * actualLossRate);
      await applyBattleCasualties(storage, studentId, playerArmy, defeatCasualties);
    }

    return {
      victory,
      playerPower: playerTotal,
      aiPower: aiTotal,
      message,
      battleDetails
    };
  }

  // Helper function to apply battle casualties to player's army
  async function applyBattleCasualties(storage: any, studentId: number, playerArmy: any, totalCasualties: number) {
    if (totalCasualties <= 0) return;

    const currentArmy = { ...playerArmy };
    let remainingCasualties = totalCasualties;

    // Distribute casualties across unit types proportionally
    const unitTypes = ['infantry', 'archer', 'knight', 'cannon', 'castle'];
    const totalUnits = (currentArmy.castle || 0) + (currentArmy.cannon || 0) + 
                      (currentArmy.knight || 0) + (currentArmy.infantry || 0) + 
                      (currentArmy.archer || 0);

    for (const unitType of unitTypes) {
      if (remainingCasualties <= 0) break;
      
      const currentCount = currentArmy[unitType] || 0;
      if (currentCount > 0) {
        // Calculate proportional losses, but ensure we don't lose more than we have
        const proportion = currentCount / totalUnits;
        const unitLosses = Math.min(
          Math.floor(totalCasualties * proportion + Math.random()), // Add some randomness
          currentCount,
          remainingCasualties
        );
        
        currentArmy[unitType] = Math.max(0, currentCount - unitLosses);
        remainingCasualties -= unitLosses;
      }
    }

    // If we still have remaining casualties to apply, remove them randomly
    while (remainingCasualties > 0) {
      const availableTypes = unitTypes.filter(type => (currentArmy[type] || 0) > 0);
      if (availableTypes.length === 0) break;
      
      const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      currentArmy[randomType] = Math.max(0, (currentArmy[randomType] || 0) - 1);
      remainingCasualties--;
    }

    // Update the army points in storage
    await storage.updateStudentArmyPoints(studentId, {
      castle: currentArmy.castle || 0,
      cannon: currentArmy.cannon || 0,
      knight: currentArmy.knight || 0,
      infantry: currentArmy.infantry || 0,
      archer: currentArmy.archer || 0
    });
  }

  // Get leaderboard data
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      const leaderboard = [];

      for (const student of students) {
        const armyPoints = await storage.getStudentArmyPoints(student.id);
        const battles = await storage.getStudentBattleResults(student.id);
        
        const totalPoints = armyPoints 
          ? armyPoints.castle + armyPoints.cannon + armyPoints.knight + 
            armyPoints.infantry + armyPoints.archer
          : 0;
        
        const victories = battles.filter(b => b.victory).length;

        leaderboard.push({
          student,
          totalPoints,
          victories,
          totalBattles: battles.length,
        });
      }

      // Don't sort on server - let frontend handle sorting
      // This allows proper sorting by victories or units as needed
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Update student avatar
  app.put('/api/students/:id/avatar', async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }

      const { avatar } = req.body;
      if (!avatar) {
        return res.status(400).json({ error: 'Avatar data is required' });
      }

      const updatedStudent = await storage.updateStudentAvatar(studentId, avatar);
      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student avatar:', error);
      res.status(500).json({ error: 'Failed to update avatar' });
    }
  });

  // Get student dashboard data
  app.get('/api/students/:id/dashboard', async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }

      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const armyPoints = await storage.getStudentArmyPoints(studentId);
      const battleResults = await storage.getStudentBattleResults(studentId);
      const achievements = await storage.getStudentAchievements(studentId);
      const questionHistory = await storage.getStudentQuestionHistory(studentId);

      // Calculate stats
      const totalBattles = battleResults.length;
      const victories = battleResults.filter(b => b.victory).length;
      const winRate = totalBattles > 0 ? Math.round((victories / totalBattles) * 100) : 0;
      const totalPower = armyPoints ? 
        armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer : 0;
      
      const questionsAnswered = questionHistory.length;
      const correctAnswers = questionHistory.filter(q => q.isCorrect).length;
      const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Sort by most recent first
      const sortedHistory = [...questionHistory].sort((a, b) => b.id - a.id);
      
      for (let i = 0; i < sortedHistory.length; i++) {
        if (sortedHistory[i].isCorrect) {
          if (i === 0) currentStreak++;
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          if (i === 0) currentStreak = 0;
          tempStreak = 0;
        }
      }

      const stats = {
        totalBattles,
        victories,
        winRate,
        totalPower,
        questionsAnswered,
        correctAnswers,
        accuracy,
        currentStreak,
        longestStreak
      };

      const dashboardData = {
        student,
        armyPoints: armyPoints || {
          id: 0,
          studentId,
          castle: 0,
          cannon: 0,
          knight: 0,
          infantry: 0,
          archer: 0
        },
        battleResults,
        achievements,
        questionHistory,
        stats
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // Analytics endpoints for student progress reports
  app.get("/api/analytics/student-progress", async (req, res) => {
    try {
      const { class: className, timeframe } = req.query;
      
      const students = await storage.getAllStudents();
      const progressData = [];

      for (const student of students) {
        if (className && className !== 'All' && student.className !== className) {
          continue;
        }

        const armyPoints = await storage.getStudentArmyPoints(student.id);
        const battleResults = await storage.getStudentBattleResults(student.id);
        const questionHistory = await storage.getStudentQuestionHistory(student.id);

        // Calculate statistics
        const totalBattles = battleResults.length;
        const victories = battleResults.filter(b => b.victory).length;
        const winRate = totalBattles > 0 ? Math.round((victories / totalBattles) * 100) : 0;
        
        const questionsAnswered = questionHistory.length;
        const correctAnswers = questionHistory.filter(q => q.isCorrect).length;
        const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

        // Calculate streaks
        const sortedQuestions = questionHistory.sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (const question of sortedQuestions) {
          if (question.isCorrect) {
            tempStreak++;
            if (currentStreak === 0) currentStreak = tempStreak;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            if (currentStreak === 0) break;
            tempStreak = 0;
          }
        }

        // Calculate category performance
        const allQuestions = await storage.getAllEnglishQuestions();
        const categories = {
          vocabulary: { correct: 0, total: 0 },
          grammar: { correct: 0, total: 0 },
          reading: { correct: 0, total: 0 }
        };

        for (const question of questionHistory) {
          const questionInfo = allQuestions.find(q => q.id === question.questionId);
          
          if (questionInfo) {
            const category = questionInfo.category as keyof typeof categories;
            if (categories[category]) {
              categories[category].total++;
              if (question.isCorrect) {
                categories[category].correct++;
              }
            }
          }
        }

        // Calculate engagement metrics
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const battlesThisWeek = battleResults.filter(b => new Date(b.createdAt) >= weekAgo).length;
        const questionsThisWeek = questionHistory.filter(q => new Date(q.answeredAt) >= weekAgo).length;
        
        const engagementScore = Math.min(100, (battlesThisWeek * 20) + (questionsThisWeek * 2));
        
        const totalPower = armyPoints ? 
          armyPoints.castle + armyPoints.cannon + armyPoints.knight + armyPoints.infantry + armyPoints.archer : 0;

        const lastActive = questionHistory.length > 0 || battleResults.length > 0 
          ? Math.max(
              questionHistory.length > 0 ? new Date(questionHistory[questionHistory.length - 1].answeredAt).getTime() : 0,
              battleResults.length > 0 ? new Date(battleResults[battleResults.length - 1].createdAt).getTime() : 0
            )
          : new Date().getTime();

        progressData.push({
          student: {
            id: student.id,
            name: student.name,
            className: student.className,
            avatar: student.avatar
          },
          stats: {
            totalBattles,
            victories,
            winRate,
            totalPower,
            questionsAnswered,
            correctAnswers,
            accuracy,
            currentStreak,
            longestStreak,
            lastActive: new Date(lastActive).toISOString()
          },
          trends: {
            battlesThisWeek,
            accuracyTrend: accuracy > 70 ? 1 : accuracy < 50 ? -1 : 0,
            engagementScore,
            improvementRate: accuracy > 60 ? 1 : -1
          },
          categories
        });
      }

      res.json(progressData);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  app.get("/api/analytics/class-overview", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      const classes = Array.from(new Set(students.map(s => s.className)));
      const classAnalytics = [];

      for (const className of classes) {
        const classStudents = students.filter(s => s.className === className);
        const studentCount = classStudents.length;
        
        let totalAccuracy = 0;
        let totalBattles = 0;
        let totalEngagement = 0;
        const topPerformers = [];
        const strugglingStudents = [];

        for (const student of classStudents) {
          const questionHistory = await storage.getStudentQuestionHistory(student.id);
          const battleResults = await storage.getStudentBattleResults(student.id);
          
          const questionsAnswered = questionHistory.length;
          const correctAnswers = questionHistory.filter(q => q.isCorrect).length;
          const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
          
          totalAccuracy += accuracy;
          totalBattles += battleResults.length;
          
          const engagement = Math.min(100, (battleResults.length * 5) + (questionsAnswered * 2));
          totalEngagement += engagement;

          if (accuracy >= 80) {
            topPerformers.push({
              name: student.name,
              metric: 'accuracy',
              value: Math.round(accuracy)
            });
          }

          if (accuracy < 60 || engagement < 40) {
            strugglingStudents.push({
              name: student.name,
              issue: accuracy < 60 ? 'Low accuracy' : 'Low engagement',
              suggestion: accuracy < 60 ? 'Additional practice needed' : 'Encourage daily participation'
            });
          }
        }

        const averageAccuracy = studentCount > 0 ? totalAccuracy / studentCount : 0;
        const averageEngagement = studentCount > 0 ? totalEngagement / studentCount : 0;

        // Generate weekly progress data
        const weeklyProgress = [];
        for (let i = 4; i >= 0; i--) {
          const weekDate = new Date();
          weekDate.setDate(weekDate.getDate() - (i * 7));
          weeklyProgress.push({
            week: weekDate.toISOString().split('T')[0],
            accuracy: Math.round(averageAccuracy + (Math.random() - 0.5) * 10),
            battles: Math.round(totalBattles / 5 + (Math.random() - 0.5) * 5)
          });
        }

        classAnalytics.push({
          className,
          studentCount,
          averageAccuracy: Math.round(averageAccuracy),
          totalBattles,
          averageEngagement: Math.round(averageEngagement),
          topPerformers: topPerformers.slice(0, 5),
          strugglingStudents: strugglingStudents.slice(0, 5),
          weeklyProgress
        });
      }

      res.json(classAnalytics);
    } catch (error) {
      console.error('Class analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch class analytics' });
    }
  });

  app.post("/api/analytics/generate-report", async (req, res) => {
    try {
      const { className, timeframe, format } = req.body;
      
      const reportData = {
        generatedAt: new Date().toISOString(),
        className,
        timeframe,
        summary: {
          totalStudents: 0,
          averageAccuracy: 0,
          totalBattles: 0,
          improvementRate: 0
        },
        recommendations: [
          "Continue encouraging daily practice for consistent improvement",
          "Focus on reading comprehension exercises for students with <60% accuracy",
          "Implement peer tutoring for struggling students",
          "Celebrate achievements to maintain motivation"
        ]
      };

      res.json({ 
        success: true, 
        reportId: `report_${Date.now()}`,
        data: reportData 
      });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
