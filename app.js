const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const session = require('express-session');
const app = express()
const flash = require('connect-flash');
const methodOverride = require('method-override');
const ejsLayouts = require('express-ejs-layouts');


const PORT = 3000
require('dotenv').config();

const passport = require('./config/passport');
const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');

const openRoutes = require('./routers/openRoutes')
const authRoutes = require('./routers/authRoutes')
const voteRoute = require('./routers/voteRoute')
const adminRoute = require('./routers/adminRoute')

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Set up EJS view engine and public folder
app.set('view engine', 'ejs');
app.use(ejsLayouts);

app.use(express.static(path.join(__dirname, './', 'public')));


app.use(session({
  secret: "thss the secret", // process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.use('/', openRoutes);
app.use('/auth', authRoutes);
app.use('/vote', voteRoute);
app.use('/admin', adminRoute);


// 404 Error handler for undefined routes
app.use((req, res) => {

  res.render('404', {
    pageTitle: `404`,
  });
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  let userActive = req.user ? true : false;
  res.redirect('/')
});

app.listen(PORT, () => {
  console.log(`app listing on port ${PORT} ...`);

})



