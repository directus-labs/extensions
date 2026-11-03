export class YouTubeHelper {
	apiKey?: string;
	channelId?: string;
	controller: AbortController;
	working: boolean;

	constructor(apiKey?: string, channelId?: string) {
		this.apiKey = apiKey;
		this.channelId = channelId;
		this.controller = new AbortController();
		this.working = false;
	}

	async getVideos(term: string, nextPageToken?: string) {
		if (this.working) {
			this.controller.abort();
		}

		this.working = true;
		const signal = this.controller.signal;

		// Make a fetch request with the signal
		try {
			const items = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&key=${
				this.apiKey
			}&type=video${
				term ? `&q=${term}` : '&order=date'
			}${
				this.channelId ? `&channelId=${this.channelId}` : ''
			}&pageToken=${nextPageToken || ''}`, { signal }).then((res) => res.json());

			this.working = false;

			if (items.error) {
				throw new Error(items.error.message);
			}

			return items;
		}
		catch (error) {
			this.working = false;
			throw error;
		}
	}
}
