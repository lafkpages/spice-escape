import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import configureServer from '$lib/server/ws';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'spice-escape-ws-server',
			configureServer
		}
	]
});
