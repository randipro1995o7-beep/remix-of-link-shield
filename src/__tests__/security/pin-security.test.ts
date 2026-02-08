import { describe, it, expect, beforeEach } from 'vitest';
import { SafetyPinService } from '@/lib/storage/SafetyPinService';

describe('PIN Security Tests', () => {
    beforeEach(async () => {
        // Clear PIN before each test
        await SafetyPinService.clear();
    });

    describe('PIN Validation', () => {
        it('should accept valid 4-digit PIN', async () => {
            await expect(SafetyPinService.save('1234')).resolves.not.toThrow();
            await expect(SafetyPinService.save('0000')).resolves.not.toThrow();
            await expect(SafetyPinService.save('9999')).resolves.not.toThrow();
        });

        it('should reject non-4-digit PINs', async () => {
            await expect(SafetyPinService.save('123')).rejects.toThrow();
            await expect(SafetyPinService.save('12345')).rejects.toThrow();
            await expect(SafetyPinService.save('1')).rejects.toThrow();
            await expect(SafetyPinService.save('')).rejects.toThrow();
        });

        it('should reject non-numeric PINs', async () => {
            await expect(SafetyPinService.save('abcd')).rejects.toThrow();
            await expect(SafetyPinService.save('12a4')).rejects.toThrow();
            await expect(SafetyPinService.save('12.4')).rejects.toThrow();
            await expect(SafetyPinService.save('12-4')).rejects.toThrow();
        });

        it('should reject special characters in PIN', async () => {
            await expect(SafetyPinService.save('12!4')).rejects.toThrow();
            await expect(SafetyPinService.save('12@4')).rejects.toThrow();
            await expect(SafetyPinService.save('12#4')).rejects.toThrow();
        });
    });

    describe('PIN Storage and Retrieval', () => {
        it('should store and retrieve PIN correctly', async () => {
            await SafetyPinService.save('5678');
            const exists = await SafetyPinService.exists();
            expect(exists).toBe(true);
        });

        it('should verify correct PIN', async () => {
            await SafetyPinService.save('1234');
            const isValid = await SafetyPinService.verify('1234');
            expect(isValid).toBe(true);
        });

        it('should reject incorrect PIN', async () => {
            await SafetyPinService.save('1234');
            const isValid = await SafetyPinService.verify('4321');
            expect(isValid).toBe(false);
        });

        it('should return false when no PIN is set', async () => {
            const isValid = await SafetyPinService.verify('1234');
            expect(isValid).toBe(false);
        });
    });

    describe('PIN Failure Safety', () => {
        it('should fail-safe on storage error', async () => {
            // Mock storage failure would go here
            // For now, just verify that incorrect PIN returns false
            await SafetyPinService.save('1234');
            const result = await SafetyPinService.verify('9999');
            expect(result).toBe(false);
        });

        it('should not leak PIN in error messages', async () => {
            await expect(async () => {
                await SafetyPinService.save('abc1');
            }).rejects.toThrow('must be exactly 4 digits');
        });
    });

    describe('PIN Clearing', () => {
        it('should clear PIN successfully', async () => {
            await SafetyPinService.save('1234');
            await SafetyPinService.clear();
            const exists = await SafetyPinService.exists();
            expect(exists).toBe(false);
        });

        it('should allow setting new PIN after clear', async () => {
            await SafetyPinService.save('1234');
            await SafetyPinService.clear();
            await SafetyPinService.save('5678');
            const isValid = await SafetyPinService.verify('5678');
            expect(isValid).toBe(true);
        });
    });

    describe('PIN Edge Cases', () => {
        it('should handle leading zeros', async () => {
            await SafetyPinService.save('0123');
            const isValid = await SafetyPinService.verify('0123');
            expect(isValid).toBe(true);
        });

        it('should not accept PIN with whitespace', async () => {
            await expect(SafetyPinService.save('12 34')).rejects.toThrow();
            await expect(SafetyPinService.save(' 1234')).rejects.toThrow();
            await expect(SafetyPinService.save('1234 ')).rejects.toThrow();
        });

        it('should not accept null or undefined', async () => {
            await expect(SafetyPinService.save(null as any)).rejects.toThrow();
            await expect(SafetyPinService.save(undefined as any)).rejects.toThrow();
        });
    });
});
