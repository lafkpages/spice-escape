import { WebSocketServer } from 'ws';

import { spice_escape } from '$lib/ws';

/**
 * @param {object} opts
 * @param {import('http').Server | null} opts.httpServer
 */
export default function main({ httpServer }) {
	if (!httpServer) {
		throw new Error('[$lib/server/ws] No HTTP server given');
	}

	const wss = new WebSocketServer({ noServer: true });

	/**
	 * @type {Record<string, import('$lib/types').Player>}
	 */
	const players = {};

	wss.on('connection', (ws) => {
		const playerId = crypto.randomUUID();

		ws.on('message', (message) => {
			if (!message || message instanceof ArrayBuffer) {
				return;
			}

			const data = spice_escape.WsMessageClient.decode(
				Array.isArray(message) ? Buffer.concat(message) : message
			);

			if (data.nick) {
				if (playerId in players) {
					// TODO: Send error message
				} else {
					players[playerId] = {
						nick: data.nick
					};

					ws.send(spice_escape.WsMessageServer.encode({ playerId }).finish());
				}
			}
		});
	});

	httpServer.on('upgrade', (req, socket, head) => {
		if (req.url != '/game') {
			return;
		}

		wss.handleUpgrade(req, socket, head, (socket) => {
			wss.emit('connection', socket, req);
		});
	});
}
