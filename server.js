import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import { connectToDatabase } from './dal.js';

import fooldalRoutes from './routes/fooldalRout.js';
import ujlakasRoutes from './routes/ujlakasRout.js';
import reszletesRoutes from './routes/reszletesRout.js';

const app = express();
app.use(express.static('.'));
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function init() {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

app.use('/', fooldalRoutes);
app.use('/', ujlakasRoutes);
app.use('/', reszletesRoutes);

app.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});

init();
