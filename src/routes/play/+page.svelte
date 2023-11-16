<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { config } from '$lib/gameConfig';
	import { phaser } from '$lib/phaser';
	import { abilities } from '$lib/abilities';

	import { PlayerRole } from '$lib/types';

	let game: import('phaser').Game;
	let role = PlayerRole.Killer;

	onMount(async () => {
		if (browser) {
			game = new phaser!.Game(config());
		}
	});
</script>

<div id="game">
	<!-- Phaser canvas goes here -->
</div>

<div class="abilities">
	{#each Object.entries(abilities[role]) as [abilityId, ability]}
		<div class="ability">
			<img src="/img/abilities/{role}/{abilityId}.png" alt={abilityId} class="pixelated" />
		</div>
	{/each}
</div>

<style>
	.abilities {
		position: fixed;
		bottom: 16px;
		left: 16px;

		display: flex;
	}

	.ability {
		width: 96px;
		height: 96px;
		aspect-ratio: 1;
		border-radius: 50%;

		background-color: var(--grey);
	}

	.ability img {
		width: 100%;
		height: 100%;
	}
</style>
