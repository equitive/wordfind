<?php
$servername = "localhost";
$username = "id8942090_cogsciuser";
$password = "Bandura6790";
$database = "id8942090_cogsci";

$user = $_POST['user'];
$puzzle =  $_POST['puzzle'];
$time = $_POST['time'];
$present_words_left = $_POST['present_words_left'];
$total_words_left = $_POST['total_words_left'];	
$words_in_puzzle = $_POST['words_in_puzzle'];
$puzzle_skipped =  $_POST['puzzle_skipped'];
$words_skipped = $_POST['words_skipped'];
$words_skipped = $_POST['words_found'];
$timestamp = $_POST['timestamp'];	


try {
    $conn = new PDO("mysql:host=$servername;dbname=$database", $username, $password);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // $sql = "CREATE TABLE experiment_data (
    //             user varchar(255),
    //             puzzle varchar(255),
    //             time varchar(255),
    //             present_words_left varchar(255),
    //             total_words_left varchar(255),
    //             words_in_puzzle varchar(255),
    //             puzzle_skipped varchar(255),
    //             words_skipped varchar(255),
    //             words_found varchar(255),
    //             timestamp varchar(255) 
    //         )";
    $sql = "INSERT INTO experiment_data (user, puzzle, time, present_words_left, total_words_left, words_in_puzzle, puzzle_skipped, words_skipped, words_found, timestamp)
    VALUES ('$user', '$puzzle', '$time', '$present_words_left', '$total_words_left', '$words_in_puzzle', '$puzzle_skipped', '$words_skipped', ,'$words_found' '$timestamp')";
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


