export const mergeProfile = (currentProfile, updates) => {
  const base = currentProfile?.toObject ? currentProfile.toObject() : currentProfile || {};
  return { ...base, ...updates };
};
