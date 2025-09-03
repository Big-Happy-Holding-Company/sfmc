// PlayFab CloudScript function for secure validation
// This would run on PlayFab servers, not in the browser

handlers.ValidateTaskSolution = function(args, context) {
    // Get task data from Title Data
    const titleData = server.GetTitleData({
        Keys: ["tasks.json"]
    });
    
    if (!titleData.Data || !titleData.Data["tasks.json"]) {
        return { success: false, error: "Tasks not found" };
    }
    
    const tasks = JSON.parse(titleData.Data["tasks.json"]);
    const task = tasks.find(t => t.id === args.taskId);
    
    if (!task) {
        return { success: false, error: "Task not found" };
    }
    
    // SERVER-SIDE validation (secure)
    const isCorrect = JSON.stringify(args.solution) === JSON.stringify(task.testOutput);
    
    if (!isCorrect) {
        return { 
            success: true, 
            correct: false, 
            message: "Incorrect solution" 
        };
    }
    
    // SERVER-SIDE scoring calculation (secure)
    let points = task.basePoints;
    let timeBonus = 0;
    let hintPenalty = 0;
    
    // Time bonus calculation
    if (args.timeElapsed && args.timeElapsed < 60) {
        timeBonus = Math.max(0, Math.floor((60 - args.timeElapsed) / 10) * 10);
        points += timeBonus;
    }
    
    // Hint penalty
    if (args.hintsUsed > 0) {
        hintPenalty = args.hintsUsed * 5;
        points = Math.max(1, points - hintPenalty);
    }
    
    // Update player data securely
    const currentUserData = server.GetUserData({
        PlayFabId: context.currentPlayerId,
        Keys: ["totalPoints", "completedMissions", "rankLevel", "rank"]
    });
    
    const currentPoints = parseInt(currentUserData.Data.totalPoints?.Value || "0");
    const currentMissions = parseInt(currentUserData.Data.completedMissions?.Value || "0");
    
    const newTotalPoints = currentPoints + points;
    const newCompletedMissions = currentMissions + 1;
    
    // Calculate rank
    const newRankLevel = Math.floor(newTotalPoints / 100) + 1;
    const ranks = [
        'Specialist 1', 'Specialist 2', 'Specialist 3', 'Specialist 4',
        'Corporal', 'Sergeant', 'Staff Sergeant', 'Technical Sergeant',
        'Master Sergeant', 'Senior Master Sergeant', 'Chief Master Sergeant'
    ];
    const newRank = ranks[Math.min(newRankLevel - 1, ranks.length - 1)] || 'Chief Master Sergeant';
    
    // Update player data
    server.UpdateUserData({
        PlayFabId: context.currentPlayerId,
        Data: {
            totalPoints: newTotalPoints.toString(),
            completedMissions: newCompletedMissions.toString(),
            rankLevel: newRankLevel.toString(),
            rank: newRank
        }
    });
    
    // Update leaderboard
    server.UpdatePlayerStatistics({
        PlayFabId: context.currentPlayerId,
        Statistics: [{
            StatisticName: "LevelPoints",
            Value: newTotalPoints
        }]
    });
    
    return {
        success: true,
        correct: true,
        pointsEarned: points,
        timeBonus: timeBonus,
        hintPenalty: hintPenalty,
        totalPoints: newTotalPoints,
        newRank: newRank,
        rankUp: newRankLevel > parseInt(currentUserData.Data.rankLevel?.Value || "1"),
        message: "Excellent work! Mission accomplished."
    };
};