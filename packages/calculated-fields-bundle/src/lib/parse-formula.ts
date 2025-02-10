import { isObject } from 'lodash-es';
import { parse } from './parser';

export function parseFormula(formula: string) {
	try {
		return parse(formula, { grammarSource: 'formula' });
	}
	catch (err: unknown) {
		if (isObject(err) && 'format' in err && typeof err.format === 'function') {
			throw err.format([{ source: 'formula', text: formula }]);
		}
		else {
			throw err;
		}
	}
}
