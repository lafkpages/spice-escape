<script lang="ts">
	import { onMount } from 'svelte';

	let anim = false;

	onMount(() => {
		anim = true;
	});
</script>

<header class:anim>
	<img src="/img/headerNoHotSauce.png" alt="Spice Escape" class="pixelated header" />
	<img src="/img/hotSauce.png" alt="" class="pixelated hot-sauce" />
</header>

<style lang="scss">
	header {
		width: 100%;
		aspect-ratio: 2;

		display: flex;
		align-items: center;
		justify-content: center;

		position: relative;

		animation-duration: 1s;
		animation-timing-function: ease-out;
		animation-fill-mode: both;

		&.anim {
			animation-name: slidein;
		}

		.header {
			height: 100%;
		}

		.hot-sauce {
			position: absolute;
			right: 14%;
			top: 19%;
			height: 62.2%;
			transform: rotate(-15deg);
		}
	}

	@keyframes slidein {
		from {
			transform: translateX(-125vw);
		}

		to {
			transform: translateX(0px);
		}
	}
</style>
