export const emails = {
	label: 'Emails',
	icon: 'mail',
	actions: {
		send: {
			label: 'Send Email',
			description: 'Send an email to a single recipient or multiple recipients.',
			icon: 'send',
			method: 'POST',
			path: '/emails',
			options: [
				{
					field: 'from',
					name: 'From',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							placeholder: 'Acme <sender@example.com>',
						},
						note: 'Sender email address. To include a friendly name, use the format "Your Name <sender@domain.com>".',
						required: true,
					},
				},
				{
					field: 'to',
					name: 'To',
					type: 'json',
					meta: {
						width: 'full',
						interface: 'tags',
						options: {
							placeholder: 'Enter email address and press Enter to add.',
						},
						note: 'Recipient email address. For multiple addresses, enter each address separately. Max 50.',
						required: true,
					},
				},
				{
					field: 'cc',
					name: 'CC',
					type: 'json',
					meta: {
						width: 'half',
						interface: 'tags',
						options: {
							placeholder: 'Enter email address and press Enter to add.',
						},
						note: 'CC recipient email address. For multiple addresses, enter each address separately.',
					},
				},
				{
					field: 'bcc',
					name: 'BCC',
					type: 'json',
					meta: {
						width: 'half',
						interface: 'tags',
						options: {
							placeholder: 'Enter email address and press Enter to add.',
						},
						note: 'BCC recipient email address. For multiple addresses, enter each address separately.',
					},
				},
				{
					field: 'subject',
					name: 'Subject',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'Email subject.',
						required: true,
					},
				},
				{
					field: 'html',
					name: 'HTML Content',
					type: 'text',
					meta: {
						width: 'full',
						interface: 'input-code',
						options: {
							language: 'html',
						},
						note: 'The HTML version of the message.',
					},
				},
				{
					field: 'text',
					name: 'Plain Text Content',
					type: 'text',
					meta: {
						width: 'full',
						interface: 'input-multiline',
						note: 'The plain text version of the message.',
					},
				},
				{
					field: 'scheduledAt',
					name: 'Scheduled At',
					type: 'timestamp',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'Schedule email to be sent later. The date should be in ISO 8601 format (e.g: 2024-08-05T11:52:01.858Z).',
					},
				},
				{
					field: 'replyTo',
					name: 'Reply To',
					type: 'json',
					meta: {
						width: 'full',
						interface: 'tags',
						options: {
							placeholder: 'Enter email address and press Enter to add.',
						},
						note: 'Reply-to email address. For multiple addresses, enter each address separately.',
					},
				},
				{
					field: 'headers',
					name: 'Headers',
					type: 'json',
					meta: {
						width: 'full',
						interface: 'input-code',
						options: {
							language: 'json',
						},
						note: 'Custom headers to add to the email. Enter as a JSON object.',
					},
				},
				{
					field: 'attachments',
					name: 'Attachments',
					type: 'json',
					meta: {
						width: 'full',
						interface: 'input-code',
						options: {
							language: 'json',
						},
						note: 'Filename and content of attachments (max 40mb per email). Enter as a JSON array of objects with filename, content, path, and content_type properties.',
					},
				},
				{
					field: 'tags',
					name: 'Tags',
					type: 'json',
					meta: {
						width: 'full',
						interface: 'input-code',
						options: {
							language: 'json',
						},
						note: 'Custom data passed in key/value pairs. Enter as a JSON array of objects with name and value properties.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				return client.fetchRequest('/emails', 'POST', {
					from: params.from,
					to: params.to,
					subject: params.subject,
					html: params.html,
					text: params.text,
					cc: params.cc,
					bcc: params.bcc,
					reply_to: params.replyTo,
					scheduled_at: params.scheduledAt,
					headers: params.headers,
					attachments: params.attachments,
					tags: params.tags,
				});
			},
		},
		sendBatch: {
			label: 'Send Batch Email',
			description: 'Send up to 100 emails in a single API call.',
			icon: 'send',
			method: 'POST',
			path: '/emails/batch',
			options: [
				{
					field: 'batchEmails',
					name: 'Batch Emails',
					type: 'json',
					meta: {
						width: 'full',
						interface: 'input-code',
						options: {
							language: 'json',
						},
						note: 'An array of email objects. Each object should contain from, to, subject, and either html or text fields. The cc, bcc, reply_to, and headers fields are optional. Attachments, tags, and scheduled_at are not supported for batch emails.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { batchEmails } = params;
				return client.fetchRequest(
					'/emails/batch',
					'POST',
					batchEmails.map((email: any) => ({
						from: email.from,
						to: email.to,
						subject: email.subject,
						html: email.html,
						text: email.text,
						cc: email.cc,
						bcc: email.bcc,
						reply_to: email.replyTo,
						headers: email.headers,
					})),
				);
				// Batch emails do not support attachments, tags, or scheduled_at
			},
		},
		retrieve: {
			label: 'Retrieve Email',
			description: 'Retrieve an email by ID.',
			icon: 'search',
			method: 'GET',
			path: '/emails/:email_id',
			options: [
				{
					field: 'emailId',
					name: 'Email ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the email to retrieve.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { emailId } = params;
				return client.fetchRequest(`/emails/${emailId}`, 'GET');
			},
		},
		update: {
			label: 'Update Email',
			description: 'Update an email by ID.',
			icon: 'edit',
			method: 'PATCH',
			path: '/emails/:email_id',
			options: [
				{
					field: 'emailId',
					name: 'Email ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the email to update.',
						required: true,
					},
				},
				{
					field: 'scheduledAt',
					name: 'Scheduled At',
					type: 'timestamp',
					meta: {
						width: 'full',
						interface: 'datetime',
						note: 'Schedule email to be sent later. The date should be in ISO 8601 format (e.g: 2024-08-05T11:52:01.858Z).',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { emailId, scheduledAt } = params;
				return client.fetchRequest(`/emails/${emailId}`, 'PATCH', {
					scheduled_at: scheduledAt,
				});
			},
		},
		cancel: {
			label: 'Cancel Email',
			description: 'Cancel an email by ID.',
			icon: 'cancel',
			method: 'POST',
			path: '/emails/:email_id/cancel',
			options: [
				{
					field: 'emailId',
					name: 'Email ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the email to cancel.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { emailId } = params;
				return client.fetchRequest(`/emails/${emailId}/cancel`, 'POST');
			},
		},
	},
};
