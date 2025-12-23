import express from 'express';
import morgan from 'morgan';

import fooldalRoutes from './routes/fooldalRout.js';
import ujlakasRoutes from './routes/ujlakasRout.js';
import reszletesRoutes from './routes/reszletesRout.js';

import { init } from './segedfuggvenyek/server_functions.js';

const app = express();
app.use(express.static('.'));
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.json());

app.use('/', fooldalRoutes);
app.use('/', ujlakasRoutes);
app.use('/', reszletesRoutes);

app.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});

init();
