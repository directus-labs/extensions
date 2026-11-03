<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useMockApi } from '../composables/use-mock-api';

const route = useRoute();
const { collections } = useMockApi();

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`);
</script>

<template>
	<v-list nav>
		<v-list-item
			v-for="collection in collections"
			:key="collection.id"
			:to="`/mock-api/${collection.id}`"
			:active="isActive(`/mock-api/${collection.id}`)"
		>
			<v-list-item-icon><v-icon name="folder_open" /></v-list-item-icon>
			<v-list-item-content><v-text-overflow :text="collection.name" /></v-list-item-content>
			<v-list-item-hint v-if="!collection.enabled">
				Off
			</v-list-item-hint>
		</v-list-item>

		<v-list-item to="/mock-api/+" :active="route.path === '/mock-api/+'">
			<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
			<v-list-item-content>New collection</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item to="/mock-api/log" :active="isActive('/mock-api/log')">
			<v-list-item-icon><v-icon name="receipt_long" /></v-list-item-icon>
			<v-list-item-content>Request log</v-list-item-content>
		</v-list-item>
		<v-list-item to="/mock-api/transfer" :active="isActive('/mock-api/transfer')">
			<v-list-item-icon><v-icon name="swap_vert" /></v-list-item-icon>
			<v-list-item-content>Import and export</v-list-item-content>
		</v-list-item>
		<v-list-item to="/mock-api/settings" :active="isActive('/mock-api/settings')">
			<v-list-item-icon><v-icon name="tune" /></v-list-item-icon>
			<v-list-item-content>Settings</v-list-item-content>
		</v-list-item>
	</v-list>
</template>
