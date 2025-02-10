import type { InjectionKey } from 'vue';
import { inject, provide } from 'vue';

export function createContext<ContextValue>(name: string) {
	const injectionKey: InjectionKey<ContextValue | null> = Symbol(
		`${name}Context`,
	);

	return [injectContext, provideContext] as const;

	function injectContext<
		T extends ContextValue | null | undefined = ContextValue,
	>(fallback?: T): T extends null ? ContextValue | null : ContextValue {
		const context = inject(injectionKey, fallback);
		if (context)
			return context;

		if (context === null)
			return context as any;

		throw new Error(`${name} not provided`);
	}

	function provideContext(context: ContextValue) {
		provide(injectionKey, context);
		return context;
	}
}
