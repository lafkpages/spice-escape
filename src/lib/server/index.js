import { createServer } from 'http';
import wsServer from './ws';

import { handler } from '../../../build/handler.js';

const server = createServer(handler);

wsServer({
	httpServer: server
});

server.listen(process.env.PORT || 3000);
