
import { useState, useEffect } from 'react';
import { useActivities } from '../contexts/ActivitiesContext';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import Board from '../components/kanban/Board';
import { Users, User, LayoutGrid, Filter } from 'lucide-react';
import ActivityFormModal from '../components/activities/ActivityFormModal';
import { AREAS } from '../constants/areas';

export default function Kanban() {
    const { boardData, fetchActivities } = useActivities();
    const { teams, members } = useTeam();
    const { user } = useAuth();

    // View State
    const [viewMode, setViewMode] = useState('general'); // general, team, member
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedArea, setSelectedArea] = useState('Todas'); // New Area State

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Determine effective filters based on Role
    const effectiveViewMode = user?.role === 'user' ? 'member' : viewMode;
    const effectiveSelectedMemberId = user?.role === 'user'
        ? members.find(m => m.name === user.name)?.id || ''
        : selectedMemberId;

    useEffect(() => {
        // Initialize filters if data available
        if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
        if (members.length > 0 && !selectedMemberId && user?.role !== 'user') setSelectedMemberId(members[0].id);
    }, [teams, members, selectedTeamId, selectedMemberId, user]);

    // Fetch activities when Area changes (Admin only or Global)
    useEffect(() => {
        // Debounce or just fetch? Effect runs on change.
        // Always reset to page 0 when filtering
        fetchActivities(0, { area: selectedArea });
    }, [selectedArea]);



    const handleSaveActivity = () => {
        setIsModalOpen(false);
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex items-center gap-4">
                    <h1>Gestão de Serviços</h1>

                    {/* Area Filter UI */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <Filter size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Áreas:</span>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="bg-transparent border-none text-sm focus:outline-none min-w-[200px]"
                            style={{ outline: 'none' }}
                        >
                            {AREAS.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>
                </div>


            </div>

            {/* View Switcher Controls - Only show for Admin */}
            {user?.role === 'admin' && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '4px' }}>
                        <button
                            className={`btn ${viewMode === 'general' ? 'btn-white' : ''} `}
                            style={{
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                backgroundColor: viewMode === 'general' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'general' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                            onClick={() => setViewMode('general')}
                        >
                            <LayoutGrid size={16} style={{ marginRight: '8px' }} /> Geral
                        </button>
                        <button
                            className={`btn ${viewMode === 'team' ? 'btn-white' : ''} `}
                            style={{
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                backgroundColor: viewMode === 'team' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                            onClick={() => setViewMode('team')}
                        >
                            <Users size={16} style={{ marginRight: '8px' }} /> Por Equipe
                        </button>
                        <button
                            className={`btn ${viewMode === 'member' ? 'btn-white' : ''} `}
                            style={{
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                backgroundColor: viewMode === 'member' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'member' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                            onClick={() => setViewMode('member')}
                        >
                            <User size={16} style={{ marginRight: '8px' }} /> Por Membro
                        </button>
                    </div>

                    {viewMode === 'team' && (
                        <select
                            className="input"
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    )}

                    {viewMode === 'member' && (
                        <select
                            className="input"
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            <Board
                boardData={boardData}
                viewMode={effectiveViewMode}
                selectedTeamId={selectedTeamId}
                selectedMemberId={effectiveSelectedMemberId}
            />

            <ActivityFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
