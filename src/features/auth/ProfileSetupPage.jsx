import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import StudentProfileCard from '../../components/StudentProfileCard';
import styles from './ProfileSetupPage.module.css';
import { getProfile, updateProfile } from './authService';
import { clearAuthToken, getAuthToken } from './authStorage';

const POPULAR_INTEREST_SUGGESTIONS = [
  'Web Development',
  'Badminton',
  'Machine Learning',
  'Photography',
  'Robotics',
  'Coffee & Study',
  'UI/UX Design',
  'Hackathons',
  'Music & Jamming',
  'Basketball',
  'Film & Cinema'
];

const initialForm = {
  name: '',
  pronouns: '',
  major: '',
  year: 'First Year',
  residence: '',
  interests: '',
  bio: '',
  avatar: ''
};

const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [formState, setFormState] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const user = await getProfile(token);
      if (user.profileComplete) {
        navigate('/main');
        return;
      }

      const profile = user.profile || {};
      setFormState({
        name: profile.name || user.name || '',
        pronouns: profile.pronouns || '',
        major: profile.major || '',
        year: profile.year || 'First Year',
        residence: profile.residence || '',
        interests: (profile.interests || []).join(', '),
        bio: profile.bio || '',
        avatar: profile.avatar || ''
      });
    } catch (error) {
      clearAuthToken();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setTone(type);
  }, []);

  const handleAddInterestSuggestion = (tag) => {
    const current = formState.interests
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (!current.includes(tag)) {
      const updated = [...current, tag].join(', ');
      updateField('interests', updated);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      updateField('avatar', '');
      return;
    }

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      showMessage('Only JPG, PNG, or WebP images are allowed.', 'error');
      event.target.value = '';
      updateField('avatar', '');
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      showMessage('Image must be smaller than 5 MB.', 'error');
      event.target.value = '';
      updateField('avatar', '');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField('avatar', reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsSubmitting(true);
      setMessage('');

      const trimmedName = formState.name.trim();
      const trimmedMajor = formState.major.trim();
      const trimmedBio = formState.bio.trim();

      if (!trimmedName || !trimmedMajor || !trimmedBio) {
        showMessage('Please share your name, department, and a short bio.', 'error');
        setIsSubmitting(false);
        return;
      }

      const profilePayload = {
        name: trimmedName,
        pronouns: formState.pronouns.trim(),
        major: trimmedMajor,
        year: formState.year,
        residence: formState.residence.trim(),
        interests: formState.interests
          .split(',')
          .map((interest) => interest.trim())
          .filter(Boolean),
        bio: trimmedBio,
        avatar: formState.avatar,
        completedAt: new Date().toISOString()
      };

      const token = getAuthToken();
      if (!token) {
        clearAuthToken();
        navigate('/login');
        return;
      }

      try {
        await updateProfile(token, profilePayload);
        showMessage('Profile saved! Opening campus discovery...', 'success');
        timerRef.current = window.setTimeout(() => {
          navigate('/main');
        }, 1000);
      } catch (error) {
        showMessage(error.message || 'Unable to save profile', 'error');
        setIsSubmitting(false);
      }
    },
    [formState, navigate, showMessage]
  );

  // Live preview user object
  const previewUser = {
    id: 'live-preview',
    name: formState.name || 'Your Name',
    matchScore: 10,
    matchReasons: ['Previewing your card'],
    profile: {
      major: formState.major || 'Your Department',
      year: formState.year,
      residence: formState.residence || 'Campus',
      bio: formState.bio || 'Your bio will appear right here...',
      avatar: formState.avatar,
      interests: formState.interests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean)
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.eyebrow}>Campus Onboarding</span>
        <h1>Introduce yourself to your campus</h1>
        <p className={styles.lead}>
          Fill out your student profile so classmates in your department and clubs can discover you and say hello.
        </p>
      </header>

      <div className={styles.splitLayout}>
        {/* Form Column */}
        <div className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Section 1: Basic Identity */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>1. Basic Information</h3>
              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label htmlFor="nameInput">Full Name</label>
                  <input
                    id="nameInput"
                    value={formState.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    type="text"
                    placeholder="e.g. Maya Patel"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="pronounsInput">Pronouns (optional)</label>
                  <input
                    id="pronounsInput"
                    value={formState.pronouns}
                    onChange={(e) => updateField('pronouns', e.target.value)}
                    type="text"
                    placeholder="e.g. she/her, they/them"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic Circle */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>2. Academic Circle</h3>
              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label htmlFor="majorInput">Department / Major</label>
                  <input
                    id="majorInput"
                    value={formState.major}
                    onChange={(e) => updateField('major', e.target.value)}
                    type="text"
                    placeholder="e.g. Computer Science & Eng"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="yearSelect">Year of Study</label>
                  <select
                    id="yearSelect"
                    value={formState.year}
                    onChange={(e) => updateField('year', e.target.value)}
                    required
                  >
                    <option>First Year</option>
                    <option>Second Year</option>
                    <option>Third Year</option>
                    <option>Fourth Year</option>
                    <option>Postgraduate / PhD</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="residenceInput">Campus Residence or Neighborhood</label>
                <input
                  id="residenceInput"
                  value={formState.residence}
                  onChange={(e) => updateField('residence', e.target.value)}
                  type="text"
                  placeholder="e.g. North Hostel 3, Off-campus Sector 15"
                />
              </div>
            </div>

            {/* Section 3: Vibes, Passions & Photo */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>3. Personality & Interests</h3>
              <div className={styles.field}>
                <label htmlFor="bioInput">Personal Bio Prompt</label>
                <textarea
                  id="bioInput"
                  value={formState.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={3}
                  placeholder="What are you currently learning, obsessed with, or looking for on campus?"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="interestsInput">Interests & Hobbies (comma-separated)</label>
                <input
                  id="interestsInput"
                  value={formState.interests}
                  onChange={(e) => updateField('interests', e.target.value)}
                  type="text"
                  placeholder="e.g. Cloud Computing, Badminton, Film Photography"
                />

                <div className={styles.suggestionsWrap}>
                  <span className={styles.suggestionsLabel}>Tap to add:</span>
                  <div className={styles.suggestionChips}>
                    {POPULAR_INTEREST_SUGGESTIONS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={styles.suggestionBtn}
                        onClick={() => handleAddInterestSuggestion(tag)}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="avatarUpload">Profile Picture (optional)</label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  className={styles.fileInput}
                />
                <span className={styles.hint}>
                  {formState.avatar ? 'Photo selected' : 'JPG, PNG, WebP · Max 5 MB'}
                </span>
              </div>
            </div>

            {message && (
              <div className={[styles.messageBanner, tone === 'error' ? styles.errorBanner : styles.successBanner].join(' ')}>
                {message}
              </div>
            )}

            <Button
              variant="primary"
              size="large"
              type="submit"
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Saving Profile...' : 'Complete Profile & Discover Peers'}
            </Button>
          </form>
        </div>

        {/* Live Preview Column */}
        <aside className={styles.previewColumn}>
          <div className={styles.previewSticky}>
            <div className={styles.previewHeader}>
              <span className={styles.previewEyebrow}>Live Preview</span>
              <h4>How you appear on campus</h4>
            </div>
            <StudentProfileCard user={previewUser} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
