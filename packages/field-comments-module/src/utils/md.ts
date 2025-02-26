import dompurify from 'dompurify';
import { marked } from 'marked';

interface Options {
	target?: '_blank' | '_self' | '_parent' | '_top';
}

const renderer = new marked.Renderer();

export function md(value: string, options: Options = {}): string {
	options.target ??= '_self';

	dompurify.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
			node.setAttribute('rel', 'noopener noreferrer');
		}
	});

	// @ts-ignore
	renderer.link = function (href, title, text) {
		// @ts-ignore
		const link = Reflect.apply(marked.Renderer.prototype.link, this, [href, title, text]);
		return link.replace('<a', `<a target="${options.target}"`);
	};

	const markdown = marked.parse(value, { renderer }) as string;

	return dompurify.sanitize(markdown, { ADD_ATTR: ['target'] });
}
