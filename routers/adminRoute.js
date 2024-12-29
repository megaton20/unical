const express = require('express')
const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const upload = require('../config/multerConfig'); // Import the Multer config
const path = require('path')
const fs = require('fs')
const {v4:uuidv4} = require('uuid')





let appName = "Mr & miss unical 24/25"


// admin Page
router.get('/', ensureAuthenticated, async (req, res) => {

  try {
    const { rows: contestants } = await query('SELECT * FROM "contestants"');
    const { rows: votesClaims } = await query('SELECT * FROM "votesClaims" WHERE is_approved = $1',[false]);
    const { rows: allVotes } = await query('SELECT * FROM "votesClaims"');

    res.render('admin', {
      appName,
      contestants,
      allVotes,
      votesClaims,
    });


  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.get('/all-votes', ensureAuthenticated, async (req, res) => {

  try {
    const { rows: votesClaims } = await query(`SELECT * FROM "votesClaims" WHERE is_approved = false AND status != 'query'`);

    res.render('admin-all-votes', {
      appName,
      votesClaims,
    });


  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.get('/new-votes', ensureAuthenticated, async (req, res) => {

  try {

    const { rows: votesClaims } = await query(`SELECT * FROM "votesClaims" WHERE is_approved = false`);

    res.render('admin-new-votes', {
      appName,
      votesClaims,
    })
  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.get('/approved-votes', ensureAuthenticated, async (req, res) => {

  try {
    const { rows: votesClaims } = await query(`SELECT * FROM "votesClaims" WHERE is_approved = true`);

    res.render('admin-approved-votes', {
      appName,
      votesClaims,
    });
  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.get('/queried-votes', ensureAuthenticated, async (req, res) => {

  try {
    const { rows: votesClaims } = await query(`SELECT * FROM "votesClaims" WHERE is_approved = false AND status = $1`, ['query']);

    res.render('admin-queried-votes', {
      appName,
      votesClaims,
    });

  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})






router.get('/contestants', ensureAuthenticated, async (req, res) => {

  try {
    const { rows: contestants } = await query('SELECT * FROM "contestants"');
    res.render('admin-contestants', {
      appName,
      contestants,
    });


  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.get('/view-contestant/:id', ensureAuthenticated, async (req, res) => {
  const id = req.params.id
  try {

    const { rows: voteFor } = await query('SELECT * FROM "contestants" WHERE id = $1', [id]);
    if (voteFor.length <= 0) {
      req.flash('error_msg', "no contestants registered")
      return res.redirect('/admin')
    }
    res.render('admin-contestant-data', {
      appName,
      voteFor,
    });


  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.put('/edit-contestant/:id', ensureAuthenticated, async (req, res) => {
  const id = req.params.id;
  const { fname, lname, bio } = req.body;

  // Validation: Ensure fname and lname are not empty
  if (!fname || !lname) {
    req.flash('error_msg', 'First name and last name cannot be empty.');
    return res.redirect('/admin');
  }

  try {
    // Update only fname, lname, and bio
    await query(
      `UPDATE "contestants" SET fname = $1, lname = $2, bio = $3 WHERE id = $4`,
      [fname, lname, bio, id]
    );

    req.flash('success_msg', 'Contestant updated successfully');
    return res.redirect('/admin/contestants');

  } catch (error) {
    console.log(error);
    req.flash('error_msg', "Error from server");
    return res.redirect('/admin');
  }
});



router.get('/view-vote/:id', ensureAuthenticated, async (req, res) => {
  const id = req.params.id
  try {

    const { rows: singleClaims } = await query('SELECT * FROM "votesClaims" WHERE id = $1', [id]);
    
    if (singleClaims.length <= 0) {
      req.flash('error_msg', "no claim registered")
      return res.redirect('/admin')
    }
    const { rows: contestant } = await query('SELECT * FROM "contestants" WHERE id = $1', [singleClaims[0].contestant_id]);
    res.render('admin-vote-data', {
      appName,
      singleClaims: singleClaims[0],
      contestant:contestant[0]
    });


  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})


router.put('/accept-vote/:id', ensureAuthenticated, async (req, res) => {
  const id = req.params.id;

  try {
    // Fetch vote claim and contestant info
    const { rows: singleClaims } = await query('SELECT * FROM "votesClaims" WHERE id = $1', [id]);
    const { rows: contestant } = await query('SELECT * FROM "contestants" WHERE id = $1', [singleClaims[0].contestant_id]);

    // Get the old vote count and calculate the new one
    const oldVote = contestant[0].vote_count;
    const newVote = oldVote + singleClaims[0].vote_count;

    // Update the contestant's vote count
    await query('UPDATE "contestants" SET vote_count = $1 WHERE id = $2', [newVote, contestant[0].id]);

    // Update the claim to be approved
    await query('UPDATE "votesClaims" SET status = $1, is_approved = $2 WHERE id = $3', ['verified', true, id]);

    req.flash('success_msg', `Old vote was ${oldVote} and new total vote is ${newVote}`);
    return res.redirect('/admin');
  } catch (error) {
    console.log(error);
    req.flash('error_msg', "Error from server");
    return res.redirect('/admin');
  }
});

router.put('/query-vote/:id', ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;

    // Update the claim status and is_approved to false
    await query('UPDATE "votesClaims" SET status = $1, is_approved = $2 WHERE id = $3', ['query', false, id]);

    req.flash('warning_msg', `Claim has been queried!`);
    return res.redirect('/admin');
  } catch (error) {
    console.log(error);
    req.flash('error_msg', "Error from server");
    return res.redirect('/admin');
  }
});



router.get('/add-contestant', ensureAuthenticated, async (req, res) => {

  try {
    res.render('admin-create-contestant', {
      appName,
    });
  } catch (error) {
    console.log(error);
    req.flash('error_msg', "error from server ")
    return res.redirect('/admin')
  }
})

router.post('/add-contestant', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const { fname, lname,bio } = req.body;
  // Handle image file, defaulting to "default.jpg" if no file is uploaded
  let image = req.file ? req.file.filename : "default.jpg";

  // Define additional fields
  const status = "active"; 
  const photo_url = `${image}`;
  const vote_count = 0
  const newuuid = uuidv4()

  try {
    await query(
      `INSERT INTO contestants (fname, lname, status, photo_url,bio,vote_count,id)
       VALUES ($1, $2, $3, $4,$5, $6,$7)`,
      [fname, lname, status, photo_url,bio,vote_count,newuuid]
    );

    req.flash('success_msg', `Contestant ${fname} ${lname} added successfully!`);    
    res.redirect('/admin/contestants');
  } catch (error) {
    console.error(error);
    // Flash error message if there's an issue
    req.flash('error_msg', 'There was an error adding the contestant');
    // Redirect to the admin page in case of error
    return res.redirect('/admin');
  }
});


router.delete('/delete-contestant/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params; // Get the contestant ID from the URL parameter

  try {
    // First, retrieve the contestant's data to get the image filename
    const contestantResult = await query(`SELECT "photo_url" FROM contestants WHERE "id" = $1`,[id]);

    // If the contestant does not exist, return an error response
    if (contestantResult.rows.length === 0) {
      req.flash('error_msg', 'Contestant not found');
      return res.redirect('/admin/contestants');
    }

    // Get the photo_url (image path) of the contestant
    const photo_url = contestantResult.rows[0].photo_url;

    // Delete the contestant from the database
    await query(`DELETE FROM contestants WHERE "id" = $1`,[id]);

    // If the contestant had an image, delete the image file from the server
    if (photo_url !== 'default.jpg') {
      const imagePath = path.join(__dirname, '..', 'public', '/uploads', path.basename(photo_url));
      
      // Check if the file exists and delete it
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.log('Error deleting image:', err);
        } else {
          console.log('Image deleted successfully');
        }
      });
    }

    // Flash success message and redirect
    req.flash('success_msg', 'Contestant deleted successfully');
    res.status(200).redirect('/admin/contestants');
  } catch (error) {
    console.error('Error during deletion:', error);
    req.flash('error_msg', 'An error occurred while deleting the contestant');
    res.status(500).redirect('/admin');
  }
});


module.exports = router;