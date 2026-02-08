// Safety Review - Rule-based link analysis
// Uses lightweight checks without AI dependency

import { getScamInfo, getCategoryLabel, ScamCategory } from './scamDatabase';

import { isTrustedDomain } from './trustedDomains';

export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export interface SafetyCheck {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'danger';
}

export interface SafetyReviewResult {
  url: string;
  domain: string;
  riskLevel: RiskLevel;
  checks: SafetyCheck[];
  summary: string;
  recommendation: string;
  scamCategory?: ScamCategory;
}


// Common brand names for typosquatting detection
const BRAND_NAMES = [
  'google', 'facebook', 'amazon', 'apple', 'microsoft', 'paypal',
  'netflix', 'instagram', 'whatsapp', 'linkedin', 'twitter', 'bank',
  'secure', 'verify', 'account', 'login', 'signin', 'support',
];

// Suspicious TLDs often used in scams
const SUSPICIOUS_TLDS = new Set([
  '.xyz', '.top', '.work', '.click', '.link', '.info', '.biz',
  '.win', '.loan', '.gq', '.ml', '.cf', '.tk', '.ga',
]);

// Suspicious patterns in URLs
const SUSPICIOUS_PATTERNS = [
  /free[.-]?gift/i,
  /claim[.-]?prize/i,
  /winner/i,
  /urgent/i,
  /expire/i,
  /suspended/i,
  /verify[.-]?account/i,
  /update[.-]?payment/i,
  /\d{10,}/,  // Long number strings
  /[a-z]{20,}/i,  // Very long random strings
];

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace('www.', '');
  } catch {
    return url;
  }
}

// Get root domain (e.g., sub.example.com -> example.com)
function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return domain;
}

// Check if HTTPS
function checkHttps(url: string): SafetyCheck {
  const isHttps = url.toLowerCase().startsWith('https://');
  return {
    id: 'https',
    name: 'Secure Connection',
    description: isHttps
      ? 'This site uses a secure encrypted connection'
      : 'This site does not use encryption - your data may not be private',
    passed: isHttps,
    severity: isHttps ? 'info' : 'warning',
  };
}

// Check for known trusted domain
function checkTrustedDomain(domain: string): SafetyCheck {
  // Use the new comprehensive check
  const isTrusted = isTrustedDomain(domain);
  return {
    id: 'trusted',
    name: 'Known Website',
    description: isTrusted
      ? 'This appears to be a well-known, established website'
      : 'This website is not in our list of commonly trusted sites',
    passed: isTrusted,
    severity: isTrusted ? 'info' : 'warning',
  };
}

// Check for suspicious TLD
function checkTld(domain: string): SafetyCheck {
  const tld = '.' + domain.split('.').pop();
  const isSuspicious = SUSPICIOUS_TLDS.has(tld);
  return {
    id: 'tld',
    name: 'Website Address',
    description: isSuspicious
      ? 'This website ending is often associated with less trustworthy sites'
      : 'The website address ending appears normal',
    passed: !isSuspicious,
    severity: isSuspicious ? 'danger' : 'info',
  };
}

// Check for typosquatting (looks like a known brand)
function checkTyposquatting(domain: string): SafetyCheck {
  const lowerDomain = domain.toLowerCase();
  const rootDomain = getRootDomain(lowerDomain);

  // Check if domain contains brand name but isn't the real domain
  const matchedBrand = BRAND_NAMES.find(brand => {
    const containsBrand = lowerDomain.includes(brand);
    // Check if it's actually the real trusted domain (or subdomain of it)
    const isRealDomain = isTrustedDomain(domain);
    return containsBrand && !isRealDomain;
  });

  const isSuspicious = matchedBrand !== undefined;
  return {
    id: 'typosquatting',
    name: 'Brand Impersonation',
    description: isSuspicious
      ? `This looks similar to "${matchedBrand}" but may not be the real website`
      : 'No obvious attempt to impersonate a known brand',
    passed: !isSuspicious,
    severity: isSuspicious ? 'danger' : 'info',
  };
}

// Check for suspicious patterns in URL
function checkSuspiciousPatterns(url: string): SafetyCheck {
  const matchedPattern = SUSPICIOUS_PATTERNS.find(pattern => pattern.test(url));
  const isSuspicious = matchedPattern !== undefined;
  return {
    id: 'patterns',
    name: 'Link Content',
    description: isSuspicious
      ? 'This link contains words often used in scam messages'
      : 'The link text appears normal',
    passed: !isSuspicious,
    severity: isSuspicious ? 'danger' : 'info',
  };
}

// Check for excessive subdomains (often used in phishing)
function checkSubdomains(domain: string): SafetyCheck {
  const parts = domain.split('.');
  const hasExcessiveSubdomains = parts.length > 3;
  return {
    id: 'subdomains',
    name: 'Website Structure',
    description: hasExcessiveSubdomains
      ? 'This website has an unusually complex address'
      : 'The website address structure looks normal',
    passed: !hasExcessiveSubdomains,
    severity: hasExcessiveSubdomains ? 'warning' : 'info',
  };
}

// Check for IP address instead of domain
function checkIpAddress(domain: string): SafetyCheck {
  const isIpAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);
  return {
    id: 'ip_address',
    name: 'Website Identity',
    description: isIpAddress
      ? 'This link uses numbers instead of a website name - unusual for legitimate sites'
      : 'The website has a proper name',
    passed: !isIpAddress,
    severity: isIpAddress ? 'danger' : 'info',
  };
}

