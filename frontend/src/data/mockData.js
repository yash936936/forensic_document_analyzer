// ============================================================================
// CrimeX ASDAS Mock Data â€” 5 Realistic Forensic Cases
// ============================================================================

// Helper for deterministic IDs
let _id = 0;
const genId = () => `mock_${(++_id).toString(36).padStart(6, '0')}`;

// ---- THUMBNAIL SVG GENERATORS ----
// Generate inline SVG data URIs for document preview thumbnails
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const miniText = (x, y, lines, size = 6, color = '#333') =>
  lines.map((l, i) => `<text x="${x}" y="${y + i * (size + 2)}" font-size="${size}" fill="${color}" font-family="monospace">${esc(l)}</text>`).join('');

function thumbnailBankStatement() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#f8f4ec"/>
  <rect x="10" y="8" width="180" height="16" rx="2" fill="#1a5fa420"/>
  <text x="100" y="20" text-anchor="middle" font-size="7" fill="#1a5fa4" font-weight="bold" font-family="sans-serif">HDFC BANK LIMITED</text>
  <text x="100" y="32" text-anchor="middle" font-size="5" fill="#555" font-family="sans-serif">Statement of Account</text>
  <line x1="10" y1="37" x2="190" y2="37" stroke="#ccc" stroke-width="0.5"/>
  ${miniText(12, 45, ['A/C: XXXX-XXXX-4892', 'Period: 01/2026', '', 'Date   Particulars      Debit    Credit', 'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€', '03/01  NEFT/RTGS         â€”     12,50,000', '05/01  ATM WDL        40,000      â€”', '14/01  DD/372891    3,00,000      â€”', '22/01  SALARY           â€”      85,000', '31/01  Closing Bal            14,92,936'], 5.5, '#222')}
  <rect x="130" y="10" width="50" height="12" rx="2" fill="none" stroke="#c0392b" stroke-width="0.8" opacity="0.5" transform="rotate(-8,155,16)"/>
  <text x="155" y="18" text-anchor="middle" font-size="5" fill="#c0392b" font-weight="bold" font-family="monospace" opacity="0.5" transform="rotate(-8,155,16)">CONFIDENTIAL</text>
</svg>`)}`;
}

function thumbnailCheque() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
  <rect width="200" height="120" rx="4" fill="#f5f0e2"/>
  <rect x="8" y="6" width="184" height="108" rx="2" fill="none" stroke="#b0a090" stroke-width="0.5" stroke-dasharray="3,1"/>
  <text x="100" y="18" text-anchor="middle" font-size="6" fill="#333" font-weight="bold" font-family="sans-serif">HDFC BANK â€” CONNAUGHT PLACE</text>
  <line x1="12" y1="22" x2="188" y2="22" stroke="#ccc" stroke-width="0.3"/>
  ${miniText(14, 32, ['Date: 15/01/2026    Cheque No: 892013', '', 'Pay: __Sunrise Enterprises__________', '', 'Rupees: __Three Lakh Only___________', '', 'â‚¹ 3,00,000/â€”'], 5.5, '#111')}
  <line x1="120" y1="98" x2="185" y2="98" stroke="#444" stroke-width="0.3"/>
  <text x="152" y="106" text-anchor="middle" font-size="4" fill="#888" font-family="sans-serif">Authorized Signatory</text>
  <rect x="8" y="108" width="60" height="5" rx="1" fill="#ddd"/>
  <text x="12" y="112" font-size="3.5" fill="#999" font-family="monospace">MICR â–®â–®â–®â–® â–®â–®â–®</text>
  <rect x="140" y="50" width="44" height="12" rx="2" fill="none" stroke="#2980b9" stroke-width="0.7" opacity="0.5" transform="rotate(-10,162,56)"/>
  <text x="162" y="58" text-anchor="middle" font-size="5" fill="#2980b9" font-weight="bold" font-family="monospace" opacity="0.5" transform="rotate(-10,162,56)">SPECIMEN</text>
</svg>`)}`;
}

function thumbnailDemandDraft() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
  <rect width="200" height="130" rx="4" fill="#f0e8dc"/>
  <rect x="8" y="6" width="184" height="118" rx="2" fill="none" stroke="#a09080" stroke-width="0.5"/>
  <text x="100" y="20" text-anchor="middle" font-size="7" fill="#333" font-weight="bold" font-family="sans-serif">DEMAND DRAFT RECEIPT</text>
  <line x1="12" y1="25" x2="188" y2="25" stroke="#ccc" stroke-width="0.4"/>
  ${miniText(14, 35, ['DD No: 372891', 'Date: 15/01/2026', 'Favoring: Sunrise Enterprises', 'Amount: â‚¹3,00,000/-', 'Drawn on: HDFC, CP Branch', 'Purchaser: A/C XXXX4892', '', 'UTR: HDFCR520260115003728'], 5.5, '#222')}
  <rect x="140" y="8" width="44" height="12" rx="2" fill="none" stroke="#27ae60" stroke-width="0.7" opacity="0.6" transform="rotate(-6,162,14)"/>
  <text x="162" y="16" text-anchor="middle" font-size="5" fill="#27ae60" font-weight="bold" font-family="monospace" opacity="0.6" transform="rotate(-6,162,14)">AUTHENTIC</text>
</svg>`)}`;
}

function thumbnailWillTop() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#f7f2e4"/>
  <text x="100" y="18" text-anchor="middle" font-size="7" fill="#1a1400" font-weight="bold" font-family="serif">LAST WILL AND TESTAMENT</text>
  <line x1="20" y1="23" x2="180" y2="23" stroke="#c0b080" stroke-width="0.4"/>
  ${miniText(14, 33, ['I, Rajendra Prasad Gupta,', 'son of Late Shri Mohan Lal Gupta,', 'resident of 14-B, Civil Lines,', 'Jaipur, Rajasthan, do hereby', 'declare this to be my Last Will.', '', 'Date: 12th August, 2024', 'Place: Jaipur, Rajasthan'], 5.5, '#2a1e0a')}
  <text x="100" y="102" text-anchor="middle" font-size="5" fill="#444" font-family="serif">â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”</text>
  <text x="14" y="115" font-size="5.5" fill="#2a1e0a" font-family="serif">CLAUSE I â€” PROPERTY</text>
  <text x="150" y="130" text-anchor="middle" font-size="24" fill="#000" opacity="0.025" font-weight="900" font-family="sans-serif" transform="rotate(-25,150,120)">LEGAL</text>
</svg>`)}`;
}

function thumbnailWillBottom() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#f3ede4"/>
  <text x="14" y="16" font-size="5.5" fill="#2a1e0a" font-weight="bold" font-family="serif">CLAUSE I â€” PROPERTY DISTRIBUTION</text>
  ${miniText(14, 28, ['1. Residential â€” to Anita Gupta', '2. Commercial â€” Vikram & Sanjay', '3. FDs SBI ~â‚¹45L â€” Kamla Devi', '4. Gold ornaments â€” equal share'], 5.5, '#2a1e0a')}
  <text x="100" y="75" text-anchor="middle" font-size="24" fill="#000" opacity="0.025" font-weight="900" font-family="sans-serif" transform="rotate(-25,100,70)">LEGAL</text>
