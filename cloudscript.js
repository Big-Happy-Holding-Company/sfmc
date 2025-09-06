/**
 * PlayFab CloudScript Functions
 * Server-side functions for Mission Control 2050 React application
 * 
 * SECURITY CRITICAL: These functions run on PlayFab servers and cannot be hacked by clients
 */

// =============================================================================
// VALIDATION FUNCTIONS (SECURITY CRITICAL)
// =============================================================================

/**
 * ValidateTaskSolution - SECURITY CRITICAL
 * 
 * Validates puzzle solutions server-side to prevent client-side cheating.
 * This replaces the hackable client-side validation in both Unity and React.
 * 
 * @param {Object} args - Function arguments
 * @param {string} args.taskId - Task ID to validate against
 * @param {string[][]} args.solution - Player's solution grid
 * @param {number} [args.timeElapsed] - Time taken in seconds
 * @param {number} [args.hintsUsed] - Number of hints used
 * @param {string} [args.sessionId] - Game session ID for logging
 * @param {number} [args.attemptId] - Attempt number for this task
 * 
 * @returns {Object} Validation result with scoring and user data updates
 */
handlers.ValidateTaskSolution = function(args, context) {
    const { taskId, solution, timeElapsed, hintsUsed, sessionId, attemptId } = args;
    
    // Input validation
    if (!taskId || !solution) {
        return {
            success: false,
            error: "Missing required parameters: taskId and solution"
        };
    }

    try {
        // Get task data from Title Data (server-side, unhackable)
        const tasksDataResponse = server.GetTitleData({ Keys: ["tasks.json"] });
        if (!tasksDataResponse.Data || !tasksDataResponse.Data["tasks.json"]) {
            return {
                success: false,
                error: "Task data not found in Title Data"
            };
        }

        const tasks = JSON.parse(tasksDataResponse.Data["tasks.json"]);
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return {
                success: false,
                error: `Task ${taskId} not found`
            };
        }

        // Server-side validation (unhackable)
        const isCorrect = arraysEqual(solution, task.testOutput);
        
        if (!isCorrect) {
            // Log failed attempt
            server.WritePlayerEvent({
                PlayFabId: context.currentPlayerId,
                EventName: "TaskValidation",
                Body: {
                    taskId,
                    result: "incorrect",
                    sessionId: sessionId || "unknown",
                    attemptId: attemptId || 1,
                    timeElapsed: timeElapsed || 0,
                    hintsUsed: hintsUsed || 0
                }
            });

            return {
                success: true,
                correct: false,
                pointsEarned: 0,
                timeBonus: 0,
                hintPenalty: 0,
                totalScore: 0,
                message: "Mission failed. Review the examples and try again."
            };
        }

        // Calculate points with bonuses/penalties (server-side, unhackable)
        let pointsEarned = task.basePoints || 100;
        let timeBonus = 0;
        let hintPenalty = 0;

        // Time bonus calculation (max 30 seconds for bonus, up to 50 bonus points)
        if (timeElapsed && timeElapsed < 30) {
            timeBonus = Math.max(0, Math.floor((30 - timeElapsed) / 5) * 10);
            pointsEarned += timeBonus;
        }

        // Hint penalty calculation (5 points per hint)
        if (hintsUsed && hintsUsed > 0) {
            hintPenalty = hintsUsed * 5;
            pointsEarned = Math.max(0, pointsEarned - hintPenalty);
        }

        // Get current player data
        const playerDataResponse = server.GetUserData({
            PlayFabId: context.currentPlayerId,
            Keys: ["totalPoints", "completedMissions", "rank", "rankLevel"]
        });

        const currentTotalPoints = parseInt(playerDataResponse.Data.totalPoints?.Value || "0");
        const currentCompletedMissions = parseInt(playerDataResponse.Data.completedMissions?.Value || "0");
        const currentRankLevel = parseInt(playerDataResponse.Data.rankLevel?.Value || "1");

        // Calculate new totals
        const newTotalPoints = currentTotalPoints + pointsEarned;
        const newCompletedMissions = currentCompletedMissions + 1;
        const newRankLevel = Math.min(Math.floor(newTotalPoints / 1000) + 1, 11);
        const newRank = getRankName(newRankLevel);
        const rankUp = newRankLevel > currentRankLevel;

        // Update user data atomically
        server.UpdateUserData({
            PlayFabId: context.currentPlayerId,
            Data: {
                totalPoints: newTotalPoints.toString(),
                completedMissions: newCompletedMissions.toString(),
                rankLevel: newRankLevel.toString(),
                rank: newRank,
                lastTaskCompleted: taskId,
                lastCompletionTime: new Date().toISOString()
            }
        });

        // Update leaderboard statistics atomically
        server.UpdatePlayerStatistics({
            PlayFabId: context.currentPlayerId,
            Statistics: [
                { StatisticName: "LevelPoints", Value: newTotalPoints }
            ]
        });

        // Log successful completion
        server.WritePlayerEvent({
            PlayFabId: context.currentPlayerId,
            EventName: "TaskValidation",
            Body: {
                taskId,
                result: "correct",
                pointsEarned,
                timeBonus,
                hintPenalty,
                newTotalPoints,
                rankUp,
                newRank,
                sessionId: sessionId || "unknown",
                attemptId: attemptId || 1,
                timeElapsed: timeElapsed || 0,
                hintsUsed: hintsUsed || 0
            }
        });

        return {
            success: true,
            correct: true,
            pointsEarned,
            timeBonus,
            hintPenalty,
            totalScore: newTotalPoints,
            newRank: rankUp ? newRank : undefined,
            rankUp,
            message: rankUp 
                ? `Outstanding! Promoted to ${newRank}! Mission accomplished.`
                : `Excellent work! Mission accomplished.`,
            newTotalPoints
        };

    } catch (error) {
        // Log error for debugging
        log.error("ValidateTaskSolution error", error);
        
        return {
            success: false,
            error: "Internal server error during validation"
        };
    }
};

