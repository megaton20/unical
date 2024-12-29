const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
require('dotenv').config();


// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows: results } = await query('SELECT * FROM "users" WHERE id = $1', [id]);

    if (results.length === 0) {
      console.warn(`User with ID ${id} not found during deserialization.`);
      return done(null, false); 
    }

  
    

    done(null, results[0]); // User found, return the user object
  } catch (err) {
    console.error(`Error during deserialization of user with ID ${id}:`, err);
    done(err, null); 
  }
});





// Local strategy for traditional login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    // Query the database for a user with the provided email
    const {rows:results} = await query('SELECT * FROM "users" WHERE email = $1', [email]);

    // Check if any user was found
    if (results.length <= 0) {
      return done(null, false, { message: 'User does not exist' });
    }

    // Extract the user from the query results
    const user = results[0];

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect email or password' });
    }

    // If everything is okay, return the user object
    return done(null, user);
  } catch (err) {
    // Log any errors and return an error response
    console.error('Error during authentication:', err);
    return done(err);
  }
}));




module.exports = passport;
