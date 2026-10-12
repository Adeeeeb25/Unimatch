import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  BookOpen,
  Code2,
  Palette,
  Coffee,
  CheckCircle2,
  Search,
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/Button';
import styles from './HomePage.module.css';
import { isAuthenticated } from '../auth/authStorage';

const HERO_THEMES = [
  {
    id: 'study',
    index: '01',
    category: 'Study Collective',
    giantWord: 'YOUR PEOPLE',
    colorKey: 'lavender',
    bgColor: '#A88BFE',
    bgLight: '#F1EAFE',
    textColor: '#282333',
    headline: 'Your people are out there.',
    lead: 'Meet students who share your courses, work through problem sets together, and make more of campus life.',
    primaryCta: 'Find your people',
    ctaLink: '/signup',
    badge: 'Course Collaboration',
    cards: [
      {
        tag: 'CSE 304 · Systems',
        title: 'Distributed Labs Study Group',
        detail: 'Reviewing consensus protocols & lab 3 prep',
        meta: 'Library Room 3B · Today 4:00 PM',
        chip: '3 spots open'
      },
      {
        tag: 'MATH 215 · Calculus',
        title: 'Linear Algebra Exam Prep',
        detail: 'Working through practice finals & proof sets',
        meta: 'Silent Study Floor · Tomorrow',
        chip: 'Peer Tutoring'
      }
    ],
    tags: ['Computer Science', 'Data Science', 'Algorithms', 'Linear Algebra']
  },
  {
    id: 'build',
    index: '02',
    category: 'Hackathons & Projects',
    giantWord: 'BUILD TOGETHER',
    colorKey: 'yellow',
    bgColor: '#FFE49A',
    bgLight: '#FFFBEB',
    textColor: '#282333',
    headline: 'Find partners who actually build.',
    lead: 'Team up with developers, designers, and problem solvers across departments to turn side projects into working software.',
    primaryCta: 'Join a project team',
    ctaLink: '/signup',
    badge: 'Campus Builders',
    cards: [
      {
        tag: 'Campus Hackathon',
        title: 'Smart Campus Transit Tracker',
        detail: 'Building real-time bus tracker. Need React + UI/UX',
        meta: 'Hackathon Sprint · 3 Weeks Left',
        chip: 'Frontend & Design'
      },
      {
        tag: 'Open Source Club',
        title: 'UniNotes Crowdsourced Repo',
        detail: 'Verified course summaries & past papers',
        meta: 'GitHub Organization · Active Repo',
        chip: 'Full Stack'
      }
    ],
    tags: ['React', 'PostgreSQL', 'Python', 'Product Design', 'Robotics']
  },
  {
    id: 'creatives',
    index: '03',
    category: 'Clubs & Creatives',
    giantWord: 'CREATIVE GUILD',
    colorKey: 'coral',
    bgColor: '#F4845F',
    bgLight: '#FEF0EA',
    textColor: '#282333',
    headline: 'Connect around what you love outside class.',
    lead: 'From film photography and campus journalism to music production and debate, discover fellow creators across faculties.',
    primaryCta: 'Explore creative circles',
    ctaLink: '/signup',
    badge: 'Campus Culture',
    cards: [
      {
        tag: 'Campus Media Collective',
        title: 'Quarterly Student Magazine',
        detail: 'Curating 35mm photography, essays, and campus design',
        meta: 'Student Center Lounge · Weekly Meet',
        chip: 'Print & Digital'
      },
      {
        tag: 'Audio Guild',
        title: 'Acoustic & Production Circle',
        detail: 'Collaborative songwriting, mixing & beat sessions',
        meta: 'Campus Amphitheater · Friday',
        chip: 'Studio Lab'
      }
    ],
    tags: ['Editorial Design', '35mm Film', 'Audio Production', 'Journalism']
  },
  {
    id: 'hangouts',
    index: '04',
    category: 'Study Spots & Coffee',
    giantWord: 'CAMPUS LIFE',
    colorKey: 'pink',
    bgColor: '#F6B8D0',
    bgLight: '#FDF2F7',
    textColor: '#282333',
    headline: 'Never eat lunch or study alone again.',
    lead: 'Discover student-friendly campus cafes, fast Wi-Fi corners, and classmates ready to grab a quick coffee between lectures.',
    primaryCta: 'Find nearby study spots',
    ctaLink: '/cafe',
    badge: 'Campus Spaces',
    cards: [
      {
        tag: 'Block 3 Lounge',
        title: 'Corner Espresso Study Bar',
        detail: 'Fast Wi-Fi 6, quiet ambient sound & plenty of outlets',
        meta: 'Open daily until 9:00 PM',
        chip: 'Power Sockets'
      },
      {
        tag: 'Science Quad Court',
        title: 'Law & Tech Reading Garden',
        detail: 'Outdoor shaded benches, natural sunlight & fresh air',
        meta: 'Open Campus Zone',
        chip: 'Outdoor Seating'
      }
    ],
    tags: ['Coffee', 'Fast Wi-Fi', 'Power Outlets', 'Quiet Tables']
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);

  // If already authenticated, jump straight to the student discovery feed
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/main', { replace: true });
    }
  }, [navigate]);

  const currentTheme = HERO_THEMES[activeThemeIndex];

  const handlePrev = useCallback(() => {
    setActiveThemeIndex((prev) => (prev === 0 ? HERO_THEMES.length - 1 : prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveThemeIndex((prev) => (prev === HERO_THEMES.length - 1 ? 0 : prev + 1));
  }, []);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        handlePrev();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/about');
    }
  };

  return (
    <div className={styles.landingWrapper}>
      {/* Editorial Full-Viewport Hero */}
      <section
        className={[styles.heroViewport, styles[`theme_${currentTheme.colorKey}`]].join(' ')}
        aria-label="UniMatch Hero Showcase"
      >
        {/* Giant Editorial Background Typography Layer */}
        <div className={styles.giantBackdropText} aria-hidden="true">
          <span>{currentTheme.giantWord}</span>
        </div>

        <div className={styles.heroGrid}>
          {/* Left Column: Editorial Headline & Actions */}
          <div className={styles.heroEditorialCol}>
            <div className={styles.themePillRow}>
              <span className={styles.themeIndexBadge}>
                THEME {currentTheme.index} / 04
              </span>
              <span className={styles.themeCategoryName}>
                {currentTheme.category}
              </span>
            </div>

            <h1 className={styles.heroHeadline}>
              {currentTheme.headline}
            </h1>

            <p className={styles.heroLead}>
              {currentTheme.lead}
            </p>

            <div className={styles.ctaGroup}>
              <Button
                variant="primary"
                size="large"
                className={styles.mainCtaBtn}
                onClick={() => navigate(currentTheme.ctaLink)}
              >
                {currentTheme.primaryCta} <ArrowRight size={16} />
              </Button>
              <Button
                variant="ghost"
                size="large"
                className={styles.secondaryCtaBtn}
                onClick={scrollToHowItWorks}
              >
                See how it works
              </Button>
            </div>

            <div className={styles.trustRow}>
              <ShieldCheck size={16} className={styles.trustIcon} />
              <span>
                Verified university email required (.edu / .cuchd.in). Strictly zero ads or tracking.
              </span>
            </div>

            {/* Carousel Navigation Bar */}
            <div className={styles.carouselControlsRow}>
              <div className={styles.arrowControls}>
                <button
                  type="button"
                  className={styles.carouselNavBtn}
                  onClick={handlePrev}
                  aria-label="Previous campus theme"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  type="button"
                  className={styles.carouselNavBtn}
                  onClick={handleNext}
                  aria-label="Next campus theme"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Direct Theme Switcher Tabs */}
              <div className={styles.themeTabsList} role="tablist" aria-label="Campus Themes">
                {HERO_THEMES.map((theme, idx) => (
                  <button
                    key={theme.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeThemeIndex}
                    className={[
                      styles.themeTabBtn,
                      idx === activeThemeIndex ? styles.activeTabBtn : ''
                    ].filter(Boolean).join(' ')}
                    onClick={() => setActiveThemeIndex(idx)}
                  >
                    <span className={styles.tabNum}>{theme.index}</span>
                    <span className={styles.tabLabel}>{theme.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Layered Editorial Focal Composition */}
          <div className={styles.heroFocalCol}>
            <div
              className={styles.posterArtCanvas}
              style={{ backgroundColor: currentTheme.bgColor }}
            >
              {/* Graphic Theme Icon Watermark */}
              <div className={styles.posterWatermark} aria-hidden="true">
                {currentTheme.id === 'study' && <BookOpen size={180} />}
                {currentTheme.id === 'build' && <Code2 size={180} />}
                {currentTheme.id === 'creatives' && <Palette size={180} />}
                {currentTheme.id === 'hangouts' && <Coffee size={180} />}
              </div>

              {/* Poster Header */}
              <div className={styles.posterHeader}>
                <div className={styles.posterEyebrowBadge}>
                  <span className={styles.posterDot} />
                  <span>{currentTheme.badge}</span>
                </div>
                <span className={styles.posterIndexCorner}>
                  #{currentTheme.index}
                </span>
              </div>

              {/* Layered Content Cards Over Poster */}
              <div className={styles.posterCardsStack}>
                {currentTheme.cards.map((card, cIdx) => (
                  <article
                    key={card.title}
                    className={[
                      styles.floatingPostCard,
                      cIdx === 1 ? styles.cardStagger : ''
                    ].filter(Boolean).join(' ')}
                  >
                    <div className={styles.floatingCardHeader}>
                      <span className={styles.cardCourseTag}>{card.tag}</span>
                      <span className={styles.cardChip}>{card.chip}</span>
                    </div>
                    <h3 className={styles.cardHeading}>{card.title}</h3>
                    <p className={styles.cardDetail}>{card.detail}</p>
                    <div className={styles.cardMetaRow}>
                      <CheckCircle2 size={13} className={styles.cardMetaIcon} />
                      <span>{card.meta}</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Poster Bottom Tag Bar */}
              <div className={styles.posterTagsBar}>
                {currentTheme.tags.map((t) => (
                  <span key={t} className={styles.posterTagPill}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Editorial Section */}
      <section id="how-it-works" className={styles.editorialSection}>
        <div className={styles.sectionHeadingWrap}>
          <div className={styles.sectionEyebrow}>Campus Architecture</div>
          <h2 className={styles.sectionTitle}>
            Designed for genuine student collaboration.
          </h2>
          <p className={styles.sectionLead}>
            UniMatch eliminates the friction of meeting peers on campus. Discover study partners in your major, join student-led projects, and connect around shared passions.
          </p>
        </div>

        <div className={styles.pillarTrioGrid}>
          <article className={[styles.pillarBlock, styles.pillarLavender].join(' ')}>
            <div className={styles.pillarIconBadge}>
              <BookOpen size={24} />
            </div>
            <span className={styles.pillarStep}>01 / ACADEMIC COLLABORATION</span>
            <h3>Course & Lab Coordination</h3>
            <p>
              Match with classmates enrolled in the same difficult courses. Share lecture notes, form study groups for midterms, and tackle problem sets together.
            </p>
            <div className={styles.pillarFeatureList}>
              <span>· Department-specific search</span>
              <span>· Shared syllabus alignment</span>
              <span>· Direct 1-on-1 messaging</span>
            </div>
          </article>

          <article className={[styles.pillarBlock, styles.pillarYellow].join(' ')}>
            <div className={styles.pillarIconBadge}>
              <Code2 size={24} />
            </div>
            <span className={styles.pillarStep}>02 / PROJECT TEAMS</span>
            <h3>Hackathons & Campus Ventures</h3>
            <p>
              Find developers, designers, and creative thinkers across faculties. Build real software, submit to hackathons, and collaborate outside the classroom.
            </p>
            <div className={styles.pillarFeatureList}>
              <span>· Skill & stack filtering</span>
              <span>· Multi-department reach</span>
              <span>· Verified student badges</span>
            </div>
          </article>

          <article className={[styles.pillarBlock, styles.pillarCoral].join(' ')}>
            <div className={styles.pillarIconBadge}>
              <Coffee size={24} />
            </div>
            <span className={styles.pillarStep}>03 / CAMPUS UTILITY</span>
            <h3>Study Spots & Verified Access</h3>
            <p>
              Discover campus libraries, quiet Wi-Fi study zones, and student perimeter cafes. Every account is authenticated via your institutional domain.
            </p>
            <div className={styles.pillarFeatureList}>
              <span>· Institutional email verification</span>
              <span>· Quiet zone locator</span>
              <span>· Zero third-party ads or tracking</span>
            </div>
          </article>
        </div>
      </section>

      {/* Campus Preview Walkthrough */}
      <section className={styles.walkthroughSection}>
        <div className={styles.walkthroughCard}>
          <div className={styles.walkthroughContent}>
            <span className={styles.walkthroughBadge}>
              <Sparkles size={14} /> Directory Preview
            </span>
            <h2>Discover students across campus departments</h2>
            <p>
              Whether you are in Computer Science, Biotechnology, Architecture, or Management, UniMatch organizes student discovery around real skills, course interests, and year level.
            </p>
            <div className={styles.departmentPillsWrap}>
              <span className={styles.deptPill}>Computer Science & Engineering</span>
              <span className={styles.deptPill}>Biotechnology</span>
              <span className={styles.deptPill}>UI/UX & Product Design</span>
              <span className={styles.deptPill}>Business Administration</span>
              <span className={styles.deptPill}>Mathematics & Statistics</span>
              <span className={styles.deptPill}>Media & Communications</span>
            </div>
            <div className={styles.walkthroughCtaRow}>
              <Button
                variant="primary"
                size="large"
                onClick={() => navigate('/signup')}
              >
                Create your student profile <ArrowRight size={16} />
              </Button>
              <Button
                variant="ghost"
                size="large"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>

          <div className={styles.walkthroughVisual} aria-hidden="true">
            <div className={styles.mockupContainer}>
              <div className={styles.mockupHeaderRow}>
                <div className={styles.mockupWindowControls}>
                  <span className={styles.winDot} />
                  <span className={styles.winDot} />
                  <span className={styles.winDot} />
                </div>
                <span className={styles.mockupUrlLabel}>app.unimatch.internal/students</span>
              </div>
              <div className={styles.mockupContentBody}>
                <div className={styles.mockupSearchField}>
                  <Search size={14} />
                  <span>Search peers by course, lab, or hobby...</span>
                </div>
                <div className={styles.mockupMiniCard}>
                  <div className={styles.miniAvatar}>AP</div>
                  <div>
                    <strong>Aarav Patel</strong>
                    <div className={styles.miniMeta}>CSE · 3rd Year · Algorithms & React</div>
                  </div>
                </div>
                <div className={styles.mockupMiniCard}>
                  <div className={styles.miniAvatar}>SK</div>
                  <div>
                    <strong>Simran Kaur</strong>
                    <div className={styles.miniMeta}>Design · 2nd Year · Figma & Systems</div>
                  </div>
                </div>
                <div className={styles.mockupMiniCard}>
                  <div className={styles.miniAvatar}>RD</div>
                  <div>
                    <strong>Rohan Das</strong>
                    <div className={styles.miniMeta}>Biotech · 4th Year · Lab Prep & Python</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Administration Portal Banner */}
      <section className={styles.adminBannerSection}>
        <div className={styles.adminBannerInner}>
          <div className={styles.adminTextCol}>
            <span className={styles.adminEyebrow}>CAMPUS INFRASTRUCTURE</span>
            <h3>Deploy UniMatch for your university or student body</h3>
            <p>
              Support custom campus domains (e.g. <code>connect.yourcampus.edu</code>) with cryptographically validated DNS challenges, directory management, and administrative moderation.
            </p>
          </div>
          <div className={styles.adminBtnCol}>
            <Button
              variant="ghost"
              size="medium"
              onClick={() => navigate('/admin')}
            >
              Admin Console Portal <ExternalLink size={14} />
            </Button>
            <Button
              variant="lavender"
              size="medium"
              onClick={() => navigate('/support')}
            >
              Contact Campus Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