</svg>`)}`;
}

function thumbnailWillSignatures() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#f1ebdf"/>
  <text x="14" y="16" font-size="5.5" fill="#2a1e0a" font-weight="bold" font-family="serif">WITNESS ATTESTATION</text>
  ${miniText(14, 30, ['Signed by Shri R.P. Gupta', 'as his Last Will.', '', 'Witness 1: Arun Bhatia (Adv.)', 'Sign: [present]', 'Witness 2: Priya Saxena', 'Sign: [present]', '', 'Notary: R.K. Joshi'], 5.5, '#2a1e0a')}
  <rect x="130" y="110" width="50" height="14" rx="2" fill="none" stroke="#1a6b3f" stroke-width="0.8" opacity="0.5" transform="rotate(-8,155,117)"/>
  <text x="155" y="119" text-anchor="middle" font-size="5" fill="#1a6b3f" font-weight="bold" font-family="monospace" opacity="0.5" transform="rotate(-8,155,117)">NOTARIZED</text>
</svg>`)}`;
}

function thumbnailMemo() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#fefefe"/>
  <rect x="8" y="6" width="184" height="14" rx="2" fill="#2c3e5010"/>
  <text x="100" y="16" text-anchor="middle" font-size="6" fill="#2c3e50" font-weight="bold" font-family="sans-serif">TECHVAULT INC. â€” INTERNAL MEMO</text>
  <text x="100" y="26" text-anchor="middle" font-size="4.5" fill="#c0392b" font-weight="bold" font-family="monospace">[CONFIDENTIAL â€” EYES ONLY]</text>
  ${miniText(14, 36, ['To: Board of Directors', 'From: Vikram Ahluwalia, CTO', 'Re: Project Nexus â€” Phase 3', '', 'â€¢ Quantum encryption â€” Complete', 'â€¢ Post-quantum key exchange â€” 98%', 'â€¢ HSM integration â€” Testing'], 5, '#222')}
  <text x="100" y="120" text-anchor="middle" font-size="18" fill="#000" opacity="0.025" font-weight="900" font-family="sans-serif">CLASSIFIED</text>
</svg>`)}`;
}

function thumbnailEmailPrintout() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#faf8f5"/>
  ${miniText(14, 16, ['From: deepak.r@techvault.in', 'To: [REDACTED]@protonmail.com', 'Date: Oct 18, 2025, 11:47 PM', 'Subject: Re: Pricing structure', 'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€', '> Per-unit pricing (govt tier):', '> Base license: â‚¹45L/year', '> HSM addon: â‚¹12L/unit', '> Support: 18% of license', '', '> Please destroy after reading.', '', '[nexus_pricing_v3.xlsx â€” NOT RECOVERED]'], 5, '#222')}
</svg>`)}`;
}

function thumbnailShippingManifest() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#eeeade"/>
  <text x="100" y="14" text-anchor="middle" font-size="6" fill="#0a0a2a" font-weight="bold" font-family="sans-serif">SHIPPING MANIFEST â€” BILL OF LADING</text>
  <line x1="10" y1="18" x2="190" y2="18" stroke="#999" stroke-width="0.4"/>
  ${miniText(12, 28, ['Vessel: MV Sagarmala Express', 'Voyage: SGE-2025-1847', 'Port: JNPT â†’ Colombo', '', 'Container    Contents      Value', 'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€', 'SGEU-7734291 Electronics â‚¹4.8Cr', 'SGEU-7734292 Textiles   â‚¹1.2Cr', '', 'Total FOB: â‚¹6,00,00,000'], 5, '#0a0a2a')}
  <rect x="140" y="4" width="44" height="12" rx="2" fill="none" stroke="#8b0000" stroke-width="0.7" opacity="0.5" transform="rotate(-8,162,10)"/>
  <text x="162" y="12" text-anchor="middle" font-size="5" fill="#8b0000" font-weight="bold" font-family="monospace" opacity="0.5" transform="rotate(-8,162,10)">ORIGINAL</text>
</svg>`)}`;
}

function thumbnailInsuranceDoc() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#ece6da"/>
  <text x="100" y="14" text-anchor="middle" font-size="6" fill="#333" font-weight="bold" font-family="sans-serif">INSURANCE COVERAGE DETAILS</text>
  <line x1="10" y1="18" x2="190" y2="18" stroke="#999" stroke-width="0.3"/>
  ${miniText(12, 28, ['Insurer: United India Insurance', 'Policy: MAR/2025/JN/004821', 'Coverage: Institute Cargo (A)', 'Sum Insured: â‚¹7,20,00,000', 'Premium: â‚¹3,60,000', '', 'CLAIM FILED: 28/12/2025', 'CLAIM AMT: â‚¹5,40,00,000', 'Reason: Container overboard'], 5, '#222')}
</svg>`)}`;
}

function thumbnailCustomsDeclaration() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#f0eade"/>
  <text x="100" y="14" text-anchor="middle" font-size="6" fill="#333" font-weight="bold" font-family="sans-serif">CUSTOMS EXPORT DECLARATION</text>
  <line x1="10" y1="18" x2="190" y2="18" stroke="#999" stroke-width="0.3"/>
  ${miniText(12, 28, ['Exporter: Oceanview Trading', 'IEC: 0425XXXXXX', 'SB No: 4821739  dt. 20/12/2025', '', 'HS Code  Description     Value', 'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€', '8517.12  Mobile Phones â‚¹4.8Cr', '5002.00  Raw Silk      â‚¹1.2Cr', '', 'Customs Officer: A.K. Verma'], 5, '#222')}
</svg>`)}`;
}

function thumbnailFIR() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#e8dcc6"/>
  <text x="100" y="16" text-anchor="middle" font-size="7" fill="#2a1e0a" font-weight="bold" font-family="monospace">FIRST INFORMATION REPORT</text>
  <text x="100" y="25" text-anchor="middle" font-size="4.5" fill="#555" font-family="monospace">(Under Section 154 Cr.P.C.)</text>
  ${miniText(12, 35, ['District: Lucknow  P.S.: Hazratganj', 'FIR No: 487/1987  Date: 14/11/1987', 'Sections: IPC 302, 201, 120B', '', 'Complainant: Smt. Parvati Devi', '', 'On the night of Nov 13, 1987...', 'husband Shri Ramesh C. Tripathi', 'left residence â€” did not return.'], 5, '#2a1e0a')}
  <rect x="140" y="6" width="44" height="12" rx="2" fill="none" stroke="#2c3e50" stroke-width="0.7" opacity="0.5" transform="rotate(-8,162,12)"/>
  <text x="162" y="14" text-anchor="middle" font-size="4.5" fill="#2c3e50" font-weight="bold" font-family="monospace" opacity="0.5" transform="rotate(-8,162,12)">POLICE COPY</text>
</svg>`)}`;
}

