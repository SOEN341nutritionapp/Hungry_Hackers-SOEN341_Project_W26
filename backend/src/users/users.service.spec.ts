// ============================================================================
// USER SERVICE UNIT TESTS
// ============================================================================
// This file tests the UsersService business logic for Sprint 1 (Profile Management)
// We use Jest (testing framework) and mock Prisma (database) to test in isolation
// ============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// MAIN TEST SUITE
// ============================================================================
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  // ==========================================================================
  // MOCK DATA
  // ==========================================================================
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    dateOfBirth: new Date('1990-01-01'),
    sex: 'Male',
    heightCm: 175,
    weightKg: 70,
    allergies: ['Peanuts'],
    dietaryPreferences: ['Vegetarian'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ==========================================================================
  // SETUP BEFORE EACH TEST
  // ==========================================================================
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  // ==========================================================================
  // TEST 1: Service Should Be Defined
  // ==========================================================================
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================================================
  // TEST GROUP: UPDATE ACCOUNT
  // ==========================================================================
  describe('updateAccount', () => {
    // ------------------------------------------------------------------------
    // TEST 2: Should Update Name Successfully
    // ------------------------------------------------------------------------
    it('should update name', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateAccount('test-user-id', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 3: Should Throw Error for Forbidden Fields
    // ------------------------------------------------------------------------
    it('should throw BadRequestException for forbidden fields', async () => {
      await expect(
        service.updateAccount('test-user-id', { id: 'new-id' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==========================================================================
  // TEST GROUP: UPDATE PROFILE
  // ==========================================================================
  describe('updateProfile', () => {
    // ------------------------------------------------------------------------
    // TEST 4: Should Update Dietary Preferences
    // ------------------------------------------------------------------------
    it('should update dietary preferences', async () => {
      const updatedUser = { 
        ...mockUser, 
        dietaryPreferences: ['Vegan', 'Gluten-Free'] 
      };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile('test-user-id', {
        dietaryPreferences: ['Vegan', 'Gluten-Free'],
      });

      expect(result.dietaryPreferences).toEqual(['Vegan', 'Gluten-Free']);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 5: Should Update Allergies
    // ------------------------------------------------------------------------
    it('should update allergies', async () => {
      const updatedUser = { 
        ...mockUser, 
        allergies: ['Shellfish', 'Dairy'] 
      };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile('test-user-id', {
        allergies: ['Shellfish', 'Dairy'],
      });

      expect(result.allergies).toEqual(['Shellfish', 'Dairy']);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 6: Should Update Height and Weight
    // ------------------------------------------------------------------------
    it('should update height and weight', async () => {
      const updatedUser = { 
        ...mockUser, 
        heightCm: 180,
        weightKg: 75 
      };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile('test-user-id', {
        heightCm: 180,
        weightKg: 75,
      });

      expect(result.heightCm).toBe(180);
      expect(result.weightKg).toBe(75);
      expect(prisma.user.update).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 7: Should Update Sex
    // ------------------------------------------------------------------------
    it('should update sex', async () => {
      const updatedUser = { 
        ...mockUser, 
        sex: 'Female' 
      };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile('test-user-id', {
        sex: 'Female',
      });

      expect(result.sex).toBe('Female');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    // ------------------------------------------------------------------------
    // TEST 8: Should Update Date of Birth
    // ------------------------------------------------------------------------
    it('should update date of birth', async () => {
      const newDate = new Date('1995-05-15');
      const updatedUser = { 
        ...mockUser, 
        dateOfBirth: newDate 
      };
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile('test-user-id', {
        dateOfBirth: '1995-05-15',
      });

      expect(result.dateOfBirth).toEqual(newDate);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// TEST SUMMARY
// ============================================================================
// Total Tests: 8
// - 1 basic service definition test
// - 2 updateAccount tests (name update, forbidden fields protection)
// - 5 updateProfile tests (diet preferences, allergies, height/weight, sex, date of birth)
//
// Coverage: All user account and profile management features (Sprint 1)
// Testing Strategy: Unit testing with mocked dependencies
// Framework: Jest + NestJS Testing utilities
// ============================================================================