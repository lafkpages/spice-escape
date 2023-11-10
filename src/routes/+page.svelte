<script lang="ts">
	import { Header } from '$lib/components/header';
</script>

<section>
	<Header />

	<div class="play-container">
		<input type="text" placeholder="Enter your name" />
		<a href="/play" role="button">Play</a>
	</div>
</section>

<section>
	<h2>About the game</h2>

	<p>
		This game was made for the Replit KaJAM 2022 contest. The objective of the game is for the
		runners to run away from the killers and escape before being killed by the killer's powers, some
		of which include using hot sauce. The killers must kill all of the runners before they escape to
		win the game
	</p>
</section>

<style>
	section {
		width: 100%;
		height: 100vh;
		height: 100dvh;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;

		color: var(--orange);
	}

	section p {
		max-width: 50em;
	}

	.play-container {
		display: flex;
		gap: 12px;
		width: max-content;
	}
</style>
