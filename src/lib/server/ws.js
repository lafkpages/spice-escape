import { WebSocketServer } from 'ws';

/**
 * @param {object} opts
 * @param {import('http').Server | null} opts.httpServer
 */
export default function main({ httpServer }) {
	if (!httpServer) {
		throw new Error('[$lib/server/ws] No HTTP server given');
	}

	const wss = new WebSocketServer({ noServer: true });

	wss.on('connection', (ws) => {
		ws.send('Hello! Message From Server!!');
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
