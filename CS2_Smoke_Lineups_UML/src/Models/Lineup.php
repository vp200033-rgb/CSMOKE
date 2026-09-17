<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Enums\Status;
use App\Enums\ThrowType;
use DateTime;
use PDO;

/**
 * Class Lineup
 * Attributes:
 * - id: int
 * - title: string
 * - startX: float
 * - startY: float
 * - endX: float
 * - endY: float
 * - videoUrl: string
 * - crosshairImageUrl: string
 * - throwType: ThrowType
 * - description: string
 * - status: Status
 * - createdAt: datetime
 * Methods:
 * + save(): void
 * + updateStatus(status: Status): void
 * + delete(): void
 */
class Lineup
{
    private ?int $id;
    private int $userId;
    private int $mapId;
    private string $title;
    private float $startX;
    private float $startY;
    private float $endX;
    private float $endY;
    private string $videoUrl;
    private string $crosshairImageUrl;
    private ThrowType $throwType;
    private string $description;
    private Status $status;
    private ?DateTime $createdAt;

    public function __construct(
        ?int $id = null,
        int $userId = 1,
        int $mapId = 1,
        string $title = '',
        float $startX = 0.0,
        float $startY = 0.0,
        float $endX = 0.0,
        float $endY = 0.0,
        string $videoUrl = '',
        string $crosshairImageUrl = '',
        ThrowType $throwType = ThrowType::STAND,
        string $description = '',
        Status $status = Status::PENDING,
        ?DateTime $createdAt = null
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->mapId = $mapId;
        $this->title = $title;
        $this->startX = $startX;
        $this->startY = $startY;
        $this->endX = $endX;
        $this->endY = $endY;
        $this->videoUrl = $videoUrl;
        $this->crosshairImageUrl = $crosshairImageUrl;
        $this->throwType = $throwType;
        $this->description = $description;
        $this->status = $status;
        $this->createdAt = $createdAt ?? new DateTime();
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getUserId(): int { return $this->userId; }
    public function getMapId(): int { return $this->mapId; }
    public function getTitle(): string { return $this->title; }
    public function getStartX(): float { return $this->startX; }
    public function getStartY(): float { return $this->startY; }
    public function getEndX(): float { return $this->endX; }
    public function getEndY(): float { return $this->endY; }
    public function getVideoUrl(): string { return $this->videoUrl; }
    public function getCrosshairImageUrl(): string { return $this->crosshairImageUrl; }
    public function getThrowType(): ThrowType { return $this->throwType; }
    public function getDescription(): string { return $this->description; }
    public function getStatus(): Status { return $this->status; }
    public function getCreatedAt(): ?DateTime { return $this->createdAt; }

    /**
     * + save(): void
     * Inserts or updates the lineup in the database.
     */
    public function save(): void
    {
        $pdo = Database::getConnection();

        if ($this->id === null) {
            $stmt = $pdo->prepare("
                INSERT INTO lineups (
                    user_id, map_id, title, start_x, start_y, end_x, end_y,
                    video_url, crosshair_image_url, throw_type, description, status, created_at
                ) VALUES (
                    :uid, :mid, :title, :sx, :sy, :ex, :ey,
                    :vurl, :curl, :tt, :desc, :status, :created
                )
            ");
            $stmt->execute([
                ':uid' => $this->userId,
                ':mid' => $this->mapId,
                ':title' => $this->title,
                ':sx' => $this->startX,
                ':sy' => $this->startY,
                ':ex' => $this->endX,
                ':ey' => $this->endY,
                ':vurl' => $this->videoUrl,
                ':curl' => $this->crosshairImageUrl,
                ':tt' => $this->throwType->value,
                ':desc' => $this->description,
                ':status' => $this->status->value,
                ':created' => $this->createdAt?->format('Y-m-d H:i:s') ?? date('Y-m-d H:i:s'),
            ]);
            $this->id = (int)$pdo->lastInsertId();
        } else {
            $stmt = $pdo->prepare("
                UPDATE lineups SET
                    title = :title,
                    start_x = :sx,
                    start_y = :sy,
                    end_x = :ex,
                    end_y = :ey,
                    video_url = :vurl,
                    crosshair_image_url = :curl,
                    throw_type = :tt,
                    description = :desc,
                    status = :status
                WHERE id = :id
            ");
            $stmt->execute([
                ':title' => $this->title,
                ':sx' => $this->startX,
                ':sy' => $this->startY,
                ':ex' => $this->endX,
                ':ey' => $this->endY,
                ':vurl' => $this->videoUrl,
                ':curl' => $this->crosshairImageUrl,
                ':tt' => $this->throwType->value,
                ':desc' => $this->description,
                ':status' => $this->status->value,
                ':id' => $this->id,
            ]);
        }
    }

    /**
     * + updateStatus(status: Status): void
     */
    public function updateStatus(Status $status): void
    {
        $this->status = $status;
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE lineups SET status = :st WHERE id = :id");
        $stmt->execute([
            ':st' => $status->value,
            ':id' => $this->id,
        ]);
    }

    /**
     * + delete(): void
     */
    public function delete(): void
    {
        if ($this->id !== null) {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("DELETE FROM lineups WHERE id = :id");
            $stmt->execute([':id' => $this->id]);
            $this->id = null;
        }
    }

    public static function fromRow(array $row): self
    {
        return new self(
            (int)$row['id'],
            (int)$row['user_id'],
            (int)$row['map_id'],
            $row['title'],
            (float)$row['start_x'],
            (float)$row['start_y'],
            (float)$row['end_x'],
            (float)$row['end_y'],
            $row['video_url'] ?? '',
            $row['crosshair_image_url'] ?? '',
            ThrowType::from((int)$row['throw_type']),
            $row['description'] ?? '',
            Status::from((int)$row['status']),
            new DateTime($row['created_at'])
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'mapId' => $this->mapId,
            'title' => $this->title,
            'startX' => $this->startX,
            'startY' => $this->startY,
            'endX' => $this->endX,
            'endY' => $this->endY,
            'videoUrl' => $this->videoUrl,
            'crosshairImageUrl' => $this->crosshairImageUrl,
            'throwType' => $this->throwType->value,
            'throwTypeLabel' => $this->throwType->label(),
            'description' => $this->description,
            'status' => $this->status->value,
            'statusLabel' => $this->status->label(),
            'createdAt' => $this->createdAt?->format('Y-m-d H:i:s'),
        ];
    }
}
