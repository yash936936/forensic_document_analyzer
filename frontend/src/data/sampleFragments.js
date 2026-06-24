// ============================================================================
// CrimeX ASDAS — 5 Downloadable Sample Fragment Images + Rich Scan Metadata
// Generates realistic SVG document fragment images as downloadable Files.
// Each file, when uploaded, triggers detailed forensic scan results.
// ============================================================================

// ---------- SVG DOCUMENT BUILDERS ----------

const svgWrap = (w, h, body, bg = '#f5f0e6') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="${bg}" surfaceScale="1.5"><feDistantLight azimuth="45" elevation="55"/></feDiffuseLighting></filter>
      <filter id="aging"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="gn"/>
      <feBlend in="SourceGraphic" in2="gn" mode="multiply"/></filter>
      <clipPath id="torn"><path d="${tornEdge(w, h)}"/></clipPath>
    </defs>
    <rect width="${w}" height="${h}" fill="${bg}" filter="url(#paper)" clip-path="url(#torn)"/>
    <g clip-path="url(#torn)" filter="url(#aging)" opacity="0.95">${body}</g>
  </svg>`;

function tornEdge(w, h) {
  // Generate irregular torn right and bottom edges
  let d = `M 0 0 L ${w * 0.95} 0 `;
  // right edge — ragged
  for (let y = 0; y <= h; y += 12) {
    d += `L ${w * 0.95 + (Math.sin(y * 0.3) * 6 + Math.cos(y * 0.7) * 4)} ${y} `;
  }
  // bottom edge — torn
  d += `L ${w} ${h} `;
  for (let x = w; x >= 0; x -= 14) {
    d += `L ${x} ${h - (Math.sin(x * 0.2) * 5 + Math.cos(x * 0.5) * 3 + 2)} `;
  }
  d += 'Z';
  return d;
}

const textBlock = (x, y, lines, size = 11, color = '#1a1a1a', family = 'monospace') =>
  lines.map((line, i) =>
    `<text x="${x}" y="${y + i * (size + 4)}" font-size="${size}" fill="${color}" font-family="${family}">${escXml(line)}</text>`
  ).join('\n');

const escXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stamp = (x, y, text, color = '#c0392b') =>
  `<g transform="translate(${x},${y}) rotate(-12)">
    <rect x="-60" y="-14" width="120" height="28" rx="4" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.7"/>
    <text x="0" y="5" text-anchor="middle" font-size="13" fill="${color}" font-weight="bold" font-family="monospace" opacity="0.7">${escXml(text)}</text>
  </g>`;

const watermark = (x, y, text) =>
  `<text x="${x}" y="${y}" font-size="48" fill="#000" opacity="0.03" font-weight="900" font-family="sans-serif" text-anchor="middle" transform="rotate(-30,${x},${y})">${escXml(text)}</text>`;

// ---------- FRAGMENT 1: Bank Statement ----------
function buildBankStatement() {
  const lines = [
    'HDFC BANK LIMITED',
    'Statement of Account',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Account No: XXXX-XXXX-4892',
    'Branch: Connaught Place, New Delhi',
    'Statement Period: 01/01/2026 — 31/01/2026',
    'Customer: SUNRISE ENTERPRISES',
    '',
    'Date       Particulars           Debit       Credit      Balance',
    '───────────────────────────────────────────────────────────────',
    '01/01   Opening Balance                                  4,52,180.00',
    '03/01   NEFT/CR/RTGS/7281      —          12,50,000.00  16,02,180.00',
    '05/01   ATM WDL/DELHI-CP     40,000.00       —          15,62,180.00',
    '07/01   UPI/P2M/AMAZON        8,499.00       —          15,53,681.00',
    '10/01   CHQ DEP/892013         —           2,25,000.00  17,78,681.00',
    '14/01   DD ISSUED/372891    3,00,000.00       —          14,78,681.00',
    '18/01   NEFT/DR/RENT         45,000.00       —          14,33,681.00',
    '22/01   SAL/JAN/2026          —             85,000.00   15,18,681.00',
    '25/01   EMI/HDFC/LN8821     24,500.00       —          14,94,181.00',
    '28/01   UPI/P2M/SWIGGY       1,245.00       —          14,92,936.00',
    '31/01   Closing Balance                                 14,92,936.00',
    '',
    'This is a computer generated statement.',
    'No signature is required.',
  ];
  const body = textBlock(30, 40, lines, 10.5, '#111', "'Courier New', monospace") +
    stamp(420, 65, 'CONFIDENTIAL') +
    watermark(280, 400, 'HDFC BANK');
  return svgWrap(580, 440, body, '#f8f4ec');
}

// ---------- FRAGMENT 2: Torn Cheque Leaf ----------
function buildChequeFrag() {
  const body = `
    <rect x="25" y="20" width="510" height="240" rx="3" fill="none" stroke="#b0a090" stroke-width="1" stroke-dasharray="4,2"/>
    ${textBlock(40, 50, [
      'HDFC BANK — CONNAUGHT PLACE BRANCH',
      '────────────────────────────────────────────────',
    ], 11, '#333', "'Courier New', monospace")}
    ${textBlock(40, 90, [
      'Date: 15 / 01 / 2026              Cheque No: 892013',
    ], 10, '#222', "'Courier New', monospace")}
    ${textBlock(40, 120, [
      'Pay: ___Sunrise Enterprises_________________________',
      '',
      'Rupees: ___Three Lakh Only__________________________',
      '',
      '₹ 3,00,000/—',
    ], 12, '#111', "'Courier New', monospace")}
    ${textBlock(40, 208, [
      'A/C No: XXXX-XXXX-4892',
      'IFSC: HDFC0000001',
    ], 9, '#555', "'Courier New', monospace")}
    <line x1="350" y1="235" x2="520" y2="235" stroke="#444" stroke-width="0.5"/>
    ${textBlock(370, 248, ['Authorized Signatory'], 8, '#666', 'sans-serif')}
    ${stamp(460, 140, 'SPECIMEN', '#2980b9')}
    <rect x="30" y="245" width="140" height="12" rx="2" fill="#ddd"/>
    ${textBlock(35, 255, ['MICR: ▮▮▮▮ ▮▮▮ ▮▮▮▮▮▮'], 7, '#888', 'monospace')}
  `;
  return svgWrap(560, 280, body, '#f5f0e2');
}

// ---------- FRAGMENT 3: Will Testament Page ----------
function buildWillFrag() {
  const lines = [
    'LAST WILL AND TESTAMENT',
    '',
    'I, Rajendra Prasad Gupta, son of Late Shri Mohan Lal Gupta,',
    'resident of 14-B, Civil Lines, Jaipur, Rajasthan,',
    'being of sound mind and disposing memory, do hereby',
    'revoke all my previous Wills and Codicils and declare',
    'this to be my Last Will and Testament.',
    '',
    'Date of Execution: 12th August, 2024',
    'Place: Jaipur, Rajasthan',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'CLAUSE I — PROPERTY DISTRIBUTION',
    '',
    '1. I bequeath my residential property at 14-B,',
    '   Civil Lines, Jaipur to my daughter Anita Gupta.',
    '2. Commercial property at M.I. Road, Shop No. 7,',
    '   divided equally between Vikram and Sanjay Gupta.',
    '3. Fixed Deposits in SBI (A/C: XXXXX7891) ~₹45,00,000',
    '   shall go to my wife Kamla Devi Gupta.',
    '',
    'WITNESS ATTESTATION:',
    '',
    'Witness 1: Arun Bhatia (Advocate) ............',
    'Witness 2: Priya Saxena           ............',
    '',
    'Notarized by: R.K. Joshi, Notary Public',
  ];
  const body = textBlock(40, 45, lines, 11, '#1a1400', "'Georgia', serif") +
    stamp(420, 430, 'NOTARIZED', '#1a6b3f') +
    watermark(280, 320, 'LEGAL DOCUMENT');
  return svgWrap(560, 480, body, '#f7f2e4');
}

// ---------- FRAGMENT 4: Shipping Manifest ----------
function buildShippingManifest() {
  const lines = [
    'SHIPPING MANIFEST — BILL OF LADING',
    '═══════════════════════════════════════════════',
    '',
    'Vessel: MV Sagarmala Express',
    'Voyage No: SGE-2025-1847',
    'Port of Loading: JNPT, Nhava Sheva, India',
    'Port of Discharge: Colombo, Sri Lanka',
    'Date of Sailing: 22/12/2025',
    '',
    'Container     Contents                  Declared Value',
    '───────────────────────────────────────────────────────',
    'SGEU-7734291  Electronics — Mobiles      ₹4,80,00,000',
    '              (Samsung, Apple) 12,000 u',
    'SGEU-7734292  Textiles — Raw Silk        ₹1,20,00,000',
    '              8,000 meters                             ',
    '',
    'Total FOB Value: ₹6,00,00,000',
    '═══════════════════════════════════════════════',
    '',
    'INSURANCE DETAILS',
    'Insurer: United India Insurance Co. Ltd.',
    'Policy No: MAR/2025/JN/004821',
    'Sum Insured: ₹7,20,00,000',
    '',
    'Exporter: Oceanview Trading Pvt. Ltd.',
    'IEC Code: 0425XXXXXX',
    'CHA: Global Logistics India',
  ];
  const body = textBlock(30, 38, lines, 10.5, '#0a0a2a', "'Courier New', monospace") +
    stamp(430, 60, 'ORIGINAL', '#8b0000') +
    watermark(280, 300, 'CUSTOMS');
  return svgWrap(560, 440, body, '#eeeade');
}

// ---------- FRAGMENT 5: FIR (Aged 1987) ----------
function buildFIRFrag() {
  const lines = [
    'FIRST INFORMATION REPORT',
    '(Under Section 154 Cr.P.C.)',
    '',
    'District: Lucknow          P.S.: Hazratganj',
    'FIR No: 487/1987           Date: 14/11/1987',
    'Act & Sections: IPC 302, 201, 120B',
    '',
    'Complainant: Smt. Parvati Devi',
    'Relation to Victim: Wife',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'BRIEF FACTS:',
    '',
    'On the night of November 13, 1987, at approx.',
    '23:30 hrs, my husband Shri Ramesh Chandra',
    'Tripathi (age 42) left our residence at 18,',
    'Gokhale Marg stating he had an urgent business',
    'meeting. He did not return.',
    '',
    'His body was found the next morning near Gomti',
    'Nagar bridge by morning walkers at 06:15 hrs.',
    '',
    'POST-MORTEM FINDINGS (Summary):',
    '• Ligature mark on neck — 18cm × 2cm',
    '• Abrasion on right temple — 4cm × 3cm',
    '• Bruising on both wrists (restraint marks)',
    '• Cause: Asphyxia due to strangulation',
    '',
    'Opinion: Homicidal in nature.',
    'Investigating Officer: SI Harnam Singh',
  ];
  const body = textBlock(35, 42, lines, 10.5, '#2a1e0a', "'Courier New', monospace") +
    stamp(400, 80, 'POLICE COPY', '#2c3e50') +
    `<text x="30" y="480" font-size="8" fill="#8b7355" font-family="monospace">Digitized from original — Lucknow Police Archives, 2025</text>` +
    watermark(260, 310, 'U.P. POLICE');
  return svgWrap(540, 500, body, '#e8dcc6');
}

// ---------- SVG → downloadable File object ----------
function svgToFile(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  return new File([blob], filename, { type: 'image/svg+xml', lastModified: Date.now() });
}

// ---------- PUBLIC API ----------

export const SAMPLE_FRAGMENTS = [
  {
    id: 'sample_bank_stmt',
    filename: 'HDFC_Bank_Statement_Fragment.svg',
    label: 'HDFC Bank Statement',
    description: 'Torn bank statement with suspicious NEFT credit entry of ₹12.5L.',
    caseRef: 'FRN-2026-001',
    category: 'Financial',
    color: '#3b82f6',
    build: buildBankStatement,
  },
  {
    id: 'sample_cheque',
    filename: 'Cheque_Leaf_892013_Fragment.svg',
    label: 'Cheque Leaf — ₹3,00,000',
    description: 'Partially torn cheque issued to Sunrise Enterprises. Signature region suspect.',
    caseRef: 'FRN-2026-001',
    category: 'Payment Instrument',
    color: '#8b5cf6',
    build: buildChequeFrag,
  },
  {
    id: 'sample_will',
    filename: 'Will_Testament_Gupta_Fragment.svg',
    label: 'Will & Testament — Gupta Estate',
    description: 'Last will recovered from notary office. Date field and witness signatures flagged.',
    caseRef: 'FRN-2026-002',
    category: 'Legal Document',
    color: '#10b981',
    build: buildWillFrag,
  },
  {
    id: 'sample_manifest',
    filename: 'Shipping_Manifest_SGE1847.svg',
    label: 'Shipping Manifest — MV Sagarmala',
    description: 'Bill of lading with suspected inflated cargo values for insurance overclaim.',
    caseRef: 'FRN-2026-004',
    category: 'Maritime / Customs',
    color: '#f59e0b',
    build: buildShippingManifest,
  },
  {
    id: 'sample_fir',
    filename: 'FIR_487_1987_Tripathi_Homicide.svg',
    label: 'FIR — Cold Case 1987',
    description: 'Digitized FIR from 1987 Tripathi homicide. Aged document with original police stamps.',
    caseRef: 'FRN-2025-089',
    category: 'Criminal / Historical',
    color: '#ef4444',
    build: buildFIRFrag,
  },
];

/** Build a File object for a given sample */
export function buildSampleFile(sampleId) {
  const s = SAMPLE_FRAGMENTS.find((f) => f.id === sampleId);
  if (!s) return null;
  return svgToFile(s.build(), s.filename);
}

/** Build all 5 sample files */
export function buildAllSampleFiles() {
  return SAMPLE_FRAGMENTS.map((s) => svgToFile(s.build(), s.filename));
}

// ---------- RICH SCAN RESULTS (per filename pattern-match) ----------
// When the user uploads one of our sample files, the mock API will use
// these detailed results instead of the generic random ones.

export const DETAILED_SCAN_RESULTS = {
  'HDFC_Bank_Statement_Fragment': {
    ocrText: `HDFC BANK LIMITED
