import { UserModel, type UserDocument, type UserRole } from './user.model';

type EnsureOtpUserParams = {
  email: string;
  role: UserRole;
  district?: string;
};

export const ensureUserForOtpLogin = async ({
  email,
  role,
  district,
}: EnsureOtpUserParams): Promise<UserDocument> => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserModel.findOne({ email: normalizedEmail });

  const effectiveRole = existingUser?.role ?? role;
  const effectiveDistrict = district ?? existingUser?.district;

  const update: {
    $set: {
      email: string;
      role: UserRole;
      district?: string;
    };
    $setOnInsert: {
      reputationScore: number;
    };
  } = {
    $set: {
      email: normalizedEmail,
      role: effectiveRole,
    },
    $setOnInsert: {
      reputationScore: 50,
    },
  };

  if (effectiveDistrict) {
    update.$set.district = effectiveDistrict;
  }

  return UserModel.findOneAndUpdate(
    { email: normalizedEmail },
    update,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};
