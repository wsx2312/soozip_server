const mysql = require('mysql')
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
})

const db_info = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

const db = mysql.createConnection(db_info)
db.connect()

module.exports = db