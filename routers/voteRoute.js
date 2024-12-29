const express = require('express')
const fs = require('fs'); // Use fs.promises for file operations
const db = require("../model/databaseTable");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);
const router = express.Router();
const upload = require('../config/multerConfig'); // Import the Multer config
const {v4:uuidv4} = require('uuid')


router.post('/upload-receipt', upload.single('receipt'), async(req, res) => {
    const { fname, lname,trackingId, amount,contestantID, voteSum} = req.body;
    let filename = req.file ? req.file.filename : "default.jpg";
  
    
    const status = "unverified"
    const is_approved = false
    const newuuid = uuidv4()
    
    try {
        await query(
            `INSERT INTO "votesClaims" ("id","fname", "lname", "uuid","amount_paid","contestant_id","vote_count", "status", "is_approved", "uploaded_receipt_file") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [newuuid, fname, lname, trackingId, amount, contestantID, voteSum, status, is_approved, filename]);

          req.flash('success_msg', `${voteSum} vote(s) claim submited with ID "${trackingId}"`)
         return res.redirect('/contestants')

    } catch (error) {

        console.log(error);
        if (req.file) {
              fs.unlinkSync(req.file.path);
            }
        req.flash('error_msg', `${voteSum} vote(s) claim not submited "`)
       return res.redirect('/')
    }



})

module.exports = router;