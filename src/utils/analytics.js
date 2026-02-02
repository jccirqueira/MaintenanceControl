export const getTeamMetrics = (activities, teams, members) => {
    // Optimization: Create a Member Name -> Team ID map for O(1) lookup
    const memberTeamMap = {};
    members.forEach(m => {
        memberTeamMap[m.name] = m.teamId;
    });

    // Initialize counters for each team
    const metrics = teams.reduce((acc, team) => {
        acc[team.id] = {
            name: team.name,
            total: 0,
            completed: 0,
            delayed: 0,
            color: team.color
        };
        return acc;
    }, {});

    // Add 'Unassigned' bucket
    metrics['unassigned'] = { name: 'Sem Equipe', total: 0, completed: 0, delayed: 0, color: '#94a3b8' };

    // Handle both Array and Object input safely
    const activityList = Array.isArray(activities) ? activities : Object.values(activities);

    activityList.forEach(activity => {
        // O(1) Lookup
        const teamId = memberTeamMap[activity.responsible] || 'unassigned';

        // Safety check if team was deleted but member still has ref
        if (!metrics[teamId]) {
            // Fallback to unassigned if team not found
            metrics['unassigned'].total++;
            return;
        }

        metrics[teamId].total++;
        if (activity.status === 'concluida') metrics[teamId].completed++;

        const isDelayed = new Date(activity.endDate) < new Date() && activity.status !== 'concluida';
        if (isDelayed) metrics[teamId].delayed++;
    });

    return Object.values(metrics).filter(m => m.total > 0);
};

export const getMemberMetrics = (activities, members) => {
    // Initialize counters for each member map for O(1) access
    const metrics = {};
    members.forEach(member => {
        metrics[member.name] = {
            name: member.name,
            total: 0,
            completed: 0,
            delayed: 0,
            color: '#3b82f6'
        };
    });

    // Handle both Array and Object input safely
    const activityList = Array.isArray(activities) ? activities : Object.values(activities);

    activityList.forEach(activity => {
        // Direct O(1) lookup
        if (metrics[activity.responsible]) {
            metrics[activity.responsible].total++;
            if (activity.status === 'concluida') metrics[activity.responsible].completed++;

            const isDelayed = new Date(activity.endDate) < new Date() && activity.status !== 'concluida';
            if (isDelayed) metrics[activity.responsible].delayed++;
        }
    });

    return Object.values(metrics).filter(m => m.total > 0);
};
