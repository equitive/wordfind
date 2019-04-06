<?php
$servername = "localhost";
$username = "id8942090_cogsciuser";
$password = "Bandura6790";
$database = "id8942090_cogsci";

$user = $_POST['user'];
$puzzle =  $_POST['puzzle'];
$time = $_POST['time'];
$word = $_POST['word'];
$skipped = $_POST['skipped'];
$timestamp = $_POST['timestamp'];	


try {
    $conn = new PDO("mysql:host=$servername;dbname=$database", $username, $password);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // $sql = "CREATE TABLE word_data (
    //             user varchar(255),
    //             puzzle varchar(255),
    //             time varchar(255),
    //             word varchar(255),
    //             skipped varchar(255),
    //             timestamp varchar(255) 
    //         )";
    $sql = "INSERT INTO word_data (user, puzzle, time, word, skipped, timestamp)
    VALUES ('$user', '$puzzle', '$time', '$word', '$skipped', '$timestamp')";
    // use exec() because no results are returned
    $conn->exec($sql);
    echo "New record created successfully";
    }
catch(PDOException $e)
    {
    echo $sql . "<br>" . $e->getMessage();
    }
    
// try {
//     $conn = new PDO("mysql:host=$servername;dbname=$database", $username, $password);
//     // set the PDO error mode to exception
//     $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
//     echo "Connected successfully"; 
//     } catch(PDOException $e) {    
//     echo "Connection failed: " . $e->getMessage();
//     }
    
$conn = null;

?>


