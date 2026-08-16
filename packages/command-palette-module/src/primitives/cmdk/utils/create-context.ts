import type { InjectionKey } from 'vue';
import { inject, provide } from 'vue';

export function createContext<ContextValue>(name: string) {
	const injectionKey: InjectionKey<ContextValue | null> = Symbol(`${name}Context`);

	function injectContext(): ContextValue;
	function injectContext(fallback: null): ContextValue | null;

	function injectContext(fallback: null | undefined = undefined): ContextValue | null {
		const context = inject(injectionKey);
		if (context) return context;
		if (fallback === null) return null;
		throw new Error(`${name} not provided`);
	}

	function provideContext(context: ContextValue) {
		provide(injectionKey, context);
		return context;
	}

	return [injectContext, provideContext] as const;
}
