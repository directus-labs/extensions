<template>
	<div class="group-heading">
		<slot />
	</div>
</template>

<style scoped lang="scss">
.group-heading {
	display: flex;
	align-items: center;
	padding: 0 0.75rem 0 0.5rem;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--cmd-group-heading-color, var(--theme--foreground-subdued));
	block-size: 2rem;
	gap: 0.375rem;
}
</style>
