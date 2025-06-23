import { memo } from 'react';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

interface PanelHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PanelHeader = memo(({ className, children }: PanelHeaderProps) => {
  const theme = useStore(themeStore);
  return (
    <div className="flex items-center justify-between w-full">
      <h2 className={theme === 'cyberpunk' ? 'neon-glow' : ''}>
        {children}
      </h2>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
});
