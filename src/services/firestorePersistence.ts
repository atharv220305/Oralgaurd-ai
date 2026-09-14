/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firestore Persistence Service for Patient Profiles & Assessment History
 *
 * Implements optimistic local caching + durable Cloud Firestore persistence so
 * patient data, active symptoms, oral map locations, and risk assessment outcomes
 * survive browser refreshes and session restarts.
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PatientProfile, AssessmentResult } from '../types';

const PATIENT_ID_STORAGE_KEY = 'oralguard_active_patient_id_v2';
const LOCAL_PROFILE_BACKUP_KEY = 'oralguard_profile_backup_v2';
const LOCAL_ASSESSMENT_BACKUP_KEY = 'oralguard_assessment_backup_v2';

/**
 * Gets existing persistent patient ID or generates a stable anonymous UUID
 */
export function getOrCreatePatientId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'demo-patient-default';
  }

  let id = localStorage.getItem(PATIENT_ID_STORAGE_KEY);
  if (!id) {
    id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(PATIENT_ID_STORAGE_KEY, id);
  }
  return id;
}

/**
 * Sanitizes an object for Firestore by converting undefined values to null or omitting them
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, v) => (v === undefined ? null : v)));
}

/**
 * Persists the current patient profile and latest risk assessment to Firestore
 * and local cache simultaneously (optimistic update).
 */
export async function syncPatientToFirestore(
  patientId: string,
  profile: PatientProfile,
  latestAssessment?: AssessmentResult | null
): Promise<void> {
  // 1. Optimistic Local Storage Backup
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_PROFILE_BACKUP_KEY, JSON.stringify(profile));
      if (latestAssessment) {
        localStorage.setItem(LOCAL_ASSESSMENT_BACKUP_KEY, JSON.stringify(latestAssessment));
      }
    } catch {
      // Ignore local storage quota limits
    }
  }

  // 2. Cloud Firestore Persistence
  try {
    const patientDocRef = doc(db, 'patients', patientId);
    const payload: Record<string, any> = {
      patientId,
      profile: sanitizeForFirestore(profile),
      updatedAt: serverTimestamp(),
    };

    if (latestAssessment) {
      payload.latestAssessment = sanitizeForFirestore(latestAssessment);
    }

    await setDoc(patientDocRef, payload, { merge: true });

    // If assessment result was provided, also append to history subcollection
    if (latestAssessment) {
      const historySubcollection = collection(db, 'patients', patientId, 'assessments');
      await addDoc(historySubcollection, {
        assessment: sanitizeForFirestore(latestAssessment),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn('Firestore sync failed, stored in local cache instead:', error);
  }
}

/**
 * Loads patient profile and latest assessment from Cloud Firestore on app init
 */
export async function loadPatientFromFirestore(
  patientId: string
): Promise<{ profile: PatientProfile | null; latestAssessment: AssessmentResult | null }> {
  try {
    const patientDocRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(patientDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        profile: (data.profile as PatientProfile) || null,
        latestAssessment: (data.latestAssessment as AssessmentResult) || null,
      };
    }
  } catch (error) {
    console.warn('Could not read from Firestore, falling back to local cache:', error);
  }

  // Fallback to local storage cache if network is unavailable
  let cachedProfile: PatientProfile | null = null;
  let cachedAssessment: AssessmentResult | null = null;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const p = localStorage.getItem(LOCAL_PROFILE_BACKUP_KEY);
      if (p) cachedProfile = JSON.parse(p);
      const a = localStorage.getItem(LOCAL_ASSESSMENT_BACKUP_KEY);
      if (a) cachedAssessment = JSON.parse(a);
    } catch {
      // Ignore JSON parse errors
    }
  }

  return {
    profile: cachedProfile,
    latestAssessment: cachedAssessment,
  };
}

/**
 * Fetches assessment history list for the patient from Firestore
 */
export async function loadAssessmentHistory(
  patientId: string
): Promise<Array<{ id: string; assessment: AssessmentResult; createdAt: any }>> {
  try {
    const historyRef = collection(db, 'patients', patientId, 'assessments');
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(15));
    const snapshot = await getDocs(q);

    const history: Array<{ id: string; assessment: AssessmentResult; createdAt: any }> = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.assessment) {
        history.push({
          id: d.id,
          assessment: data.assessment as AssessmentResult,
          createdAt: data.createdAt,
        });
      }
    });

    return history;
  } catch (error) {
    console.warn('Could not fetch assessment history from Firestore:', error);
    return [];
  }
}

/**
 * Resets the patient session state (clears local cache and creates a fresh patientId)
 */
export function resetLocalPatientSession(): void {
  if (typeof window !== 'undefined') {
    if (window.sessionStorage) {
      sessionStorage.removeItem('oralguard_persistent_screening_session_v2');
    }
    if (window.localStorage) {
      localStorage.removeItem(LOCAL_PROFILE_BACKUP_KEY);
      localStorage.removeItem(LOCAL_ASSESSMENT_BACKUP_KEY);
      // Generate a fresh ID for next screening session
      localStorage.setItem(
        PATIENT_ID_STORAGE_KEY,
        `pt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      );
    }
  }
}
