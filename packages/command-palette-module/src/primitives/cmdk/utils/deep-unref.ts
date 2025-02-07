import { isObject } from '@vueuse/core';
import { isRef, unref } from 'vue';

export function deepUnref(val: any) {
	const checkedVal: [] = isRef(val) ? unref(val) : val;

	if (!isObject(checkedVal))
		return checkedVal;

	if (Array.isArray(checkedVal))
		return unrefArray(checkedVal);

	return unrefObject(checkedVal);
}

function smartUnref(val: any) {
	if (val !== null && !isRef(val) && typeof val === 'object')
		return deepUnref(val);

	return unref(val);
}

function unrefArray(arr: []) {
	arr.map(smartUnref);
}

function unrefObject(obj: any) {
	const unreffed: any = {};

	Object.keys(obj).forEach((key) => {
		unreffed[key] = smartUnref(obj[key]);
	});

	return unreffed;
}