Statement of Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account No: XXXX-XXXX-4892
Branch: Connaught Place, New Delhi
Statement Period: 01/01/2026 — 31/01/2026
Customer: SUNRISE ENTERPRISES

Date       Particulars           Debit       Credit      Balance
───────────────────────────────────────────────────────────────
01/01   Opening Balance                                  4,52,180.00
03/01   NEFT/CR/RTGS/7281      —          12,50,000.00  16,02,180.00
05/01   ATM WDL/DELHI-CP     40,000.00       —          15,62,180.00
07/01   UPI/P2M/AMAZON        8,499.00       —          15,53,681.00
14/01   DD ISSUED/372891    3,00,000.00       —          14,78,681.00
31/01   Closing Balance                                 14,92,936.00`,
    ocrConfidence: 0.94,
    fraudScore: 72,
    elaScore: 68,
    isFraudulent: true,
    language: 'English',
    documentType: 'Bank Statement',
    analysisNotes: `[FRAUD ALERT — HIGH CONFIDENCE]
ELA detected inconsistent compression artifacts around the NEFT credit entry of ₹12,50,000 on 03/01. The pixel luminance distribution in the credit amount field diverges from the surrounding text by 3.2σ (standard deviations).

Key findings:
• The NEFT transaction row has a JPEG quality level of ~72, while remaining rows show quality ~85 — suggests the row was edited in an external tool and re-saved.
• Baseline text alignment is offset by 0.3px in the suspicious row — consistent with text replacement.
• Amount font kerning analysis shows the "12,50,000" uses tighter letter-spacing (92%) compared to authentic entries (100%).
• SHA-256 hash of this region differs from the document's overall compression profile.

