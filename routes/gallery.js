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

router.post('/saveCollection', (req, res) => {
    console.log(req.user)
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO gallery (authid, writer, title, content, photo, category) VALUES (?, ?, ?, ?, ?, ?)'
            const params = [req.user.authid, rows[0].username, req.body.title, req.body.content, "/" + req.body.imageName, req.body.category]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    const sql2 = 'INSERT INTO gallery_photo (gallery_id, photo) VALUES (?, ?)'
                    const params2 = [rows.insertId, "/" + req.body.imageName]
                    db.query(sql2, params2, (err, rows, cols) => {
                        console.log('saveCollection completed.')
                        return res.json({
                            success: true
                        })
                    })
                }
            })
        }
    })
})

router.post('/getGallery', (req, res) => {
    const sql = `(SELECT * FROM gallery ORDER BY authid LIMIT ${req.body.num})`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getGallery completed.')
            res.json({galleryData: rows}) // send MySQL gallery data including tables' data related to gallery table
        }
    })
})
router.post('/getcomments', (req, res) => {
    const sql = `(SELECT * FROM gallery_comment WHERE gallery_id = ?)`
    db.query(sql,[req.body.id], (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getcomments completed.')
            res.json({datas: rows}) // send MySQL gallery data including tables' data related to gallery table
        }
    })
})

router.post('/getRecommendedGallery', (req, res) => {
    db.query(`SELECT authid FROM users WHERE love >= 0 ORDER BY RAND() LIMIT ${req.body.num}`, (err, rows, cols) => {
        if (err) throw err
        else {
            res.json({recommendGalleries: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/getHotGallery', (req, res) => {
    db.query('SELECT authid FROM users ORDER BY love DESC LIMIT 5', (err, rows, cols) => {
        if (err) throw err
        else {
            let popularAuthid = []
            for (let i = 0; i < rows.length; ++i) {
                popularAuthid.push(rows[i].authid)
            }
            const sql = `SELECT A.id as gallery_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
            A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as gallery_created_at, B.comment as comment, \
            B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
            FROM (SELECT * FROM gallery ORDER BY authid LIMIT ?) as A LEFT JOIN gallery_comment as B ON B.gallery_id = A.id LEFT JOIN \
            gallery_love as C ON C.gallery_id = A.id LEFT JOIN gallery_photo as D ON D.gallery_id = A.id`
            db.query(sql, [req.body.num],  (err, rows, cols) => {
                if (err) throw err
                else {
                    for (let i = 0; i < rows.length; ++i) {
                        if (!popularAuthid.includes(rows[i].authid)) {
                            delete rows[i]
                        }
                    }
                    let data = rows.filter(
                        (item) => {
                            return item !== undefined
                        }
                    )
                    console.log('getHotGallery completed.')
                    res.json({hotGalleryData: data}) // NOTE! confirm this data necessarily.
                }
            })
        }
    })
})

router.post('/getHotCollection', (req, res) => {
    const sql = `SELECT A.id as gallery_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as gallery_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM gallery ORDER BY love DESC LIMIT ${req.body.num}) as A LEFT JOIN gallery_comment as B ON B.gallery_id = A.id LEFT JOIN \
    gallery_love as C ON C.gallery_id = A.id LEFT JOIN gallery_photo as D ON D.gallery_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getHotCollection completed.')
            res.json({hotCollectionData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/uploadGalleryComment', (req, res) => {
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO gallery_comment (gallery_id, writer, comment) VALUES (?, ?, ?)'
            const params = [req.body.gallery_id, rows[0].username, req.body.comment]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    db.query('SELECT comment FROM gallery WHERE id = ?', [req.body.gallery_id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            db.query('UPDATE gallery SET comment = ? WHERE id = ?', [rows[0].comment + 1, req.body.gallery_id], (err, rows, cols) => {
                                if (err) throw err
                                else {
                                    console.log('uploadGalleryComment completed')
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

router.post('/getLoveUserCollection', (req, res) => { // get loved user's collection in gallery table
    const sql = `SELECT A.target_authid as loveuser_authid, B.writer as writer, B.title as title, B.content as content, \
    B.photo as photo, B.category as category, B.love as love_num, B.comment as comment_num, B.created_at as gallery_created_at FROM (SELECT * FROM users_love WHERE authid = ${req.user.authid} LIMIT ${req.body.num}) as A \
    LEFT JOIN gallery as B ON B.authid = A.target_authid`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getLoveUserCollection completed.')
            res.json({loveUserCollectionData: rows, authid: req.user.authid}) // send MySQL gallery data including tables' data related to loved user table
        }
    })
})

router.get('/getLoveUsers', (req, res) => { // get loved user's collection in gallery table
    const sql = `(SELECT * FROM users_love WHERE authid = ?`
    db.query(sql,[req.body.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getLoveUserCollection completed.')
            res.json({loveUsers: rows}) // send MySQL gallery data including tables' data related to loved user table
        }
    })
})

router.post('/loveGallery', (req, res) => { // love for collections the gallery include
    const sql = 'INSERT INTO gallery_love (gallery_id, authid) VALUES (?, ?)'
    const params = [req.body.gallery_id, req.user.authid]
    db.query(sql, params, (err, rows, cols) => {
        if (err) throw err
        else {
            db.query('SELECT love FROM gallery WHERE id = ?', [req.body.gallery_id], (err, rows, cols) => {
                if (err) throw err
                else {
                    db.query('UPDATE gallery SET love = ? WHERE id = ?', [rows[0].love + 1, req.body.gallery_id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            console.log('loveGallery completed')
                            res.json({success: true})
                        }
                    })
                }
            })
        }
    })
})

router.post('/getLoveGallery', (req, res) => { // get collections of the loved user gallery table
    const sql = `SELECT A.gallery_id as love_gallery_id, B.authid as authid, B.writer as writer, B.title as title, B.content as content, \
    B.photo as photo, B.category as category, B.love as love_num, B.comment as comment_num, B.created_at as gallery_created_at, C.comment as comment, \
    C.love as comment_love_num, C.created_at as comment_created_at, D.photo as photo_name FROM (SELECT * FROM gallery_love WHERE authid = ${req.user.authid} LIMIT ${req.body.num}) as A \
    LEFT JOIN gallery as B ON B.id = A.gallery_id LEFT JOIN gallery_comment as C ON C.gallery_id = A.gallery_id LEFT JOIN gallery_photo as D ON D.gallery_id = A.gallery_id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getLoveGallery completed.')
            res.json({loveGalleryData: rows, authid: req.user.authid}) // send MySQL gallery data including tables' data related to loved user gallery table
        }
    })
})

router.post('/getAuthidCollection', (req, res) => {
    const sql = `SELECT * from gallery where authid=?`
    db.query(sql,[req.body.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getAuthidCollection completed.')
            res.json({authidCollectionData: rows})
        }
    })
})

router.post('/getIdCollection', (req, res) => {
    console.log("바디", req.body.id)
    const sql = `SELECT * FROM gallery WHERE id = ?`
    db.query(sql,[req.body.id], (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getIdCollection completed.')
            res.json({idCollectionData: rows})
        }
    })
})

module.exports = router;