// =============================================================================
// ANONYMOUS NAME GENERATION
// =============================================================================

/**
 * GenerateAnonymousName
 * Generates creative anonymous names for new players
 * Matches Unity's implementation
 */
handlers.GenerateAnonymousName = function(args, context) {
    const adjectives = [
        "Stellar", "Cosmic", "Quantum", "Galactic", "Nebula", "Solar", 
        "Lunar", "Orbital", "Plasma", "Photon", "Neutron", "Alpha",
        "Delta", "Omega", "Prime", "Nova", "Pulsar", "Quasar",
        "Asteroid", "Comet", "Meteor", "Phoenix", "Vortex", "Cipher"
    ];

    const nouns = [
        "Explorer", "Navigator", "Commander", "Pilot", "Engineer", "Scientist",
        "Guardian", "Sentinel", "Operative", "Specialist", "Technician", "Agent",
        "Ranger", "Scout", "Voyager", "Pioneer", "Wanderer", "Seeker",
        "Hunter", "Tracker", "Observer", "Monitor", "Analyst", "Decoder"
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;

    const generatedName = `${adjective}${noun}${number}`;

    // Log name generation
    server.WritePlayerEvent({
        PlayFabId: context.currentPlayerId,
        EventName: "AnonymousNameGenerated",
        Body: {
            generatedName,
            timestamp: new Date().toISOString()
        }
    });

    return { newName: generatedName };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Compare 2D arrays for equality
 */
function arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
        if (!Array.isArray(a[i]) || !Array.isArray(b[i])) return false;
        if (a[i].length !== b[i].length) return false;
        
        for (let j = 0; j < a[i].length; j++) {
            if (a[i][j] !== b[i][j]) return false;
        }
    }
    return true;
}

/**
 * Get rank name based on rank level (matches Unity and React)
 */
function getRankName(rankLevel) {
    const ranks = [
        'Specialist 1',      // Level 1
        'Specialist 2',      // Level 2  
        'Specialist 3',      // Level 3
        'Specialist 4',      // Level 4
        'Corporal',          // Level 5
        'Sergeant',          // Level 6
        'Staff Sergeant',    // Level 7
        'Technical Sergeant', // Level 8
        'Master Sergeant',   // Level 9
        'Senior Master Sergeant', // Level 10
        'Chief Master Sergeant'   // Level 11+
    ];
    return ranks[rankLevel - 1] || 'Chief Master Sergeant';
}

// =============================================================================
// DEBUGGING AND MAINTENANCE
// =============================================================================

/**
 * ValidateARCPuzzle - ARC puzzle validation for Officer Track
 * 
 * Validates ARC puzzles with multiple test cases. ALL test cases must pass.
 * 
 * @param {Object} args - Function arguments
 * @param {string} args.puzzleId - ARC puzzle ID (e.g., "ARC-TR-007bbfb7")
 * @param {number[][][]} args.solutions - Array of user solutions, one per test case
 * @param {number} args.timeElapsed - Time taken in seconds
 * @param {number} args.attemptNumber - Attempt number for this puzzle
 * @param {string} [args.sessionId] - Session ID for tracking
 * 
 * @returns {Object} Simple validation result
 */
