import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// ============================================================================
// USER SERVICE UNIT TESTS
// ============================================================================
// Tests the UsersService business logic for Sprint 1 (User Profile Management)
// ============================================================================
describe('UsersService', () => {
  let service: UsersService;

  // Mocked Prisma - replaces real database with fake functions
  let prisma: {
    user: {
      update: jest.Mock;
    };
  };

  // ========================================================================
  // SETUP - Runs before each test
  // ========================================================================
  // Creates a fresh testing environment for every test
  // Ensures tests don't interfere with each other
  // ========================================================================
  beforeEach(async () => {
    // Create mock Prisma with fake update method
    prisma = {
      user: {
        update: jest.fn(),
      },
    };

    // Build a mini NestJS module just for testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma, // Inject our mock instead of real Prisma
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ========================================================================
  // TEST GROUP: UPDATE ACCOUNT
  // ========================================================================
  // Tests the updateAccount method (email, name, password updates)
  // ========================================================================
  describe('updateAccount', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Update Email Only
    // ----------------------------------------------------------------------
    // Verifies that email can be updated independently
    // ----------------------------------------------------------------------
    it('should update email only', async () => {
      // ARRANGE: Mock what Prisma will return
      const updatedUser = {
        id: 'u1',
        email: 'new@email.com',
        name: 'Nigel',
      };
      prisma.user.update.mockResolvedValue(updatedUser);

      // ACT: Call the service method
      const result = await service.updateAccount('u1', {
        email: 'new@email.com',
      });

      // ASSERT: Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { email: 'new@email.com' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // ASSERT: Verify the result matches what Prisma returned
      expect(result).toEqual(updatedUser);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Update Name Only
    // ----------------------------------------------------------------------
    it('should update name only', async () => {
      const updatedUser = {
        id: 'u1',
        email: 'old@email.com',
        name: 'Kyle',
      };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateAccount('u1', {
        name: 'Kyle',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { name: 'Kyle' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(updatedUser);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Hash Password Before Updating
    // ----------------------------------------------------------------------
    // Security test: Ensures passwords are hashed, never stored as plain text
    // ----------------------------------------------------------------------
    it('should hash the password before updating', async () => {
      // ARRANGE: Mock bcrypt to return a fake hashed password
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      prisma.user.update.mockResolvedValue({
        id: 'u1',
        email: 'test@email.com',
        name: 'Nigel',
      });

      // ACT: Try to update password
      await service.updateAccount('u1', {
        password: 'plainPassword',
      });

      // ASSERT: Verify bcrypt was called to hash the password
      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);

      // ASSERT: Verify the HASHED password (not plain) was sent to database
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { password: 'hashedPassword' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Update Multiple Fields Together
    // ----------------------------------------------------------------------
    it('should update multiple allowed fields together', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      prisma.user.update.mockResolvedValue({
        id: 'u1',
        email: 'new@email.com',
        name: 'New Name',
      });

      await service.updateAccount('u1', {
        email: 'new@email.com',
        name: 'New Name',
        password: 'plainPassword',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          email: 'new@email.com',
          name: 'New Name',
          password: 'hashedPassword',
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Reject Forbidden Fields
    // ----------------------------------------------------------------------
    // Security test: Users shouldn't be able to change their ID or timestamps
    // ----------------------------------------------------------------------
    it('should throw BadRequestException for forbidden fields', async () => {
      // ASSERT: Attempting to update 'id' should throw error
      await expect(
        service.updateAccount('u1', { id: 'new-id' }),
      ).rejects.toThrow(BadRequestException);

      // ASSERT: Attempting to update 'createdAt' should throw error
      await expect(
        service.updateAccount('u1', { createdAt: new Date() }),
      ).rejects.toThrow(BadRequestException);

      // ASSERT: Attempting to update 'updatedAt' should throw error
      await expect(
        service.updateAccount('u1', { updatedAt: new Date() }),
      ).rejects.toThrow(BadRequestException);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Reject Empty Updates
    // ----------------------------------------------------------------------
    it('should throw BadRequestException when no valid fields are provided', async () => {
      await expect(service.updateAccount('u1', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ========================================================================
  // TEST GROUP: UPDATE PROFILE
  // ========================================================================
  // Tests the updateProfile method (diet preferences, allergies, physical stats)
  // ========================================================================
  describe('updateProfile', () => {
    // ----------------------------------------------------------------------
    // TEST: Should Update All Profile Fields
    // ----------------------------------------------------------------------
    it('should update profile fields correctly', async () => {
      const updatedUser = {
        id: 'u1',
        email: 'test@email.com',
        name: 'Nigel',
        sex: 'male',
        heightCm: 180,
        weightKg: 75,
        allergies: ['nuts'],
        dietaryPreferences: ['vegan'],
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('u1', {
        sex: 'male',
        heightCm: 180,
        weightKg: 75,
        allergies: ['nuts'],
        dietaryPreferences: ['vegan'],
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          sex: 'male',
          heightCm: 180,
          weightKg: 75,
          allergies: ['nuts'],
          dietaryPreferences: ['vegan'],
        },
        select: {
          id: true,
          email: true,
          name: true,
          dateOfBirth: true,
          sex: true,
          heightCm: true,
          weightKg: true,
          allergies: true,
          dietaryPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(updatedUser);
    });

    // ----------------------------------------------------------------------
    // TEST: Should Convert Date String to Date Object
    // ----------------------------------------------------------------------
    // Ensures date strings from frontend are properly converted
    // ----------------------------------------------------------------------
    it('should convert dateOfBirth string into a Date object', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        dateOfBirth: new Date('2000-01-01'),
      });

      await service.updateProfile('u1', {
        dateOfBirth: '2000-01-01',
      } as any);

      // ASSERT: Date string was converted to Date object before saving
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          dateOfBirth: new Date('2000-01-01'),
        },
        select: {
          id: true,
          email: true,
          name: true,
          dateOfBirth: true,
          sex: true,
          heightCm: true,
          weightKg: true,
          allergies: true,
          dietaryPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Update Multiple Profile Fields Together
    // ----------------------------------------------------------------------
    it('should update multiple profile fields together', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        sex: 'female',
        heightCm: 165,
      });

      await service.updateProfile('u1', {
        sex: 'female',
        heightCm: 165,
      } as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          sex: 'female',
          heightCm: 165,
        },
        select: {
          id: true,
          email: true,
          name: true,
          dateOfBirth: true,
          sex: true,
          heightCm: true,
          weightKg: true,
          allergies: true,
          dietaryPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    // ----------------------------------------------------------------------
    // TEST: Should Reject Empty Profile Updates
    // ----------------------------------------------------------------------
    it('should throw BadRequestException when no valid profile fields are provided', async () => {
      await expect(service.updateProfile('u1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});