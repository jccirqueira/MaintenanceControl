import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';

export default function Column({ column, activities, onCardClick }) {
    return (
        <div style={{
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            width: '300px',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{column.title}</h3>
                <span style={{
                    backgroundColor: '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    {activities.length} / {column.totalCount || activities.length}
                </span>
            </div>

            <Droppable droppableId={column.id}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                            padding: '1rem',
                            flex: 1,
                            overflowY: 'auto'
                        }}
                    >
                        {activities.map((activity, index) => (
                            <Card key={activity.id} activity={activity} index={index} onClick={onCardClick} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