handlers.ValidateARCPuzzle = function(args, context) {
    const { puzzleId, solutions, timeElapsed, attemptNumber, sessionId } = args;
    
    // Input validation
    if (!puzzleId || !solutions || !Array.isArray(solutions)) {
        return {
            success: false,
            error: "Missing required parameters: puzzleId and solutions array"
        };
    }

    try {
        // Find puzzle in Title Data batches
        const puzzle = findPuzzleInBatches(puzzleId);
        if (!puzzle) {
            return {
                success: false,
                error: `Puzzle ${puzzleId} not found in Title Data`
            };
        }

        // Validate that user provided correct number of solutions
        const expectedTestCases = puzzle.test ? puzzle.test.length : 0;
        if (solutions.length !== expectedTestCases) {
            return {
                success: false,
                error: `Expected ${expectedTestCases} solutions, got ${solutions.length}`
            };
        }

        // Validate ALL test cases must pass
        let allCorrect = true;
        for (let i = 0; i < puzzle.test.length; i++) {
            const expectedOutput = puzzle.test[i].output;
            const userSolution = solutions[i];
            
            if (!arraysEqual(userSolution, expectedOutput)) {
                allCorrect = false;
                break;
            }
        }

        // Record attempt in PlayFab events
        server.WritePlayerEvent({
            PlayFabId: context.currentPlayerId,
            EventName: "ARCPuzzleAttempt",
            Body: {
                puzzleId: puzzleId,
                correct: allCorrect,
                timeElapsed: timeElapsed || 0,
                attemptNumber: attemptNumber || 1,
                sessionId: sessionId || "unknown",
                testCases: expectedTestCases,
                completedAt: new Date().toISOString()
            }
        });

        // If puzzle solved, update user progress
        if (allCorrect) {
            const currentUserData = server.GetUserData({
                PlayFabId: context.currentPlayerId,
                Keys: ["completedARCPuzzles"]
            });

            let completedPuzzles = [];
            if (currentUserData.Data && currentUserData.Data.completedARCPuzzles) {
                try {
                    completedPuzzles = JSON.parse(currentUserData.Data.completedARCPuzzles.Value);
                } catch (e) {
                    completedPuzzles = [];
                }
            }

            // Add puzzle to completed list if not already there
            if (completedPuzzles.indexOf(puzzleId) === -1) {
                completedPuzzles.push(puzzleId);
                
                server.UpdateUserData({
                    PlayFabId: context.currentPlayerId,
                    Data: {
                        completedARCPuzzles: JSON.stringify(completedPuzzles)
                    }
                });
            }
        }

        return {
            success: true,
            correct: allCorrect,
            timeElapsed: timeElapsed || 0,
            completedAt: new Date().toISOString()
        };

    } catch (error) {
        log.error("ValidateARCPuzzle error", error);
        
        return {
            success: false,
            error: "Internal server error during puzzle validation"
        };
    }
};

/**
 * Find puzzle data from Title Data batches
 */
function findPuzzleInBatches(puzzleId) {
    // Define batch keys to search
    const batchKeys = [
        // Training batches
        "officer-tasks-training-batch1.json",
        "officer-tasks-training-batch2.json", 
        "officer-tasks-training-batch3.json",
        "officer-tasks-training-batch4.json",
        // Training2 batches  
        "officer-tasks-training2-batch1.json",
        "officer-tasks-training2-batch2.json",
        "officer-tasks-training2-batch3.json",
        "officer-tasks-training2-batch4.json",
        "officer-tasks-training2-batch5.json",
        "officer-tasks-training2-batch6.json",
        "officer-tasks-training2-batch7.json",
        "officer-tasks-training2-batch8.json",
        "officer-tasks-training2-batch9.json",
        "officer-tasks-training2-batch10.json",
        // Evaluation batches
        "officer-tasks-evaluation-batch1.json",
        "officer-tasks-evaluation-batch2.json",
        "officer-tasks-evaluation-batch3.json", 
        "officer-tasks-evaluation-batch4.json",
        // Evaluation2 batches
        "officer-tasks-evaluation2-batch1.json",
        "officer-tasks-evaluation2-batch2.json"
    ];

    // Search through batches
    for (let i = 0; i < batchKeys.length; i++) {
        try {
            const titleDataResponse = server.GetTitleData({ Keys: [batchKeys[i]] });
            
            if (titleDataResponse.Data && titleDataResponse.Data[batchKeys[i]]) {
                const dataValue = titleDataResponse.Data[batchKeys[i]].Value;
                
                if (dataValue && dataValue !== "undefined") {
                    const puzzles = JSON.parse(dataValue);
                    
                    // Look for puzzle in this batch
                    for (let j = 0; j < puzzles.length; j++) {
                        if (puzzles[j].id === puzzleId) {
                            return puzzles[j];
                        }
                    }
                }
            }
        } catch (batchError) {
            // Continue searching other batches
            continue;
        }
    }
    
    return null; // Puzzle not found
}

/**
 * GetServerInfo - Debugging function
 */
handlers.GetServerInfo = function(args, context) {
    return {
        timestamp: new Date().toISOString(),
        playFabId: context.currentPlayerId,
        functionExecuted: "GetServerInfo",
        cloudScriptRevision: "1.1.0"
    };
};