import { useNavigate } from 'react-router-dom';
import { Users, Sparkles, ShieldCheck, Compass, ArrowRight } from 'lucide-react';
import Button from '../../components/Button';
import styles from './AboutPage.module.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Our Philosophy</span>
        <h1>Making campus feel smaller and friendlier.</h1>
        <p className={styles.lead}>
          UniMatch was created with one simple conviction: your university years are shaped by the people you meet,
          the study groups you form, and the late-night conversations that start from a simple &ldquo;hello&rdquo;.
        </p>
      </header>

      <section className={styles.storyGrid}>
        <article className={[styles.storyCard, styles.cardLavender].join(' ')}>
          <div className={styles.cardSpark}>
            <Users size={24} />
          </div>
          <h2>The Problem With Campus Life</h2>
          <p>
            Universities have thousands of bright students, but most of us only ever meet the 30 people in our tutorial
            or the ones living on our floor. Giant group chats are noisy, and dating apps are the wrong vibe for academic & campus friendships.
          </p>
        </article>

        <article className={[styles.storyCard, styles.cardPink].join(' ')}>
          <div className={styles.cardSpark}>
            <Sparkles size={24} />
          </div>
          <h2>A Friendly, Purpose-Built Social Club</h2>
          <p>
            UniMatch is designed around your campus reality: finding a coding partner for operating systems, discovering fellow badminton players,
            or organizing coffee study sprints before finals.
          </p>
        </article>

        <article className={[styles.storyCard, styles.cardYellow].join(' ')}>
          <div className={styles.cardSpark}>
            <ShieldCheck size={24} />
          </div>
          <h2>100% Student Exclusivity</h2>
          <p>
            Every account requires an authentic institutional email domain (.edu / .cuchd.in).
            There are no outside recruiters, advertisers, or fake accounts. Just verified students from your campus.
          </p>
        </article>

        <article className={[styles.storyCard, styles.cardMint].join(' ')}>
          <div className={styles.cardSpark}>
            <Compass size={24} />
          </div>
          <h2>Collaborative Campus Culture</h2>
          <p>
            We don&rsquo;t want you feeling isolated in massive lecture halls. From project partners to exam review
            buddies, UniMatch helps you build supportive peer networks that last through graduation.
          </p>
        </article>
      </section>

      <section className={styles.communityCallout}>
        <div className={styles.calloutCopy}>
          <h3>Ready to meet your classmates?</h3>
          <p>Join the student directory, tell your campus what you&rsquo;re into, and discover who&rsquo;s around you.</p>
        </div>
        <div className={styles.calloutActions}>
          <Button variant="primary" size="large" onClick={() => navigate('/signup')}>
            Join Your Campus <ArrowRight size={16} />
          </Button>
          <Button variant="ghost" size="large" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
