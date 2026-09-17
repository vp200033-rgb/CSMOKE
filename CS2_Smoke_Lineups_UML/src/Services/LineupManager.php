<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Enums\Status;
use App\Models\Lineup;
use PDO;

/**
 * Class LineupManager
 * Methods:
 * + getLineupsByMap(mapId: int): List<Lineup>
 * + searchLineups(query: string): List<Lineup>
 * + verifyLineup(lineupId: int, newStatus: Status): void
 */
class LineupManager
{
    /**
     * + getLineupsByMap(mapId: int): List<Lineup>
     * Retrieves all lineups for a given map.
     * @return Lineup[]
     */
    public function getLineupsByMap(int $mapId, ?Status $statusFilter = null): array
    {
        $pdo = Database::getConnection();
        if ($statusFilter !== null) {
            $stmt = $pdo->prepare("SELECT * FROM lineups WHERE map_id = :mid AND status = :st ORDER BY id DESC");
            $stmt->execute([':mid' => $mapId, ':st' => $statusFilter->value]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM lineups WHERE map_id = :mid ORDER BY id DESC");
            $stmt->execute([':mid' => $mapId]);
        }

        $lineups = [];
        while ($row = $stmt->fetch()) {
            $lineups[] = Lineup::fromRow($row);
        }
        return $lineups;
    }

    /**
     * + searchLineups(query: string): List<Lineup>
     * Searches lineups matching a query string in title or description.
     * @return Lineup[]
     */
    public function searchLineups(string $query, ?int $mapId = null): array
    {
        $pdo = Database::getConnection();
        $q = '%' . trim($query) . '%';

        if ($mapId !== null) {
            $stmt = $pdo->prepare("
                SELECT * FROM lineups 
                WHERE map_id = :mid AND (title LIKE :q OR description LIKE :q) AND status = :st
                ORDER BY id DESC
            ");
            $stmt->execute([':mid' => $mapId, ':q' => $q, ':st' => Status::APPROVED->value]);
        } else {
            $stmt = $pdo->prepare("
                SELECT * FROM lineups 
                WHERE (title LIKE :q OR description LIKE :q) AND status = :st
                ORDER BY id DESC
            ");
            $stmt->execute([':q' => $q, ':st' => Status::APPROVED->value]);
        }

        $lineups = [];
        while ($row = $stmt->fetch()) {
            $lineups[] = Lineup::fromRow($row);
        }
        return $lineups;
    }

    /**
     * + verifyLineup(lineupId: int, newStatus: Status): void
     * Verifies a lineup and changes its moderation status.
     */
    public function verifyLineup(int $lineupId, Status $newStatus): void
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM lineups WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $lineupId]);
        $row = $stmt->fetch();

        if ($row) {
            $lineup = Lineup::fromRow($row);
            $lineup->updateStatus($newStatus);
        }
    }
}
