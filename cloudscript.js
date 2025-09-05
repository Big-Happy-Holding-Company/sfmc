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
 * GetServerInfo - Debugging function
 */
handlers.GetServerInfo = function(args, context) {
    return {
        timestamp: new Date().toISOString(),
        playFabId: context.currentPlayerId,
        functionExecuted: "GetServerInfo",
        cloudScriptRevision: "1.0.0"
    };
};