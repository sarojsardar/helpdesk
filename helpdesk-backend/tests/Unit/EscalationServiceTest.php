<?php

namespace Tests\Unit;

use App\Services\EscalationService;
use Tests\TestCase;

class EscalationServiceTest extends TestCase
{
    private EscalationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EscalationService();
    }

    public function test_bump_priority_low_to_medium(): void
    {
        $this->assertEquals('medium', $this->bumpPriority('low'));
    }

    public function test_bump_priority_medium_to_high(): void
    {
        $this->assertEquals('high', $this->bumpPriority('medium'));
    }

    public function test_bump_priority_high_to_critical(): void
    {
        $this->assertEquals('critical', $this->bumpPriority('high'));
    }

    public function test_bump_priority_critical_stays_critical(): void
    {
        $this->assertEquals('critical', $this->bumpPriority('critical'));
    }

    private function bumpPriority(string $priority): string
    {
        $method = new \ReflectionMethod(EscalationService::class, 'bumpPriority');
        $method->setAccessible(true);
        return $method->invoke($this->service, $priority);
    }
}
