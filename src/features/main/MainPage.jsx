import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, GraduationCap, Sparkles, MessageSquare, Search, X } from 'lucide-react';
import Button from '../../components/Button';
import StudentProfileCard from '../../components/StudentProfileCard';
import { getAuthToken, clearAuthToken } from '../auth/authStorage';
import { getProfile, getRecommendations } from '../auth/authService';
import styles from './MainPage.module.css';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Students', icon: Users },
  { id: 'shared', label: 'Shared Interests', icon: Heart },
  { id: 'dept', label: 'Same Department', icon: GraduationCap },
  { id: 'high', label: 'High Overlap', icon: Sparkles }
];

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const MainPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [connectedIds, setConnectedIds] = useState(new Set());

  const loadData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [profileRes, recsRes] = await Promise.all([
        getProfile(token),
        getRecommendations(token)
      ]);

      setProfile(profileRes);
      setRecommendations(recsRes.recommendations || []);
    } catch (error) {
      clearAuthToken();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProfile = profile?.profile || {};
  const currentName = profile?.name ? profile.name.split(' ')[0] : 'Student';
  const currentMajor = currentProfile.major || 'Your Department';
  const isProfileComplete = Boolean(profile?.profileComplete);

  const departmentOptions = useMemo(() => {
    return uniqueValues([
      currentProfile.major,
      ...recommendations.map((u) => u.profile?.major)
    ]);
  }, [currentProfile.major, recommendations]);

  const filteredRecommendations = useMemo(() => {
    const query = normalize(searchTerm);

    return recommendations.filter((user) => {
      const name = normalize(user.name);
      const major = normalize(user.profile?.major);
      const bio = normalize(user.profile?.bio);
      const interests = Array.isArray(user.profile?.interests)
        ? user.profile.interests.join(' ').toLowerCase()
        : '';

      // Text search
      const matchesSearch =
        !query ||
        name.includes(query) ||
        major.includes(query) ||
        bio.includes(query) ||
        interests.includes(query);

      // Department filter
      const matchesDept =
        departmentFilter === 'all' ||
        normalize(user.profile?.major) === normalize(departmentFilter);

      // Category tab
      let matchesTab = true;
      if (activeTab === 'shared') {
        matchesTab = (user.sharedInterests?.length || 0) > 0;
      } else if (activeTab === 'dept') {
        matchesTab = Boolean(user.sameDepartment);
      } else if (activeTab === 'high') {
        matchesTab = (user.matchScore || 0) >= 3;
      }

      return matchesSearch && matchesDept && matchesTab;
    });
  }, [activeTab, departmentFilter, recommendations, searchTerm]);

  const handleConnect = (user) => {
    setConnectedIds((prev) => new Set(prev).add(user.id));
    navigate('/matches', { state: { openDmId: user.id } });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Finding people on your campus...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Welcoming Header Banner */}
      <section className={styles.welcomeBanner}>
        <div className={styles.welcomeInner}>
          <div className={styles.welcomeCopy}>
            <div className={styles.campusBadge}>
              <span className={styles.campusDot} />
              <span>Campus Directory</span>
              <span className={styles.dividerDot}>·</span>
              <span>{currentMajor}</span>
            </div>
            <h1 className={styles.welcomeTitle}>
              Hey {currentName}! Find your campus crew.
            </h1>
            <p className={styles.welcomeLead}>
              Discover classmates in your courses, find dedicated study partners, and make real friends across campus.
            </p>
          </div>

          <div className={styles.bannerActions}>
            <Button
              variant="primary"
              size="medium"
              onClick={() => navigate('/matches')}
            >
              <MessageSquare size={16} /> Messages
            </Button>
          </div>
        </div>

        {/* Profile Completion Nudge if not complete */}
        {!isProfileComplete && (
          <div className={styles.nudgeBanner}>
            <div className={styles.nudgeText}>
              <Sparkles size={16} className={styles.nudgeSpark} />
              <span>Your profile is missing interests and bio. Complete it to unlock tailored campus matches!</span>
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={() => navigate('/profile-setup')}
            >
              Complete Profile
            </Button>
          </div>
        )}
      </section>

      {/* Discovery Hub Controls */}
      <section className={styles.controlsSection}>
        {/* Category Vibe Pills */}
        <div className={styles.tabBar} role="tablist" aria-label="Discovery categories">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={[styles.tabBtn, activeTab === tab.id ? styles.activeTab : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} className={styles.tabIcon} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Department Dropdown Filter */}
        <div className={styles.searchFilterRow}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name, major, interest (e.g. machine learning, robotics)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.deptSelectWrap}>
            <select
              className={styles.deptSelect}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Profile Discovery Grid */}
      <section className={styles.discoverySection}>
        <div className={styles.discoveryHeader}>
          <div className={styles.discoveryTitleGroup}>
            <h2 className={styles.sectionHeading}>Suggested Classmates</h2>
            <span className={styles.countPill}>
              {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          {(searchTerm || departmentFilter !== 'all' || activeTab !== 'all') && (
            <button
              type="button"
              className={styles.resetFiltersBtn}
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setActiveTab('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredRecommendations.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrap}>
              <Search size={32} />
            </div>
            <h3 className={styles.emptyTitle}>No matching students found</h3>
            <p className={styles.emptyLead}>
              Try clearing your search terms or expanding the department filter to discover more peers across campus.
            </p>
            <Button
              variant="lavender"
              size="medium"
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setActiveTab('all');
              }}
            >
              Show All Students
            </Button>
          </div>
        ) : (
          <div className={styles.profileGrid}>
            {filteredRecommendations.map((user) => (
              <StudentProfileCard
                key={user.id}
                user={user}
                isConnected={connectedIds.has(user.id)}
                onConnect={handleConnect}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default MainPage;
