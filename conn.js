const mysql = require('mysql');
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tracemate',
});
conn.connect((err) => {
  if (err) {
    console.error('Error : ' + err);
    throw err;
  }
  console.log('Connected Successfully');
});

module.exports = conn;
