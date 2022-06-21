const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const db = require('../config/db.js')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const path = require('path')

const photo_path = path.join(__dirname, '../images/')

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../images/'))
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`)
    }
})

let upload = multer({ storage: storage }).single("image")

router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

router.post('/saveStory', (req, res) => {
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO story (authid, writer, title, content, photo, category) VALUES (?, ?, ?, ?, ?, ?)'
            const params = [req.user.authid, rows[0].username, req.body.title, req.body.content, photo_path, req.body.category]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    upload(req, res, (err) => {
                        if (err) {
                            console.log(err) 
                            return res.json({ success: false });
                        } else {
                            const sql2 = 'INSERT INTO story_photo (story_id, photo) VALUES (?, ?)'
                            const params2 = [rows.insertId, req.body.imageName]
                            db.query(sql2, params2, (err, rows, cols) => {
                                console.log('saveStory completed.')
                                return res.json({
                                    success: true
                                })
                            })
                        }
                    })
                }
            })
        }
    })
})

router.post('/getStory', (req, res) => {
    const sql = `SELECT A.id as story_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as story_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM story LIMIT ${req.body.num}) as A LEFT JOIN story_comment as B ON B.story_id = A.id LEFT JOIN \
    story_love as C ON C.story_id = A.id LEFT JOIN story_photo as D ON D.story_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getStory completed.')
            res.json({storyData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/getHotStory', (req, res) => {
    const sql = `SELECT A.id as story_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as story_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM story ORDER BY love DESC LIMIT ${req.body.num}) as A LEFT JOIN story_comment as B ON B.story_id = A.id LEFT JOIN \
    story_love as C ON C.story_id = A.id LEFT JOIN story_photo as D ON D.story_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getHotStory completed.')
            res.json({hotStoryData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/uploadStoryComment', (req, res) => {
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO story_comment (story_id, writer, comment) VALUES (?, ?, ?)'
            const params = [req.body.story_id, rows[0].username, req.body.comment]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    db.query('SELECT comment FROM story WHERE id = ?', [req.body.story_id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            db.query('UPDATE story SET comment = ? WHERE id = ?', [rows[0].comment + 1, req.body.story_id], (err, rows, cols) => {
                                if (err) throw err
                                else {
                                    console.log('uploadStoryComment completed')
                                    res.json({success: true})
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

router.post('/getLoveUserStory', (req, res) => { // get loved user's story
    const sql = `SELECT A.target_authid as loveuser_authid, B.writer as writer, B.title as title, B.content as content, \
    B.photo as photo, B.category as category, B.love as love_num, B.comment as comment_num, B.created_at as story_created_at, C.comment as comment, \
    C.love as comment_love_num, C.created_at as comment_created_at, D.photo as photo_name FROM (SELECT * FROM users_love WHERE authid = ${req.user.authid} LIMIT ${req.body.num}) as A \
    LEFT JOIN story as B ON B.authid = A.target_authid LEFT JOIN story_comment as C ON C.story_id = B.id LEFT JOIN story_photo as D ON D.story_id = B.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getLoveUserGallery completed.')
            res.json({loveUserStoryData: rows, authid: req.user.authid}) // send MySQL story data including tables' data related to loved user table
        }
    })
})

router.post('/loveStory', (req, res) => { // love for story related to story table
    const sql = 'INSERT INTO story_love (story_id, authid) VALUES (?, ?)'
    const params = [req.body.story_id, req.user.authid]
    db.query(sql, params, (err, rows, cols) => {
        if (err) throw err
        else {
            db.query('SELECT love FROM story WHERE id = ?', [req.body.story_id], (err, rows, cols) => {
                if (err) throw err
                else {
                    db.query('UPDATE story SET love = ? WHERE id = ?', [rows[0].love + 1, req.body.story_id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            console.log('loveStory completed')
                            res.json({success: true})
                        }
                    })
                }
            })
        }
    })
})

router.post('/getLoveStory', (req, res) => { // get stories of the loved user story table
    const sql = `SELECT A.story_id as love_story_id, B.authid as authid, B.writer as writer, B.title as title, B.content as content, \
    B.photo as photo, B.category as category, B.love as love_num, B.comment as comment_num, B.created_at as story_created_at, C.comment as comment, \
    C.love as comment_love_num, C.created_at as comment_created_at, D.photo as photo_name FROM (SELECT * FROM story_love WHERE authid = ${req.user.authid} LIMIT ${req.body.num}) as A \
    LEFT JOIN story as B ON B.id = A.story_id LEFT JOIN story_comment as C ON C.story_id = A.story_id LEFT JOIN story_photo as D ON D.story_id = A.story_id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getLoveStory completed.')
            res.json({loveStoryData: rows, authid: req.user.authid}) // send MySQL story data including tables' data related to loved user story table
        }
    })
})

router.post('/getAuthidStory', (req, res) => {
    const sql = `SELECT A.id as story_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as story_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM story WHERE authid = ${req.body.authid} LIMIT ${req.body.num}) as A LEFT JOIN story_comment as B ON B.story_id = A.id LEFT JOIN \
    story_love as C ON C.story_id = A.id LEFT JOIN story_photo as D ON D.story_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getAuthidStory completed.')
            res.json({authidStoryData: rows})
        }
    })
})

router.post('/getIdStory', (req, res) => {
    const sql = `SELECT A.id as story_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as story_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM story WHERE id = ${req.body.id} LIMIT ${req.body.num}) as A LEFT JOIN story_comment as B ON B.story_id = A.id LEFT JOIN \
    story_love as C ON C.story_id = A.id LEFT JOIN story_photo as D ON D.story_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getIdStory completed.')
            res.json({idStoryData: rows})
        }
    })
})

module.exports = router;