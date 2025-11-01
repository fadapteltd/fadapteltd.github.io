<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$servername = "localhost";
$dbusername = "root";
$dbpassword = "admin";
$dbname = "sys";

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB connection failed"]));
}

$result = $conn->query("SELECT id, name FROM employees");

$employees = [];
while ($row = $result->fetch_assoc()) {
    $employees[] = $row;
}

echo json_encode(["success" => true, "employees" => $employees]);

$conn->close();
?>
