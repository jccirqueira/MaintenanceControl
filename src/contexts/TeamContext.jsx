import { createContext, useContext, useState, useEffect } from 'react';

const TeamContext = createContext(null);

const initialTeams = [
    { id: 't1', name: 'Gestão', color: '#1e293b' },
    { id: 't2', name: 'Elétrica', color: '#eab308' },
    { id: 't3', name: 'Mecânica', color: '#3b82f6' },
];

const initialMembers = [
    { id: 'm1', name: 'Daniel Nunes', role: 'Coordenador', teamId: 't1' },
    { id: 'm2', name: 'João Silva', role: 'Técnico', teamId: 't2' },
    { id: 'm3', name: 'Maria Santos', role: 'Técnica', teamId: 't2' },
    { id: 'm4', name: 'Pedro Souza', role: 'Mecânico', teamId: 't3' },
];

export const TeamProvider = ({ children }) => {
    // Initialize from localStorage or use defaults
    const [teams, setTeams] = useState(() => {
        const saved = localStorage.getItem('mc_teams');
        return saved ? JSON.parse(saved) : initialTeams;
    });

    const [members, setMembers] = useState(() => {
        const saved = localStorage.getItem('mc_members');
        if (saved) return JSON.parse(saved);

        // Add default credentials to initial members if seeding
        return initialMembers.map(m => ({
            ...m,
            username: m.name.toLowerCase().replace(' ', '.'),
            password: '123' // Default password for initial users
        }));
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('mc_teams', JSON.stringify(teams));
    }, [teams]);

    useEffect(() => {
        localStorage.setItem('mc_members', JSON.stringify(members));
    }, [members]);

    const addTeam = (name, color) => {
        const newTeam = {
            id: `t-${Date.now()}`,
            name,
            color: color || '#64748b'
        };
        setTeams([...teams, newTeam]);
    };

    const removeTeam = (teamId) => {
        setTeams(teams.filter(t => t.id !== teamId));
    };

    const addMember = (name, role, teamId, photo, accessLevel, username, password) => {
        const newMember = {
            id: `m-${Date.now()}`,
            name,
            role,
            teamId,
            photo: photo || null,
            accessLevel: accessLevel || 'user',
            username: username || '',
            password: password || ''
        };
        setMembers([...members, newMember]);
    };

    const editMember = (id, updatedData) => {
        setMembers(members.map(m => m.id === id ? { ...m, ...updatedData } : m));
    };

    const removeMember = (memberId) => {
        setMembers(members.filter(m => m.id !== memberId));
    };

    return (
        <TeamContext.Provider value={{ teams, members, addTeam, removeTeam, addMember, editMember, removeMember }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => useContext(TeamContext);
