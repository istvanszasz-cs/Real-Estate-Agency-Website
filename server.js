import express from 'express';
import morgan from 'morgan';

import fooldalRoutes from './routes/fooldalRout.js';
import ujlakasRoutes from './routes/ujlakasRout.js';
import reszletesRoutes from './routes/reszletesRout.js';
import loginRout from './routes/loginRout.js';
import session from 'express-session';

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

app.use(
  session({
    secret: 'weblab6', // alairas
    resave: false, // ha nem valtozik a session akkor ne mentse ujra
    saveUninitialized: false, // amig nincs adat addig nem hoz letre sessiont
    cookie: {
      secure: false, // nem https
      httpOnly: true,
      maxAge: 1000 * 60 * 30, // 30 percig ervenyes a session,
    },
  }),
);

app.use((req, res, next) => {
  res.locals.user = req.session.email || null;
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.nev = req.session.nev || null;
  next();
});

app.use('/', fooldalRoutes);
app.use('/', ujlakasRoutes);
app.use('/', reszletesRoutes);
app.use('/', loginRout);

app.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});

init();
