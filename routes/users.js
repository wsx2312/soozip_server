const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const db = require('../config/db.js')
const cookieParser = require('cookie-parser')
const path = require('path')

router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

router.post('/modifyProfile', (req, res) => {
  const sql = 'UPDATE users SET username = ?, profile_photo = ?, profile_content = ? WHERE authid = ?'
  const params = [req.body.username, req.body.photo, req.body.content, req.user.authid]
  db.query(sql, params, (err, rows, cols) => {
      if (err) throw err
      else {
          console.log('modifyProfile completed')
          res.json({success: true, profileAuthid: req.user.authid})
      }
  })
})

router.post('/getUsers', (req, res) => {
    const sql = 'SELECT * FROM users LIMIT ?'
    const params = [req.body.num]
    db.query(sql, params, (err, rows, cols) => {
        if (err) throw err
        else {
            res.json({success: true, datas:rows})
        }
    })
})

router.get('/getProfile', (req, res) => { // with user badge data (badge_num is not the number of badge. just badge number e.g. 1 == good)
  const sql = 'SELECT * FROM users WHERE authid = ?'
  const params = [req.user.authid]
  db.query(sql, params, (err, rows, cols) => {
      if (err) throw err
      else {
          console.log('getProfile completed')
          res.json({profileData: rows})
      }
  })
})

router.post('/getAuthidProfile', (req, res) => { // added
  const sql = 'SELECT * FROM users WHERE authid = ?'
  const params = [req.body.authid]
  db.query(sql, params, (err, rows, cols) => {
      if (err) throw err
      else {
          console.log('getAuthidProfile completed')
          res.json({authidProfileData: rows})
      }
  })
}) // get the profile information of given user authid

router.post('/loveUser', (req, res) => { // obviously, loveUser equals to user's gallery love.
  const sql = 'INSERT INTO users_love (authid, target_authid) VALUES (?, ?)'
  const params = [req.user.authid, req.body.target_authid]
  db.query(sql, params, (err, rows, cols) => {
      if (err) throw err
      else {
          db.query('SELECT love FROM users WHERE authid = ?', [req.body.target_authid], (err, rows, cols) => {
              if (err) throw err
              else {
                  db.query('UPDATE users SET love = ? WHERE authid = ?', [rows[0].love + 1, req.body.target_authid], (err, rows, cols) => {
                      if (err) throw err
                      else {
                          console.log('loveUser completed')
                          res.json({success: true})
                      }
                  })
              }
          })
      }
  })
})

router.post('/cancelLoveUser', (req, res) => {
  const sql = 'DELETE FROM users_love WHERE authid = ? AND target_authid = ?'
  const params = [req.user.authid, req.body.target_authid]
  db.query(sql, params, (err, rows, cols) => {
      if (err) throw err
      else {
          db.query('SELECT love FROM users WHERE authid = ?', [req.body.target_authid], (err, rows, cols) => {
              if (err) throw err
              else {
                  db.query('UPDATE users SET love = ? WHERE authid = ?', [rows[0].love - 1, req.body.target_authid], (err, rows, cols) => {
                      if (err) throw err
                      else {
                          console.log('cancelLoveUser completed')
                          res.json({success: true})
                      }
                  })
              }
          })
      }
  })
})

router.post('/getUserInformation', (req, res) => {
    const sql = 'SELECT * FROM users WHERE authid = ?'
    const params = [req.body.authid]
    db.query(sql, params, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getAuthidProfile function completed')
            const data1 = rows // authidProfileData
            const sql2 = `SELECT * from gallery where authid = ?`
            db.query(sql2,[req.body.authid], (err, rows, cols) => {
                if (err) throw err
                else {
                    console.log('getAuthidCollection function completed.')
                    const data2 = rows // authidCollectionData
                    const sql3 = `SELECT A.id as story_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
                    A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as story_created_at, B.comment as comment, \
                    B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
                    FROM (SELECT * FROM story WHERE authid = ?) as A LEFT JOIN story_comment as B ON B.story_id = A.id LEFT JOIN \
                    story_love as C ON C.story_id = A.id LEFT JOIN story_photo as D ON D.story_id = A.id`
                    db.query(sql3, [req.body.authid], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            console.log('getAuthidStory function completed.')
                            const data3 = rows // authidStoryData
                            const sql4 = `SELECT A.id as article_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, A.photo as photo, \
                            A.category as category, A.love as love_num, A.comment as comment_num, A.created_at as article_created_at, B.comment as comment, \
                            B.love as comment_love_num, B.created_at as comment_created_at, C.authid as love_authid, D.photo as photo_name \
                            FROM (SELECT * FROM article WHERE authid = ?) as A LEFT JOIN article_comment as B ON B.article_id = A.id LEFT JOIN \
                            article_love as C ON C.article_id = A.id LEFT JOIN article_photo as D ON D.article_id = A.id`
                            db.query(sql4,[req.body.authid], (err, rows, cols) => {
                                if (err) throw err
                                else {
                                    console.log('getAuthidArticle function completed.\ngetUserInformation completed.')
                                    const data4 = rows // authidArticleData
                                    res.json({authidProfileData: data1, authidCollectionData: data2, authidStoryData: data3, authidArticleData: data4})
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

module.exports = router;