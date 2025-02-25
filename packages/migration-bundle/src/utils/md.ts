import { marked } from 'marked';
import dompurify from 'dompurify';

const renderer = new marked.Renderer();

export function md(value: string): string {
	const markdown = marked.parse(value, { renderer }) as string;
	return dompurify.sanitize(markdown);
}