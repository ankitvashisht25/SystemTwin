import { useCollaborationStore } from '../../stores/collaborationStore';

export default function CollaboratorCursors() {
  const collaborators = useCollaborationStore((s) => s.collaborators);

  return (
    <>
      {Array.from(collaborators.values()).map((c) => (
        <div
          key={c.socketId}
          className="absolute pointer-events-none z-50 transition-all duration-100"
          style={{ left: c.x, top: c.y, transform: 'translate(-2px, -2px)' }}
        >
          {/* Cursor arrow */}
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path d="M0 0L16 12L8 12L4 20L0 0Z" fill={c.color} stroke="white" strokeWidth="1" />
          </svg>
          {/* Name label */}
          <div
            className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: c.color }}
          >
            {c.userName}
          </div>
        </div>
      ))}
    </>
  );
}
