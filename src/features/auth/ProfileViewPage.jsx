import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import StudentProfileCard from '../../components/StudentProfileCard';
import styles from './ProfileViewPage.module.css';
import { deleteAccount, getProfile, getPublicProfileById, updateProfile } from './authService';
import { clearAuthToken, getAuthToken } from './authStorage';

const initialForm = {
  name: '',
  pronouns: '',
  major: '',
  year: '',
  residence: '',
  interests: '',
  bio: '',
  avatar: ''
};

const ProfileViewPage = () => {
  const navigate = useNavigate();
  const { id: profileId } = useParams();
  const [formState, setFormState] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isReadOnlyProfile = Boolean(profileId);

  const loadProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const user = profileId ? await getPublicProfileById(token, profileId) : await getProfile(token);
      if (!profileId && !user.profileComplete) {
        navigate('/profile-setup');
        return;
      }

      const profile = user.profile || {};
      setFormState({
        name: profile.name || user.name || '',
        pronouns: profile.pronouns || '',
        major: profile.major || '',
        year: profile.year || '',
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
  }, [navigate, profileId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      updateField('avatar', '');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField('avatar', reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setTone(type);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthToken();
    navigate('/login');
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/main');
  }, [navigate]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsSaving(true);
      setMessage('');

      const trimmedName = formState.name.trim();
      const trimmedMajor = formState.major.trim();
      const trimmedBio = formState.bio.trim();

      if (!trimmedName || !trimmedMajor || !formState.year || !trimmedBio) {
        showMessage('Please complete the required fields.', 'error');
        setIsSaving(false);
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
        showMessage('Profile saved successfully.', 'success');
      } catch (error) {
        showMessage(error.message || 'Unable to save profile', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [formState, navigate, showMessage]
  );

  const confirmDelete = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      clearAuthToken();
      navigate('/login');
      return;
    }

    try {
      await deleteAccount(token);
    } catch (error) {
      console.warn('Failed to delete account via API', error);
    } finally {
      clearAuthToken();
      setShowDeleteModal(false);
      navigate('/');
    }
  }, [navigate]);

  const interestList = useMemo(
    () =>
      formState.interests
        ? formState.interests.split(',').map((i) => i.trim()).filter(Boolean)
        : [],
    [formState.interests]
  );

  const previewUser = {
    id: profileId || 'my-profile',
    name: formState.name || 'Student',
    matchScore: 9,
    matchReasons: [formState.major ? `Major in ${formState.major}` : 'Verified peer'],
    profile: {
      name: formState.name,
      pronouns: formState.pronouns,
      major: formState.major,
      year: formState.year,
      residence: formState.residence,
      bio: formState.bio,
      avatar: formState.avatar,
      interests: interestList
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading profile details...</p>
      </div>
    );
  }

  // Viewing another student's profile (Read-only)
  if (isReadOnlyProfile) {
    return (
      <section className={styles.page}>
        <div className={styles.viewLayout}>
          <div className={styles.cardCol}>
            <StudentProfileCard user={previewUser} />
          </div>

          <div className={styles.detailsCol}>
            <div className={styles.detailsHeader}>
              <span className={styles.eyebrow}>Campus Profile</span>
              <h1 className={styles.studentTitle}>{formState.name}</h1>
              <p className={styles.subMeta}>
                {formState.major} · {formState.year} {formState.residence && `· ${formState.residence}`}
              </p>
            </div>

            <article className={styles.bioCard}>
              <h3>About {formState.name.split(' ')[0]}</h3>
              <p className={styles.bioText}>
                {formState.bio || 'This student hasn’t added a custom bio yet.'}
              </p>
            </article>

            {interestList.length > 0 && (
              <article className={styles.interestsCard}>
                <h3>Interests & Passions</h3>
                <div className={styles.tagGrid}>
                  {interestList.map((tag) => (
                    <span key={tag} className={styles.interestTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            )}

            <article className={styles.starterCard}>
              <h3>Conversation Starters</h3>
              <ul className={styles.starterList}>
                {interestList.slice(0, 3).map((tag) => (
                  <li key={tag}>
                    Ask them how they got into <strong>{tag}</strong>!
                  </li>
                ))}
                <li>Ask what professors or classes they recommend in {formState.major || 'their department'}.</li>
              </ul>
            </article>

            <div className={styles.viewerActions}>
              <Button
                variant="primary"
                size="large"
                onClick={() => navigate('/matches', { state: { openDmId: profileId } })}
              >
                Send Direct Message
              </Button>
              <Button variant="ghost" size="large" onClick={handleBack}>
                Back to Discovery
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Viewing & Editing Own Profile
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Student Account</span>
          <h1>Your Campus Profile</h1>
          <p className={styles.lead}>
            Keep your major, year, interests, and bio up-to-date so classmates can discover you.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="small" onClick={handleBack}>
            Back
          </Button>
          <Button variant="ghost" size="small" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className={styles.editLayout}>
        {/* Form */}
        <div className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label htmlFor="nameField">Display Name</label>
                <input
                  id="nameField"
                  value={formState.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  type="text"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="pronounsField">Pronouns</label>
                <input
                  id="pronounsField"
                  value={formState.pronouns}
                  onChange={(e) => updateField('pronouns', e.target.value)}
                  type="text"
                  placeholder="e.g. she/her"
                />
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label htmlFor="majorField">Department / Major</label>
                <input
                  id="majorField"
                  value={formState.major}
                  onChange={(e) => updateField('major', e.target.value)}
                  type="text"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="yearField">Year of Study</label>
                <select
                  id="yearField"
                  value={formState.year}
                  onChange={(e) => updateField('year', e.target.value)}
                  required
                >
                  <option>First Year</option>
                  <option>Second Year</option>
                  <option>Third Year</option>
                  <option>Fourth Year</option>
                  <option>Postgraduate</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="residenceField">Campus Residence or Quad</label>
              <input
                id="residenceField"
                value={formState.residence}
                onChange={(e) => updateField('residence', e.target.value)}
                type="text"
                placeholder="e.g. North Quad Hall"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="bioField">Bio</label>
              <textarea
                id="bioField"
                value={formState.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="interestsField">Interests & Hobbies (comma-separated)</label>
              <input
                id="interestsField"
                value={formState.interests}
                onChange={(e) => updateField('interests', e.target.value)}
                type="text"
                placeholder="e.g. Badminton, AI, Photography"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="avatarField">Change Profile Picture</label>
              <input
                id="avatarField"
                type="file"
                accept="image/*"
                onChange={handleFile}
              />
            </div>

            {message && (
              <div className={[styles.messageBanner, tone === 'error' ? styles.errorBanner : styles.successBanner].join(' ')}>
                {message}
              </div>
            )}

            <div className={styles.formActions}>
              <Button
                variant="primary"
                size="large"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className={styles.dangerZone}>
            <div className={styles.dangerCopy}>
              <h4>Account Removal</h4>
              <p>Permanently remove your student account and all chat history.</p>
            </div>
            <Button
              variant="danger"
              size="small"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Live Card Preview */}
        <aside className={styles.previewAside}>
          <div className={styles.previewSticky}>
            <span className={styles.eyebrow}>Live Preview</span>
            <StudentProfileCard user={previewUser} />
          </div>
        </aside>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>Delete your UniMatch account</h3>
            <p>
              This will permanently delete your account, matching score, and direct message history. This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfileViewPage;