Recommendation: Cross-reference UTR number RTGS/7281 with HDFC bank servers. Compare with original e-statement PDF metadata.`,
    edgeAnalysis: {
      tearPattern: 'Diagonal tear — top-right to mid-right',
      matchPotential: 'High (73%) — edge geometry suggests connection to adjacent fragment',
      shredType: 'Manual tear (not machine-shredded)',
      paperGSM: '~75 GSM (standard bank stationery)',
    },
    processingSteps: [
      { step: 'Document Ingestion', duration: '0.4s', status: 'complete', detail: 'SVG parsed, rasterized at 300 DPI (1740×1320 px)' },
      { step: 'Pre-processing', duration: '1.2s', status: 'complete', detail: 'Binarization (Otsu), deskew (-0.3°), noise reduction (median 3×3)' },
      { step: 'OCR Extraction', duration: '2.8s', status: 'complete', detail: 'Tesseract v5.3.4 LSTM — English model — 94.2% character confidence' },
      { step: 'Fraud Analysis (ELA)', duration: '3.1s', status: 'complete', detail: 'Error Level Analysis at quality 95 — anomaly detected in row 3' },
      { step: 'Edge Feature Extraction', duration: '1.5s', status: 'complete', detail: 'CNN edge encoder — 128-dim feature vector generated' },
      { step: 'Hash Verification', duration: '0.2s', status: 'complete', detail: 'SHA-256: a7f3c8e2d1b4...c1e3d5b7f9 — logged to chain' },
    ],
  },
  'Cheque_Leaf_892013_Fragment': {
    ocrText: `HDFC BANK — CONNAUGHT PLACE BRANCH
