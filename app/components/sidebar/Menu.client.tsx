import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { db, deleteById, getAll, chatId, type ChatHistoryItem, setMessages } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-150px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent = 
  | { type: 'delete'; item: ChatHistoryItem }
  | { type: 'rename'; item: ChatHistoryItem }
  | null;

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [newName, setNewName] = useState('');

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    if (db) {
      deleteById(db, item.id)
        .then(() => {
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          toast.error('Failed to delete conversation');
          logger.error(error);
        });
    }
  }, []);

  const renameItem = useCallback(async (event: React.UIEvent, item: ChatHistoryItem, newDescription: string) => {
    event.preventDefault();

    if (db) {
      try {
        await setMessages(db, item.id, item.messages, item.urlId, newDescription);
        loadEntries();
        toast.success('Chat renamed successfully');
      } catch (error) {
        toast.error('Failed to rename chat');
        logger.error(error);
      }
    }
  }, []);

  const exportItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    const exportData = {
      description: item.description,
      messages: item.messages,
      timestamp: item.timestamp
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${item.description || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Chat exported successfully');
  }, []);

  const closeDialog = () => {
    setDialogContent(null);
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  useEffect(() => {
    const enterThreshold = 40;
    const exitThreshold = 40;

    function onMouseMove(event: MouseEvent) {
      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <motion.div
      ref={menuRef}
      className="fixed top-0 bottom-0 w-[300px] bg-bolt-elements-background-depth-2 border-r border-bolt-elements-borderColor z-sidebar"
      variants={menuVariants}
      animate={open ? 'open' : 'closed'}
      initial="closed"
    >
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-1 bg-bolt-elements-background-depth-2 p-4 pt-12 flex justify-between items-center border-b border-bolt-elements-borderColor">
          <div className="text-bolt-elements-textPrimary font-medium">History</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 pb-16">
          {list.length === 0 && <div className="pl-2 text-bolt-elements-textTertiary">No previous conversations</div>}
          <DialogRoot open={dialogContent !== null}>
            {binDates(list).map(({ category, items }) => (
              <div key={category} className="mt-4 first:mt-0 space-y-1">
                <div className="text-bolt-elements-textTertiary sticky top-0 z-1 bg-bolt-elements-background-depth-2 pl-2 pt-2 pb-1">
                  {category}
                </div>
                {items.map((item) => (
                  <HistoryItem 
                    key={item.id} 
                    item={item} 
                    onDelete={() => setDialogContent({ type: 'delete', item })}
                    onRename={() => {
                      setNewName(item.description || '');
                      setDialogContent({ type: 'rename', item });
                    }}
                    onExport={(event) => exportItem(event, item)}
                  />
                ))}
              </div>
            ))}
            <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
              {dialogContent?.type === 'delete' && (
                <>
                  <DialogTitle>Delete Chat?</DialogTitle>
                  <DialogDescription asChild>
                    <div>
                      <p>
                        You are about to delete <strong>{dialogContent.item.description}</strong>.
                      </p>
                      <p className="mt-1">Are you sure you want to delete this chat?</p>
                    </div>
                  </DialogDescription>
                  <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                    <DialogButton type="secondary" onClick={closeDialog}>
                      Cancel
                    </DialogButton>
                    <DialogButton
                      type="danger"
                      onClick={(event) => {
                        deleteItem(event, dialogContent.item);
                        closeDialog();
                      }}
                    >
                      Delete
                    </DialogButton>
                  </div>
                </>
              )}
              {dialogContent?.type === 'rename' && (
                <>
                  <DialogTitle>Rename Chat</DialogTitle>
                  <DialogDescription asChild>
                    <div>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full p-2 mt-2 text-bolt-elements-textPrimary bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md focus:outline-none focus:border-bolt-elements-borderColorFocus"
                        placeholder="Enter new name"
                        autoFocus
                      />
                    </div>
                  </DialogDescription>
                  <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                    <DialogButton type="secondary" onClick={closeDialog}>
                      Cancel
                    </DialogButton>
                    <DialogButton
                      type="primary"
                      onClick={(event) => {
                        if (newName.trim()) {
                          renameItem(event, dialogContent.item, newName.trim());
                          closeDialog();
                        }
                      }}
                    >
                      Rename
                    </DialogButton>
                  </div>
                </>
              )}
            </Dialog>
          </DialogRoot>
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <ThemeSwitch />
      </div>
    </motion.div>
  );
}
