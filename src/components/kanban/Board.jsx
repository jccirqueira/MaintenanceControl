import { useState, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useActivities } from '../../contexts/ActivitiesContext';
import { useTeam } from '../../contexts/TeamContext';

export default function Board({ viewMode = 'general', selectedTeamId, selectedMemberId }) {
    const { boardData: data, updateBoard: setData, moveActivity } = useActivities();
    const { user } = useAuth();
    const { teams, members } = useTeam();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingMove, setPendingMove] = useState(null);
    const [justification, setJustification] = useState('');

    // Filter Data
    const displayData = useMemo(() => {
        if (viewMode === 'general') return data;

        // Clone columns to avoid mutating state directly (shallow clone of structure)
        const newColumns = {};
        Object.keys(data.columns).forEach(colId => {
            newColumns[colId] = { ...data.columns[colId], activityIds: [] };
        });

        // Filter activities
        const relevantActivities = [];

        // Helper to check if activity matches filter
        const matchesFilter = (activity) => {
            if (viewMode === 'team' && selectedTeamId) {
                const teamMemberNames = members
                    .filter(m => m.teamId === selectedTeamId)
                    .map(m => m.name);
                return teamMemberNames.includes(activity.responsible);
            }
            if (viewMode === 'member' && selectedMemberId) {
                const member = members.find(m => m.id === selectedMemberId);
                return member ? activity.responsible === member.name : false;
            }
            return true;
        };

        // Rebuild columns with partial lists
        Object.keys(data.columns).forEach(colId => {
            const originalIds = data.columns[colId].activityIds;
            const filteredIds = originalIds.filter(id => {
                const activity = data.activities[id];
                return activity && matchesFilter(activity);
            });
            // Performance Limit: Only show first 50 items per column
            // TODO: Implement "Load More" or proper virtualization later if needed.
            // For now, this stops the crash.
            newColumns[colId].activityIds = filteredIds.slice(0, 50);

            // Store total count for UI display if needed (hacky, but effective)
            newColumns[colId].totalCount = filteredIds.length;
        });

        return {
            ...data,
            columns: newColumns
        };
    }, [data, viewMode, selectedTeamId, selectedMemberId, members]);

    const executeMove = (moveDetails) => {
        const { source, destination, draggableId } = moveDetails;

        // Same column move (Reordering)
        // Since we don't have persistence for order within column yet, and 'setData' is not available in context,
        // we will disable reordering for now to prevent UI glitches.
        if (source.droppableId === destination.droppableId) {
            return;
        }

        // Cross-column move (Status Change)
        // This works for both 'general' and filtered views
        moveActivity(draggableId, source.droppableId, destination.droppableId);
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Prevent reordering in filtered mode
        if (viewMode !== 'general' && destination.droppableId === source.droppableId) {
            return;
        }

        // Check for Justification Rules
        const targetColumn = destination.droppableId;
        if (targetColumn === 'aguardando_materiais' || targetColumn === 'pausada') {
            setPendingMove(result);
            setJustification('');
            setIsModalOpen(true);
            return;
        }

        executeMove(result);
    };

    const confirmMove = () => {
        if (!justification.trim()) {
            alert("A justificativa é obrigatória.");
            return;
        }
        executeMove(pendingMove);
        setIsModalOpen(false);
        setPendingMove(null);
    };

    const cancelMove = () => {
        setIsModalOpen(false);
        setPendingMove(null);
    };

    const handleCardClick = (activity) => {
        alert(`Detalhes da atividade: ${activity.code}\n${activity.description}`);
    };

    if (!displayData) return <div>Carregando...</div>;

    return (
        <>
            <div style={{ height: 'calc(100vh - 150px)', overflowX: 'auto', overflowY: 'hidden' }}>
                <DragDropContext onDragEnd={onDragEnd}>
                    <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
                        {displayData.columnOrder.map((columnId) => {
                            const column = displayData.columns[columnId];
                            const activities = column.activityIds.map((taskId) => displayData.activities[taskId]);

                            return <Column key={column.id} column={column} activities={activities} onCardClick={handleCardClick} />;
                        })}
                    </div>
                </DragDropContext>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={cancelMove}
                title="Justificativa Necessária"
                footer={
                    <>
                        <button className="btn btn-outline" onClick={cancelMove}>Cancelar</button>
                        <button className="btn btn-primary" onClick={confirmMove}>Confirmar</button>
                    </>
                }
            >
                <p style={{ marginBottom: '1rem' }}>Para mover o card para <strong>{pendingMove?.destination?.droppableId === 'pausada' ? 'Pausada' : 'Aguardando Materiais'}</strong>, é necessário informar o motivo.</p>
                <textarea
                    className="input"
                    style={{ width: '100%', height: '100px', padding: '0.5rem' }}
                    placeholder="Descreva o motivo..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                />
            </Modal>
        </>
    );
}
