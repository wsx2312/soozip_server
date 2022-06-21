const express = require('express');
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bkfd2Password = require('pbkdf2-password')
const hasher = bkfd2Password()
const router = express.Router()
const cookieParser = require('cookie-parser')
const db = require('../config/db.js')
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
})

router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(cookieParser());

router.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MySQLStore({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
    })
}))

router.use(passport.initialize())
router.use(passport.session())

passport.serializeUser(function (user, done){
    console.log('[SerializeUser]', user);
    done(null, user.authid);
})

passport.deserializeUser(function (authid, done){
    console.log('[DeserializeUser]', authid) // authid parameter ===  user.authid value in serializeUser method.
    db.query(
        'SELECT * FROM users WHERE authid=?',
        [authid],
        function (err, results) {
        if (err) done(err)
        if (!results[0]) done(err)
        let user = results[0]
        done(null, user) // remember that parameter user will be request.user!
    })
})

passport.use(new LocalStrategy({
        usernameField: 'authid',
        passwordField: 'password'
    },
    function (authid, password, done) {
      db.query(
        'SELECT * FROM users WHERE authId=?',
        [authid],
        function (err, results) {
          if (err) return done(err) // the case 1 entered user information is not in MySQL.
          if (!results[0]) return done(err) // the case 2 entered user information is not in MySQL.
          let user = results[0] // the case proper user information exists.
          return hasher(
            { password: password, salt: user.salt },
            function (err, pass, salt, hash) {
                if (hash === user.password) { // confirm user's password is correct.
                    console.log('LocalStrategy', user)
                    done(null, user) // transmit user value to the first parameter of passport.serializeUser.
                }
                else done(null, false)
          })
    })
}))

router.post('/register_process', (req, res) => {
    hasher(
        { password: req.body.password },
        (err, pass, salt, hash) => {
            let user = {
                authid: req.body.authid,
                username: req.body.username,
                name: req.body.username,
                password: hash,
                salt: salt,
            }
            db.query(
                'INSERT INTO users SET ?',
                user,
                (err, results) => {
                if (err) throw err
                res.json({success: true})
            })
        }
    )
})

router.post('/login',
    passport.authenticate(
        'local',
        {
            successRedirect: '/api',
            failureRedirect: '/login_fail',
            failureFlash: false
        }
    ),
    (req, res) => {
        if (req.user) {
            let success = {auth: 'success'}
            res.json({auth:'success', user:req.user})
        }
        else {
            let failure = {auth: 'failure'}
            res.json(failure)
        }
    }
)

router.get('/logout', function(req, res){
    req.logout();
    req.session.save(function(){
      res.redirect('/')
    })
    res.json({logout: true})
})


module.exports = router;