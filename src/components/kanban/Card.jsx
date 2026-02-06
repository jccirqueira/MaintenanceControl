import { Draggable } from '@hello-pangea/dnd';
import { Clock, AlertTriangle, User } from 'lucide-react';

export default function Card({ activity, index, onClick }) {
    // Simple check for delay
    const isDelayed = new Date(activity.endDate) < new Date() && activity.status !== 'Concluída';

    return (
        <Draggable draggableId={activity.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="kanban-card"
                    style={{
                        ...provided.draggableProps.style,
                        borderLeft: isDelayed ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)',
                    }}
                    onClick={() => onClick(activity)}
                >
                    <div className="kanban-card-header">
                        <span className="kanban-card-code">{activity.code}</span>
                        {isDelayed && <AlertTriangle size={16} color="var(--color-danger)" />}
                    </div>

                    <h4 className="kanban-card-title">{activity.description}</h4>

                    <div className="kanban-card-meta">
                        <Clock size={14} />
                        <span>
                            {activity.startDate ? new Date(activity.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : '?'} - {activity.endDate ? new Date(activity.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : '?'}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '6px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${activity.percentual || 0}%`,
                                backgroundColor: (activity.percentual === 100) ? 'var(--color-success)' : 'var(--color-primary)',
                                height: '100%',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                    {(activity.percentual > 0) && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: (activity.percentual === 100) ? 'var(--color-success)' : 'var(--color-primary)', marginBottom: '0.5rem', textAlign: 'right' }}>
                            {activity.percentual}%
                        </div>
                    )}

                    <div className="kanban-card-footer">
                        <div className="kanban-card-avatar">
                            <User size={14} />
                        </div>
                        <span className="kanban-card-responsible">{activity.responsible}</span>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
