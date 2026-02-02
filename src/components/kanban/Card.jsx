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
                    style={{
                        ...provided.draggableProps.style,
                        backgroundColor: 'white',
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        borderRadius: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        borderLeft: isDelayed ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)',
                        cursor: 'grab'
                    }}
                    onClick={() => onClick(activity)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>{activity.code}</span>
                        {isDelayed && <AlertTriangle size={16} color="var(--color-danger)" />}
                    </div>

                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{activity.description}</h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
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

                    <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} />
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{activity.responsible}</span>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