function thumbnailWitnessStatement() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#d8ccac"/>
  <text x="100" y="16" text-anchor="middle" font-size="6" fill="#2a1e0a" font-weight="bold" font-family="monospace">SUPPLEMENTARY WITNESS STATEMENT</text>
  ${miniText(12, 30, ['Recorded: 18/11/1987', 'Witness: Shri Babu Lal', '', 'I saw a black Ambassador car', 'parked near the bridge at 23:45.', 'Two men carrying a heavy bundle.', 'Car left towards Mahanagar.', '', '[Note in different ink: Statement', 'recorded 5 days after incident]'], 5, '#2a1e0a')}
</svg>`)}`;
}

function thumbnailPostmortem() {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" rx="4" fill="#d0c4a4"/>
  <text x="100" y="16" text-anchor="middle" font-size="6" fill="#2a1e0a" font-weight="bold" font-family="monospace">POST-MORTEM REPORT â€” KGMU</text>
  ${miniText(12, 30, ['Deceased: R.C. Tripathi, M, 42', 'PM No: 1142/87  Date: 15/11/87', '', 'EXTERNAL FINDINGS:', '1. Ligature mark â€” 18cm Ã— 2cm', '2. Temple abrasion â€” 4cm Ã— 3cm', '3. Wrist bruising (restraints)', '4. Petechial hemorrhages', '', 'CAUSE: Asphyxia â€” strangulation', 'OPINION: Homicidal'], 5, '#2a1e0a')}
</svg>`)}`;
}

// Map each mock fragment to its thumbnail based on originalName
const THUMBNAIL_MAP = {
  'bank_stmt_page1_frag_A.jpg': thumbnailBankStatement,
  'bank_stmt_page1_frag_B.jpg': thumbnailBankStatement,
  'cheque_leaf_torn.png': thumbnailCheque,
  'demand_draft_receipt.jpg': thumbnailDemandDraft,
  'will_testament_page1_top.jpg': thumbnailWillTop,
  'will_testament_page1_bottom.jpg': thumbnailWillBottom,
  'will_testament_page2_signatures.jpg': thumbnailWillSignatures,
  'internal_memo_shred_01.png': thumbnailMemo,
  'internal_memo_shred_02.png': thumbnailMemo,
  'email_printout_fragment.jpg': thumbnailEmailPrintout,
  'shipping_manifest_torn_A.jpg': thumbnailShippingManifest,
  'shipping_manifest_torn_B.jpg': thumbnailInsuranceDoc,
  'customs_declaration_frag.jpg': thumbnailCustomsDeclaration,
  'police_fir_page1_aged.jpg': thumbnailFIR,
  'witness_statement_partial.jpg': thumbnailWitnessStatement,
  'postmortem_report_frag.jpg': thumbnailPostmortem,
};

/** Get a thumbnail data URI for a fragment by its originalName */
export function getFragmentThumbnail(originalName) {
  const builder = THUMBNAIL_MAP[originalName];
  return builder ? builder() : null;
}

// ---- USERS ----
export const MOCK_USERS = [
  {
    _id: 'usr_001',
    name: 'Ayushi Singh',
    email: 'ayushi@crimex-asdas.gov',
    password: 'CrimeX-Forensic-2026',
    badgeId: 'FN-9021-X',
    role: 'Senior Examiner',
    lastLogin: '2026-03-06T08:12:00Z',
  },
  {
    _id: 'usr_002',
    name: 'Ravi Mehta',
    email: 'ravi.mehta@crimex-asdas.gov',
    password: 'CrimeX-Agent-2026',
    badgeId: 'FN-4410-R',
    role: 'Forensic Analyst',
    lastLogin: '2026-03-05T14:30:00Z',
  },
];

// ---- SHA256 hashes (fake but realistic) ----
const hashes = [
  'a7f3c8e2d1b4f6a9c3e5d7b1f2a8c4e6d0b3f5a7c9e1d3b5f7a9c1e3d5b7f9',
  'b8e4d9f3c2a5e7b1d3f5a8c0e2d4b6f8a1c3e5d7b9f2a4c6e8d0b2f4a6c8e0',
  'c9f5e0a4d3b6f8c2e4d6a9b1f3a5c7e9d1b3f5a7c0e2d4b6f8a1c3e5d7b9f2',
  'd0a6f1b5e4c7a9d3f5e7b0c2a4d6f8e1b3c5a7d9f2e4b6c8a0d2f4e6b8c1a3',
  'e1b7a2c6f5d8b0e4a6c8d2f4b6e8a0c3d5f7b9e1a3c5d7f9b2e4a6c8d0f2b4',
];

