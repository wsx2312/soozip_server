var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
const port = 3001

var authRouter = require('./routes/auth')
var indexRouter = require('./routes/index')
var galleryRouter = require('./routes/gallery')
var storyRouter = require('./routes/story')
var articleRouter = require('./routes/article')
var qnaRouter = require('./routes/qna')
var usersRouter = require('./routes/users')
var testRouter = require('./routes/test')

var app = express();

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
//app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'images')))

app.use('/', authRouter) // authentication
app.use('/api', indexRouter) // api, index
app.use('/gallery', galleryRouter) // gallery
app.use('/story', storyRouter) // story
app.use('/article', articleRouter) // article
app.use('/qna', qnaRouter) // qna
app.use('/users', usersRouter) // users
app.use('/test', testRouter) // testing

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.send('error');//this or res.status(err.status || 500).send('error')
  console.log(err)
});

app.listen(port, () => {
  console.log(`Server is listening on ${port}!`)
})
