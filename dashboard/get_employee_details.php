<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$servername = "localhost";
$username = "root";
$password = "admin";
$dbname = "sys";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB connection failed"]));
}

$id = $_GET["id"];

$stmt = $conn->prepare("SELECT basic_pay, ot_pay FROM employees WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(["success" => true, "employee" => $row]);
} else {
    echo json_encode(["success" => false, "message" => "Employee not found"]);
}

$stmt->close();
$conn->close();
?>
