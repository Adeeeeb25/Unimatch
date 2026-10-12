import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import Button from '../../components/Button';
import { clearAuthToken, getAuthToken } from '../auth/authStorage';
import {
  getConversation,
  getProfile,
  getRecommendations,
  listConversations,
  sendDirectMessage
} from '../auth/authService';
import styles from './MatchesPage.module.css';

const formatMessageTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MatchesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatMessagesEndRef = useRef(null);
  const lastSentAtRef = useRef(0);

  const [currentUserId, setCurrentUserId] = useState('');
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedDmId, setSelectedDmId] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'matches'
  const [mobileChatView, setMobileChatView] = useState(false);

  // 1. Load Current User, Recommendations, and Conversations
  const loadInitialData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [profileRes, recsRes, convsRes] = await Promise.all([
        getProfile(token),
        getRecommendations(token).catch(() => ({ recommendations: [] })),
        listConversations(token).catch(() => ({ conversations: [] }))
      ]);

      const myId = String(profileRes.id || profileRes._id);
      setCurrentUserId(myId);

      const recommendedUsers = recsRes.recommendations || [];
      const userConvs = convsRes.conversations || [];

      setMatches(recommendedUsers);
      setConversations(userConvs);

      const requestedDmId = location.state?.openDmId ? String(location.state.openDmId) : '';

      setSelectedDmId((currentSelection) => {
        if (requestedDmId) {
          setMobileChatView(true);
          return requestedDmId;
        }
        if (currentSelection) return currentSelection;
        if (userConvs.length > 0) return String(userConvs[0].partnerId);
        if (recommendedUsers.length > 0) return String(recommendedUsers[0].id);
        return '';
      });
      setErrorStatus('');
    } catch (error) {
      clearAuthToken();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load Active Conversation Messages
  const fetchActiveMessages = useCallback(async ({ skipIfRecentSend = false } = {}) => {
    if (!selectedDmId) return;
    if (skipIfRecentSend && Date.now() - lastSentAtRef.current < 3000) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await getConversation(token, selectedDmId);
      const incoming = data.messages || [];
      setMessages((prev) => {
        const serverIds = new Set(incoming.map((m) => String(m.id)));
        const localOnly = prev.filter((m) => m._local && !serverIds.has(String(m.id)));
        return [...incoming, ...localOnly];
      });
      if (data.partner) {
        setActivePartner(data.partner);
      }
      setErrorStatus('');
    } catch (err) {
      setErrorStatus(err.message || 'Unable to load message thread.');
    }
  }, [selectedDmId]);

  useEffect(() => {
    fetchActiveMessages();
  }, [fetchActiveMessages]);

  // 3. Periodic Background Sync (every 5 seconds)
  useEffect(() => {
    if (!selectedDmId) return;

    const interval = setInterval(() => {
      fetchActiveMessages({ skipIfRecentSend: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchActiveMessages, selectedDmId]);

  // 4. Auto scroll chat to bottom
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Merge directory recommendations and active conversation partners
  const displayPeers = useMemo(() => {
    const map = new Map();

    conversations.forEach((conv) => {
      map.set(String(conv.partnerId), {
        id: String(conv.partnerId),
        name: conv.partnerName,
        email: conv.partnerEmail,
        profile: conv.partnerProfile || {},
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount || 0
      });
    });

    matches.forEach((peer) => {
      const peerId = String(peer.id);
      if (!map.has(peerId)) {
        map.set(peerId, {
          id: peerId,
          name: peer.name,
          email: peer.email,
          profile: peer.profile || {},
          matchScore: peer.matchScore
        });
      } else {
        map.get(peerId).matchScore = peer.matchScore;
      }
    });

    const list = Array.from(map.values());

    if (activeTab === 'unread') {
      return list.filter((p) => p.unreadCount > 0);
    }
    if (activeTab === 'matches') {
      return list.filter((p) => p.matchScore !== undefined);
    }
    return list;
  }, [activeTab, conversations, matches]);

  const selectedPeer = useMemo(() => {
    if (!selectedDmId) return null;
    const found = displayPeers.find((p) => String(p.id) === String(selectedDmId));
    if (found) return found;
    return activePartner;
  }, [activePartner, displayPeers, selectedDmId]);

  const handleSelectDm = (peerId) => {
    setSelectedDmId(String(peerId));
    setMobileChatView(true);
  };

  const openProfile = (peerId) => {
    navigate(`/profile/${peerId}`);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmed = draft.trim();
    if (!selectedDmId || !trimmed || isSending) return;

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      senderId: String(currentUserId),
      recipientId: String(selectedDmId),
      content: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
      _local: true
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft('');
    setIsSending(true);
    lastSentAtRef.current = Date.now();

    try {
      const sentMessage = await sendDirectMessage(token, selectedDmId, trimmed);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? sentMessage : m))
      );

      listConversations(token).then((res) => {
        setConversations(res.conversations || []);
      }).catch(() => {});
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(trimmed);
      setErrorStatus(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Campus Messages</span>
          <h1>Direct Messages & Peer Coordination</h1>
          <p className={styles.lead}>
            Coordinate assignments, plan study sessions at campus cafes, or say hello to peers.
          </p>
        </div>
      </header>

      <div className={[styles.chatLayout, mobileChatView ? styles.showMobileChat : ''].filter(Boolean).join(' ')}>
        {/* Left Pane: Conversations & Matches List */}
        <div className={styles.sidebarPane}>
          <div className={styles.sidebarHeader}>
            <div className={styles.filterPills}>
              <button
                type="button"
                className={[styles.pillBtn, activeTab === 'all' ? styles.activePill : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveTab('all')}
              >
                All ({displayPeers.length})
              </button>
              <button
                type="button"
                className={[styles.pillBtn, activeTab === 'matches' ? styles.activePill : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveTab('matches')}
              >
                Matches
              </button>
            </div>
          </div>

          <div className={styles.peerList}>
            {loading ? (
              <div className={styles.emptyNotice}>Loading conversations...</div>
            ) : displayPeers.length === 0 ? (
              <div className={styles.emptyNotice}>
                <p>No active conversations yet.</p>
                <Button variant="lavender" size="small" onClick={() => navigate('/main')}>
                  Find Classmates
                </Button>
              </div>
            ) : (
              displayPeers.map((peer) => {
                const isSelected = String(peer.id) === String(selectedDmId);
                const major = peer.profile?.major || 'Campus Student';
                const initial = peer.name?.charAt(0).toUpperCase() || 'U';

                return (
                  <article
                    key={peer.id}
                    className={[styles.peerCard, isSelected ? styles.activePeer : ''].filter(Boolean).join(' ')}
                    onClick={() => handleSelectDm(peer.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectDm(peer.id)}
                  >
                    <div className={styles.peerAvatar}>
                      {peer.profile?.avatar ? (
                        <img src={peer.profile.avatar} alt={peer.name} />
                      ) : (
                        <span>{initial}</span>
                      )}
                      {peer.unreadCount > 0 && <span className={styles.unreadDot} />}
                    </div>

                    <div className={styles.peerInfo}>
                      <div className={styles.peerNameRow}>
                        <h4 className={styles.peerName}>{peer.name}</h4>
                        {peer.matchScore !== undefined && (
                          <span className={styles.scoreBadge}>
                            <Sparkles size={11} /> {peer.matchScore}
                          </span>
                        )}
                      </div>
                      <p className={styles.peerMajor}>{major}</p>
                      {peer.lastMessage && (
                        <p className={styles.lastMessageSnippet}>{peer.lastMessage}</p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Message Thread */}
        <section className={styles.threadPane}>
          {selectedPeer ? (
            <>
              {/* Thread Header */}
              <div className={styles.threadHeader}>
                <button
                  type="button"
                  className={styles.mobileBackBtn}
                  onClick={() => setMobileChatView(false)}
                  aria-label="Back to contacts"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <div
                  className={styles.threadPartnerInfo}
                  onClick={() => openProfile(selectedPeer.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.threadAvatar}>
                    {selectedPeer.profile?.avatar ? (
                      <img src={selectedPeer.profile.avatar} alt={selectedPeer.name} />
                    ) : (
                      <span>{selectedPeer.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <h3 className={styles.threadPartnerName}>{selectedPeer.name}</h3>
                    <p className={styles.threadPartnerMajor}>
                      {selectedPeer.profile?.major || 'Student'} · {selectedPeer.profile?.year || 'Campus'}
                    </p>
                  </div>
                </div>

                <div className={styles.threadActions}>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => openProfile(selectedPeer.id)}
                  >
                    View Story
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className={styles.messageScrollArea}>
                {messages.length === 0 ? (
                  <div className={styles.emptyConversation}>
                    <div className={styles.emptyChatSpark}>
                      <MessageSquare size={32} />
                    </div>
                    <h4>Say hello to {selectedPeer.name}!</h4>
                    <p>
                      Send a message to break the ice, ask about assignments, or grab coffee at a campus study spot.
                    </p>
                  </div>
                ) : (
                  messages.map((chat) => {
                    const isMine = String(chat.senderId) === String(currentUserId);
                    return (
                      <div
                        key={chat.id}
                        className={[styles.messageRow, isMine ? styles.myRow : styles.partnerRow].join(' ')}
                      >
                        <div className={[styles.bubble, isMine ? styles.myBubble : styles.partnerBubble].join(' ')}>
                          <p className={styles.bubbleText}>{chat.content}</p>
                          <span className={styles.timestamp}>
                            {formatMessageTime(chat.createdAt)} {isMine && chat._local && '· Sending...'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Composer */}
              <form className={styles.composer} onSubmit={handleSend}>
                <input
                  type="text"
                  className={styles.composerInput}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Write a message to ${selectedPeer.name}...`}
                  disabled={isSending}
                  maxLength={1000}
                />
                <Button
                  variant="primary"
                  size="medium"
                  type="submit"
                  disabled={!draft.trim() || isSending}
                >
                  <Send size={15} />
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </form>

              {errorStatus && <p className={styles.errorNotice}>{errorStatus}</p>}
            </>
          ) : (
            <div className={styles.noPeerSelected}>
              <div className={styles.noPeerIcon}>
                <MessageSquare size={36} />
              </div>
              <h3>Select a classmate to chat</h3>
              <p>Choose an ongoing conversation from the left, or connect with a classmate from the directory.</p>
              <Button variant="lavender" size="medium" onClick={() => navigate('/main')}>
                Explore Classmates
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MatchesPage;
