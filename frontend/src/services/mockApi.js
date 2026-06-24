// ============================================================================
// Mock API Service — Simulates backend calls with realistic delays
// ============================================================================
import {
  MOCK_CASES,
  MOCK_FRAGMENTS,
  ALL_FRAGMENTS,
  MOCK_MATCHES,
  MOCK_ALERTS,
  MOCK_AUDIT_LOG,
  MOCK_NOTIFICATIONS,
  getFragmentThumbnail,
} from '../data/mockData';
import { getDetailedScanForFile } from '../data/sampleFragments';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => delay(300 + Math.random() * 700);

// ---- Cases ----
export const getCases = async () => {
  await randomDelay();
  return [...MOCK_CASES];
};

export const getCaseById = async (id) => {
  await randomDelay();
  const found = MOCK_CASES.find((c) => c._id === id);
  if (!found) throw new Error('Case not found');
  return { ...found };
};

export const createCase = async (caseData) => {
  await delay(800);
  const newCase = {
    _id: `case_${Date.now().toString(36)}`,
    caseId: `FRN-2026-${String(MOCK_CASES.length + 1).padStart(3, '0')}`,
    ...caseData,
    status: 'Open',
    fragmentCount: 0,
    reconstructionProgress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_CASES.push(newCase);
  return { ...newCase };
};

// Flatten fragment metadata into top-level fields for easier consumption
const _ocrCache = {};
const flattenFragment = (f) => {
  if (!_ocrCache[f._id]) {
    // Generate a stable ocrConfidence based on fragment id hash
    let hash = 0;
    for (let i = 0; i < f._id.length; i++) hash = ((hash << 5) - hash + f._id.charCodeAt(i)) | 0;
    _ocrCache[f._id] = 0.55 + (Math.abs(hash) % 400) / 1000;
  }
  return {
    ...f,
    fraudScore: f.metadata?.fraudScore ?? 0,
    ocrText: f.metadata?.ocrText ?? '',
    ocrConfidence: f.metadata?.ocrText ? _ocrCache[f._id] : 0,
    elaScore: (f.metadata?.elaScore ?? 0) / 100,
    analysisNotes: f.metadata?.analysisNotes ?? '',
    label: f.features?.textFragments?.[0] || f.fragmentId?.slice(-4) || 'F',
    status: f.metadata?.isFraudulent ? 'Flagged' : 'Analyzed',
    scanDetails: f.scanDetails || null,
    thumbnail: f.thumbnail || null,
  };
};

// ---- Fragments ----
export const getFragmentsByCase = async (caseId) => {
  await randomDelay();
  return (MOCK_FRAGMENTS[caseId] || []).map(flattenFragment);
};

export const getAllFragments = async () => {
  await randomDelay();
  return ALL_FRAGMENTS.map(flattenFragment);
};

export const uploadFragments = async (caseId, files, onProgress) => {
  // Simulate multi-stage processing with granular progress
  const total = files.length;
  const stagesPerFile = 6; // matches processingSteps length
  const totalSteps = total * stagesPerFile;
  let completed = 0;

  for (let i = 0; i < total; i++) {
    for (let s = 0; s < stagesPerFile; s++) {
      await delay(200 + Math.random() * 400);
      completed++;
      if (onProgress) {
        onProgress(Math.min(Math.round((completed / totalSteps) * 95), 95));
      }
    }
  }

  // Create mock fragments — use detailed results if file matches a known sample
  // Create persistent thumbnails from uploaded files
  const newFragments = files.map((f, idx) => {
    // Generate a persistent thumbnail: use preview blob URL or SVG thumbnail for known samples
    const fileThumbnail = f.preview || (f.file && f.file.type && f.file.type.startsWith('image/') ? URL.createObjectURL(f.file) : null) || getFragmentThumbnail(f.name);
    const detailed = getDetailedScanForFile(f.name);
    const fraudScore = detailed ? detailed.fraudScore : Math.floor(Math.random() * 100);
    const ocrConf = detailed ? detailed.ocrConfidence : (0.55 + Math.random() * 0.4);

    const genericOcrTexts = [
      'Document fragment analysis pending. Preliminary scan indicates partial text recovery. Further processing required for complete OCR extraction.',
      `Recovered text: "...pursuant to Section ${Math.floor(10 + Math.random() * 400)} of the Act, the undersigned hereby certifies..." [Fragment edges degraded — confidence: ${(60 + Math.random() * 35).toFixed(1)}%]`,
      `Partial header detected: "${f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')}"\nBody text partially legible. Ink degradation noted in lower quadrant. Estimated recovery: ${Math.floor(40 + Math.random() * 50)}%.`,
    ];

    const frag = {
      _id: `frg_new_${Date.now()}_${idx}`,
      fragmentId: `FRG-${Date.now()}-${Math.random().toFixed(4).slice(2)}`,
      caseId,
      originalName: f.name,
      storagePath: `uploads/${f.name}`,
      mimeType: f.type || 'image/svg+xml',
      position: { x: idx * 200, y: 0, rotation: Math.floor(Math.random() * 10) - 5 },
      features: {
        edgeGeometry: Array.from({ length: 4 }, () => Math.floor(Math.random() * 100)),
        textFragments: [],
        averageColor: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      },
      metadata: {
        fraudScore,
        isFraudulent: fraudScore > 50,
        ocrText: detailed ? detailed.ocrText : genericOcrTexts[Math.floor(Math.random() * genericOcrTexts.length)],
        elaScore: detailed ? detailed.elaScore : Math.floor(Math.random() * 100),
        analysisNotes: detailed ? detailed.analysisNotes : (
          fraudScore > 50
          ? 'ELA analysis detected compression inconsistencies in multiple regions. Elevated brightness variance suggests possible digital modification. Manual review recommended.'
          : 'No significant anomalies detected. Compression patterns are consistent throughout the fragment. Document appears authentic.'
        ),
      },
      matchedWith: [],
      matchScores: {},
      thumbnail: fileThumbnail || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Extended scan data (only for known samples)
      ...(detailed ? {
        scanDetails: {
          documentType: detailed.documentType,
          language: detailed.language,
          edgeAnalysis: detailed.edgeAnalysis,
          processingSteps: detailed.processingSteps,
        },
      } : {
        scanDetails: {
          documentType: 'Unknown — Generic Fragment',
          language: 'English (detected)',
          edgeAnalysis: {
            tearPattern: 'Irregular edges detected',
            matchPotential: `${Math.floor(30 + Math.random() * 60)}% — edge features extracted`,
            shredType: 'Undetermined',
            paperGSM: `~${Math.floor(70 + Math.random() * 40)} GSM`,
          },
          processingSteps: [
            { step: 'Document Ingestion', duration: `${(0.2 + Math.random() * 0.5).toFixed(1)}s`, status: 'complete', detail: 'Image parsed, color profile normalized' },
            { step: 'Pre-processing', duration: `${(0.5 + Math.random() * 1).toFixed(1)}s`, status: 'complete', detail: 'Binarization, deskew, noise reduction' },
            { step: 'OCR Extraction', duration: `${(1 + Math.random() * 3).toFixed(1)}s`, status: 'complete', detail: `Tesseract v5.3.4 — ${(ocrConf * 100).toFixed(1)}% confidence` },
            { step: 'Fraud Analysis (ELA)', duration: `${(1.5 + Math.random() * 3).toFixed(1)}s`, status: 'complete', detail: fraudScore > 50 ? 'Anomalies detected — review recommended' : 'No significant anomalies' },
            { step: 'Edge Feature Extraction', duration: `${(0.5 + Math.random() * 1.5).toFixed(1)}s`, status: 'complete', detail: '128-dim feature vector generated' },
            { step: 'Hash Verification', duration: '0.2s', status: 'complete', detail: `SHA-256: ${Array.from({length: 8}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('')}... — logged` },
          ],
        },
      }),
    };
    return frag;
  });

  // Add to mock store
  if (!MOCK_FRAGMENTS[caseId]) MOCK_FRAGMENTS[caseId] = [];
  MOCK_FRAGMENTS[caseId].push(...newFragments);

  // Update case fragment count
  const caseObj = MOCK_CASES.find((c) => c._id === caseId);
  if (caseObj) {
    caseObj.fragmentCount += newFragments.length;
    caseObj.updatedAt = new Date().toISOString();
  }

  if (onProgress) onProgress(100);
  await delay(300);

  return { fragments: newFragments.map(flattenFragment), message: 'Evidence logged successfully' };
};

// ---- Matching ----
export const getMatchesByCase = async (caseId) => {
  await delay(500 + Math.random() * 500);
  const raw = MOCK_MATCHES[caseId] || { totalFragments: 0, matchedPairs: [], assemblyGroups: [], overallProgress: 0 };
  // Normalize to what pages expect
  const pairs = (raw.matchedPairs || []).map((p, i) => ({
    _id: `match_${caseId}_${i}`,
    fragmentA: p.fragmentA,
    fragmentB: p.fragmentB,
    confidence: p.confidence,
    status: p.status === 'pending_review' ? 'pending' : p.status,
    matchType: Array.isArray(p.matchType) ? p.matchType : [p.matchType],
    description: p.description,
  }));
  const assemblyGroups = (raw.assemblyGroups || []).map((g) => ({
    groupId: g.groupId,
    name: g.label,
    fragmentIds: g.fragments,
    progress: g.confidence,
  }));
  return { pairs, assemblyGroups };
};

export const runAutoMatch = async (caseId) => {
  // Simulate AI matching process with progressive updates
  await delay(2000 + Math.random() * 2000);
  const raw = MOCK_MATCHES[caseId] || { totalFragments: 0, matchedPairs: [], assemblyGroups: [], overallProgress: 0 };
  const pairs = (raw.matchedPairs || []).map((p, i) => ({
    _id: `match_${caseId}_${i}`,
    fragmentA: p.fragmentA,
    fragmentB: p.fragmentB,
    confidence: p.confidence,
    status: p.status === 'pending_review' ? 'pending' : p.status,
    matchType: Array.isArray(p.matchType) ? p.matchType : [p.matchType],
    description: p.description,
  }));
  const assemblyGroups = (raw.assemblyGroups || []).map((g) => ({
    groupId: g.groupId,
    name: g.label,
    fragmentIds: g.fragments,
    progress: g.confidence,
  }));
  return { pairs, assemblyGroups };
};

export const confirmMatch = async (matchId) => {
  await delay(500);
  return { success: true, matchId, status: 'confirmed' };
};

export const rejectMatch = async (matchId) => {
  await delay(500);
  return { success: true, matchId, status: 'rejected' };
};

// ---- Alerts & Notifications ----
export const getAlerts = async () => {
  await delay(200);
  return [...MOCK_ALERTS];
};

export const getNotifications = async () => {
  await delay(200);
  return [...MOCK_NOTIFICATIONS];
};

export const markNotificationRead = async (id) => {
  const n = MOCK_NOTIFICATIONS.find((n) => n.id === id);
  if (n) n.read = true;
  return { success: true };
};

// ---- Audit Log ----
export const getAuditLog = async () => {
  await randomDelay();
  return [...MOCK_AUDIT_LOG];
};

// ---- Stats (computed from mock data) ----
export const getDashboardStats = async () => {
  await randomDelay();
  const totalFragments = ALL_FRAGMENTS.length;
  const analyzedFragments = ALL_FRAGMENTS.filter((f) => f.metadata?.fraudScore !== undefined).length;
  const fraudDetected = ALL_FRAGMENTS.filter((f) => f.metadata?.isFraudulent).length;
  const activeCases = MOCK_CASES.filter((c) => c.status !== 'Completed').length;
  const avgReconstruction = MOCK_CASES.reduce((s, c) => s + c.reconstructionProgress, 0) / MOCK_CASES.length;

  return {
    activeCases,
    totalCases: MOCK_CASES.length,
    fragmentsAnalyzed: analyzedFragments,
    totalFragments,
    fraudDetected,
    successRate: ((analyzedFragments - fraudDetected) / analyzedFragments * 100).toFixed(1),
    avgReconstruction: avgReconstruction.toFixed(0),
    systemLoad: (8 + Math.random() * 15).toFixed(0),
  };
};
