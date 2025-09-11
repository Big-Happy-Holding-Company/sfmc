/**
 * PlayFab CloudScript Functions
 * Server-side functions for Mission Control 2050 React application
 * 
 * SECURITY CRITICAL: These functions run on PlayFab servers and cannot be hacked by clients
 */

// =============================================================================
// REFACTOR CONSTANTS & HELPERS
// =============================================================================

const CONSTANTS = {
    // Title Data Batch Keys
    BATCH_KEYS: [
        "officer-tasks-training-batch1.json", "officer-tasks-training-batch2.json",
        "officer-tasks-training-batch3.json", "officer-tasks-training-batch4.json",
        "officer-tasks-training2-batch1.json", "officer-tasks-training2-batch2.json",
        "officer-tasks-training2-batch3.json", "officer-tasks-training2-batch4.json",
        "officer-tasks-training2-batch5.json", "officer-tasks-training2-batch6.json",
        "officer-tasks-training2-batch7.json", "officer-tasks-training2-batch8.json",
        "officer-tasks-training2-batch9.json", "officer-tasks-training2-batch10.json",
        "officer-tasks-evaluation-batch1.json", "officer-tasks-evaluation-batch2.json",
        "officer-tasks-evaluation-batch3.json", "officer-tasks-evaluation-batch4.json",
        "officer-tasks-evaluation2-batch1.json", "officer-tasks-evaluation2-batch2.json"
    ],
    // Player Statistic Names
    STATS: {
        LEVEL_POINTS: "LevelPoints",
        OFFICER_TRACK_POINTS: "OfficerTrackPoints",
        ARC2_EVAL_POINTS: "ARC2EvalPoints",
    },
    // Scoring Parameters
    SCORING: {
        OFFICER_TRACK: {
            BASE_POINTS: 10000,
            SPEED_BONUS: { PER_MINUTE_POINTS: 100, UNDER_MINUTES: 20 },
            EFFICIENCY_BONUS: { PER_ACTION_POINTS: 50, UNDER_ACTIONS: 100 },
        },
        ARC2_EVAL: {
            BASE_POINTS: 25000, FIRST_TRY_BONUS: 5000,
            SPEED_BONUS: { PER_MINUTE_POINTS: 200, UNDER_MINUTES: 30 },
            EFFICIENCY_BONUS: { PER_ACTION_POINTS: 100, UNDER_ACTIONS: 150 },
        },
    },
};

// --- Logging Helpers ---
function logInfo(context, message, extra = {}) {
    const logPayload = { ...context, ...extra };
    log.info(message, logPayload);
}
function logError(context, message, error, extra = {}) {
    const errorPayload = { ...context, ...extra, errorMessage: error.message, stack: error.stack };
    log.error(message, errorPayload);
}

// --- General Utils ---
function nowIso() { return new Date().toISOString(); }
function safeParseJSON(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
}
function assert(condition, message) { if (!condition) throw new Error(message); }
function assertArgs(obj, requiredKeys) {
    for (const key of requiredKeys) {
        assert(obj[key] !== undefined && obj[key] !== null, `Missing required argument: ${key}`);
    }
}

// --- Data Access ---
function getTitleDataJSON(key) { 
    const res = server.GetTitleData({ Keys: [key] });
    return res.Data && res.Data[key] ? safeParseJSON(res.Data[key]) : null;
}
function getPuzzleById(puzzleId, context) {
    for (const key of CONSTANTS.BATCH_KEYS) {
        const puzzles = getTitleDataJSON(key);
        if (puzzles) {
            const cleanPuzzleId = puzzleId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
            for (const puzzle of puzzles) {
                const cleanStoredId = puzzle.id.replace(/^ARC-(TR|T2|EV|E2)-/, '');
                if (puzzle.id === puzzleId || cleanStoredId === cleanPuzzleId) {
                    logInfo(context, `Found puzzle ${puzzleId} in batch ${key}`);
                    return { puzzle, batchKey: key };
                }
            }
        }
    }
    logError(context, `Puzzle ${puzzleId} not found in any batch`, new Error("Puzzle not found"));
    return null;
}
function getPlayerData(playFabId, keys) { return server.GetUserData({ PlayFabId: playFabId, Keys: keys }); }
function updatePlayerData(playFabId, dataObj) { return server.UpdateUserData({ PlayFabId: playFabId, Data: dataObj }); }
function updatePlayerStats(playFabId, statsArray) { return server.UpdatePlayerStatistics({ PlayFabId: playFabId, Statistics: statsArray }); }
function writeEvent(playFabId, eventName, body) { return server.WritePlayerEvent({ PlayFabId: playFabId, EventName: eventName, Body: body }); }

