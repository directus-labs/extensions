import dompurify from 'dompurify';
import { marked } from 'marked';

const renderer = new marked.Renderer();

export function md(value: string): string {
	const markdown = marked.parse(value, { renderer }) as string;
	return dompurify.sanitize(markdown);
}
