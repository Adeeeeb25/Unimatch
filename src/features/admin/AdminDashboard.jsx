import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import styles from './AdminDashboard.module.css';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  getDomains,
  addDomain,
  setDomainStatus,
  makePrimaryDomain,
  deleteDomain,
  getSupportRequests,
  updateSupportStatus
} from '../auth/authService';
import { ADMIN_TOKEN_KEY } from './AdminLoginPage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString() + ' ' + parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  
  // Users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [userTone, setUserTone] = useState('');

  // Domains
  const [domains, setDomains] = useState([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newInstitutionInput, setNewInstitutionInput] = useState('');
  const [domainMessage, setDomainMessage] = useState('');
  const [latestChallenge, setLatestChallenge] = useState(null);

  // Support Requests
  const [supportRequests, setSupportRequests] = useState([]);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  const getToken = () => window.localStorage.getItem(ADMIN_TOKEN_KEY);

  const loadUsers = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUsers([]);
      setUserMessage('Admin session expired. Sign in again.');
      setUserTone('error');
      return;
    }

    setIsLoadingUsers(true);
    try {
      const payload = await getAdminUsers(token);
      setUsers(payload.users || []);
    } catch (error) {
      setUserMessage(error.message || 'Failed to load user directory.');
      setUserTone('error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadDomains = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoadingDomains(true);
    try {
      const payload = await getDomains(token);
      setDomains(payload.domains || []);
    } catch (error) {
      setDomainMessage(error.message || 'Failed to load domains.');
    } finally {
      setIsLoadingDomains(false);
    }
  }, []);

  const loadSupportRequests = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoadingSupport(true);
    try {
      const payload = await getSupportRequests(token);
      setSupportRequests(payload.requests || []);
    } catch (error) {
      setSupportMessage(error.message || 'Failed to load support requests.');
    } finally {
      setIsLoadingSupport(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadDomains();
    loadSupportRequests();
  }, [loadUsers, loadDomains, loadSupportRequests]);

  const userList = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const activeAccounts = useMemo(
    () => userList.filter((user) => Boolean(user.profileComplete)).length,
    [userList]
  );
  const adminCount = useMemo(
    () => userList.filter((user) => user.role === 'admin').length,
    [userList]
  );
  const pendingCount = useMemo(
    () => userList.length - activeAccounts,
    [userList.length, activeAccounts]
  );

  const handleCreateUser = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedName = newName.trim();
      const normalizedEmail = newEmail.trim().toLowerCase();

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setUserMessage('Valid university email required.');
        setUserTone('error');
        return;
      }

      if (newPassword.length < 8) {
        setUserMessage('Password must have at least 8 characters.');
        setUserTone('error');
        return;
      }

      const token = getToken();
      if (!token) {
        setUserMessage('Admin session expired.');
        setUserTone('error');
        return;
      }

      try {
        await createAdminUser(token, { email: normalizedEmail, password: newPassword, name: trimmedName });
        setUserMessage(`Registered ${normalizedEmail} successfully.`);
        setUserTone('success');
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        loadUsers();
      } catch (error) {
        setUserMessage(error.message || 'Unable to register user.');
        setUserTone('error');
      }
    },
    [loadUsers, newEmail, newName, newPassword]
  );

  const handleDeleteUser = useCallback(
    async (userId) => {
      const token = getToken();
      if (!token) {
        setUserMessage('Admin session expired.');
        setUserTone('error');
        return;
      }

      try {
        await deleteAdminUser(token, userId);
        setUserMessage(`User deleted successfully.`);
        setUserTone('success');
        loadUsers();
      } catch (error) {
        setUserMessage(error.message || 'Unable to delete user.');
        setUserTone('error');
      }
    },
    [loadUsers]
  );

  const handleAddDomain = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setDomainMessage('');
    setLatestChallenge(null);

    try {
      const res = await addDomain(token, {
        domain: newDomainInput,
        institution: newInstitutionInput
      });
      setDomainMessage(res.message || 'Domain added successfully.');
      if (res.dnsChallenge) {
        setLatestChallenge({
          domain: res.domain.domain,
          ...res.dnsChallenge
        });
      }
      setNewDomainInput('');
      setNewInstitutionInput('');
      loadDomains();
    } catch (err) {
      setDomainMessage(err.message || 'Failed to add domain.');
    }
  };

  const handleVerifyDomain = async (domainId) => {
    const token = getToken();
    if (!token) return;

    try {
      await setDomainStatus(token, domainId, 'verified');
      setDomainMessage('Domain status updated to verified.');
      loadDomains();
    } catch (err) {
      setDomainMessage(err.message || 'Verification update failed.');
    }
  };

  const handleSetPrimary = async (domainId) => {
    const token = getToken();
    if (!token) return;

    try {
      await makePrimaryDomain(token, domainId);
      setDomainMessage('Primary institutional domain updated.');
      loadDomains();
    } catch (err) {
      setDomainMessage(err.message || 'Failed to set primary domain.');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    const token = getToken();
    if (!token) return;

    try {
      await deleteDomain(token, domainId);
      setDomainMessage('Domain removed from campus configuration.');
      loadDomains();
    } catch (err) {
      setDomainMessage(err.message || 'Failed to remove domain.');
    }
  };

  const handleUpdateSupportStatus = async (requestId, newStatus) => {
    const token = getToken();
    if (!token) return;

    try {
      await updateSupportStatus(token, requestId, newStatus);
      setSupportMessage('Support request status updated.');
      loadSupportRequests();
    } catch (err) {
      setSupportMessage(err.message || 'Failed to update request.');
    }
  };

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.dispatchEvent(new Event('unimatch-admin-change'));
    navigate('/admin/login');
  }, [navigate]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Campus Administration</span>
          <h1>UniMatch Administration Console</h1>
          <p className={styles.lead}>
            Directory metrics, user management, support tickets, and institutional domain configuration.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Application
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Sign Out Admin
          </Button>
        </div>
      </header>

      <nav className={styles.subnav}>
        <button
          type="button"
          className={activeView === 'overview' ? styles.activeTab : ''}
          onClick={() => setActiveView('overview')}
        >
          Overview & Metrics
        </button>
        <button
          type="button"
          className={activeView === 'users' ? styles.activeTab : ''}
          onClick={() => setActiveView('users')}
        >
          User Directory ({userList.length})
        </button>
        <button
          type="button"
          className={activeView === 'domains' ? styles.activeTab : ''}
          onClick={() => setActiveView('domains')}
        >
          Custom Domains ({domains.length})
        </button>
        <button
          type="button"
          className={activeView === 'support' ? styles.activeTab : ''}
          onClick={() => setActiveView('support')}
        >
          Support Inquiries ({supportRequests.length})
        </button>
      </nav>

      {activeView === 'overview' && (
        <section className={styles.viewSection}>
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Directory Accounts</span>
              <p className={styles.metricValue}>{userList.length}</p>
              <p className={styles.metricMeta}>Registered student accounts in database</p>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Complete Profiles</span>
              <p className={styles.metricValue}>{activeAccounts}</p>
              <p className={styles.metricMeta}>Profiles with major, year, and interests</p>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Pending Onboarding</span>
              <p className={styles.metricValue}>{pendingCount}</p>
              <p className={styles.metricMeta}>Users awaiting profile completion</p>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Configured Campus Domains</span>
              <p className={styles.metricValue}>{domains.length}</p>
              <p className={styles.metricMeta}>Institutional domains registered</p>
            </div>
          </div>

          <div className={styles.overviewGrid}>
            <article className={styles.panelCard}>
              <h3>Platform Status</h3>
              <div className={styles.statusList}>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>PostgreSQL Database</span>
                  <span className={styles.badgeSuccess}>Connected</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>API Service Status</span>
                  <span className={styles.badgeSuccess}>Online</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Support Queue</span>
                  <span className={styles.badgeInfo}>
                    {supportRequests.filter((r) => r.status === 'pending').length} Pending Review
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Admin Session</span>
                  <span className={styles.badgeSuccess}>Authenticated</span>
                </div>
              </div>
            </article>

            <article className={styles.panelCard}>
              <h3>Quick Actions</h3>
              <div className={styles.quickActionList}>
                <Button variant="ghost" onClick={() => setActiveView('domains')}>
                  Configure New Custom Domain
                </Button>
                <Button variant="ghost" onClick={() => setActiveView('users')}>
                  Register New Directory User
                </Button>
                <Button variant="ghost" onClick={() => setActiveView('support')}>
                  Review Support Inquiries
                </Button>
                <Button variant="ghost" onClick={() => { loadUsers(); loadDomains(); loadSupportRequests(); }}>
                  Refresh Database Records
                </Button>
              </div>
            </article>
          </div>
        </section>
      )}

      {activeView === 'users' && (
        <section className={styles.viewSection}>
          <article className={styles.panelCard}>
            <h3>Add Directory User</h3>
            <p className={styles.panelLead}>Directly register an authorized student account in the database.</p>
            <form className={styles.userForm} onSubmit={handleCreateUser}>
              <div className={styles.formFields}>
                <input
                  className={styles.input}
                  placeholder="Full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
                <input
                  className={styles.input}
                  placeholder="University email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
                <input
                  className={styles.input}
                  placeholder="Initial password (min 8 chars)"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button variant="glow" type="submit">
                Create User
              </Button>
              {userMessage && (
                <p className={[styles.feedback, userTone ? styles[userTone] : ''].filter(Boolean).join(' ')}>
                  {userMessage}
                </p>
              )}
            </form>
          </article>

          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Registered Users Directory</h3>
                <p className={styles.panelLead}>
                  {userList.length} total members · {activeAccounts} completed profiles
                </p>
              </div>
              <Button variant="ghost" onClick={loadUsers}>
                Refresh List
              </Button>
            </div>

            {isLoadingUsers ? (
              <p className={styles.loadingState}>Loading user records...</p>
            ) : userList.length === 0 ? (
              <p className={styles.emptyState}>No registered accounts found in the database.</p>
            ) : (
              <div className={styles.userList}>
                {userList.map((user) => (
                  <div key={user.id} className={styles.userCard}>
                    <div>
                      <h4 className={styles.userName}>{user.name || 'Unnamed student'}</h4>
                      <p className={styles.userEmail}>{user.email}</p>
                      <p className={styles.userMeta}>
                        Registered: {formatDate(user.createdAt)} · Role: {user.role} ·{' '}
                        {user.profileComplete ? 'Profile Complete' : 'Pending Setup'}
                      </p>
                    </div>
                    <div className={styles.userActions}>
                      <Button
                        variant="ghost"
                        className={styles.dangerBtn}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete User
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {activeView === 'domains' && (
        <section className={styles.viewSection}>
          <article className={styles.panelCard}>
            <h3>Register Custom Campus Domain</h3>
            <p className={styles.panelLead}>
              Add an authorized institutional domain (e.g. connect.cuchd.in). Domains are validated using DNS TXT challenges.
            </p>

            <form className={styles.domainForm} onSubmit={handleAddDomain}>
              <div className={styles.formFields}>
                <input
                  className={styles.input}
                  placeholder="Custom Domain (e.g. connect.cuchd.in)"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  required
                />
                <input
                  className={styles.input}
                  placeholder="Institution Name (e.g. Chandigarh University)"
                  value={newInstitutionInput}
                  onChange={(e) => setNewInstitutionInput(e.target.value)}
                  required
                />
              </div>
              <Button variant="glow" type="submit">
                Add Campus Domain
              </Button>
              {domainMessage && <p className={styles.feedback}>{domainMessage}</p>}
            </form>

            {latestChallenge && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>DNS Verification Challenge for {latestChallenge.domain}</h4>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                  Create a TXT record with your DNS provider before marking verified:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <strong>Record Type:</strong> <code>{latestChallenge.type}</code>
                  <strong>Host / Name:</strong> <code>{latestChallenge.host}</code>
                  <strong>Value / Token:</strong> <code>{latestChallenge.value}</code>
                </div>
              </div>
            )}
          </article>

          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Configured Institutional Domains</h3>
                <p className={styles.panelLead}>
                  Live database records for authorized institutional domain origins.
                </p>
              </div>
              <Button variant="ghost" onClick={loadDomains}>
                Refresh Domains
              </Button>
            </div>

            {isLoadingDomains ? (
              <p className={styles.loadingState}>Loading configured domains...</p>
            ) : domains.length === 0 ? (
              <p className={styles.emptyState}>No campus domains configured yet.</p>
            ) : (
              <div className={styles.domainList}>
                {domains.map((dom) => (
                  <div key={dom.id} className={styles.domainCard}>
                    <div className={styles.domainInfo}>
                      <div className={styles.domainTitleRow}>
                        <h4 className={styles.domainName}>{dom.domain}</h4>
                        {dom.isPrimary && <span className={styles.primaryBadge}>Primary Domain</span>}
                        <span
                          className={
                            dom.status === 'verified' ? styles.badgeSuccess : styles.badgeWarning
                          }
                        >
                          {dom.status}
                        </span>
                      </div>
                      <p className={styles.domainMeta}>
                        Institution: {dom.institution || 'Institutional'} · Added: {formatDate(dom.addedAt)}
                      </p>
                      {dom.verificationToken && (
                        <p className={styles.domainMeta} style={{ fontSize: '0.78rem' }}>
                          DNS TXT Token: <code>{dom.verificationToken}</code>
                        </p>
                      )}
                    </div>

                    <div className={styles.domainActions}>
                      {dom.status !== 'verified' && (
                        <Button variant="ghost" onClick={() => handleVerifyDomain(dom.id)}>
                          Verify Domain
                        </Button>
                      )}
                      {!dom.isPrimary && (
                        <Button variant="ghost" onClick={() => handleSetPrimary(dom.id)}>
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className={styles.dangerBtn}
                        onClick={() => handleDeleteDomain(dom.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className={styles.panelCard}>
            <h3>DNS Configuration Reference</h3>
            <p className={styles.panelLead}>
              Add the following DNS records in your campus DNS management console to route traffic and verify ownership:
            </p>
            <div className={styles.dnsTableWrapper}>
              <table className={styles.dnsTable}>
                <thead>
                  <tr>
                    <th>Record Type</th>
                    <th>Host / Name</th>
                    <th>Target / Value</th>
                    <th>Requirement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>CNAME</code></td>
                    <td><code>connect</code> (or subdomain)</td>
                    <td><code>app.unimatch.internal</code></td>
                    <td>Traffic Routing</td>
                  </tr>
                  <tr>
                    <td><code>TXT</code></td>
                    <td><code>_unimatch-verify</code></td>
                    <td><code>[Verification Token]</code></td>
                    <td>Campus Ownership Proof</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeView === 'support' && (
        <section className={styles.viewSection}>
          <article className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Student & Campus Support Inquiries</h3>
                <p className={styles.panelLead}>
                  {supportRequests.length} total inquiries logged to the database.
                </p>
              </div>
              <Button variant="ghost" onClick={loadSupportRequests}>
                Refresh Inquiries
              </Button>
            </div>

            {supportMessage && <p className={styles.feedback}>{supportMessage}</p>}

            {isLoadingSupport ? (
              <p className={styles.loadingState}>Loading support requests...</p>
            ) : supportRequests.length === 0 ? (
              <p className={styles.emptyState}>No support inquiries in queue.</p>
            ) : (
              <div className={styles.userList}>
                {supportRequests.map((req) => (
                  <div key={req.id} className={styles.userCard} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 className={styles.userName}>{req.name} ({req.email})</h4>
                        <p className={styles.userMeta}>
                          Topic: <strong>{req.topic}</strong> · Submitted: {formatDate(req.submittedAt || req.submitted_at)}
                        </p>
                      </div>
                      <span
                        className={
                          req.status === 'resolved'
                            ? styles.badgeSuccess
                            : req.status === 'in-progress'
                            ? styles.badgeInfo
                            : styles.badgeWarning
                        }
                      >
                        {req.status}
                      </span>
                    </div>

                    <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem', color: '#334155', border: '1px solid #e2e8f0' }}>
                      {req.message}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {req.status !== 'in-progress' && (
                        <Button variant="ghost" onClick={() => handleUpdateSupportStatus(req.id, 'in-progress')}>
                          Mark In Progress
                        </Button>
                      )}
                      {req.status !== 'resolved' && (
                        <Button variant="ghost" onClick={() => handleUpdateSupportStatus(req.id, 'resolved')}>
                          Mark Resolved
                        </Button>
                      )}
                      {req.status !== 'closed' && (
                        <Button variant="ghost" onClick={() => handleUpdateSupportStatus(req.id, 'closed')}>
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}
    </section>
  );
};

export default AdminDashboard;
