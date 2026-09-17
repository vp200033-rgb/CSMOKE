<?php
declare(strict_types=1);

namespace App\Enums;

/**
 * Enum Status <<ENUM>>
 * Publication & moderation status of a smoke lineup submission.
 */
enum Status: int
{
    case PENDING = 0;
    case APPROVED = 1;
    case REJECTED = 2;

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Pending Review',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
        };
    }
}
