import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--imoogle-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--imoogle-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--imoogle-elements-terminal-textColor'),
    background: cssVar('--imoogle-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--imoogle-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--imoogle-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--imoogle-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--imoogle-elements-terminal-color-black'),
    red: cssVar('--imoogle-elements-terminal-color-red'),
    green: cssVar('--imoogle-elements-terminal-color-green'),
    yellow: cssVar('--imoogle-elements-terminal-color-yellow'),
    blue: cssVar('--imoogle-elements-terminal-color-blue'),
    magenta: cssVar('--imoogle-elements-terminal-color-magenta'),
    cyan: cssVar('--imoogle-elements-terminal-color-cyan'),
    white: cssVar('--imoogle-elements-terminal-color-white'),
    brightBlack: cssVar('--imoogle-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--imoogle-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--imoogle-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--imoogle-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--imoogle-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--imoogle-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--imoogle-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--imoogle-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
