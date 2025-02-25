import type { Node } from '../types';

export function walkAst(
	node: Node,
	visit: (node: Node) => void,
	order: 'pre' | 'post' = 'pre',
) {
	if (order === 'pre')
		visit(node);

	switch (node.type) {
		case 'BinaryExpression': {
			walkAst(node.left, visit);
			walkAst(node.right, visit);

			break;
		}
		case 'UnaryExpression': {
			walkAst(node.value, visit);

			break;
		}
		case 'Function': {
			for (const arg of node.arguments) walkAst(arg, visit);

			break;
		}
	// No default
	}

	if (order === 'post')
		visit(node);
}
