'use client';

import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { DragHandle } from './common/DragHandle';
import { HeroPostRow } from './HeroPostRow';

import type { HeroPostActions } from './useHeroPostActions';
import type { HeroPost } from '@/schemas/showcase.schema';
import type { FC } from 'react';

interface HeroPostSortableListProps {
  posts: HeroPost[];
  actions: HeroPostActions;
  onView: (post: HeroPost) => void;
  onEdit: (post: HeroPost) => void;
}

const DROPPABLE_ID = 'hero-posts';

/** The slider images in order; drag a row by its handle to move it (keyboard: space, arrows, space). */
export const HeroPostSortableList: FC<HeroPostSortableListProps> = ({
  posts,
  actions,
  onView,
  onEdit,
}) => {
  const { t } = useTranslation();

  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination) return;
    actions.move(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={DROPPABLE_ID}>
        {(droppable) => (
          <Stack
            ref={droppable.innerRef}
            {...droppable.droppableProps}
            component="ul"
            aria-label={t('showcase.posts.listLabel')}
            sx={{ listStyle: 'none', m: 0, p: 0 }}
          >
            {posts.map((post, index) => (
              <Draggable key={post._id} draggableId={post._id} index={index}>
                {(draggable) => (
                  <Box
                    component="li"
                    ref={draggable.innerRef}
                    {...draggable.draggableProps}
                    sx={{ pb: 2 }}
                  >
                    <HeroPostRow
                      post={post}
                      position={index + 1}
                      total={posts.length}
                      actions={actions}
                      onView={onView}
                      onEdit={onEdit}
                      dragHandle={
                        <DragHandle
                          handleProps={draggable.dragHandleProps}
                          label={t('showcase.posts.dragHandle', { position: index + 1 })}
                        />
                      }
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {droppable.placeholder}
          </Stack>
        )}
      </Droppable>
    </DragDropContext>
  );
};
