import User from "../models/User";

export const generateUniqueUsername = async (
  email: string,
): Promise<string> => {
  const baseUsername = email.split("@")[0].toLowerCase();
  let candidateUsername = baseUsername;
  let suffix = 1;

  while (await User.findOne({ username: candidateUsername })) {
    candidateUsername = `${baseUsername}${suffix}`;
    suffix++;
  }

  return candidateUsername;
};