// Check for fake invitation patterns (e.g. .apk files, suspicious wording)
function checkFakeInvitation(url: string, domain: string): SafetyCheck {
  const lowerUrl = url.toLowerCase();

  // 1. Check for file extensions often used in malware
  const isApk = lowerUrl.endsWith('.apk') || lowerUrl.includes('.apk?');
  const isExe = lowerUrl.endsWith('.exe') || lowerUrl.includes('.exe?');

  // 2. Check for invitation keywords
  const invitationKeywords = [
    'undangan', 'pernikahan', 'wedding', 'marry', 'invitation',
    'surat', 'digital', 'nikah', 'resepsi', 'hajatan'
  ];

  const hasInvitationKeyword = invitationKeywords.some(keyword => lowerUrl.includes(keyword));

  // 3. Trusted invitation domains (allow-list)
  // Add real invitation platforms here to avoid false positives
  const trustedInvitationDomains = [
    'canva.com', 'sebarundangan.com', 'kitalulus.com', 'linkedin.com',
    'bridestory.com', 'invit.id', 'datengdong.com'
  ];

  const rootDomain = getRootDomain(domain);
  const isTrustedPlatform = trustedInvitationDomains.includes(rootDomain) || isTrustedDomain(domain);


  // LOGIC:

  // CRITICAL: Invitation keyword + APK/EXE = MALWARE
  if (hasInvitationKeyword && (isApk || isExe)) {
    return {
      id: 'fake_invitation_file',
      name: 'Malicious File Detected',
      description: 'This link contains a dangerous file (.apk) disguised as an invitation. Installing it can drain your bank account.',
      passed: false,
      severity: 'danger'
    };
  }

  // HIGH RISK: APK/EXE from unknown source (even without invitation keywords)
  if (isApk || isExe) {
    return {
      id: 'suspicious_file',
      name: 'Suspicious File',
      description: 'This link downloads an application file directly. Do not install unknown apps.',
      passed: false,
      severity: 'danger'
    };
  }

  // MEDIUM RISK: Invitation keyword on unknown domain
  if (hasInvitationKeyword && !isTrustedPlatform) {
    return {
      id: 'suspicious_invitation',
      name: 'Unverified Invitation',
      description: 'This link claims to be an invitation but comes from an unknown website. Be careful.',
      passed: false,
      severity: 'warning'
    };
  }

  return {
    id: 'invitation_safety',
    name: 'Content Safety',
    description: 'No specific fake invitation patterns detected',
    passed: true,
    severity: 'info'
  };
}

// Calculate overall risk level
function calculateRiskLevel(checks: SafetyCheck[]): RiskLevel {
  // If any check fails with 'fake_invitation_file' ID -> BLOCKED immediately
  const isMalware = checks.some(c => c.id === 'fake_invitation_file' && !c.passed);
  if (isMalware) return 'blocked';

  const dangerCount = checks.filter(c => !c.passed && c.severity === 'danger').length;
  const warningCount = checks.filter(c => !c.passed && c.severity === 'warning').length;

  // Existing logic...
  if (dangerCount >= 2 || (dangerCount >= 1 && warningCount >= 2)) {
    return 'high';
  }
  if (dangerCount >= 1 || warningCount >= 2) {
    return 'medium';
  }
  if (warningCount >= 1) {
    return 'low';
  }
  return 'low';
}

// Generate human-readable summary
function generateSummary(riskLevel: RiskLevel, checks: SafetyCheck[]): string {
  const failedChecks = checks.filter(c => !c.passed);

  if (riskLevel === 'high') {
    return 'We found several warning signs about this link. It may be trying to trick you or steal your information.';
  }
  if (riskLevel === 'medium') {
    return 'We noticed some things about this link that seem unusual. Please be careful if you decide to continue.';
  }
  if (failedChecks.length > 0) {
    return 'This link appears mostly normal, but we noticed a few minor concerns.';
  }
  return 'This link appears to be from a known, trusted source.';
}

// Generate recommendation based on risk
function generateRecommendation(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'high':
      return 'We recommend not opening this link. If you were expecting something from a company, go to their website directly instead.';
    case 'medium':
      return 'Be cautious with this link. Make sure you trust the person who sent it before continuing.';
    case 'low':
    default:
      return 'This link seems okay, but always be careful about entering personal information on websites.';
  }
}

// Main safety review function
export function performSafetyReview(url: string): SafetyReviewResult {
  const domain = extractDomain(url);

  // FIRST: Check scam database - if found, immediately block
  const scamInfo = getScamInfo(domain);
  if (scamInfo) {
    return {
      url,
      domain,
      riskLevel: 'blocked',
      checks: [{
        id: 'scam_database',
        name: 'Known Scam Site',
        description: `This website is in our database of known scam sites (${getCategoryLabel(scamInfo.category)})`,
        passed: false,
        severity: 'danger',
      }],
      summary: 'This website has been identified as a confirmed scam site. It is designed to steal your personal information or money.',
      recommendation: 'DO NOT visit this website. If you received this link from someone, they may have been hacked or are trying to scam you.',
      scamCategory: scamInfo.category,
    };
  }

  // Normal heuristic checks for non-blocked domains
  const checks: SafetyCheck[] = [
    checkHttps(url),
    checkTrustedDomain(domain),
    checkTyposquatting(domain),
    checkSuspiciousPatterns(url),
    checkTld(domain),
    checkSubdomains(domain),
    checkIpAddress(domain),
    checkFakeInvitation(url, domain),
  ];

  const riskLevel = calculateRiskLevel(checks);

  return {
    url,
    domain,
    riskLevel,
    checks,
    summary: generateSummary(riskLevel, checks),
    recommendation: generateRecommendation(riskLevel),
  };
}

