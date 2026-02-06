import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';

export default function Column({ column, activities, onCardClick }) {
    return (
        <div className="kanban-column">
            <div className="kanban-column-header">
                <h3 className="kanban-column-title">{column.title}</h3>
                <span className="kanban-column-count">
                    {activities.length} / {column.totalCount || activities.length}
                </span>
            </div>

            <Droppable droppableId={column.id}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="kanban-column-content"
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
