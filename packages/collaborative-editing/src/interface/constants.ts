import { AwarenessThemeColorMap, themePrefix } from './types';

export const ACTIVE_FIELD_SELECTOR = '[data-collection][data-field][data-primary-key]';

export const ACTIVE_FIELD_IDLE_TIMEOUT = 1000 * 60 * 5; // 5 minutes

export const themeColors: AwarenessThemeColorMap = {
	purple: `${themePrefix}purple`,
	blue: `${themePrefix}blue`,
	green: `${themePrefix}green`,
	yellow: `${themePrefix}yellow`,
	orange: `${themePrefix}orange`,
	red: `${themePrefix}red`,
};
