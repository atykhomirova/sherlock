const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
global.appRoot = path.resolve(__dirname);
const config = require(  `${appRoot}/config.json`);


//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({ secret: 'sherlock', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!isProduction) {
  app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect(config.db.url + config.db.name);
mongoose.set('debug', true);

//Models & routes
require('./models/UserProfiles');
require('./config/passport');
app.use('/api/v1.0/users', require('./routes/api/v1.0/users'));
app.use('/api/v1.0/confirm', require('./routes/api/v1.0/confirm'));
app.use('/api/v1.0/auth', require('./routes/api/v1.0/auth'));

//Error handlers & middlewares
// if(!isProduction) {
//   app.use((err, req, res) => {
//     res.status(err.status || 500);
//
//     res.json({
//       errors: {
//         message: err.message,
//         error: err,
//       },
//     });
//   });
// }
//
// app.use((err, req, res) => {
//   res.status(err.status || 500);
//
//   res.json({
//     errors: {
//       message: err.message,
//       error: {},
//     },
//   });
// });

app.listen(8000, () => console.log('Server running on http://localhost:8000/'));