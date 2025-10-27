<?php
error_reporting(E_ALL);
ini_set("display_errors",1);

header("Content-Type: application/json");

// Allow CORS if needed (optional, useful for testing)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    echo json_encode(["debug" => 'OPTIONS requested']);
    exit(0);
}

// Get JSON input from the JS fetch() request
$data = json_decode(file_get_contents("php://input"), true);
$username = $data["username"];
$password = $data["password"];

// Connect to MySQL
$servername = "localhost";
$dbusername = "root";
$dbpassword = "admin";
$dbname = "sys";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]));
    // echo json_encode(["success" => false, "message" => "Database connection failed."]);
    // exit();
}

// Prepared statement to prevent SQL injection
$stmt = $conn->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false]);
}

$stmt->close();
$conn->close();
?>