Date: 15 / 01 / 2026    Cheque No: 892013

Pay: ___Sunrise Enterprises___________ or Bearer
Rupees: ___Three Lakh Only______________________
₹ 3,00,000/—

A/C No: XXXX-XXXX-4892    IFSC: HDFC0000001
MICR: ▮▮▮▮ ▮▮▮ ▮▮▮▮▮▮`,
    ocrConfidence: 0.89,
    fraudScore: 85,
    elaScore: 82,
    isFraudulent: true,
    language: 'English',
    documentType: 'Cheque / Payment Instrument',
    analysisNotes: `[CRITICAL — SIGNATURE FORGERY DETECTED]
Error Level Analysis reveals the authorized signatory region was digitally spliced from a different document. Compression level mismatch of 47% between the signature area and the cheque body.

Detailed findings:
• Signature block JPEG quality: ~62 (significantly lower than document body at ~88)
• Pixel boundary analysis shows a hard rectangular cut-line around the signature — 1px aliasing artifact visible at 400% zoom
• The amount in words "Three Lakh Only" shows minor pixel bleeding at character edges — possible overwrite of original amount
• MICR code band shows authentic magnetic ink patterns — not tampered
• Date field UV analysis: consistent ink age (no overwrite detected)

Correlation: The DD amount (₹3,00,000) matches a debit entry on 14/01 in the bank statement fragment (FRG-1709312001). Cross-document validation supports transaction authenticity, but the cheque instrument itself shows forgery indicators in the signature region.

