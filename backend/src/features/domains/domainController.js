import {
  listDomains,
  findDomainByValue,
  createDomain,
  updateDomainStatus,
  setPrimaryDomain,
  deleteDomain
} from './domainRepository.js';

const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export const getDomains = async (req, res) => {
  try {
    const domains = await listDomains();
    return res.json({ domains });
  } catch (err) {
    console.error('getDomains error:', err);
    return res.status(500).json({ message: 'Failed to load domains' });
  }
};

export const addDomain = async (req, res) => {
  try {
    const { domain, institution } = req.body;
    if (!domain?.trim()) {
      return res.status(400).json({ message: 'Domain name is required' });
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!DOMAIN_PATTERN.test(clean)) {
      return res.status(400).json({ message: 'Please provide a valid domain name (e.g. students.university.edu)' });
    }

    const existing = await findDomainByValue(clean);
    if (existing) {
      return res.status(409).json({ message: 'This domain is already registered' });
    }

    const created = await createDomain({
      domain: clean,
      institution: institution?.trim() || ''
    });

    return res.status(201).json({
      domain: created,
      message: `Domain "${clean}" added with status: pending. Add the DNS TXT record below to begin verification.`,
      dnsChallenge: {
        type: 'TXT',
        host: '_unimatch-verify',
        value: created.verificationToken
      }
    });
  } catch (err) {
    console.error('addDomain error:', err);
    return res.status(500).json({ message: 'Failed to add domain' });
  }
};

export const setDomainStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'verified', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    // NOTE: This sets the status directly. In production, 'verified' should only be
    // set after confirming the DNS TXT record via a DNS resolver. That check requires
    // network access to DNS servers and is documented in README.md as a required
    // infrastructure step before enabling domain-restricted registration.
    const updated = await updateDomainStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    return res.json({ domain: updated });
  } catch (err) {
    console.error('setDomainStatus error:', err);
    return res.status(500).json({ message: 'Failed to update domain status' });
  }
};

export const makePrimary = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await setPrimaryDomain(id);
    if (!updated) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    return res.json({ domain: updated });
  } catch (err) {
    console.error('makePrimary error:', err);
    return res.status(500).json({ message: 'Failed to set primary domain' });
  }
};

export const removeDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteDomain(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    return res.json({ message: 'Domain removed' });
  } catch (err) {
    console.error('removeDomain error:', err);
    return res.status(500).json({ message: 'Failed to remove domain' });
  }
};
