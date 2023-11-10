<script lang="ts">
	import { Header } from '$lib/components/header';
</script>

<div class="main">
	<Header />

	<div class="play-container">
		<input type="text" placeholder="Enter your name" />
		<button>Play</button>
	</div>
</div>

<style>
	.main {
		width: 100%;
		height: 100%;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.play-container {
		display: flex;
		gap: 12px;
		width: max-content;
	}
</style>
