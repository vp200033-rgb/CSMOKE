<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple autoloader for App\ namespace
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = dirname(__DIR__) . '/src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Enums\Role;
use App\Enums\Status;
use App\Enums\ThrowType;
use App\Models\Lineup;
use App\Models\Map;
use App\Models\User;
use App\Services\LineupManager;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_GET['action'] ?? '';
$manager = new LineupManager();

try {
    switch ($action) {
        // 1. Get all maps
        case 'get_maps':
            $maps = Map::getRadars();
            $result = array_map(fn($m) => $m->toArray(), $maps);
            echo json_encode(['success' => true, 'data' => $result]);
            break;

        // 2. Get lineups by map
        case 'get_lineups':
            $mapId = (int)($_GET['mapId'] ?? 1);
            $statusParam = isset($_GET['status']) ? (int)$_GET['status'] : null;
            $statusFilter = $statusParam !== null ? Status::tryFrom($statusParam) : null;
            
            // By default, guests and regular users only see APPROVED unless admin
            $userRole = $_SESSION['role'] ?? Role::GUEST->value;
            if ($userRole !== Role::ADMIN->value && $statusFilter === null) {
                $statusFilter = Status::APPROVED;
            }

            $lineups = $manager->getLineupsByMap($mapId, $statusFilter);
            $result = array_map(fn($l) => $l->toArray(), $lineups);
            echo json_encode(['success' => true, 'data' => $result]);
            break;

        // 3. Search lineups
        case 'search_lineups':
            $query = (string)($_GET['query'] ?? '');
            $mapId = isset($_GET['mapId']) ? (int)$_GET['mapId'] : null;
            $lineups = $manager->searchLineups($query, $mapId);
            $result = array_map(fn($l) => $l->toArray(), $lineups);
            echo json_encode(['success' => true, 'data' => $result]);
            break;

        // 4. Create / submit a lineup
        case 'save_lineup':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
                exit;
            }

            $userId = (int)($_SESSION['user_id'] ?? 2);
            $userRole = (int)($_SESSION['role'] ?? Role::USER->value);

            // Admins can create directly as APPROVED; users create as PENDING
            $initialStatus = $userRole === Role::ADMIN->value ? Status::APPROVED : Status::PENDING;

            $lineup = new Lineup(
                null,
                $userId,
                (int)($input['mapId'] ?? 1),
                (string)($input['title'] ?? 'Untitled Lineup'),
                (float)($input['startX'] ?? 0.0),
                (float)($input['startY'] ?? 0.0),
                (float)($input['endX'] ?? 0.0),
                (float)($input['endY'] ?? 0.0),
                (string)($input['videoUrl'] ?? ''),
                (string)($input['crosshairImageUrl'] ?? ''),
                ThrowType::from((int)($input['throwType'] ?? 0)),
                (string)($input['description'] ?? ''),
                $initialStatus
            );
            $lineup->save();

            echo json_encode([
                'success' => true,
                'data' => $lineup->toArray(),
                'message' => $initialStatus === Status::APPROVED ? 'Lineup published!' : 'Lineup submitted for review!'
            ]);
            break;

        // 5. Verify / moderate lineup (Admin only)
        case 'verify_lineup':
            $input = json_decode(file_get_contents('php://input'), true);
            $lineupId = (int)($input['lineupId'] ?? 0);
            $newStatus = Status::from((int)($input['newStatus'] ?? 1));

            $manager->verifyLineup($lineupId, $newStatus);
            echo json_encode(['success' => true, 'message' => 'Lineup status updated to ' . $newStatus->label()]);
            break;

        // 6. User Auth - Login
        case 'login':
            $input = json_decode(file_get_contents('php://input'), true);
            $email = (string)($input['email'] ?? '');
            $password = (string)($input['password'] ?? '');

            $user = User::findByEmail($email);
            if ($user && password_verify($password, $user->getPasswordHash())) {
                $token = $user->login();
                echo json_encode(['success' => true, 'token' => $token, 'user' => $user->toArray()]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
            }
            break;

        // 7. User Auth - Register
        case 'register':
            $input = json_decode(file_get_contents('php://input'), true);
            $email = trim((string)($input['email'] ?? ''));
            $password = (string)($input['password'] ?? '');

            if (!$email || strlen($password) < 6) {
                echo json_encode(['success' => false, 'error' => 'Email is required and password must be at least 6 characters']);
                exit;
            }

            if (User::findByEmail($email)) {
                echo json_encode(['success' => false, 'error' => 'An account with this email already exists']);
                exit;
            }

            $user = new User(null, $email, password_hash($password, PASSWORD_DEFAULT), Role::USER);
            $user->register();
            $token = $user->login();

            echo json_encode(['success' => true, 'token' => $token, 'user' => $user->toArray()]);
            break;

        // 8. User Auth - Logout
        case 'logout':
            $userId = (int)($_SESSION['user_id'] ?? 0);
            if ($userId) {
                $user = User::findById($userId);
                $user?->logout();
            }
            echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
            break;

        // 9. Check current session status
        case 'session':
            $userId = (int)($_SESSION['user_id'] ?? 0);
            if ($userId) {
                $user = User::findById($userId);
                echo json_encode(['success' => true, 'user' => $user?->toArray()]);
            } else {
                echo json_encode(['success' => true, 'user' => null]);
            }
            break;

        default:
            echo json_encode([
                'success' => true,
                'name' => 'Counter-Strike 2 Smoke Lineups API',
                'version' => '1.0.0',
                'endpoints' => [
                    'get_maps',
                    'get_lineups',
                    'search_lineups',
                    'save_lineup',
                    'verify_lineup',
                    'login',
                    'register',
                    'logout',
                    'session',
                ]
            ]);
            break;
    }
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
