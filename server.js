/* eslint no-console: 0 */

import Path from 'path';
import Http from 'http';
import Express from 'express';
import Webpack from 'webpack';
import WebpackMiddleware from 'webpack-dev-middleware';
import WebpackHotMiddleware from 'webpack-hot-middleware';
import Config from './webpack.config.js';
import SocketIo from 'socket.io';

const isDeveloping = process.env.NODE_ENV !== 'production';
const port = isDeveloping ? 3000 : process.env.PORT;
const app = new Express;

if (isDeveloping) {
  const compiler = new Webpack(Config);
  const middleware = new WebpackMiddleware(compiler, {
    publicPath: Config.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });

  app.use(middleware);
  app.use(WebpackHotMiddleware(compiler));
  app.get('*', function response(req, res) {
    res.write(middleware.fileSystem.readFileSync(Path.join(__dirname, 'dist/index.html')));
    res.end();
  });
} else {
  app.use(Express.static(__dirname + '/dist'));
  app.get('*', function response(req, res) {
    res.sendFile(Path.join(__dirname, 'dist/index.html'));
  });
}

const server = new Http.Server(app);
const io = new SocketIo(8080);

server.listen(port, () => {
  console.log(`Running server on port: ${port}`);
});

io.on('connection', (socket) => {
  console.log('[Server] User connected');
});
