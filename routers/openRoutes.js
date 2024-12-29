const express = require('express')
// const path = require('path')
const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');


let appName = "Mr & miss unical 24/25"





// Welcome Page
router.get('/', async (req, res) => {
  const { rows: contestants } = await query('SELECT * FROM "contestants"');

  res.render('index', {
    pageTitle: `Welcome to ${appName}`,
    appName,
    contestants,
  });
})

router.get('/contestants', async (req, res) => {
  const { rows: contestants } = await query('SELECT * FROM "contestants"');
  res.render('contestants', {
    pageTitle: `Welcome to ${appName}`,
    appName,
    contestants,
  });
})


router.get('/contestants/:id/vote', async (req, res) => {
  const id = req.params.id
  const { rows: contestants } = await query('SELECT * FROM "contestants" WHERE id = $1', [id]);
  res.render('vote', {
    contestants:contestants[0],
  });
})

router.get('/standing', async (req, res) => {
  const { rows: standings } = await query('SELECT * FROM "contestants" ORDER BY vote_count DESC');

  res.render('standing', {
    pageTitle: `Welcome to ${appName}`,
    appName,
    standings,
  });
})


router.get('/prizes',  (req, res) => {

  res.render('prizes', {
    pageTitle: `Welcome to ${appName}`,
    appName,
  });
})

router.get('/contact',  (req, res) => {
  res.render('contact', {
    pageTitle: `Welcome to ${appName}`,
    appName
  });
})



router.get('/login',forwardAuthenticated,  (req, res) => {

  res.render('login', {
    pageTitle: `login`,
    appName
  });
})

router.get('/register',forwardAuthenticated,  (req, res) => {

  res.render('register', {
    pageTitle: `login`,
    appName
  });
})



module.exports = router;