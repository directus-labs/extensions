export type Prompt = {
  text: string,
  value: string,
  icon: string,
  messages: message[],
}

export type message = {
  role: string,
  content: string,
};

export type RequestBody = {
	model: string,
	messages: message[],
	max_tokens?: number,
	response_format?: {
		type: string
  },
}