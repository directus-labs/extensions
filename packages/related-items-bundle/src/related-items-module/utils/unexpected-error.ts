export function unexpectedError(error: any, stores: any): void {
	const { useNotificationsStore } = stores;
	const store = useNotificationsStore();

	const code =
		error?.response?.data?.errors?.[0]?.extensions?.code
		|| error?.extensions?.code
		|| 'UNKNOWN';

	console.warn(error);

	store.add({
		title: code,
		type: 'error',
		code,
		dialog: true,
		error,
	});
}