// ---- CASE 1: Operation Paper Trail ----
const case1Fragments = [
  {
    _id: 'frg_101',
    fragmentId: 'FRG-1709312001-0.4821',
    caseId: 'case_001',
    originalName: 'bank_stmt_page1_frag_A.jpg',
    storagePath: 'uploads/bank_stmt_page1_frag_A.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 0, rotation: 0 },
    features: { edgeGeometry: [12, 45, 78, 23], textFragments: ['HDFC BANK', 'Statement of Account'], averageColor: '#e8e0d4' },
    metadata: {
      fraudScore: 72,
      isFraudulent: true,
      ocrText: 'HDFC BANK LIMITED\nStatement of Account\nAccount No: XXXX-XXXX-4892\nDate: 14/01/2026\n\nParticulars          Debit       Credit      Balance\n---------------------------------------------------\nOpening Balance                              â‚¹4,52,180.00\nNEFT/CR/RTGS         â€”          â‚¹12,50,000  â‚¹16,02,180.00\nATM WDL/DELHI     â‚¹40,000        â€”          â‚¹15,62,180.00\nUPI/P2M/AMAZON    â‚¹8,499         â€”          â‚¹15,53,681.00\nDD ISSUED/372891  â‚¹3,00,000      â€”          â‚¹12,53,681.00',
      elaScore: 68,
      analysisNotes: 'ELA detected inconsistent compression artifacts around the NEFT credit entry of â‚¹12,50,000. The pixel luminance distribution in the amount field diverges from the surrounding text by 3.2 standard deviations. Possible digital insertion of transaction record.',
    },
    matchedWith: ['frg_102', 'frg_103'],
    matchScores: { 'frg_102': 94, 'frg_103': 87 },
    createdAt: '2026-02-28T09:15:00Z',
    updatedAt: '2026-03-01T14:22:00Z',
  },
  {
    _id: 'frg_102',
    fragmentId: 'FRG-1709312002-0.7133',
    caseId: 'case_001',
    originalName: 'bank_stmt_page1_frag_B.jpg',
    storagePath: 'uploads/bank_stmt_page1_frag_B.jpg',
    mimeType: 'image/jpeg',
    position: { x: 320, y: 0, rotation: 2 },
    features: { edgeGeometry: [78, 23, 56, 90], textFragments: ['Closing Balance', 'â‚¹12,53,681'], averageColor: '#e5ddd0' },
    metadata: {
      fraudScore: 18,
      isFraudulent: false,
      ocrText: 'UPI/P2M/SWIGGY    â‚¹1,245        â€”          â‚¹12,52,436.00\nSAL/MAR/2026       â€”          â‚¹85,000    â‚¹13,37,436.00\nEMI/HDFC/LN8821  â‚¹24,500        â€”          â‚¹13,12,936.00\n\nClosing Balance                              â‚¹13,12,936.00\n\nThis is a computer generated statement.',
      elaScore: 12,
      analysisNotes: 'No significant anomalies detected. Compression patterns are consistent throughout the fragment. Edge features align well with Fragment A for physical reassembly.',
    },
    matchedWith: ['frg_101'],
    matchScores: { 'frg_101': 94 },
    createdAt: '2026-02-28T09:15:30Z',
    updatedAt: '2026-03-01T14:22:00Z',
  },
  {
    _id: 'frg_103',
    fragmentId: 'FRG-1709312003-0.2948',
    caseId: 'case_001',
    originalName: 'cheque_leaf_torn.png',
    storagePath: 'uploads/cheque_leaf_torn.png',
    mimeType: 'image/png',
    position: { x: 0, y: 400, rotation: -1 },
    features: { edgeGeometry: [34, 67, 12, 89], textFragments: ['Pay', 'Rupees', 'Three Lakh'], averageColor: '#f2ece2' },
    metadata: {
      fraudScore: 85,
      isFraudulent: true,
      ocrText: 'HDFC BANK\nPay ______Sunrise Enterprises______ or Bearer\nRupees ___Three Lakh Only___________\nâ‚¹ 3,00,000/-\nA/C No: XXXX4892\nDate: 15/01/2026\nSign: [illegible]',
      elaScore: 82,
      analysisNotes: 'CRITICAL: Signature region shows clear evidence of digital splicing. Error Level Analysis reveals the signature was copy-pasted from a different document â€” compression level mismatch of 47%. The amount in words shows minor pixel bleeding inconsistent with original print.',
    },
    matchedWith: ['frg_101'],
    matchScores: { 'frg_101': 87 },
    createdAt: '2026-02-28T09:16:00Z',
    updatedAt: '2026-03-01T15:00:00Z',
  },
  {
    _id: 'frg_104',
    fragmentId: 'FRG-1709312004-0.5512',
    caseId: 'case_001',
    originalName: 'demand_draft_receipt.jpg',
    storagePath: 'uploads/demand_draft_receipt.jpg',
    mimeType: 'image/jpeg',
    position: { x: 320, y: 400, rotation: 0 },
    features: { edgeGeometry: [56, 90, 34, 67], textFragments: ['DD No', '372891'], averageColor: '#f0e8dc' },
    metadata: {
      fraudScore: 8,
      isFraudulent: false,
      ocrText: 'DEMAND DRAFT RECEIPT\nDD No: 372891\nDate: 15/01/2026\nFavoring: Sunrise Enterprises\nAmount: â‚¹3,00,000/- (Rupees Three Lakh Only)\nDrawn on: HDFC Bank, Connaught Place Branch\nPurchaser: A/C XXXX4892\nUTR: HDFCR52026011500372891',
      elaScore: 6,
      analysisNotes: 'Document appears authentic. All fields show consistent print quality and compression. The DD number correlates with the cheque leaf debit entry.',
    },
    matchedWith: [],
    matchScores: {},
    createdAt: '2026-02-28T09:17:00Z',
    updatedAt: '2026-03-01T15:00:00Z',
  },
];

// ---- CASE 2: Estate Dispute #447 ----
const case2Fragments = [
  {
    _id: 'frg_201',
    fragmentId: 'FRG-1709313001-0.8821',
    caseId: 'case_002',
    originalName: 'will_testament_page1_top.jpg',
    storagePath: 'uploads/will_testament_page1_top.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 0, rotation: 0 },
    features: { edgeGeometry: [22, 55, 88, 11], textFragments: ['Last Will', 'Testament'], averageColor: '#f5f0e8' },
    metadata: {
      fraudScore: 42,
      isFraudulent: false,
      ocrText: 'LAST WILL AND TESTAMENT\n\nI, Rajendra Prasad Gupta, son of Late Shri Mohan Lal Gupta,\nresident of 14-B, Civil Lines, Jaipur, Rajasthan,\nbeing of sound mind and disposing memory, do hereby\nrevoke all my previous Wills and Codicils and declare\nthis to be my Last Will and Testament.\n\nDate of Execution: 12th August, 2024\nPlace: Jaipur, Rajasthan',
      elaScore: 38,
      analysisNotes: 'Moderate ELA variance detected in the date field. The surrounding text shows uniform aging patterns, but the date region has slightly different paper texture characteristics. This could be natural wear or indicate a date modification. Further physical examination recommended.',
    },
    matchedWith: ['frg_202'],
    matchScores: { 'frg_202': 96 },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T16:45:00Z',
  },
  {
    _id: 'frg_202',
    fragmentId: 'FRG-1709313002-0.3349',
    caseId: 'case_002',
    originalName: 'will_testament_page1_bottom.jpg',
    storagePath: 'uploads/will_testament_page1_bottom.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 500, rotation: 1 },
    features: { edgeGeometry: [88, 11, 44, 77], textFragments: ['bequeath', 'property', 'Anita'], averageColor: '#f3ede4' },
    metadata: {
      fraudScore: 15,
      isFraudulent: false,
      ocrText: 'CLAUSE I: PROPERTY DISTRIBUTION\n\n1. I bequeath my residential property at 14-B, Civil Lines,\n   Jaipur to my daughter Anita Gupta.\n2. My commercial property at M.I. Road, Shop No. 7,\n   shall be divided equally between my sons Vikram Gupta\n   and Sanjay Gupta.\n3. Fixed Deposits in SBI (A/C: XXXXX7891) amounting to\n   approximately â‚¹45,00,000 shall go to my wife\n   Kamla Devi Gupta.\n4. Gold ornaments in Bank Locker No. 221 (PNB, C-Scheme)\n   to be divided equally among all three children.',
      elaScore: 10,
      analysisNotes: 'Fragment shows consistent aging and print characteristics. No digital manipulation detected. Edge profile matches perfectly with the top portion (Fragment 201). The handwriting analysis of marginal notes is consistent with reference samples.',
    },
    matchedWith: ['frg_201', 'frg_203'],
    matchScores: { 'frg_201': 96, 'frg_203': 91 },
    createdAt: '2026-01-15T10:01:00Z',
    updatedAt: '2026-01-20T16:45:00Z',
  },
  {
    _id: 'frg_203',
    fragmentId: 'FRG-1709313003-0.6672',
    caseId: 'case_002',
    originalName: 'will_testament_page2_signatures.jpg',
    storagePath: 'uploads/will_testament_page2_signatures.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 1000, rotation: 0 },
    features: { edgeGeometry: [44, 77, 22, 55], textFragments: ['Witness', 'Signed', 'Notary'], averageColor: '#f1ebdf' },
    metadata: {
      fraudScore: 67,
      isFraudulent: true,
      ocrText: 'WITNESS ATTESTATION\n\nSigned and declared by Shri Rajendra Prasad Gupta\nas his Last Will in our presence, and we in his\npresence and in the presence of each other have\nhereunto subscribed our names as witnesses.\n\nWitness 1: Arun Bhatia (Advocate)\nSign: [present]\nAddress: 22, Tonk Road, Jaipur\n\nWitness 2: Priya Saxena\nSign: [present]\nAddress: 9, Malviya Nagar, Jaipur\n\nNotarized by: R.K. Joshi, Notary Public\nSeal: [present]\nDate: 12/08/2024',
      elaScore: 61,
      analysisNotes: 'ALERT: Witness 2 signature shows inconsistent pressure patterns compared to the rest of the document. The notary seal region has higher ELA values indicating possible re-stamping or digital overlay. The seal date matches the document date but ink analysis would need physical verification.',
    },
    matchedWith: ['frg_202'],
    matchScores: { 'frg_202': 91 },
    createdAt: '2026-01-15T10:02:00Z',
    updatedAt: '2026-01-20T17:00:00Z',
  },
];