// --- Validation Core ---
function compareSolutions(puzzle, solutions) {
    const failures = [];
    let allCorrect = true;
    if (solutions.length !== puzzle.test.length) {
        return { allCorrect: false, error: `Expected ${puzzle.test.length} solutions, got ${solutions.length}` };
    }
    for (let i = 0; i < puzzle.test.length; i++) {
        if (!arraysEqual(solutions[i], puzzle.test[i].output)) {
            allCorrect = false;
            failures.push({ index: i, expected: puzzle.test[i].output, got: solutions[i] });
        }
    }
    return { allCorrect, failures };
}

// --- Scoring Strategies ---
function speedBonusFor({ time, perMinute, underMinutes }) {
    const timeInMinutes = Math.ceil((time || 0) / 60);
    return timeInMinutes < underMinutes ? (underMinutes - timeInMinutes) * perMinute : 0;
}
function efficiencyBonusFor({ steps, perAction, underActions }) {
    return steps < underActions ? (underActions - steps) * perAction : 0;
}
function officerTrackScore({ timeElapsed, stepCount }) {
    const params = CONSTANTS.SCORING.OFFICER_TRACK;
    const speedBonus = speedBonusFor({ time: timeElapsed, ...params.SPEED_BONUS });
    const efficiencyBonus = efficiencyBonusFor({ steps: stepCount, ...params.EFFICIENCY_BONUS });
    const finalScore = params.BASE_POINTS + speedBonus + efficiencyBonus;
    return { basePoints: params.BASE_POINTS, speedBonus, efficiencyBonus, finalScore };
}
function arc2EvalScore({ timeElapsed, stepCount, attemptNumber }) {
    const params = CONSTANTS.SCORING.ARC2_EVAL;
    const speedBonus = speedBonusFor({ time: timeElapsed, ...params.SPEED_BONUS });
    const efficiencyBonus = efficiencyBonusFor({ steps: stepCount, ...params.EFFICIENCY_BONUS });
    const firstTryBonus = (attemptNumber === 1) ? params.FIRST_TRY_BONUS : 0;
    const finalScore = params.BASE_POINTS + speedBonus + efficiencyBonus + firstTryBonus;
    return { basePoints: params.BASE_POINTS, speedBonus, efficiencyBonus, firstTryBonus, finalScore };
}

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
                message: "Incorrect. Review the examples and try again."
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
            if (a[i][j] != b[i][j]) return false;
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
    
    // Enhanced debug logging
    log.info("=== ValidateARCPuzzle Debug Info ===");
    log.info("Puzzle ID received: " + puzzleId);
    log.info("Solutions count: " + (solutions ? solutions.length : 'undefined'));
    log.info("Time elapsed: " + timeElapsed);
    log.info("Session ID: " + sessionId);
    
    // Input validation
    if (!puzzleId || !solutions || !Array.isArray(solutions)) {
        const error = "Missing required parameters: puzzleId and solutions array";
        log.error("Input validation failed: " + error);
        return {
            success: false,
            error: error
        };
    }

    try {
        // Find puzzle in Title Data batches with enhanced logging
        log.info("Searching for puzzle ID: " + puzzleId);
        const puzzle = findPuzzleInBatches(puzzleId);
        if (!puzzle) {
            log.error("Puzzle not found in Title Data: " + puzzleId);
            return {
                success: false,
                error: `Puzzle ${puzzleId} not found in Title Data`
            };
        }
        
        log.info("Found puzzle in Title Data: " + puzzle.id);
        log.info("Puzzle has " + (puzzle.test ? puzzle.test.length : 0) + " test cases");

        // Validate that user provided correct number of solutions 
        // (should be equal to number of test cases)
        // Most will have only 1 test case, but some will have multiple
        
        const expectedTestCases = puzzle.test ? puzzle.test.length : 0;
        if (solutions.length !== expectedTestCases) {
            return {
                success: false,
                error: `Expected ${expectedTestCases} solutions, got ${solutions.length}`
            };
        }

        // Validate ALL test cases must pass
        // (some puzzles have multiple test cases)
        //  we need to account for this in the validation and inform the user which test case failed
        //  we will also need to modify the response to include which test case failed
        //  we will need to modify the client side to handle this information
        //  THIS IS POSSIBLE THE SOURCE OF THE PROBLEM WE ARE SEEING IN THE CLIENT SIDE!! 

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

        // If puzzle solved, update user progress AND HIGH-SCORE SYSTEM
        if (allCorrect) {
            // Get current officer points and completed puzzles
            const currentUserData = server.GetUserData({
                PlayFabId: context.currentPlayerId,
                Keys: ["completedARCPuzzles", "officerTrackPoints"]
            });

            let completedPuzzles = [];
            if (currentUserData.Data && currentUserData.Data.completedARCPuzzles) {
                try {
                    completedPuzzles = JSON.parse(currentUserData.Data.completedARCPuzzles.Value);
                } catch (e) {
                    completedPuzzles = [];
                }
            }

            let currentOfficerPoints = 0;
            if (currentUserData.Data && currentUserData.Data.officerTrackPoints) {
                currentOfficerPoints = parseInt(currentUserData.Data.officerTrackPoints.Value) || 0;
            }

            // Add puzzle to completed list if not already there
            if (completedPuzzles.indexOf(puzzleId) === -1) {
                completedPuzzles.push(puzzleId);
            }

            // HIGH-SCORE FORMULA (Simple & Rewarding)
            const basePoints = 10000; // High base - everyone wins big!
            
            // Speed Bonus: 100 points per minute under 20 minutes
            const timeInMinutes = Math.ceil((timeElapsed || 0) / 60);
            const speedBonus = timeInMinutes < 20 ? (20 - timeInMinutes) * 100 : 0;
            
            // Efficiency Bonus: Extract step count from events, 50 points per action under 100
            const stepCount = getStepCountFromEvents(context.currentPlayerId, sessionId) || 100;
            const efficiencyBonus = stepCount < 100 ? (100 - stepCount) * 50 : 0;
            
            // Simple session validation (flags but doesn't block)
            validateSession(timeElapsed, stepCount, sessionId, context.currentPlayerId);
            
            const finalScore = basePoints + speedBonus + efficiencyBonus;
            const newOfficerPoints = currentOfficerPoints + finalScore;
            
            // Update Officer Track leaderboard statistic
            server.UpdatePlayerStatistics({
                PlayFabId: context.currentPlayerId,
                Statistics: [
                    { StatisticName: "OfficerTrackPoints", Value: newOfficerPoints }
                ]
            });
            
            // Update user data with new points and completed puzzles
            server.UpdateUserData({
                PlayFabId: context.currentPlayerId,
                Data: {
                    completedARCPuzzles: JSON.stringify(completedPuzzles),
                    officerTrackPoints: newOfficerPoints.toString()
                }
            });

            // Log high-score details for analytics
            server.WritePlayerEvent({
                PlayFabId: context.currentPlayerId,
                EventName: "ARCHighScore",
                Body: {
                    puzzleId: puzzleId,
                    basePoints: basePoints,
                    speedBonus: speedBonus,
                    efficiencyBonus: efficiencyBonus,
                    finalScore: finalScore,
                    newOfficerPoints: newOfficerPoints,
                    timeInMinutes: timeInMinutes,
                    stepCount: stepCount,
                    sessionId: sessionId || "unknown"
                }
            });
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
 * ValidateARC2EvalPuzzle - Premium ARC-2 Evaluation puzzle validation 
 * 
 * Validates ARC-2 evaluation puzzles with PREMIUM HIGH-SCORE SYSTEM for hardest puzzles.
 * These are the most challenging puzzles and deserve massive rewards.
 * 
 * @param {Object} args - Function arguments
 * @param {string} args.puzzleId - ARC puzzle ID (e.g., "ARC-E2-007bbfb7")
 * @param {number[][][]} args.solutions - Array of user solutions, one per test case
 * @param {number} args.timeElapsed - Time taken in seconds
 * @param {number} args.attemptNumber - Attempt number for this puzzle
 * @param {string} [args.sessionId] - Session ID for tracking
 * 
 * @returns {Object} Premium validation result with high scores
 */
handlers.ValidateARC2EvalPuzzle = function(args, context) {
    const { puzzleId, solutions, timeElapsed, attemptNumber, sessionId } = args;
    
    // Input validation
    if (!puzzleId || !solutions || !Array.isArray(solutions)) {
        return {
            success: false,
            error: "Missing required parameters: puzzleId and solutions array"
        };
    }

    try {
        // Find puzzle in Title Data batches (focusing on evaluation2 batches)
        const puzzle = findPuzzleInBatches(puzzleId);
        if (!puzzle) {
            return {
                success: false,
                error: `ARC-2 Evaluation puzzle ${puzzleId} not found in Title Data`
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
            EventName: "ARC2EvalPuzzleAttempt",
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

        // If puzzle solved, PREMIUM HIGH-SCORE SYSTEM
        if (allCorrect) {
            // Get current ARC-2 points and completed puzzles
            const currentUserData = server.GetUserData({
                PlayFabId: context.currentPlayerId,
                Keys: ["completedARC2Puzzles", "arc2EvalPoints"]
            });

            let completedARC2Puzzles = [];
            if (currentUserData.Data && currentUserData.Data.completedARC2Puzzles) {
                try {
                    completedARC2Puzzles = JSON.parse(currentUserData.Data.completedARC2Puzzles.Value);
                } catch (e) {
                    completedARC2Puzzles = [];
                }
            }

            let currentARC2Points = 0;
            if (currentUserData.Data && currentUserData.Data.arc2EvalPoints) {
                currentARC2Points = parseInt(currentUserData.Data.arc2EvalPoints.Value) || 0;
            }

            // Add puzzle to completed list if not already there
            if (completedARC2Puzzles.indexOf(puzzleId) === -1) {
                completedARC2Puzzles.push(puzzleId);
            }

            // PREMIUM HIGH-SCORE FORMULA
            const basePoints = 25000; // Massive base for hardest puzzles!
            
            // Premium Speed Bonus: 200 points per minute under 30 minutes
            const timeInMinutes = Math.ceil((timeElapsed || 0) / 60);
            const speedBonus = timeInMinutes < 30 ? (30 - timeInMinutes) * 200 : 0;
            
            // Premium Efficiency Bonus: 100 points per action under 150
            const stepCount = getStepCountFromEvents(context.currentPlayerId, sessionId) || 150;
            const efficiencyBonus = stepCount < 150 ? (150 - stepCount) * 100 : 0;
            
            // First Try Bonus: Huge reward for getting it right immediately
            const firstTryBonus = (attemptNumber === 1) ? 5000 : 0;
            
            // Simple session validation (flags but doesn't block)
            validateSession(timeElapsed, stepCount, sessionId, context.currentPlayerId);
            
            const finalScore = basePoints + speedBonus + efficiencyBonus + firstTryBonus;
            const newARC2Points = currentARC2Points + finalScore;
            
            // Update separate ARC2EvalPoints statistic
            server.UpdatePlayerStatistics({
                PlayFabId: context.currentPlayerId,
                Statistics: [
                    { StatisticName: "ARC2EvalPoints", Value: newARC2Points }
                ]
            });
            
            // Update user data with new points and completed puzzles
            server.UpdateUserData({
                PlayFabId: context.currentPlayerId,
                Data: {
                    completedARC2Puzzles: JSON.stringify(completedARC2Puzzles),
                    arc2EvalPoints: newARC2Points.toString()
                }
            });

            // Log premium high-score details for analytics
            server.WritePlayerEvent({
                PlayFabId: context.currentPlayerId,
                EventName: "ARC2EvalHighScore",
                Body: {
                    puzzleId: puzzleId,
                    basePoints: basePoints,
                    speedBonus: speedBonus,
                    efficiencyBonus: efficiencyBonus,
                    firstTryBonus: firstTryBonus,
                    finalScore: finalScore,
                    newARC2Points: newARC2Points,
                    timeInMinutes: timeInMinutes,
                    stepCount: stepCount,
                    attemptNumber: attemptNumber,
                    sessionId: sessionId || "unknown"
                }
            });
        }

        return {
            success: true,
            correct: allCorrect,
            timeElapsed: timeElapsed || 0,
            completedAt: new Date().toISOString(),
            premium: true // Flag to indicate this was a premium evaluation puzzle
        };

    } catch (error) {
        log.error("ValidateARC2EvalPuzzle error", error);
        
        return {
            success: false,
            error: "Internal server error during ARC-2 evaluation puzzle validation"
        };
    }
};

/**
 * Get step count from events for bonus calculation
 * Extracts cell_change events from recent player events for the given session
 */
function getStepCountFromEvents(playFabId, sessionId) {
    // Query recent events for this session
    const events = server.GetPlayerEvents({
        PlayFabId: playFabId,
        EventNamespace: "custom.SFMC"
    });
    
    // Count cell_change events in this session
    let stepCount = 0;
    if (events && events.History) {
        for (let event of events.History) {
            if (event.EventName === "SFMC" && 
                event.EventData && 
                event.EventData.sessionId === sessionId &&
                event.EventData.event_type === "cell_change") {
                stepCount++;
            }
        }
    }
    
    return stepCount || 100; // Default to 100 if no data
}

/**
 * Simple session validation for fraud detection
 * 
 * Flags suspicious activity without blocking legitimate solves.
 * Philosophy: Data collection over punishment.
 */
function validateSession(timeElapsed, stepCount, sessionId, playFabId) {
    const flags = [];
    
    // Suspiciously fast (under 30 seconds)
    if (timeElapsed && timeElapsed < 30) {
        flags.push("FAST_SOLVE");
    }
    
    // Too few actions for complex puzzle (under 5 actions)
    if (stepCount && stepCount < 5) {
        flags.push("LOW_ACTION_COUNT");
    }
    
    // Log flags for analysis, don't block scoring
    if (flags.length > 0) {
        server.WritePlayerEvent({
            PlayFabId: playFabId,
            EventName: "SuspiciousSolve",
            Body: {
                flags: flags,
                timeElapsed: timeElapsed,
                stepCount: stepCount,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            }
        });
    }
    
    // Always return true - we don't block, just flag
    return true;
}

/**
 * Find puzzle data from Title Data batches with enhanced debugging
 */
function findPuzzleInBatches(puzzleId) {
    log.info("=== findPuzzleInBatches Debug ===");
    log.info("Looking for puzzle: " + puzzleId);
    
    const batchKeys = getAllBatchKeys();

    log.info("Searching " + batchKeys.length + " batches");
    
    // Search through batches
    for (let i = 0; i < batchKeys.length; i++) {
        try {
            log.info("Checking batch: " + batchKeys[i]);
            const titleDataResponse = server.GetTitleData({ Keys: [batchKeys[i]] });
            
            if (titleDataResponse.Data && titleDataResponse.Data[batchKeys[i]]) {
                // In CloudScript, GetTitleData returns Data[key] directly as a JSON string (no .Value)
                const dataValue = titleDataResponse.Data[batchKeys[i]];
                
                if (dataValue && dataValue !== "undefined") {
                    const puzzles = JSON.parse(dataValue);
                    log.info("Batch " + batchKeys[i] + " has " + puzzles.length + " puzzles");
                    
                    // Look for puzzle in this batch
                    // Flexible puzzle lookup
                    const cleanPuzzleId = puzzleId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
                    for (let j = 0; j < puzzles.length; j++) {
                        const storedId = puzzles[j].id;
                        if (storedId === puzzleId) {
                            log.info(`FOUND EXACT MATCH! Puzzle ${puzzleId} in ${batchKeys[i]}`);
                            return puzzles[j];
                        }
                        
                        const cleanStoredId = storedId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
                        if (cleanStoredId === cleanPuzzleId) {
                            log.info(`FOUND CLEAN ID MATCH! Puzzle ${puzzleId} (as ${cleanStoredId}) in ${batchKeys[i]}`);
                            return puzzles[j];
                        }
                    }
                } else {
                    log.info("Batch " + batchKeys[i] + " has no data or undefined");
                }
            } else {
                log.info("Batch " + batchKeys[i] + " not found in Title Data");
            }
        } catch (batchError) {
            log.error("Error checking batch " + batchKeys[i] + ": " + batchError.message);
            continue;
        }
    }
    
    log.error("Puzzle " + puzzleId + " NOT FOUND in any batch");
    return null; // Puzzle not found
}

/**
 * Get all available batch keys from Title Data
 */
function getAllBatchKeys() {
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

    return batchKeys;
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