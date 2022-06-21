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


router.get('/', (req, res) => {
    res.json({success: true});
})


router.post('/getAuthidCollection', (req, res) => {
    console.log(req.body)
    const sql = `SELECT A.id as gallery_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as gallery_created_at, B.comment as comment, \
    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
    FROM (SELECT * FROM gallery WHERE authid = ?) as A LEFT JOIN gallery_comment as B ON B.gallery_id = A.id LEFT JOIN \
    gallery_love as C ON C.gallery_id = A.id LEFT JOIN gallery_photo as D ON D.gallery_id = A.id`
    db.query(sql,['Zxcv05@naver.com'], (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getAuthidCollection completed.')
            res.json({authidCollectionData: rows})
        }
    })
})

// SLEEP ON IMPLEMENTING DELETE FUNCTION

/*
router.post('/searchKeyword', (req, res) => { // JOIN!!!!! have to fix
    let searchedGalleryData = {gallery: [], gallery_comment: [], gallery_love: [], gallery_photo: []} // gallery objects array
    let searchedStoryData = {story: [], story_comment: [], story_love: [], story_photo: []} // story objects array
    let searchedArticleData = {article: [], article_comment: [], article_love: [], article_photo: []} // article objects array
    let searchedQnaData = {qna: [], qna_answer: [], qna_love: []} // qna objects array
    const sqlGallery = `SELECT * FROM gallery WHERE title LIKE '%${req.body.keyword}%' OR content LIKE '%${req.body.keyword}%'`
    const sqlStory = `SELECT * FROM story WHERE title LIKE '%${req.body.keyword}%' OR content LIKE '%${req.body.keyword}%'`
    const sqlArticle = `SELECT * FROM article WHERE title LIKE '%${req.body.keyword}%' OR content LIKE '%${req.body.keyword}%'`
    const sqlQna = `SELECT * FROM qna WHERE title LIKE '%${req.body.keyword}%' OR content LIKE '%${req.body.keyword}%'`
    db.query(sqlGallery, (err, rows, cols) => {
        if (err) throw err
        else {
            searchedGalleryData.gallery = rows
            for (let i = 0; i < rows.length; ++i) {
                db.query(`SELECT * FROM gallery_comment WHERE gallery_id = ?`, [rows[i].id], (err, rows, cols) => {
                    if (err) throw err
                    else {
                        searchedGalleryData.gallery_comment.push(rows)
                    }
                })
                db.query(`SELECT * FROM gallery_love WHERE gallery_id = ?`, [rows[i].id], (err, rows, cols) => {
                    if (err) throw err
                    else {
                        searchedGalleryData.gallery_love.push(rows)
                    }
                })
                db.query(`SELECT * FROM gallery_photo WHERE gallery_id = ?`, [rows[i].id], (err, rows, cols) => {
                    if (err) throw err
                    else {
                        searchedGalleryData.gallery_photo.push(rows)
                    }
                })
            }
        }
    })
})

router.post('/searchCategory', (req, res) => {

})
*/
/*
router.get('/getFollows', (req, res) => { // JOIN!!!!! have to fix
    const sql = 'SELECT * FROM users_follow WHERE authid = ?'
    const params = [req.user.authid]
    let followerId = []
    let followerGalleryData = {gallery: [], gallery_comment: [], gallery_love: [], gallery_photo: []} // gallery objects array
    let followerStoryData = {story: [], story_comment: [], story_love: [], story_photo: []} // story objects array
    db.query(sql, params, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('get stories and collections of followers(additionally, getting the number of comments)')
            for (let i = 0; i < rows.length; ++i) {
                if (rows[i].authid === req.user.authid) {
                    followerId.push(rows[i].target_authid)
                }
                if (rows[i].target_authid === req.user.authid) {
                    followerId.push(rows[i].authid)
                }
            }
            for (let i = 0; i < followerId.length; ++i) {
                db.query(`SELECT * FROM gallery WHERE authid = ?`, [followerId[i]], (err, rows, cols) => {
                    if (err) throw err
                    else {
                        followerGalleryData.gallery.push(rows)
                    }
                })
                db.query(`SELECT * FROM story WHERE authid = ?`, [followerId[i]], (err, rows, cols) => {
                    if (err) throw err
                    else {
                        followerStoryData.story.push(rows)
                    }
                })
            }
            for (let i = 0; i < followerGalleryData.gallery.length; ++i) {
                for (let j = 0; j < followerGalleryData.gallery[i].length; ++j) {
                    db.query(`SELECT * FROM gallery_comment WHERE gallery_id = ?`, [followerGalleryData.gallery[i][j].id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            followerGalleryData.gallery_comment.push(rows)
                        }
                    })
                    db.query(`SELECT * FROM gallery_love WHERE gallery_id = ?`, [followerGalleryData.gallery[i][j].id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            followerGalleryData.gallery_love.push(rows)
                        }
                    })
                    db.query(`SELECT * FROM gallery_photo WHERE gallery_id = ?`, [followerGalleryData.gallery[i][j].id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            followerGalleryData.gallery_photo.push(rows)
                        }
                    })
                }
            }
            for (let i = 0; i < followerStoryData.story.length; ++i) {
                for (let j = 0; j < followerStoryData.story[i].length; ++j) {
                    db.query(`SELECT * FROM story_comment WHERE story_id = ?`, [followerStoryData.story[i][j].id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            followerStoryData.story_comment.push(rows)
                        }
                    })
                    db.query(`SELECT * FROM story_love WHERE story_id = ?`, [followerStoryData.story[i][j].id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            followerStoryData.story_love.push(rows)
                        }
                    })
                    db.query(`SELECT * FROM story_photo WHERE story_id = ?`, [followerStoryData.story[i][j].id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            followerStoryData.story_photo.push(rows)
                        }
                    })
                }
            }
        }
    })
    res.json({followerId: followerId, followerGalleryData: followerGalleryData, followerStoryData: followerStoryData})
}) // get stories and collections of followers(additionally, getting the number of comments)
*/

router.post('/uploadImage', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err) 
            return res.json({ success: false });
        } else {
            return res.json({
                success: true,
                image: res.req.file.path,
                fileName: res.req.file.filename,
            })
        }
    })
})

module.exports = router;