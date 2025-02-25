<template>
	<v-list nav v-if="navItems">
		<v-list-item v-for="navItem in navItems" :key="navItem.to" :active="navItem.collection == collection" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" :color="navItem.color" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="navItem.name" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script>
import { ref } from 'vue';

export default {
	name: 'SupportNavigation',
  inheritAttrs: false,
	setup() {
		const navItems = ref([
      {
        icon: 'home',
        color: '',
        name: 'Home',
        collection: 'home',
        to: `/migration`,
      }
    ]);

		return { navItems };
	},
};
</script>