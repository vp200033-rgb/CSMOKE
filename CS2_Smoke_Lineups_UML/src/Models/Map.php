<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * Class Map
 * Attributes:
 * - id: int
 * - name: string
 * - radarImageUrl: string
 * Methods:
 * + getRadars(): List<Map>
 */
class Map
{
    private ?int $id;
    private string $name;
    private string $radarImageUrl;

    public function __construct(?int $id = null, string $name = '', string $radarImageUrl = '')
    {
        $this->id = $id;
        $this->name = $name;
        $this->radarImageUrl = $radarImageUrl;
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getRadarImageUrl(): string { return $this->radarImageUrl; }

    /**
     * + getRadars(): List<Map>
     * Retrieves all available tournament maps with radar paths.
     * @return Map[]
     */
    public static function getRadars(): array
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT * FROM maps ORDER BY id ASC");
        $maps = [];
        while ($row = $stmt->fetch()) {
            $maps[] = new self((int)$row['id'], $row['name'], $row['radar_image_url']);
        }
        return $maps;
    }

    public static function findById(int $id): ?self
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM maps WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        return new self((int)$row['id'], $row['name'], $row['radar_image_url']);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'radarImageUrl' => $this->radarImageUrl,
        ];
    }
}
