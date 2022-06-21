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

router.post('/saveArticle', (req, res) => {
    console.log(req.body)
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO article (authid, writer, title, content, photo, category) VALUES (?, ?, ?, ?, ?, ?)'
            const params = [req.user.authid, rows[0].username, req.body.title, req.body.content, "/" + req.body.imageName, req.body.category]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    const sql2 = 'INSERT INTO article_photo (article_id, photo) VALUES (?, ?)'
                    const params2 = [rows.insertId,"/" + req.body.imageName]
                    db.query(sql2, params2, (err, rows, cols) => {
                        console.log('saveArticle completed.')
                        return res.json({
                            success: true
                        })
                    })
                }
            })
        }
    })
})

router.post('/getArticle', (req, res) => {
    const sql = `(SELECT * FROM article ORDER BY RAND() LIMIT ${req.body.num})`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getArticle completed.')
            res.json({articleData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/getHotArticle', (req, res) => {
    const sql = `SELECT A.id as article_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as article_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM article ORDER BY love DESC LIMIT ${req.body.num}) as A LEFT JOIN article_comment as B ON B.article_id = A.id LEFT JOIN \
    article_love as C ON C.article_id = A.id LEFT JOIN article_photo as D ON D.article_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getHotArticle completed.')
            res.json({hotArticleData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/uploadArticleComment', (req, res) => {
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO article_comment (article_id, writer, comment) VALUES (?, ?, ?)'
            const params = [req.body.article_id, rows[0].username, req.body.comment]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    db.query('SELECT comment FROM article WHERE id = ?', [req.body.article_id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            db.query('UPDATE article SET comment = ? WHERE id = ?', [rows[0].comment + 1, req.body.article_id], (err, rows, cols) => {
                                if (err) throw err
                                else {
                                    console.log('uploadArticleComment completed')
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

router.post('/getLoveUserArticle', (req, res) => { // get loved user's article
    const sql = `SELECT A.target_authid as loveuser_authid, B.writer as writer, B.title as title, B.content as content, \
    B.photo as photo, B.category as category, B.love as love_num, B.comment as comment_num, B.created_at as article_created_at, C.comment as comment, \
    C.love as comment_love_num, C.created_at as comment_created_at, D.photo as photo_name FROM (SELECT * FROM users_love WHERE authid = ${req.user.authid} LIMIT ${req.body.num}) as A \
    LEFT JOIN article as B ON B.authid = A.target_authid LEFT JOIN article_comment as C ON C.article_id = B.id LEFT JOIN article_photo as D ON D.article_id = B.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getLoveUserGallery completed.')
            res.json({loveUserArticleData: rows, authid: req.user.authid}) // send MySQL article data including tables' data related to loved user table
        }
    })
})

router.post('/getAuthidArticle', (req, res) => {
    const sql = `SELECT A.id as article_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as article_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM article WHERE authid = ${req.body.authid} LIMIT ${req.body.num}) as A LEFT JOIN article_comment as B ON B.article_id = A.id LEFT JOIN \
    article_love as C ON C.article_id = A.id LEFT JOIN article_photo as D ON D.article_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getAuthidArticle completed.')
            res.json({authidArticleData: rows})
        }
    })
})

router.post('/getIdArticle', (req, res) => {
    const sql = `SELECT A.id as article_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as article_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM article WHERE id = ${req.body.id} LIMIT ${req.body.num}) as A LEFT JOIN article_comment as B ON B.article_id = A.id LEFT JOIN \
    article_love as C ON C.article_id = A.id LEFT JOIN article_photo as D ON D.article_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getIdArticle completed.')
            res.json({idArticleData: rows})
        }
    })
})

module.exports = router;