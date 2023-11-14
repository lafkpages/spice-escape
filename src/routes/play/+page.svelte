<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { config } from '$lib/gameConfig';
	import { phaser } from '$lib/phaser';
	import { abilities } from '$lib/abilities';

	let game: import('phaser').Game;

	onMount(async () => {
		if (browser) {
			game = new phaser!.Game(config());
		}
	});
</script>

<div id="game">
	<!-- Phaser canvas goes here -->
</div>
