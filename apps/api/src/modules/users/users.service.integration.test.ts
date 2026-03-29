import assert from 'node:assert/strict';
import test from 'node:test';
import { UserModel } from './user.model';
import { ensureUserForOtpLogin } from './users.service';

test('ensureUserForOtpLogin creates a normalized user when none exists', async () => {
  const originalFindOne = UserModel.findOne;
  const originalFindOneAndUpdate = UserModel.findOneAndUpdate;

  try {
    let capturedEmail: string | undefined;

    UserModel.findOne = (async ({ email }: { email: string }) => {
      capturedEmail = email;
      return null;
    }) as unknown as typeof UserModel.findOne;

    UserModel.findOneAndUpdate = (async (
      _filter: unknown,
      update: { $set: { email: string; role: string; district?: string } },
    ) =>
      ({
        _id: '507f1f77bcf86cd799439011',
        email: update.$set.email,
        role: update.$set.role,
        district: update.$set.district,
      }) as never) as unknown as typeof UserModel.findOneAndUpdate;

    const user = await ensureUserForOtpLogin({
      email: 'Test@Example.com',
      role: 'CITIZEN',
      district: 'ikeja',
    });

    assert.equal(capturedEmail, 'test@example.com');
    assert.equal(String(user._id), '507f1f77bcf86cd799439011');
    assert.equal(user.email, 'test@example.com');
    assert.equal(user.role, 'CITIZEN');
    assert.equal(user.district, 'ikeja');
  } finally {
    UserModel.findOne = originalFindOne;
    UserModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('ensureUserForOtpLogin preserves existing role and district when not overridden', async () => {
  const originalFindOne = UserModel.findOne;
  const originalFindOneAndUpdate = UserModel.findOneAndUpdate;

  try {
    UserModel.findOne = (async () =>
      ({
        role: 'AGENCY_ADMIN',
        district: 'surulere',
      }) as never) as unknown as typeof UserModel.findOne;

    UserModel.findOneAndUpdate = (async (
      _filter: unknown,
      update: { $set: { email: string; role: string; district?: string } },
    ) =>
      ({
        _id: '507f191e810c19729de860ea',
        email: update.$set.email,
        role: update.$set.role,
        district: update.$set.district,
      }) as never) as unknown as typeof UserModel.findOneAndUpdate;

    const user = await ensureUserForOtpLogin({
      email: 'admin@example.com',
      role: 'CITIZEN',
    });

    assert.equal(String(user._id), '507f191e810c19729de860ea');
    assert.equal(user.role, 'AGENCY_ADMIN');
    assert.equal(user.district, 'surulere');
  } finally {
    UserModel.findOne = originalFindOne;
    UserModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
