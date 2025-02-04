import type { BinaryExpressionNode, FunctionNode, Node } from '../types';
import * as formulajs from '@formulajs/formulajs';
import { get, has } from 'lodash-es';

export function evaluateFormula(
	node: Node,
	values: Record<string, any>,
): string | number | boolean {
	switch (node.type) {
		case 'Literal':
			return node.value;
		case 'Reference':
			if (!has(values, node.field)) {
				throw new Error(`Field not found: ${node.field}`);
			}

			return get(values, node.field);
		case 'UnaryExpression':
			return -evaluateFormula(node.value, values);
		case 'BinaryExpression':
			return evaluateBinaryExpression(node, values);
		case 'Function':
			return evaluateFunction(node, values);
		default:
			throw new Error(`Unknown node type: ${(node as any).type}`);
	}
}

function evaluateBinaryExpression(
	node: BinaryExpressionNode,
	values: Record<string, any>,
) {
	const left = evaluateFormula(node.left, values);
	const right = evaluateFormula(node.right, values);

	switch (node.operator) {
		case '+':
			// @ts-ignore
			return left + right;
		case '-':
			// @ts-ignore
			return left - right;
		case '*':
			// @ts-ignore
			return left * right;
		case '/':
			// @ts-ignore
			return left / right;
		case '%':
			// @ts-ignore
			return left % right;
		case '<':
			return left < right;
		case '<=':
			return left <= right;
		case '>':
			return left > right;
		case '>=':
			return left >= right;
		case '==':
			return left == right;
		case '!=':
			return left != right;
	}
}

function evaluateFunction(node: FunctionNode, value: Record<string, any>) {
	// @ts-ignore
	const func = formulajs[node.name];

	if (!func) {
		throw new Error(`Unknown function: ${node.name}`);
	}

	const args = node.arguments.map((arg) => evaluateFormula(arg, value));
	return func(...args);
}
