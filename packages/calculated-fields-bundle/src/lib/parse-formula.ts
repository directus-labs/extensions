import { isObject } from 'lodash-es';
import { parse } from './parser';

export function parseFormula(formula: string) {
	try {
		return parse(formula, { grammarSource: 'formula' });
	}
	catch (error_: unknown) {
		const error = isObject(error_) && 'format' in error_ && typeof error_.format === 'function' ? error_.format([{ source: 'formula', text: formula }]) : error_;
		throw error;
	}
}
