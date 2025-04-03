// Original Source: https://github.com/vuejs/test-utils/blob/7ad5bc6ed94194a81909e479b6fcaf40936da025/src/utils/find.ts
// License: MIT https://github.com/vuejs/test-utils/blob/7ad5bc6ed94194a81909e479b6fcaf40936da025/LICENSE

import type {
	ComponentPublicInstance,
	ConcreteComponent,
	VNode,
	VNodeArrayChildren,
	VNodeChild,
	VNodeNormalizedChildren,
} from 'vue';

export function isComponent(
	component: unknown,
): component is ConcreteComponent {
	return Boolean(
		component
		&& (typeof component === 'object' || typeof component === 'function'),
	);
}

export function matches(
	node: VNode,
	selector: string,
): boolean {
	// do not return none Vue components
	if (!node.component) return false;

	const nodeType = node.type;
	if (!isComponent(nodeType)) return false;

	return node.el?.matches?.(selector);
}

/**
 * Filters out the null, undefined and primitive values,
 * to only keep VNode and VNodeArrayChildren values
 * @param value
 */
function nodesAsObject(
	value: VNodeChild | VNodeArrayChildren,
): value is VNodeArrayChildren | VNode {
	return !!value && typeof value === 'object';
}

/**
 * Collect all children
 * @param nodes
 * @param children
 */
function aggregateChildren(nodes: VNode[], children: VNodeNormalizedChildren) {
	if (children && Array.isArray(children)) {
		const reversedNodes = [...children].reverse().filter(nodesAsObject);

		reversedNodes.forEach((node: VNodeArrayChildren | VNode) => {
			if (Array.isArray(node)) {
				aggregateChildren(nodes, node);
			}
			else {
				nodes.unshift(node);
			}
		});
	}
}

function findAllVNodes(
	vnode: VNode,
	selector: string,
): VNode[] {
	const matchingNodes: VNode[] = [];
	const nodes: VNode[] = [vnode];

	while (nodes.length > 0) {
		const node = nodes.shift()!;
		aggregateChildren(nodes, node.children);

		if (node.component) {
			aggregateChildren(nodes, [node.component.subTree]);
		}

		if (node.suspense) {
			// match children if component is Suspense
			const { activeBranch } = node.suspense;
			aggregateChildren(nodes, [activeBranch]);
		}

		if (matches(node, selector) && !matchingNodes.includes(node)) {
			matchingNodes.push(node);
		}
	}

	return matchingNodes;
}

export function find(
	root: VNode,
	selector: string,
): ComponentPublicInstance[] {
	let matchingVNodes = findAllVNodes(root, selector);

	// When searching by CSS selector we want only one (topmost) vnode for each el`
	matchingVNodes = matchingVNodes.filter(
		(vnode: VNode) => vnode.component!.parent?.vnode.el !== vnode.el,
	);

	return matchingVNodes.map((vnode: VNode) => vnode.component!);
}
