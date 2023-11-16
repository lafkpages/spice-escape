import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	return {
		nick: url.searchParams.get('nick') || 'Player'
	};
};
