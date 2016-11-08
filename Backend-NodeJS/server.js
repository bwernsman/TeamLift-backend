var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '12Password',
    database : 'teamlift'
});

// Connect to running MySQL instance
connection.connect();

connection.query('SELECT * FROM users', function(err, result, fields){

    if(err) {
        throw err;
    } else {

        console.log(result);
    }

});


// Close connection to running MySQL instance
connection.end(function(err) {

    console.log(err);
    
});

