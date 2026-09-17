<?php
declare(strict_types=1);

namespace App\Enums;

/**
 * Enum ThrowType <<ENUM>>
 * Mechanical execution type of the CS2 smoke throw.
 */
enum ThrowType: int
{
    case STAND = 0;
    case JUMPTHROW = 1;
    case RUN_JUMPTHROW = 2;

    public function label(): string
    {
        return match($this) {
            self::STAND => 'Stand Throw',
            self::JUMPTHROW => 'Jumpthrow',
            self::RUN_JUMPTHROW => 'Run Jumpthrow',
        };
    }
}