Evidence grade: B+ (partially authentic, partially tampered)`,
    edgeAnalysis: {
      tearPattern: 'Clean cut — bottom edge; ragged right side',
      matchPotential: 'Medium (58%) — partial edge geometry match with bank statement',
      shredType: 'Scissors cut + manual tear',
      paperGSM: '~100 GSM (cheque security paper)',
    },
    processingSteps: [
      { step: 'Document Ingestion', duration: '0.3s', status: 'complete', detail: 'SVG parsed, rasterized at 300 DPI (1680×840 px)' },
      { step: 'Pre-processing', duration: '0.9s', status: 'complete', detail: 'Binarization, deskew (+0.1°), MICR zone isolation' },
      { step: 'OCR Extraction', duration: '2.1s', status: 'complete', detail: 'Tesseract v5.3.4 LSTM — 89.4% confidence — MICR decoded separately' },
      { step: 'Fraud Analysis (ELA)', duration: '4.2s', status: 'complete', detail: 'Multi-level ELA (Q75, Q85, Q95) — signature region FLAGGED' },
      { step: 'Signature Verification', duration: '2.7s', status: 'complete', detail: 'CNN signature matcher — NO MATCH with reference signatures on file' },
      { step: 'Hash Verification', duration: '0.2s', status: 'complete', detail: 'SHA-256: b8e4d9f3c2a5...d0b2f4a6c8e0 — logged to chain' },
    ],
  },
  'Will_Testament_Gupta_Fragment': {
    ocrText: `LAST WILL AND TESTAMENT

