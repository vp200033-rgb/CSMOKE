<?php
declare(strict_types=1);

namespace App\Enums;

/**
 * Enum Role <<ENUM>>
 * User permission roles in the application.
 */
enum Role: int
{
    case GUEST = 0;
    case USER = 1;
    case ADMIN = 2;

    public function label(): string
    {
        return match($this) {
            self::GUEST => 'Guest',
            self::USER => 'User',
            self::ADMIN => 'Administrator',
        };
    }
}
