import type { SeoValue } from './types/seo';
import { describe, expect, it } from 'vitest';
import { getSeoStatus, worstSeoStatus } from './seo-status';

const ideal = {
	title: 'x'.repeat(50),
	meta_description: 'x'.repeat(140),
} as SeoValue;

describe('getSeoStatus', () => {
	it('flags missing title or description as an error', () => {
		expect(getSeoStatus({} as SeoValue, null).color).toBe('error');
	});

	it('flags empty required custom fields as an error, but not false or 0', () => {
		const options = { additionalFields: [{ field: 'canonical', required: true }] };
		expect(getSeoStatus({ ...ideal, additional_fields: {} }, options).color).toBe('error');
		expect(getSeoStatus({ ...ideal, additional_fields: { canonical: false } } as unknown as SeoValue, options).color).toBe('success');
	});

	it('warns on lengths outside the ideal range and a missing OG image', () => {
		expect(getSeoStatus({ ...ideal, title: 'Short' }, null).color).toBe('warning');
		expect(getSeoStatus(ideal, { showOgImage: true }).color).toBe('warning');
		expect(getSeoStatus(ideal, null).color).toBe('success');
	});

	it('treats noindex as neutral', () => {
		expect(getSeoStatus({ no_index: true } as SeoValue, null).color).toBe('neutral');
	});
});

describe('worstSeoStatus', () => {
	it('picks the most severe status', () => {
		const statuses = [getSeoStatus(ideal, null), getSeoStatus({} as SeoValue, null), getSeoStatus({ ...ideal, title: 'Short' }, null)];
		expect(worstSeoStatus(statuses).color).toBe('error');
	});
});
