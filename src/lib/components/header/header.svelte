<header>
	<img src="/img/headerNoHotSauce.png" alt="Spice Escape" class="header" />
	<img src="/img/hotSauce.png" alt="" class="hot-sauce" />
</header>

<style lang="scss">
	header {
		width: 100%;
		aspect-ratio: 2;

		display: flex;
		align-items: center;
		justify-content: center;

		position: relative;

		img {
			image-rendering: crisp-edges;
			image-rendering: pixelated;
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
</style>
