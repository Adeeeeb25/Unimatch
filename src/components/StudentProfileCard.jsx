import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, MessageSquare } from 'lucide-react';
import Button from './Button';
import styles from './StudentProfileCard.module.css';

// Tasteful palette combinations for photo-fallback monograms
const MONOGRAM_PALETTES = [
  { bg: '#F0EBFF', text: '#5B2BE0' },
  { bg: '#FDF0F5', text: '#89254C' },
  { bg: '#FFF9E6', text: '#6E5200' },
  { bg: '#EBF8F5', text: '#156150' },
  { bg: '#F5F0FF', text: '#4C22C4' }
];

const getMonogramPalette = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MONOGRAM_PALETTES.length;
  return MONOGRAM_PALETTES[index];
};

const StudentProfileCard = ({ user, onConnect, isConnected = false }) => {
  const navigate = useNavigate();
  const profile = user.profile || {};
  const major = profile.major || 'Undeclared';
  const year = profile.year ? `'${String(profile.year).slice(-2)}` : '';
  const residence = profile.residence || '';
  const bio = profile.bio || '';
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const sharedInterests = Array.isArray(user.sharedInterests) ? user.sharedInterests : [];
  const matchScore = user.matchScore || 0;
  const matchReasons = Array.isArray(user.matchReasons) ? user.matchReasons : [];

  const initials = (user.name || 'Student')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const palette = getMonogramPalette(user.name);

  const handleSayHi = (e) => {
    e.stopPropagation();
    if (onConnect) {
      onConnect(user);
    } else {
      navigate('/matches', { state: { openDmId: user.id } });
    }
  };

  const handleOpenProfile = () => {
    navigate(`/profile/${user.id}`);
  };

  return (
    <article
      className={styles.card}
      onClick={handleOpenProfile}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleOpenProfile()}
      aria-label={`View profile of ${user.name}`}
    >
      {/* Visual Canvas: Photo or Stylized Monogram */}
      <div className={styles.visualCanvas}>
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={user.name}
            className={styles.avatarImage}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove(styles.hiddenFallback);
            }}
          />
        ) : null}

        <div
          className={[styles.monogramFallback, profile.avatar ? styles.hiddenFallback : '']
            .filter(Boolean)
            .join(' ')}
          style={{ background: palette.bg, color: palette.text }}
        >
          <span className={styles.initialsText}>{initials}</span>
        </div>

        {/* Floating Badges */}
        <div className={styles.topBadges}>
          {matchScore > 0 && (
            <span className={styles.scoreBadge}>
              <Sparkles size={12} className={styles.sparkIcon} /> {matchScore} pts
            </span>
          )}
          <span className={styles.verifiedBadge}>
            <Check size={12} strokeWidth={3} className={styles.checkIcon} /> Campus Verified
          </span>
        </div>

        <div className={styles.canvasBottomInfo}>
          <div className={styles.nameRow}>
            <h3 className={styles.studentName}>{user.name}</h3>
            {year && <span className={styles.yearBadge}>{year}</span>}
          </div>
          <p className={styles.majorResidence}>
            {major} {residence && `· ${residence}`}
          </p>
        </div>
      </div>

      {/* Card Content Section */}
      <div className={styles.cardContent}>
        {/* Match Highlight Banner */}
        {matchReasons.length > 0 && (
          <div className={styles.matchReasonBanner}>
            <span className={styles.sparkLead}>Why you match:</span>
            <span className={styles.reasonText}>{matchReasons[0]}</span>
          </div>
        )}

        {/* Bio prompt */}
        {bio ? (
          <p className={styles.bioSnippet}>&ldquo;{bio}&rdquo;</p>
        ) : (
          <p className={styles.bioFallback}>Looking to connect with peers for coursework & campus events.</p>
        )}

        {/* Interest tags */}
        {interests.length > 0 && (
          <div className={styles.interestsWrap}>
            {interests.slice(0, 4).map((interest) => {
              const isShared = sharedInterests.some(
                (si) => si.toLowerCase() === interest.toLowerCase()
              );
              return (
                <span
                  key={interest}
                  className={[styles.interestChip, isShared ? styles.sharedChip : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isShared && <Sparkles size={11} className={styles.chipSpark} />}
                  {interest}
                </span>
              );
            })}
            {interests.length > 4 && (
              <span className={styles.moreChip}>+{interests.length - 4}</span>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className={styles.actionBar}>
          <Button
            variant="pink"
            size="small"
            className={styles.sayHiBtn}
            onClick={handleSayHi}
          >
            {isConnected ? (
              <>
                <Check size={13} /> Message Sent
              </>
            ) : (
              <>
                <MessageSquare size={13} /> Say Hi
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="small"
            className={styles.viewBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProfile();
            }}
          >
            Full Story
          </Button>
        </div>
      </div>
    </article>
  );
};

export default StudentProfileCard;
