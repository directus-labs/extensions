export default function isValidUrl(string: string) {
	let url;

	try {
		url = new URL(string);
	}
	catch (error) {
		console.warn(error);
		return false;
	}

	return url.protocol === 'http:' || url.protocol === 'https:';
}