I, Rajendra Prasad Gupta, son of Late Shri Mohan Lal Gupta,
resident of 14-B, Civil Lines, Jaipur, Rajasthan,
being of sound mind and disposing memory, do hereby revoke
all my previous Wills and Codicils and declare this to be my
Last Will and Testament.

Date of Execution: 12th August, 2024

CLAUSE I — PROPERTY DISTRIBUTION
1. Residential property at 14-B, Civil Lines — to Anita Gupta
2. Commercial property at M.I. Road, Shop No. 7 — divided
   equally between Vikram and Sanjay Gupta
3. FD in SBI (XXXXX7891) ~₹45,00,000 — to Kamla Devi Gupta

WITNESS ATTESTATION:
Witness 1: Arun Bhatia (Advocate) ............
Witness 2: Priya Saxena           ............
Notarized by: R.K. Joshi, Notary Public`,
    ocrConfidence: 0.91,
    fraudScore: 67,
    elaScore: 61,
    isFraudulent: true,
    language: 'English',
    documentType: 'Legal — Will & Testament',
    analysisNotes: `[ALERT — WITNESS SIGNATURE ANOMALY]
Witness 2 (Priya Saxena) signature shows inconsistent pressure patterns compared to the rest of the document. The notary seal region has elevated ELA values indicating possible re-stamping or digital overlay.

Detailed findings:
• Date field ("12th August, 2024"): moderate ELA variance (Δ = 2.1σ) — the surrounding text shows uniform aging but date region has slightly different texture. Could be natural wear OR date modification.
• Witness 1 signature: ink density consistent with document body — AUTHENTIC
• Witness 2 signature: ink density 23% lighter than expected — pressure analysis suggests a different writing instrument was used
• Notary seal: ELA value 61 vs. document average ELA 38 — seal may have been applied at a different time or overlaid digitally
• Paper aging: UV fluorescence analysis shows uniform aging (~2 years) consistent with stated 2024 date