// ---- CASE 3: Corporate Espionage â€” TechVault ----
const case3Fragments = [
  {
    _id: 'frg_301',
    fragmentId: 'FRG-1709314001-0.1193',
    caseId: 'case_003',
    originalName: 'internal_memo_shred_01.png',
    storagePath: 'uploads/internal_memo_shred_01.png',
    mimeType: 'image/png',
    position: { x: 0, y: 0, rotation: 3 },
    features: { edgeGeometry: [15, 48, 82, 29], textFragments: ['CONFIDENTIAL', 'Project Nexus'], averageColor: '#ffffff' },
    metadata: {
      fraudScore: 5,
      isFraudulent: false,
      ocrText: 'TECHVAULT INC. â€” INTERNAL MEMORANDUM\n[CONFIDENTIAL â€” EYES ONLY]\n\nTo: Board of Directors\nFrom: Vikram Ahluwalia, CTO\nDate: November 3, 2025\nRe: Project Nexus â€” Phase 3 Timeline\n\nAs discussed in the Q3 review, the quantum encryption\nmodule has passed all penetration tests. We are on track\nfor a January 2026 deployment to select government clients.\n\nKey milestones achieved:\nâ€¢ Zero-knowledge proof implementation â€” Complete\nâ€¢ Post-quantum lattice-based key exchange â€” 98% ready\nâ€¢ Hardware security module integration â€” Testing phase',
      elaScore: 3,
      analysisNotes: 'Document appears to be an authentic corporate printout. Consistent laser printer artifacts throughout. No signs of digital manipulation. Fragment edges suggest cross-cut shredding pattern â€” 4mm strips.',
    },
    matchedWith: ['frg_302'],
    matchScores: { 'frg_302': 89 },
    createdAt: '2026-02-10T08:30:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
  {
    _id: 'frg_302',
    fragmentId: 'FRG-1709314002-0.4467',
    caseId: 'case_003',
    originalName: 'internal_memo_shred_02.png',
    storagePath: 'uploads/internal_memo_shred_02.png',
    mimeType: 'image/png',
    position: { x: 200, y: 0, rotation: -2 },
    features: { edgeGeometry: [82, 29, 63, 41], textFragments: ['deployment', 'government', 'timeline'], averageColor: '#fefefe' },
    metadata: {
      fraudScore: 4,
      isFraudulent: false,
      ocrText: 'Remaining concerns:\n1. The side-channel vulnerability reported by Dr. Reddy\n   needs resolution before any production deployment.\n2. Budget overrun of â‚¹2.3Cr on the HSM procurement\n   requires CFO approval.\n3. Competitors (specifically CipherCore) have made\n   inquiries about our lattice implementation through\n   suspicious channels.\n\nRECOMMENDATION: Accelerate timeline by 3 weeks.\nEngage external red team from CyberSec India.\n\nThis memo is classified. Unauthorized distribution\nis grounds for immediate termination and legal action.',
      elaScore: 5,
      analysisNotes: 'Authentic continuation of Fragment 301. Edge geometry matches with 89% confidence for direct physical join. Shredding pattern is consistent. Document reconstruction confirms a single-page memo.',
    },
    matchedWith: ['frg_301'],
    matchScores: { 'frg_301': 89 },
    createdAt: '2026-02-10T08:31:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
  {
    _id: 'frg_303',
    fragmentId: 'FRG-1709314003-0.7891',
    caseId: 'case_003',
    originalName: 'email_printout_fragment.jpg',
    storagePath: 'uploads/email_printout_fragment.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 600, rotation: 0 },
    features: { edgeGeometry: [63, 41, 15, 48], textFragments: ['From:', 'competitor', 'pricing'], averageColor: '#faf8f5' },
    metadata: {
      fraudScore: 12,
      isFraudulent: false,
      ocrText: 'From: deepak.r@techvault.in\nTo: external_contact_redacted@protonmail.com\nDate: Oct 18, 2025, 11:47 PM\nSubject: Re: Pricing structure\n\n> As discussed, attached is the breakdown you requested.\n> The per-unit pricing for the government tier is\n> structured as follows:\n> - Base license: â‚¹45L/year\n> - HSM module addon: â‚¹12L/unit\n> - Support & maintenance: 18% of license\n>\n> Let me know if CipherCore needs more details.\n> Please destroy after reading.\n\n[Attachment: nexus_pricing_v3.xlsx â€” NOT RECOVERED]',
      elaScore: 9,
      analysisNotes: 'Critical evidence of potential corporate espionage. Email printout from TechVault employee to external contact associated with competitor CipherCore. Document appears authentic â€” no tampering detected. The attachment referenced was not recovered from shredded material.',
    },
    matchedWith: [],
    matchScores: {},
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-15T12:30:00Z',
  },
];

// ---- CASE 4: Insurance Fraud â€” Maritime ----
const case4Fragments = [
  {
    _id: 'frg_401',
    fragmentId: 'FRG-1709315001-0.3321',
    caseId: 'case_004',
    originalName: 'shipping_manifest_torn_A.jpg',
    storagePath: 'uploads/shipping_manifest_torn_A.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 0, rotation: -3 },
    features: { edgeGeometry: [33, 66, 99, 22], textFragments: ['MANIFEST', 'MV Sagarmala', 'Container'], averageColor: '#eae4d8' },
    metadata: {
      fraudScore: 78,
      isFraudulent: true,
      ocrText: 'SHIPPING MANIFEST â€” BILL OF LADING\nVessel: MV Sagarmala Express\nVoyage No: SGE-2025-1847\nPort of Loading: JNPT, Nhava Sheva\nPort of Discharge: Colombo, Sri Lanka\nDate of Sailing: 22/12/2025\n\nContainer No    Contents              Declared Value\n---------------------------------------------------------\nSGEU-7734291   Electronics â€” Mobile   â‚¹4,80,00,000\n                Phones (Samsung, Apple)\n                Qty: 12,000 units\nSGEU-7734292   Textiles â€” Raw Silk    â‚¹1,20,00,000\n                Qty: 8,000 meters',
      elaScore: 74,
      analysisNotes: 'CRITICAL: The declared value for Container SGEU-7734291 shows significant ELA discrepancy. The original amount appears to have been â‚¹1,80,00,000 (digitally altered to â‚¹4,80,00,000). Pixel analysis shows a 3x multiplier was applied to inflate the electronics shipment value for insurance overclaim purposes.',
    },
    matchedWith: ['frg_402'],
    matchScores: { 'frg_402': 92 },
    createdAt: '2026-03-01T06:00:00Z',
    updatedAt: '2026-03-05T10:15:00Z',
  },
  {
    _id: 'frg_402',
    fragmentId: 'FRG-1709315002-0.9914',
    caseId: 'case_004',
    originalName: 'shipping_manifest_torn_B.jpg',
    storagePath: 'uploads/shipping_manifest_torn_B.jpg',
    mimeType: 'image/jpeg',
    position: { x: 400, y: 0, rotation: 1 },
    features: { edgeGeometry: [99, 22, 55, 88], textFragments: ['Insurance', 'United India', 'Claim'], averageColor: '#ece6da' },
    metadata: {
      fraudScore: 81,
      isFraudulent: true,
      ocrText: 'INSURANCE COVERAGE DETAILS\nInsurer: United India Insurance Co. Ltd.\nPolicy No: MAR/2025/JN/004821\nCoverage Type: Institute Cargo Clause (A)\nSum Insured: â‚¹7,20,00,000\nPremium Paid: â‚¹3,60,000\n\nSPECIAL CONDITIONS:\n- All-risk coverage including piracy\n- Transshipment allowed at Colombo\n- Subject to Institute War Clauses\n\nCLAIM FILED: 28/12/2025\nCLAIM AMOUNT: â‚¹5,40,00,000\nReason: Containers SGEU-7734291 fell overboard\n        during severe weather near Lakshadweep Islands',
      elaScore: 76,
      analysisNotes: 'HIGH FRAUD PROBABILITY: The insurance claim amount (â‚¹5.4Cr) significantly exceeds what would be expected for the actual cargo value. Combined with the inflated manifest values detected in Fragment 401, this supports a coordinated insurance fraud scheme. The weather claim should be cross-referenced with IMD data for the stated date and location.',
    },
    matchedWith: ['frg_401'],
    matchScores: { 'frg_401': 92 },
    createdAt: '2026-03-01T06:01:00Z',
    updatedAt: '2026-03-05T10:15:00Z',
  },
  {
    _id: 'frg_403',
    fragmentId: 'FRG-1709315003-0.1147',
    caseId: 'case_004',
    originalName: 'customs_declaration_frag.jpg',
    storagePath: 'uploads/customs_declaration_frag.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 500, rotation: 0 },
    features: { edgeGeometry: [55, 88, 33, 66], textFragments: ['Customs', 'Declaration', 'IEC'], averageColor: '#f0eade' },
    metadata: {
      fraudScore: 22,
      isFraudulent: false,
      ocrText: 'CUSTOMS EXPORT DECLARATION\nExporter: Oceanview Trading Pvt. Ltd.\nIEC Code: 0425XXXXXX\nSB No: 4821739 dt. 20/12/2025\nFOB Value: â‚¹6,00,00,000\nCIF Value: â‚¹6,24,00,000\n\nHS Code    Description              Qty      Value\n8517.12    Mobile Phones            12,000   â‚¹4,80,00,000\n5002.00    Raw Silk                 8,000m   â‚¹1,20,00,000\n\nCustoms Officer: A.K. Verma\nSeal: [present]',
      elaScore: 18,
      analysisNotes: 'The customs declaration itself appears unaltered â€” the fraud appears concentrated in the shipping manifest and insurance documents. However, the declared FOB value matches the inflated manifest figures, suggesting the customs form was prepared using the already-falsified manifest data.',
    },
    matchedWith: [],
    matchScores: {},
    createdAt: '2026-03-01T06:02:00Z',
    updatedAt: '2026-03-05T10:30:00Z',
  },
];

// ---- CASE 5: Cold Case #1987-B ----
const case5Fragments = [
  {
    _id: 'frg_501',
    fragmentId: 'FRG-1709316001-0.6643',
    caseId: 'case_005',
    originalName: 'police_fir_page1_aged.jpg',
    storagePath: 'uploads/police_fir_page1_aged.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 0, rotation: 5 },
    features: { edgeGeometry: [11, 44, 77, 33], textFragments: ['F.I.R.', 'Police Station', 'Complainant'], averageColor: '#d4c8a8' },
    metadata: {
      fraudScore: 28,
      isFraudulent: false,
      ocrText: 'FIRST INFORMATION REPORT\n(Under Section 154 Cr.P.C.)\n\nDistrict: Lucknow     P.S.: Hazratganj\nFIR No: 487/1987      Date: 14/11/1987\nAct & Sections: IPC 302, 201, 120B\n\nComplainant: Smt. Parvati Devi\nRelation to Victim: Wife\n\nBrief Facts:\nOn the night of November 13, 1987, at approximately\n23:30 hours, my husband Shri Ramesh Chandra Tripathi\n(age 42) left our residence at 18, Gokhale Marg\nstating he had an urgent business meeting. He did\nnot return. His body was found the next morning near\nGomti Nagar bridge by morning walkers.',
      elaScore: 25,
      analysisNotes: 'Document shows authentic aging patterns consistent with 1987 paper stock. The yellowing, foxing marks, and ink degradation are natural. Minor ELA variance in the FIR number area is consistent with stamp-pad impression overlap, not tampering. Document has been well-preserved.',
    },
    matchedWith: ['frg_502'],
    matchScores: { 'frg_502': 88 },
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-01-10T09:00:00Z',
  },
  {
    _id: 'frg_502',
    fragmentId: 'FRG-1709316002-0.2298',
    caseId: 'case_005',
    originalName: 'witness_statement_partial.jpg',
    storagePath: 'uploads/witness_statement_partial.jpg',
    mimeType: 'image/jpeg',
    position: { x: 0, y: 600, rotation: -2 },
    features: { edgeGeometry: [77, 33, 11, 44], textFragments: ['Witness', 'Statement', 'saw'], averageColor: '#d8ccac' },
    metadata: {
      fraudScore: 55,
      isFraudulent: true,
      ocrText: 'SUPPLEMENTARY WITNESS STATEMENT\nRecorded on: 18/11/1987\nWitness: Shri Babu Lal (Night Watchman)\n\nI, Babu Lal, employed as chowkidar at Modi\nTextile Godown, Gomti Nagar, state that on the\nnight of 13th November, I saw a black Ambassador\ncar (Reg: UP 32 XXXX) parked near the bridge\nat around 23:45. Two men were carrying what\nappeared to be a heavy bundle. I heard raised\nvoices but could not make out the words due to\ndistance. The car left towards Mahanagar at\nhigh speed approximately 15 minutes later.\n\nI did not report this as I feared for my safety.\n\n[Note added in different ink: This statement was\nrecorded 5 days after the incident. Delay\nexplained by witness as fear of retaliation.]',
      elaScore: 49,
      analysisNotes: 'ATTENTION: The bracketed note at the bottom appears to have been added at a significantly different time than the main body. Ink density analysis suggests the note was written with a different pen, and ELA shows different compression characteristics in that region. The main testimony appears authentic. The added note may have been inserted later â€” possibly to explain procedural gaps. Cross-reference with station diary entries needed.',
    },
    matchedWith: ['frg_501'],
    matchScores: { 'frg_501': 88 },
    createdAt: '2025-12-01T10:30:00Z',
    updatedAt: '2026-01-10T09:30:00Z',
  },
  {
    _id: 'frg_503',
    fragmentId: 'FRG-1709316003-0.8812',
    caseId: 'case_005',
    originalName: 'postmortem_report_frag.jpg',
    storagePath: 'uploads/postmortem_report_frag.jpg',
    mimeType: 'image/jpeg',
    position: { x: 400, y: 0, rotation: 0 },
    features: { edgeGeometry: [55, 88, 22, 66], textFragments: ['Post-Mortem', 'cause of death', 'injuries'], averageColor: '#d0c4a4' },
    metadata: {
      fraudScore: 11,
      isFraudulent: false,
      ocrText: 'POST-MORTEM EXAMINATION REPORT\nKGMU, Lucknow\n\nDeceased: Ramesh Chandra Tripathi, Male, 42 yrs\nPM No: 1142/87    Date: 15/11/1987\nBrought by: HC Ram Kumar, PS Hazratganj\n\nEXTERNAL EXAMINATION:\n1. Ligature mark on neck â€” 18cm x 2cm\n2. Abrasion on right temple â€” 4cm x 3cm\n3. Bruising on both wrists â€” consistent with\n   restraint marks\n4. Petechial hemorrhages in conjunctiva\n\nCAUSE OF DEATH: Asphyxia due to ligature\nstrangulation. The head injury (finding #2)\nappears ante-mortem and may have been used\nto incapacitate the victim.\n\nOPINION: Homicidal in nature.\n\nDr. S.N. Mishra, Professor, Forensic Medicine',
      elaScore: 8,
      analysisNotes: 'Authentic historical medical document. Consistent paper aging and typewriter characteristics of the mid-1980s. No signs of tampering. The document has been carefully preserved â€” likely photocopied from original archives for digitization.',
    },
    matchedWith: [],
    matchScores: {},
    createdAt: '2025-12-01T11:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
];

// ---- CASES ----
export const MOCK_CASES = [
  {
    _id: 'case_001',
    caseId: 'FRN-2026-001',
    name: 'Operation Paper Trail',
    description: 'Investigation into suspected financial fraud involving forged bank statements and demand drafts. Multiple shredded bank documents recovered from suspect premises during raid on Jan 28, 2026.',
    status: 'Processing',
    priority: 'High',
    assignedAgent: 'usr_001',
    assignedAgentName: 'Ayushi Singh',
    fragmentCount: 4,
    reconstructionProgress: 68,
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-03-05T14:22:00Z',
    tags: ['Financial Fraud', 'Bank Documents', 'Forgery'],
  },
  {
    _id: 'case_002',
    caseId: 'FRN-2026-002',
    name: 'Estate Dispute #447',
    description: 'Contested will and testament of Late Shri Rajendra Prasad Gupta. Family members allege the will was tampered with after execution. Shredded fragments of the original will recovered from notary office.',
    status: 'Processing',
    priority: 'Medium',
    assignedAgent: 'usr_001',
    assignedAgentName: 'Ayushi Singh',
    fragmentCount: 3,
    reconstructionProgress: 82,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T16:45:00Z',
    tags: ['Property Dispute', 'Will', 'Notary Fraud'],
  },
  {
    _id: 'case_003',
    caseId: 'FRN-2026-003',
    name: 'Corporate Espionage â€” TechVault',
    description: 'Investigation into alleged trade secret theft from TechVault Inc. Shredded internal memos and email printouts recovered from the desk of a terminated employee suspected of leaking Project Nexus details to competitor CipherCore.',
    status: 'Open',
    priority: 'Critical',
    assignedAgent: 'usr_002',
    assignedAgentName: 'Ravi Mehta',
    fragmentCount: 3,
    reconstructionProgress: 55,
    createdAt: '2026-02-10T08:30:00Z',
    updatedAt: '2026-02-15T12:30:00Z',
    tags: ['Corporate Espionage', 'Trade Secrets', 'IT Sector'],
  },
  {
    _id: 'case_004',
    caseId: 'FRN-2026-004',
    name: 'Maritime Insurance Fraud',
    description: 'Suspected insurance overclaim on maritime cargo. Partially shredded shipping manifests and insurance documents recovered from offices of Oceanview Trading Pvt. Ltd. suggest inflated cargo values for insurance fraud.',
    status: 'Processing',
    priority: 'High',
    assignedAgent: 'usr_001',
    assignedAgentName: 'Ayushi Singh',
    fragmentCount: 3,
    reconstructionProgress: 73,
    createdAt: '2026-03-01T06:00:00Z',
    updatedAt: '2026-03-05T10:30:00Z',
    tags: ['Insurance Fraud', 'Maritime', 'Customs'],
  },
  {
    _id: 'case_005',
    caseId: 'FRN-2025-089',
    name: 'Cold Case #1987-B â€” Tripathi Homicide',
    description: 'Re-examination of evidence from the 1987 Ramesh Chandra Tripathi homicide case. Original paper evidence digitized and analyzed using modern AI forensic techniques. Case reopened on direction of Lucknow High Court.',
    status: 'Open',
    priority: 'Medium',
    assignedAgent: 'usr_002',
    assignedAgentName: 'Ravi Mehta',
    fragmentCount: 3,
    reconstructionProgress: 41,
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
    tags: ['Cold Case', 'Homicide', 'Historical Evidence'],
  },
];

// ---- FRAGMENTS MAP ----
export const MOCK_FRAGMENTS = {
  case_001: case1Fragments,
  case_002: case2Fragments,
  case_003: case3Fragments,
  case_004: case4Fragments,
  case_005: case5Fragments,
};

// All fragments flat
export const ALL_FRAGMENTS = [
  ...case1Fragments,
  ...case2Fragments,
  ...case3Fragments,
  ...case4Fragments,
  ...case5Fragments,
];

// Attach thumbnails to all fragments
ALL_FRAGMENTS.forEach((f) => {
  f.thumbnail = getFragmentThumbnail(f.originalName);
});

// ---- MATCHING DATA (precomputed matches per case) ----
export const MOCK_MATCHES = {
  case_001: {
    totalFragments: 4,
    matchedPairs: [
      { fragmentA: 'frg_101', fragmentB: 'frg_102', confidence: 94, status: 'confirmed', matchType: 'edge_geometry', description: 'Bank statement page 1 â€” left and right halves. Edge profiles align with 94% confidence. Tear pattern consistent.' },
      { fragmentA: 'frg_101', fragmentB: 'frg_103', confidence: 87, status: 'confirmed', matchType: 'content_link', description: 'Bank statement references DD No. 372891 which matches the cheque leaf debit. Content-based association.' },
      { fragmentA: 'frg_103', fragmentB: 'frg_104', confidence: 76, status: 'pending_review', matchType: 'content_link', description: 'Cheque leaf and DD receipt share identical DD number and amount. Cross-document content match.' },
    ],
    assemblyGroups: [
      { groupId: 'asm_001', fragments: ['frg_101', 'frg_102'], confidence: 94, label: 'Bank Statement â€” Page 1 Reconstruction' },
      { groupId: 'asm_002', fragments: ['frg_103', 'frg_104'], confidence: 76, label: 'Payment Instruments â€” Cross-reference Group' },
    ],
    overallProgress: 68,
  },
  case_002: {
    totalFragments: 3,
    matchedPairs: [
      { fragmentA: 'frg_201', fragmentB: 'frg_202', confidence: 96, status: 'confirmed', matchType: 'edge_geometry', description: 'Will page 1 â€” top and bottom halves. Near-perfect edge alignment. Paper grain direction matches.' },
      { fragmentA: 'frg_202', fragmentB: 'frg_203', confidence: 91, status: 'confirmed', matchType: 'edge_geometry', description: 'Will page 1 bottom connects to page 2 signatures section. Page sequence confirmed by content flow.' },
    ],
    assemblyGroups: [
      { groupId: 'asm_003', fragments: ['frg_201', 'frg_202', 'frg_203'], confidence: 93, label: 'Last Will & Testament â€” Full Document' },
    ],
    overallProgress: 82,
  },
  case_003: {
    totalFragments: 3,
    matchedPairs: [
      { fragmentA: 'frg_301', fragmentB: 'frg_302', confidence: 89, status: 'confirmed', matchType: 'edge_geometry', description: 'Internal memo â€” left and right strips from cross-cut shredder. Strip width matches at 4mm.' },
    ],
    assemblyGroups: [
      { groupId: 'asm_004', fragments: ['frg_301', 'frg_302'], confidence: 89, label: 'Confidential Memo â€” Project Nexus' },
      { groupId: 'asm_005', fragments: ['frg_303'], confidence: 100, label: 'Email Evidence â€” Standalone' },
    ],
    overallProgress: 55,
  },
  case_004: {
    totalFragments: 3,
    matchedPairs: [
      { fragmentA: 'frg_401', fragmentB: 'frg_402', confidence: 92, status: 'confirmed', matchType: 'edge_geometry', description: 'Shipping manifest and insurance document â€” physical tear alignment matches. Both from same shredding batch.' },
      { fragmentA: 'frg_401', fragmentB: 'frg_403', confidence: 71, status: 'pending_review', matchType: 'content_link', description: 'Manifest cargo details match customs declaration entries. HS codes and quantities correlate.' },
    ],
    assemblyGroups: [
      { groupId: 'asm_006', fragments: ['frg_401', 'frg_402'], confidence: 92, label: 'Shipping & Insurance Documents' },
      { groupId: 'asm_007', fragments: ['frg_403'], confidence: 100, label: 'Customs Declaration â€” Standalone' },
    ],
    overallProgress: 73,
  },
  case_005: {
    totalFragments: 3,
    matchedPairs: [
      { fragmentA: 'frg_501', fragmentB: 'frg_502', confidence: 88, status: 'confirmed', matchType: 'content_link', description: 'FIR and witness statement from same case â€” FIR No. 487/1987 referenced in both documents. Timeline consistent.' },
    ],
    assemblyGroups: [
      { groupId: 'asm_008', fragments: ['frg_501', 'frg_502'], confidence: 88, label: 'Investigation Records â€” FIR & Witness' },
      { groupId: 'asm_009', fragments: ['frg_503'], confidence: 100, label: 'Medical Evidence â€” Post-Mortem Report' },
    ],
    overallProgress: 41,
  },
};

// ---- SYSTEM ALERTS (dynamic-looking) ----
export const MOCK_ALERTS = [
  { type: 'critical', msg: 'High fraud score (85%) detected on cheque leaf â€” FRN-2026-001', time: '8m ago', caseId: 'case_001' },
  { type: 'warning', msg: 'Witness statement anomaly flagged in Cold Case #1987-B', time: '23m ago', caseId: 'case_005' },
  { type: 'success', msg: 'OCR batch processed â€” 3 fragments from TechVault case', time: '1h ago', caseId: 'case_003' },
  { type: 'info', msg: 'Maritime Insurance case fragments matched with 92% confidence', time: '2h ago', caseId: 'case_004' },
  { type: 'success', msg: 'Estate Will page 1 fully reconstructed (96% match)', time: '3h ago', caseId: 'case_002' },
  { type: 'info', msg: 'System backup completed successfully', time: '5h ago', caseId: null },
  { type: 'warning', msg: 'AI model confidence below threshold for fragment FRG-1709315003', time: '6h ago', caseId: 'case_004' },
];

// ---- AUDIT LOG ----
export const MOCK_AUDIT_LOG = [
  { timestamp: '2026-03-06T08:12:00Z', user: 'Ayushi Singh', action: 'LOGIN', details: 'Agent authenticated via credential ID', ip: '192.168.1.45' },
  { timestamp: '2026-03-06T08:15:00Z', user: 'Ayushi Singh', action: 'VIEW_CASE', details: 'Accessed case FRN-2026-001 â€” Operation Paper Trail', ip: '192.168.1.45' },
  { timestamp: '2026-03-06T08:22:00Z', user: 'Ayushi Singh', action: 'RUN_ANALYSIS', details: 'Initiated AI fraud analysis on cheque_leaf_torn.png', ip: '192.168.1.45' },
  { timestamp: '2026-03-06T07:30:00Z', user: 'System', action: 'OCR_BATCH', details: 'Processed 3 fragments from case FRN-2026-003', ip: 'internal' },
  { timestamp: '2026-03-06T06:00:00Z', user: 'Ravi Mehta', action: 'UPLOAD', details: 'Uploaded 3 fragments to Maritime Insurance Fraud case', ip: '192.168.1.78' },
  { timestamp: '2026-03-05T22:00:00Z', user: 'System', action: 'BACKUP', details: 'Automated database backup completed â€” 2.4GB', ip: 'internal' },
  { timestamp: '2026-03-05T18:45:00Z', user: 'Ayushi Singh', action: 'MATCH_CONFIRM', details: 'Confirmed edge match between frg_201 and frg_202 (96%)', ip: '192.168.1.45' },
  { timestamp: '2026-03-05T16:30:00Z', user: 'Ravi Mehta', action: 'VIEW_REPORT', details: 'Generated forensic report for Cold Case #1987-B', ip: '192.168.1.78' },
];

// ---- NOTIFICATIONS ----
export const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'High Fraud Alert', message: 'Cheque leaf in FRN-2026-001 scored 85% fraud probability', read: false, time: '2026-03-06T08:22:00Z', type: 'critical' },
  { id: 'n2', title: 'Match Completed', message: 'Will testament fragments matched with 96% confidence', read: false, time: '2026-03-06T05:00:00Z', type: 'success' },
  { id: 'n3', title: 'OCR Processing Done', message: '3 TechVault memo fragments processed successfully', read: true, time: '2026-03-06T07:30:00Z', type: 'info' },
  { id: 'n4', title: 'New Case Assigned', message: 'Maritime Insurance Fraud case assigned to your queue', read: true, time: '2026-03-01T06:00:00Z', type: 'info' },
  { id: 'n5', title: 'System Update', message: 'AI model v4.3 deployed â€” improved edge matching accuracy', read: true, time: '2026-02-28T00:00:00Z', type: 'info' },
];
