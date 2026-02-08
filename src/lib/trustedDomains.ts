/**
 * Trusted Domains List
 * 
 * This file contains a comprehensive list of trusted domains for the Link Shield application.
 * It includes major international services and specific Indonesian trusted entities.
 */

// Major International Tech & Services
const GLOBAL_TECH = [
    'google.com', 'youtube.com', 'gmail.com', 'android.com',
    'facebook.com', 'instagram.com', 'whatsapp.com', 'messenger.com',
    'twitter.com', 'x.com', 't.co',
    'linkedin.com', 'microsoft.com', 'live.com', 'office.com', 'bing.com',
    'apple.com', 'icloud.com', 'itunes.com',
    'amazon.com', 'aws.amazon.com',
    'netflix.com', 'spotify.com', 'twitch.tv',
    'github.com', 'gitlab.com', 'stackoverflow.com',
    'zoom.us', 'slack.com', 'atlassian.com', 'trello.com',
    'dropbox.com', 'drive.google.com', 'wetransfer.com',
    'paypal.com', 'wise.com',
    'wikipedia.org', 'reddit.com', 'medium.com',
    'adobe.com', 'figma.com', 'canva.com',
    'salesforce.com', 'oracle.com', 'ibm.com',
    'cloudflare.com',
];

// Indonesian Banks (BUMN & Private)
const INDONESIA_BANKS = [
    'bankmandiri.co.id', 'bankmandiri.com', 'livin.id',
    'bri.co.id', 'ib.bri.co.id', 'brimo.bri.co.id',
    'bni.co.id', 'ibank.bni.co.id',
    'bca.co.id', 'klikbca.com', 'mybca.bca.co.id',
    'cimbniaga.co.id', 'octoclicks.co.id',
    'danamon.co.id', 'danamonline.com',
    'maybank.co.id',
    'permatabank.com',
    'btpn.com', 'jenius.com',
    'btn.co.id',
    'bsi.co.id', 'bankbsi.co.id',
    'bankmega.com',
    'panin.co.id',
    'ocbcnisp.com',
    'uob.co.id',
    'shinhan.co.id',
    'commonwealth.co.id',
    'bi.go.id', // Bank Indonesia
    'ojk.go.id', // Otoritas Jasa Keuangan
    'lps.go.id', // Lembaga Penjamin Simpanan
];

// Indonesian E-Wallets & Fintech
const INDONESIA_FINTECH = [
    'gopay.co.id', 'gojek.com',
    'ovo.id',
    'dana.id',
    'linkaja.id',
    'sakuku.bca.co.id',
    'shopeepay.co.id',
    'dokupay.com',
    'flip.id',
    'investree.id', 'koinworks.com', 'modalku.co.id', // P2P Lending (Major ones)
    'bibit.id', 'ajaib.co.id', 'bareksa.com', // Investment
];

// Indonesian E-Commerce & Marketplaces
const INDONESIA_ECOMMERCE = [
    'tokopedia.com',
    'shopee.co.id',
    'bukalapak.com',
    'lazada.co.id',
    'blibli.com',
    'jd.id', // Note: JD.ID strictly speaking closed, but keeping for safety if redirected
    'zalora.co.id',
    'sociolla.com',
    'tiket.com',
    'traveloka.com',
    'pegipegi.com',
    'agoda.com', 'booking.com', // Popular in ID
    'halodoc.com', 'alodokter.com', // Health
    'ruangguru.com', 'zenius.net', // Education
];

// Indonesian Government & Public Services
const INDONESIA_GOV = [
    'go.id', // Catch-all for government domains (careful with this, but usually safe)
    'kemkes.go.id',
    'kemdikbud.go.id',
    'kemenkeu.go.id',
    'pajak.go.id',
    'dukcapil.kemendagri.go.id',
    'bpjs-kesehatan.go.id',
    'bpjsketenagakerjaan.go.id',
    'pln.co.id',
    'telkom.co.id', 'indihome.co.id',
    'pertamina.com',
    'posindonesia.co.id',
    'kai.id', // Kereta Api
    'garuda-indonesia.com',
    'lionair.co.id',
    'citilink.co.id',
    'batikair.com',
    'pelni.co.id',
    'damri.co.id',
    'pedulilindungi.id', 'satusehat.kemkes.go.id',
];

// Indonesian Media & News
const INDONESIA_MEDIA = [
    'kompas.com', 'kompas.id',
    'detik.com',
    'cnnindonesia.com',
    'cnbcindonesia.com',
    'tribunnews.com',
    'liputan6.com',
    'merdeka.com',
    'viva.co.id',
    'suara.com',
    'kumparan.com',
    'idntimes.com',
    'tempo.co',
    'republika.co.id',
    'antaranews.com',
    'jawapos.com',
    'bisnis.com',
    'katadata.co.id',
];

// Telecommunication Providers
const INDONESIA_TELCO = [
    'telkomsel.com',
    'indosatooredoo.com', 'im3.id',
    'xl.co.id', 'axis.co.id',
    'smartfren.com',
    'tri.co.id',
    'biznetnetworks.com',
    'firstmedia.com',
    'myrepublic.co.id',
];

// Educational Institutions (Examples)
const INDONESIA_EDU = [
    'ac.id', // Catch-all for academic institutions
    'ui.ac.id',
    'ugm.ac.id',
    'itb.ac.id',
    'ipb.ac.id',
    'unpad.ac.id',
    'its.ac.id',
    'undip.ac.id',
    'unair.ac.id',
    'ub.ac.id',
    'binus.ac.id',
];

// Combine all trusted domains
export const TRUSTED_DOMAINS_LIST = [
    ...GLOBAL_TECH,
    ...INDONESIA_BANKS,
    ...INDONESIA_FINTECH,
    ...INDONESIA_ECOMMERCE,
    ...INDONESIA_GOV,
    ...INDONESIA_MEDIA,
    ...INDONESIA_TELCO,
    ...INDONESIA_EDU,
];

// Create a Set for O(1) lookup
export const TRUSTED_DOMAINS_SET = new Set(TRUSTED_DOMAINS_LIST);

/**
 * Check if a domain is trusted
 * Handles exact matches and subdomain checks for certain categories
 */
export function isTrustedDomain(domain: string): boolean {
    const lowerDomain = domain.toLowerCase();

    // 1. Direct match
    if (TRUSTED_DOMAINS_SET.has(lowerDomain)) {
        return true;
    }

    // 2. Subdomain check
    // For many services, any subdomain of a trusted domain is also trusted
    // e.g., mail.google.com, ibank.bni.co.id

    // We iterate through the trusted list to find if the current domain is a subdomain
    // Optimization: Check for common suffixes instead of iterating everything if manageable,
    // but for this size (~200 domains), iteration is fast enough, or we can use the Set more smartly.

    const parts = lowerDomain.split('.');

    // Check from specific to general
    // e.g. a.b.c.com -> check b.c.com, then c.com
    for (let i = 1; i < parts.length; i++) {
        const parent = parts.slice(i).join('.');
        if (TRUSTED_DOMAINS_SET.has(parent)) {
            return true;
        }
    }

    // 3. Special TLD handling (e.g., .go.id, .ac.id)
    if (lowerDomain.endsWith('.go.id') || lowerDomain.endsWith('.ac.id')) {
        return true;
    }

    return false;
}
