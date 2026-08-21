/** Anonymous live-activity line — appears on new map events, auto-dismissed
 * by the parent after a few seconds. `key` on the message id re-mounts the
 * pill so consecutive events read as fresh. */
export function ActivityTicker({ message }: { message: { id: number; text: string } | null }) {
  if (!message) return null;
  return (
    <div
      key={message.id}
      aria-live="polite"
      className="absolute inset-x-0 bottom-16 z-10 mx-auto w-fit max-w-[90vw] rounded-full border border-border bg-card/95 px-4 py-2 text-center text-xs font-medium shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur md:bottom-8"
    >
      {message.text}
    </div>
  );
}
