<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Enums\Role;
use DateTime;
use PDO;

/**
 * Class User
 * Attributes:
 * - id: int
 * - email: string
 * - passwordHash: string
 * - role: Role
 * - createdAt: datetime
 * Methods:
 * + register(): void
 * + login(): string
 * + logout(): void
 */
class User
{
    private ?int $id;
    private string $email;
    private string $passwordHash;
    private Role $role;
    private ?DateTime $createdAt;

    public function __construct(
        ?int $id = null,
        string $email = '',
        string $passwordHash = '',
        Role $role = Role::USER,
        ?DateTime $createdAt = null
    ) {
        $this->id = $id;
        $this->email = $email;
        $this->passwordHash = $passwordHash;
        $this->role = $role;
        $this->createdAt = $createdAt ?? new DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): void { $this->email = $email; }
    public function getPasswordHash(): string { return $this->passwordHash; }
    public function getRole(): Role { return $this->role; }
    public function setRole(Role $role): void { $this->role = $role; }
    public function getCreatedAt(): ?DateTime { return $this->createdAt; }

    /**
     * + register(): void
     */
    public function register(): void
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, role, created_at) VALUES (:email, :pwd, :role, :created)");
        $stmt->execute([
            ':email' => $this->email,
            ':pwd' => $this->passwordHash,
            ':role' => $this->role->value,
            ':created' => $this->createdAt?->format('Y-m-d H:i:s') ?? date('Y-m-d H:i:s'),
        ]);
        $this->id = (int)$pdo->lastInsertId();
    }

    /**
     * + login(): string
     * Authenticates user session and returns auth token.
     */
    public function login(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['user_id'] = $this->id;
        $_SESSION['email'] = $this->email;
        $_SESSION['role'] = $this->role->value;

        return bin2hex(random_bytes(24));
    }

    /**
     * + logout(): void
     */
    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }

    public static function findByEmail(string $email): ?self
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $data = $stmt->fetch();

        if (!$data) {
            return null;
        }

        return new self(
            (int)$data['id'],
            $data['email'],
            $data['password_hash'],
            Role::from((int)$data['role']),
            new DateTime($data['created_at'])
        );
    }

    public static function findById(int $id): ?self
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $data = $stmt->fetch();

        if (!$data) {
            return null;
        }

        return new self(
            (int)$data['id'],
            $data['email'],
            $data['password_hash'],
            Role::from((int)$data['role']),
            new DateTime($data['created_at'])
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role->value,
            'roleLabel' => $this->role->label(),
            'createdAt' => $this->createdAt?->format('Y-m-d H:i:s'),
        ];
    }
}
