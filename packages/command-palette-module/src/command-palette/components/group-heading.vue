<template>
	<div class="group-heading">
		<slot />
	</div>
</template>

<style scoped lang="scss">
.group-heading {
	display: flex;
	align-items: center;
	padding: 0 12px 0 8px;
	font-size: 13px;
	color: var(--cmd-group-heading-color, var(--theme--foreground-subdued));
	height: 36px;
}
</style>
