import bcrypt from 'bcrypt';
import { mergeProfile } from '../shared/profileHelpers.js';
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  listAllUsers,
  updateUserProfile
} from './userRepository.js';

export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ message: 'Profile data required' });
    }

    const mergedProfile = mergeProfile(req.user.profile, profile);
    const updatedUser = await updateUserProfile(req.user.id, mergedProfile);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = updatedUser;
    return res.json({ profile: req.user.profile, profileComplete: req.user.profileComplete });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await deleteUserById(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await listAllUsers();
    res.json({ count: users.length, users });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ message: 'Failed to load users' });
  }
};

export const getPublicProfileById = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = user.profile || {};
    return res.json({
      id: user.id,
      name: user.name,
      profileComplete: user.profileComplete,
      profile: {
        name: profile.name || user.name || '',
        pronouns: profile.pronouns || '',
        major: profile.major || '',
        year: profile.year || '',
        residence: profile.residence || '',
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        completedAt: profile.completedAt || ''
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error('getPublicProfileById error:', err);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const toInterestList = (profile = {}) => {
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  return interests.map((interest) => normalizeText(interest)).filter(Boolean);
};

const buildRecommendation = (currentUser, candidate) => {
  const currentProfile = currentUser.profile || {};
  const candidateProfile = candidate.profile || {};
  const currentInterests = toInterestList(currentProfile);
  const candidateInterests = toInterestList(candidateProfile);
  const sharedInterests = candidateInterests.filter((interest) => currentInterests.includes(interest));
  const sameDepartment = normalizeText(currentProfile.major) && normalizeText(currentProfile.major) === normalizeText(candidateProfile.major);
  const sameYear = normalizeText(currentProfile.year) && normalizeText(currentProfile.year) === normalizeText(candidateProfile.year);
  const sameResidence = normalizeText(currentProfile.residence) && normalizeText(currentProfile.residence) === normalizeText(candidateProfile.residence);

  let score = 0;
  if (sameDepartment) score += 5;
  score += sharedInterests.length * 3;
  if (sameYear) score += 1;
  if (sameResidence) score += 1;
  if (candidate.profileComplete) score += 1;

  const reasons = [];
  if (sameDepartment) reasons.push('Same department');
  if (sharedInterests.length > 0) reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
  if (sameYear) reasons.push('Same year');
  if (sameResidence) reasons.push('Same residence');
  if (candidate.profileComplete) reasons.push('Complete profile');

  return {
    ...candidate,
    matchScore: score,
    matchReasons: reasons,
    sharedInterests,
    sameDepartment,
    sameYear,
    sameResidence
  };
};

export const getRecommendations = async (req, res) => {
  try {
    const currentUser = req.user;
    const users = await listAllUsers();

    const recommendations = users
      .filter((user) => String(user.id) !== String(currentUser.id))
      .filter((user) => user.profileComplete)
      .map((user) => {
        const rec = buildRecommendation(currentUser, user);
        const { role, ...safeRec } = rec;
        return safeRec;
      })
      .sort((left, right) => right.matchScore - left.matchScore || right.updatedAt.localeCompare(left.updatedAt));

    return res.json({
      count: recommendations.length,
      recommendations,
      currentProfile: currentUser.profile || {}
    });
  } catch (err) {
    console.error('getRecommendations error:', err);
    return res.status(500).json({ message: 'Failed to load recommendations' });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const deleted = await deleteUserById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUserByAdmin error:', err);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await createUser({
      email: normalizedEmail,
      password: hashed,
      name: trimmedName,
      profile: { name: trimmedName }
    });

    return res.status(201).json({ user });
  } catch (err) {
    console.error('createUserByAdmin error:', err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
};
