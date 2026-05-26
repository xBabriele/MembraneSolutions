<?php
define('DB_HOST',    getenv('MYSQLHOST')     ?: getenv('MYSQL_HOST')     ?: 'localhost');
define('DB_PORT',    getenv('MYSQLPORT')     ?: getenv('MYSQL_PORT')     ?: '3306');
define('DB_NAME',    getenv('MYSQLDATABASE') ?: getenv('MYSQL_DATABASE') ?: 'MEMBRANE_SOLUTIONS');
define('DB_USER',    getenv('MYSQLUSER')     ?: getenv('MYSQL_USER')     ?: 'root');
define('DB_PASS',    getenv('MYSQLPASSWORD') ?: getenv('MYSQL_PASSWORD') ?: '');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'ok'    => false,
            'error' => 'Connessione DB fallita: ' . $e->getMessage()
        ]);
        exit;
    }

    return $pdo;
}
