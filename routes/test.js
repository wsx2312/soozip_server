const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const db = require('../config/db.js')
const cookieParser = require('cookie-parser')
const path = require('path')


router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

router.get('/mysql', (req, res) => {
    db.query('SELECT title as tit FROM gallery WHERE authid = ?', ['pilso'], (err, rows, cols) => {
        console.log(rows[0])
    })
})

module.exports = router;