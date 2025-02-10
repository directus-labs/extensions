export interface APIError {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
}
