import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { type ChatHistoryItem } from '~/lib/persistence';

interface HistoryItemProps {
  item: ChatHistoryItem;
  onDelete?: (event: React.UIEvent) => void;
  onRename?: (event: React.UIEvent) => void;
  onExport?: (event: React.UIEvent) => void;
}

export function HistoryItem({ item, onDelete, onRename, onExport }: HistoryItemProps) {
  const [hovering, setHovering] = useState(false);
  const hoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    function mouseEnter() {
      setHovering(true);
      if (timeout) {
        clearTimeout(timeout);
      }
    }

    function mouseLeave() {
      setHovering(false);
    }

    hoverRef.current?.addEventListener('mouseenter', mouseEnter);
    hoverRef.current?.addEventListener('mouseleave', mouseLeave);

    return () => {
      hoverRef.current?.removeEventListener('mouseenter', mouseEnter);
      hoverRef.current?.removeEventListener('mouseleave', mouseLeave);
    };
  }, []);

  return (
    <div
      ref={hoverRef}
      className="group rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 overflow-hidden flex justify-between items-center px-2 py-1"
    >
      <a href={`/chat/${item.urlId}`} className="flex w-full relative truncate block">
        {item.description}
        <div className="absolute right-0 z-1 top-0 bottom-0 bg-gradient-to-l from-bolt-elements-background-depth-2 group-hover:from-bolt-elements-background-depth-3 to-transparent w-10 flex justify-end group-hover:w-32 group-hover:from-45%">
          {hovering && (
            <div className="flex items-center gap-1 p-1 text-bolt-elements-textSecondary">
              <button
                className="i-ph:pencil-simple scale-110 hover:text-bolt-elements-textPrimary"
                onClick={(event) => {
                  event.preventDefault();
                  onRename?.(event);
                }}
                title="Rename"
              />
              <button
                className="i-ph:export scale-110 hover:text-bolt-elements-textPrimary"
                onClick={(event) => {
                  event.preventDefault();
                  onExport?.(event);
                }}
                title="Export as JSON"
              />
              <Dialog.Trigger asChild>
                <button
                  className="i-ph:trash scale-110 hover:text-bolt-elements-item-contentDanger"
                  onClick={(event) => {
                    event.preventDefault();
                    onDelete?.(event);
                  }}
                  title="Delete"
                />
              </Dialog.Trigger>
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