Recommendation: Physical ink analysis (HPLC) needed to confirm whether Witness 2 signed at the same time as Witness 1. Compare notary seal impression with R.K. Joshi's registered seal sample.`,
    edgeAnalysis: {
      tearPattern: 'Torn horizontally across middle; ragged bottom',
      matchPotential: 'Very High (91%) — top connects to will header page',
      shredType: 'Manual tear along fold line',
      paperGSM: '~90 GSM (legal bond paper)',
    },
    processingSteps: [
      { step: 'Document Ingestion', duration: '0.4s', status: 'complete', detail: 'SVG parsed, rasterized at 300 DPI (1680×1440 px)' },
      { step: 'Pre-processing', duration: '1.0s', status: 'complete', detail: 'Binarization, deskew (-0.2°), seal region isolation' },
      { step: 'OCR Extraction', duration: '3.4s', status: 'complete', detail: 'Tesseract v5.3.4 LSTM — English + Devanagari — 91.0% confidence' },
      { step: 'Fraud Analysis (ELA)', duration: '3.8s', status: 'complete', detail: 'Error Level Analysis — date field + seal region flagged' },
      { step: 'Signature Analysis', duration: '3.2s', status: 'complete', detail: 'Pressure profile extraction — Witness 2 anomaly detected' },
      { step: 'Hash Verification', duration: '0.2s', status: 'complete', detail: 'SHA-256: c9f5e0a4d3b6...a1c3e5d7b9f2 — logged to chain' },
    ],
  },
  'Shipping_Manifest_SGE1847': {
    ocrText: `SHIPPING MANIFEST — BILL OF LADING
═══════════════════════════════════════
Vessel: MV Sagarmala Express
Voyage No: SGE-2025-1847
Port of Loading: JNPT, Nhava Sheva
Port of Discharge: Colombo, Sri Lanka
Date of Sailing: 22/12/2025

Container       Contents              Declared Value
───────────────────────────────────────────────────
SGEU-7734291   Electronics — Mobiles   ₹4,80,00,000
               (Samsung, Apple) 12k units
SGEU-7734292   Textiles — Raw Silk     ₹1,20,00,000

Total FOB Value: ₹6,00,00,000
INSURANCE: United India Insurance
Policy: MAR/2025/JN/004821
Sum Insured: ₹7,20,00,000`,
    ocrConfidence: 0.93,
    fraudScore: 78,
    elaScore: 74,
    isFraudulent: true,
    language: 'English',
    documentType: 'Shipping Manifest / Bill of Lading',
    analysisNotes: `[CRITICAL — VALUE INFLATION DETECTED]
The declared value for Container SGEU-7734291 shows significant ELA discrepancy. Pixel analysis indicates the original amount was ₹1,80,00,000 — digitally altered to ₹4,80,00,000 (2.67× inflation).

Key findings:
• The digit "4" in "₹4,80,00,000" has a different anti-aliasing profile than surrounding numerals — consistent with digit replacement
• Ghost pixel residue shows faint traces of the original digit "1" beneath the current "4" at 16x magnification
• Font metrics: the replacement digit is 0.4px wider than the original typeface baseline — OpenType hinting mismatch
• The insurance claim amount (₹5,40,00,000) filed on 28/12 significantly exceeds actual cargo value
• Cross-reference: IMD weather data for 25-28 Dec 2025 near Lakshadweep shows Beaufort Scale 3-4 (moderate) — NOT severe weather

Fraud pattern: Classic cargo value inflation → insurance overclaim scheme. The manifest was altered before customs filing, then the inflated values were used as the basis for the insurance claim. The customs declaration itself was prepared using the already-falsified manifest.

Combined fraud exposure: ₹3,00,00,000+ (difference between real and claimed value)`,
    edgeAnalysis: {
      tearPattern: 'Torn vertically — left portion; clean right edge',
      matchPotential: 'High (82%) — connects to insurance certificate fragment',
      shredType: 'Strip-cut shredder (6mm)',
      paperGSM: '~80 GSM (commercial printing paper)',
    },
    processingSteps: [
      { step: 'Document Ingestion', duration: '0.3s', status: 'complete', detail: 'SVG parsed, rasterized at 300 DPI (1680×1320 px)' },
      { step: 'Pre-processing', duration: '0.8s', status: 'complete', detail: 'Binarization, table structure detection, cell segmentation' },
      { step: 'OCR Extraction', duration: '2.5s', status: 'complete', detail: 'Tesseract v5.3.4 LSTM — 93.1% confidence — table OCR mode' },
      { step: 'Fraud Analysis (ELA)', duration: '4.5s', status: 'complete', detail: 'Multi-level ELA — digit replacement in value column FLAGGED' },
      { step: 'Ghost Pixel Analysis', duration: '2.1s', status: 'complete', detail: 'Residual digit trace detection — original "1" recovered under "4"' },
      { step: 'Hash Verification', duration: '0.2s', status: 'complete', detail: 'SHA-256: d0a6f1b5e4c7...d2f4e6b8c1a3 — logged to chain' },
    ],
  },
  'FIR_487_1987_Tripathi_Homicide': {
    ocrText: `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

District: Lucknow     P.S.: Hazratganj
FIR No: 487/1987      Date: 14/11/1987
Act & Sections: IPC 302, 201, 120B

Complainant: Smt. Parvati Devi
Relation to Victim: Wife

BRIEF FACTS:
On the night of November 13, 1987, at approx. 23:30 hrs,
my husband Shri Ramesh Chandra Tripathi (age 42) left our
residence at 18, Gokhale Marg stating he had an urgent
business meeting. He did not return.

His body was found the next morning near Gomti Nagar bridge
by morning walkers at 06:15 hours.

POST-MORTEM: Ligature mark (18cm×2cm), temple abrasion,
wrist bruising. Cause: Asphyxia due to strangulation.
Opinion: Homicidal.

IO: SI Harnam Singh, PS Hazratganj`,
    ocrConfidence: 0.82,
    fraudScore: 28,
    elaScore: 25,
    isFraudulent: false,
    language: 'English + Hindi (headers)',
    documentType: 'Police FIR — Historical (1987)',
    analysisNotes: `[AUTHENTIC — HISTORICAL DOCUMENT]
Document shows authentic aging patterns consistent with 1987-era paper stock. The yellowing, foxing marks, and ink degradation are natural and uniform across the entire surface.

Detailed findings:
• Paper analysis: yellowing consistent with ~38 years of aging at room temperature. Foxing spots (iron oxide) naturally distributed — NOT simulated.
• Ink analysis: ballpoint pen ink shows expected fading curve for 1987 vintage (estimated Bic Cristal or equivalent). No UV fluorescence anomalies.
• FIR number stamp area: minor ELA variance (Δ = 1.4σ) is consistent with rubber stamp-pad impression overlap — NOT tampering.
• Typewriter characteristics: consistent with Godrej Prima typewriter (standard issue UP Police 1985-1992). Ribbon wear patterns match expected usage.
• The document has been well-preserved in police archives — photocopy artifacts suggest this is a 2nd generation copy from the original.

Historical note: FIR references IPC 302 (murder), 201 (destruction of evidence), and 120B (criminal conspiracy). Case was marked unsolved in 1989. Reopened by Lucknow HC order dated Nov 2025 for modern forensic re-examination.

Evidence grade: A (authentic, no tampering)`,
    edgeAnalysis: {
      tearPattern: 'Aged fold marks; some edge crumbling from paper degradation',
      matchPotential: 'Medium (65%) — connects to supplementary witness statement',
      shredType: 'Not shredded — naturally aged with fold damage',
      paperGSM: '~70 GSM (government issue, 1980s stock)',
    },
    processingSteps: [
      { step: 'Document Ingestion', duration: '0.5s', status: 'complete', detail: 'SVG parsed, rasterized at 300 DPI — aged document mode enabled' },
      { step: 'Pre-processing', duration: '1.8s', status: 'complete', detail: 'Adaptive binarization (Sauvola), heavy deskew (+5.2°), stain removal' },
      { step: 'OCR Extraction', duration: '4.1s', status: 'complete', detail: 'Tesseract v5.3.4 LSTM — degraded document model — 82.3% confidence' },
      { step: 'Fraud Analysis (ELA)', duration: '2.9s', status: 'complete', detail: 'Error Level Analysis — no anomalies — document appears authentic' },
      { step: 'Document Age Estimation', duration: '1.6s', status: 'complete', detail: 'Paper aging model: ~37-39 years (consistent with 1987 date)' },
      { step: 'Hash Verification', duration: '0.2s', status: 'complete', detail: 'SHA-256: e1b7a2c6f5d8...c8d0f2b4 — logged to chain' },
    ],
  },
};

/**
 * Look up detailed scan metadata for a filename.
 * Returns null if the file doesn't match any known sample.
 */
export function getDetailedScanForFile(filename) {
  const base = filename.replace(/\.[^.]+$/, ''); // strip extension
  for (const key of Object.keys(DETAILED_SCAN_RESULTS)) {
    if (base.includes(key) || key.includes(base)) {
      return DETAILED_SCAN_RESULTS[key];
    }
  }
  return null;
}
