const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const db = require('../config/db.js')
const cookieParser = require('cookie-parser')
const path = require('path')

router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

router.post('/saveQna', (req, res) => {
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO qna (authid, writer, title, content, category) VALUES (?, ?, ?, ?, ?)'
            const params = [req.user.authid, rows[0].username, req.body.title, req.body.content, req.body.category]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    res.json({success: true})
                    console.log('saveQna completed.')
                }
            })
        }
    })
})

router.post('/getQna', (req, res) => {
    const sql = `SELECT A.id as qna_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, \
    A.category as category, A.love as love_num, A.comment as answer_num, A.created_at as qna_created_at, B.title as answer_title, \
    B.content as answer_content, B.created_at as answer_created_at, C.authid as love_authid \
    FROM (SELECT * FROM qna LIMIT ${req.body.num}) as A LEFT JOIN qna_answer as B ON B.qna_id = A.id LEFT JOIN \
    qna_love as C ON C.qna_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getQna completed.')
            res.json({qnaData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/getHotQna', (req, res) => {
    const sql = `SELECT A.id as qna_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, \
    A.category as category, A.love as love_num, A.comment as answer_num, A.created_at as qna_created_at, B.title as answer_title, \
    B.content as answer_content, B.created_at as answer_created_at, C.authid as love_authid \
    FROM (SELECT * FROM qna ORDER BY love DESC LIMIT ${req.body.num}) as A LEFT JOIN qna_answer as B ON B.qna_id = A.id LEFT JOIN \
    qna_love as C ON C.qna_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getQna completed.')
            res.json({qnaData: rows}) // NOTE! confirm this data necessarily.
        }
    })
})

router.post('/uploadQnaAnswer', (req, res) => {
    db.query('SELECT username FROM users WHERE authid = ?', [req.user.authid], (err, rows, cols) => {
        if (err) throw err
        else {
            const sql = 'INSERT INTO qna_answer (qna_id, writer, content) VALUES (?, ?, ?)'
            const params = [req.body.qna_id, rows[0].username, req.body.content]
            db.query(sql, params, (err, rows, cols) => {
                if (err) throw err
                else {
                    db.query('SELECT comment FROM qna WHERE id = ?', [req.body.qna_id], (err, rows, cols) => {
                        if (err) throw err
                        else {
                            db.query('UPDATE qna SET comment = ? WHERE id = ?', [rows[0].comment + 1, req.body.qna_id], (err, rows, cols) => {
                                if (err) throw err
                                else {
                                    console.log('uploadQnaAnswer completed')
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

router.post('/getAuthidQna', (req, res) => {
    const sql = `SELECT A.id as qna_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, \
    A.category as category, A.love as love_num, A.comment as answer_num, A.created_at as qna_created_at, B.title as answer_title, \
    B.content as answer_content, B.created_at as answer_created_at, C.authid as love_authid \
    FROM (SELECT * FROM qna WHERE authid = ${req.body.authid} LIMIT ${req.body.num}) as A LEFT JOIN qna_answer as B ON B.qna_id = A.id LEFT JOIN \
    qna_love as C ON C.qna_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getAuthidQna completed.')
            res.json({authidQnaData: rows})
        }
    })
})

router.post('/getIdQna', (req, res) => {
    const sql = `SELECT A.id as qna_id, A.authid as authid, A.writer as writer, A.title as title, A.content as content, \
    A.category as category, A.love as love_num, A.comment as answer_num, A.created_at as qna_created_at, B.title as answer_title, \
    B.content as answer_content, B.created_at as answer_created_at, C.authid as love_authid \
    FROM (SELECT * FROM qna WHERE id = ${req.body.id} LIMIT ${req.body.num}) as A LEFT JOIN qna_answer as B ON B.qna_id = A.id LEFT JOIN \
    qna_love as C ON C.qna_id = A.id`
    db.query(sql, (err, rows, cols) => {
        if (err) throw err
        else {
            console.log('getIdQna completed.')
            res.json({idQnaData: rows})
        }
    })
})

module.exports = router;