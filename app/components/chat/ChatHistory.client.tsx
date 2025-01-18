import { useEffect, useState } from 'react';
import type { ChatHistoryItem } from '~/lib/persistence/useChatHistory';
import { db } from '~/lib/persistence/useChatHistory';
import { getAll } from '~/lib/persistence/db';
import { useNavigate, useLoaderData } from '@remix-run/react';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatHistory');

export function ChatHistory() {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { id: currentId } = useLoaderData<{ id?: string }>();

  useEffect(() => {
    if (!db) return;
    
    const loadHistory = async () => {
      try {
        const items = await getAll(db!);
        // Filter items to only show history for the current chat
        const filteredItems = items
          .filter(item => item.urlId === currentId || item.id === currentId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistory(filteredItems);
      } catch (error) {
        logger.error('Failed to load chat history', error);
      }
    };

    loadHistory();
  }, [currentId]);

  const handleRestore = (item: ChatHistoryItem) => {
    navigate(`/chat/${item.id}`);
    setIsOpen(false);
  };

  if (!db || history.length === 0) return null;

  return (
    <div className="relative">
      <IconButton
        title="Chat History"
        onClick={() => setIsOpen(!isOpen)}
        className={classNames({
          'text-bolt-elements-item-contentAccent!': isOpen,
        })}
      >
        <div className="i-ph:clock-counter-clockwise text-xl" />
      </IconButton>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[300px] max-h-[400px] overflow-y-auto bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg">
          <div className="p-2">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary px-2 py-1">Chat History</h3>
            <div className="mt-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRestore(item)}
                  className="w-full text-left px-2 py-1.5 hover:bg-bolt-elements-item-backgroundHover rounded transition-colors"
                >
                  <div className="text-sm text-bolt-elements-textPrimary truncate">
                    {item.description || `Version ${new Date(item.timestamp).toLocaleTimeString()}`}
                  </div>
                  <div className="text-xs text-bolt-elements-textTertiary">
                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 