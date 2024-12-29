const express = require('express')
// const path = require('path')
const router = express.Router();
const { promisify } = require('util');
const db = require("../model/databaseTable");
const query = promisify(db.query).bind(db);
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const { forwardAuthenticated } = require('../config/auth');
const {v4:uuidv4} = require('uuid')


router.post('/register', forwardAuthenticated, async (req, res) => {
  let errors = [];

  const { email, password, passwordB } = req.body;

  // Check for empty fields
  if (!(email && password && passwordB)) {
    errors.push({ msg: 'Enter all details' });
  }

  // Check if passwords match
  if (password !== passwordB) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // If there are errors, re-render the form with error messages
  if (errors.length > 0) {
    return res.render('register', {
      errors,
      email,
      password,
    });
  }

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user already exists
    const results = await query('SELECT * FROM "users" WHERE email = $1', [email]);

    if (results.rows.length > 0) {
      errors.push({ msg: `User with this email: ${email} already exists.` });
      return res.render('register', {
        errors,
        email,
        password,
      });
    }

    // Determine user role based on email prefix
    let user_role = 'user';
    let sanitizedEmail = email; // Use this to remove the 'become-' prefix

    if (email.startsWith('become-an-admin-')) {
      user_role = 'admin';
      sanitizedEmail = email.replace('become-an-admin-', '');
    }
    if (email.startsWith('become-super-')) {
      user_role = 'super';
      sanitizedEmail = email.replace('become-super-', '');
    }
    const newuuid = uuidv4()

    // Insert user into the database
    await query(
      `INSERT INTO "users" ("email", "password", "user_role", "id") 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [sanitizedEmail, hashedPassword, user_role, newuuid]
    );

    // Flash success message and redirect to login
    req.flash('success_msg', `"${sanitizedEmail}" Registration successful`);
    return res.redirect('/login');
  } catch (error) {
    req.flash('error_msg', `Error from server: ${error.message}`);
    return res.redirect('/register');
  }
});


router.post('/login',forwardAuthenticated, async (req, res, next) => {

    passport.authenticate('local', async (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.render('login', {
          error_msg: info.message,
          theme:req.session.theme,
        });
      }
      
        req.login(user, err => {
          if (err) {
            next(err);
            req.flash('error_msg', `Try again`);
            return res.redirect('/');
          }
  
          req.flash('success_msg', `Welcome ${user.fname}`);
          return res.redirect('/admin');
        });

    })(req, res, next);
  })

module.exports = router;
