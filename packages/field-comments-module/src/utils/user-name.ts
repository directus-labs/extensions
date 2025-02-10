import type { User } from '@directus/types';

export function userName(user?: Partial<User>): string | undefined {
	if (!user) {
		return;
	}

	if (user.first_name && user.last_name) {
		return `${user.first_name} ${user.last_name}`;
	}

	if (user.first_name) {
		return user.first_name;
	}

	if (user.email) {
		return user.email;
	}
}
