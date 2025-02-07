import type { Ref } from 'vue';
import type { CommandRouter } from '../router';
import { createContext } from '../../primitives/cmdk/utils/create-context';

export interface GlobalCommandContext {
	search: Ref<string>;
	loading: Ref<boolean>;
	router: CommandRouter;
	close: () => void;
	clearSearch: () => void;
}

export const [useCommandContext, provideGlobalCommandContext]
  = createContext<GlobalCommandContext>('GlobalCommand');
