'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSlideshowStore } from '@/store/slideshowStore'
import type { Slide } from '@/types/slideshow'

function SlideCard({ slide, index, isSelected, onSelect }: {
  slide: Slide
  index: number
  isSelected: boolean
  onSelect: () => void
}) {
  const { removeSlide } = useSlideshowStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex-shrink-0 w-32 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors group
        ${isSelected ? 'border-[var(--gold)]' : 'border-[var(--border)] hover:border-[var(--gold)]/40'}
      `}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="absolute top-1 left-1 z-10 p-1 rounded bg-black/40 cursor-grab active:cursor-grabbing">
        <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>

      {/* Thumbnail */}
      <div className="aspect-video bg-[var(--surface-2)] flex items-center justify-center">
        {slide.mediaType === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.mediaUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-[var(--text-muted)]">Video</span>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="bg-[var(--surface)] px-2 py-1 flex justify-between items-center">
        <span className="text-xs text-[var(--text-muted)]">#{index + 1}</span>
        <span className="text-xs text-[var(--text-muted)]">{slide.duration}s</span>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeSlide(slide.id) }}
        className="absolute top-1 right-1 z-10 p-1 rounded bg-red-900/70 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-3 h-3 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface TimelineProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function Timeline({ selectedId, onSelect }: TimelineProps) {
  const { slides, reorderSlides, previewStatus } = useSlideshowStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = slides.findIndex((s) => s.id === active.id)
    const newIndex = slides.findIndex((s) => s.id === over.id)
    reorderSlides(oldIndex, newIndex)
  }

  if (!slides.length) {
    return (
      <div className="h-28 flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl">
        <p className="text-[var(--text-muted)] text-sm">Upload photos or videos to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {previewStatus === 'stale' && (
        <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-lg px-3 py-2 text-sm text-[var(--gold)] flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Changes made — click &quot;Generate Slideshow&quot; to update the preview
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
            {slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={i}
                isSelected={selectedId === slide.id}
                onSelect={() => onSelect(slide.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
