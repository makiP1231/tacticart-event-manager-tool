import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

function DroppableComponent({ children, droppableId, type = 'DEFAULT', ...props }) {
  return (
    <Droppable droppableId={droppableId} type={type} {...props}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={snapshot.isDraggingOver ? 'dragging-over' : ''}
        >
          {children(provided)}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default DroppableComponent;
