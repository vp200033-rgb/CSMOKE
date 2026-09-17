<?php
declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

/**
 * Database connection manager using PDO.
 * Supports SQLite (zero-config default) and MySQL/MariaDB.
 */
class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $dbType = getenv('DB_TYPE') ?: 'sqlite';

            try {
                if ($dbType === 'mysql') {
                    $host = getenv('DB_HOST') ?: '127.0.0.1';
                    $port = getenv('DB_PORT') ?: '3306';
                    $dbname = getenv('DB_NAME') ?: 'cs2_lineups';
                    $user = getenv('DB_USER') ?: 'root';
                    $pass = getenv('DB_PASS') ?: '';
                    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
                    self::$instance = new PDO($dsn, $user, $pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]);
                } else {
                    // SQLite default
                    $dbDir = dirname(__DIR__, 2) . '/database';
                    if (!is_dir($dbDir)) {
                        mkdir($dbDir, 0777, true);
                    }
                    $dbFile = $dbDir . '/cs2_lineups.sqlite';
                    $isNew = !file_exists($dbFile);
                    self::$instance = new PDO("sqlite:{$dbFile}", null, null, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    ]);

                    if ($isNew) {
                        self::initializeSchema(self::$instance);
                    }
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
                exit;
            }
        }

        return self::$instance;
    }

    private static function initializeSchema(PDO $pdo): void
    {
        $schemaFile = dirname(__DIR__, 2) . '/database/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $pdo->exec($sql);
        }
    }
}
