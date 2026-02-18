export interface UseUserStackUser {
	uid: string;
	id?: string;
	first_name?: string;
	last_name?: string;
}

export function useAvatarStack() {
	const users: UseUserStackUser[] = [];

	return { add };

	function add(user: UseUserStackUser) {
		if (users.find((u) => u.uid === user.uid)) {
			return;
		}

		users.push(user);
	}
}
