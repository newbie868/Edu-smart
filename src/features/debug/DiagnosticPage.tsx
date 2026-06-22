/**
 * PRODUCTION DIAGNOSTIC PAGE
 * 
 * Runs every Firestore operation that occurs during login
 * and shows the exact result (ALLOW / DENY + error code + stack)
 * directly in the browser UI. No DevTools needed.
 *
 * Route: append ?debug=1 to URL, or navigate to /debug
 */

import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../../config/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, writeBatch
} from 'firebase/firestore';

interface StepResult {
  id: string;
  label: string;
  operation: string;
  path: string;
  payload?: any;
  status: 'pending' | 'running' | 'allow' | 'deny' | 'skip';
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  result?: any;
  durationMs?: number;
}

const DiagnosticPage: React.FC = () => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);
  const [loginRunning, setLoginRunning] = useState(false);

  const updateStep = (id: string, patch: Partial<StepResult>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addStep = (step: StepResult) => {
    setSteps(prev => [...prev, step]);
  };

  const runOperation = async (
    id: string,
    label: string,
    operation: string,
    path: string,
    payload: any,
    fn: () => Promise<any>
  ): Promise<any> => {
    const step: StepResult = { id, label, operation, path, payload, status: 'running' };
    setSteps(prev => [...prev, step]);
    const t0 = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - t0;
      setSteps(prev => prev.map(s => s.id === id ? {
        ...s, status: 'allow', durationMs,
        result: result === undefined ? 'void (success)' : 
          (typeof result === 'object' && result !== null && 'exists' in result) 
            ? `exists=${result.exists()}, data=${JSON.stringify(result.exists() ? result.data() : null)}`
            : JSON.stringify(result)
      } : s));
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - t0;
      setSteps(prev => prev.map(s => s.id === id ? {
        ...s, status: 'deny', durationMs,
        error: {
          code: err.code || 'unknown',
          message: err.message || String(err),
          stack: err.stack
        }
      } : s));
      return null; // don't rethrow, continue tracing
    }
  };

  const doLogin = async () => {
    setLoginRunning(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setAuthUser(result.user);
    } catch (err: any) {
      alert('Google login failed: ' + err.message);
    } finally {
      setLoginRunning(false);
    }
  };

  const doLogout = async () => {
    await signOut(auth);
    setAuthUser(null);
    setSteps([]);
  };

  const runDiagnostics = async () => {
    if (!authUser) { alert('Login first'); return; }
    setSteps([]);
    setRunning(true);

    const uid   = authUser.uid;
    const email = authUser.email?.toLowerCase() || '';
    const name  = authUser.displayName || 'User';

    // ─────────────────────────────────────────────────────────────
    // STEP 0: Auth info
    // ─────────────────────────────────────────────────────────────
    addStep({
      id: 'auth_info', label: 'Auth State', operation: 'auth', path: 'n/a',
      status: 'allow',
      result: JSON.stringify({ uid, email, name, emailVerified: authUser.emailVerified })
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 1: getUser(uid) — query users where uid == auth.uid
    // ─────────────────────────────────────────────────────────────
    const getUserSnap = await runOperation(
      'get_user', 'getUser(uid)', 'LIST QUERY',
      `users WHERE uid == "${uid}"`,
      null,
      () => getDocs(query(collection(db, 'users'), where('uid', '==', uid)))
    );

    let profile: any = null;
    let docId: string | null = null;

    if (getUserSnap && !getUserSnap.empty) {
      docId = getUserSnap.docs[0].id;
      profile = { docId, ...getUserSnap.docs[0].data() };
      updateStep('get_user', { result: `FOUND — docId=${docId}, data=${JSON.stringify(profile)}` });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: getUserByEmail(email) — only if getUser returned null
    // ─────────────────────────────────────────────────────────────
    if (!profile) {
      const getEmailSnap = await runOperation(
        'get_user_email', 'getUserByEmail(email)', 'LIST QUERY',
        `users WHERE email == "${email}"`,
        null,
        () => getDocs(query(collection(db, 'users'), where('email', '==', email)))
      );

      if (getEmailSnap && !getEmailSnap.empty) {
        docId = getEmailSnap.docs[0].id;
        profile = { docId, ...getEmailSnap.docs[0].data() };
        updateStep('get_user_email', { result: `FOUND — docId=${docId}, data=${JSON.stringify(profile)}` });
      } else if (getEmailSnap) {
        updateStep('get_user_email', { result: 'NOT FOUND — email not in users collection' });
      }

      if (profile) {
        // ─────────────────────────────────────────────────────────
        // STEP 3: getDoc(users/docId) — inside updateUserByDocId
        // ─────────────────────────────────────────────────────────
        const docSnap = await runOperation(
          'get_doc', 'getDoc(users/docId) inside updateUserByDocId', 'GET',
          `users/${docId}`,
          null,
          () => getDoc(doc(db, 'users', docId!))
        );

        // ─────────────────────────────────────────────────────────
        // STEP 4: updateDoc(users/docId, {uid, name, photoUrl})
        //         Case 2 UID binding
        // ─────────────────────────────────────────────────────────
        const updatePayload = { uid, name, photoUrl: authUser.photoURL || '' };
        await runOperation(
          'update_uid', 'updateDoc(users/docId, {uid, name, photoUrl}) — UID binding', 'UPDATE',
          `users/${docId}`,
          updatePayload,
          () => updateDoc(doc(db, 'users', docId!), updatePayload)
        );

        // merge profile with new data
        if (docSnap && docSnap.exists()) {
          profile = { ...profile, ...docSnap.data(), ...updatePayload };
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 5: syncUserMapping — setDoc user_mappings/{uid}
    //         This runs whether profile was found by uid or email
    // ─────────────────────────────────────────────────────────────
    if (profile && profile.uid && !String(profile.uid).startsWith('user-')) {
      const mappingPayload = {
        docId: profile.docId || docId,
        role: profile.role,
        schoolId: profile.schoolId || null,
        isActive: profile.isActive
      };
      await runOperation(
        'sync_mapping', 'setDoc(user_mappings/{uid}, ...) — syncUserMapping', 'SET',
        `user_mappings/${uid}`,
        mappingPayload,
        () => setDoc(doc(db, 'user_mappings', uid), mappingPayload, { merge: true })
      );
    } else {
      addStep({
        id: 'sync_mapping', label: 'syncUserMapping — SKIPPED', operation: 'SET',
        path: `user_mappings/${uid}`, status: 'skip',
        result: profile ? `uid="${profile.uid}" starts with "user-" — skipped` : 'profile is null — skipped'
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 6: Check user_mappings/{uid} now exists
    // ─────────────────────────────────────────────────────────────
    await runOperation(
      'check_mapping', 'getDoc(user_mappings/{uid}) — verify mapping exists', 'GET',
      `user_mappings/${uid}`,
      null,
      () => getDoc(doc(db, 'user_mappings', uid))
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 7: profile null check — would throw "not registered" error
    // ─────────────────────────────────────────────────────────────
    if (!profile) {
      addStep({
        id: 'null_check', label: 'Profile null check', operation: 'code check',
        path: 'AuthContext.tsx:108',
        status: 'deny',
        error: {
          code: 'access-denied-in-code',
          message: 'Profile is null — would throw: "Access Denied: Your email is not registered"'
        }
      });
    } else {
      addStep({
        id: 'null_check', label: 'Profile null check', operation: 'code check',
        path: 'AuthContext.tsx:108',
        status: 'allow',
        result: `profile.role="${profile.role}", profile.isActive=${profile.isActive}`
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 8: isActive check
    // ─────────────────────────────────────────────────────────────
    if (profile && !profile.isActive) {
      addStep({
        id: 'active_check', label: 'isActive check', operation: 'code check',
        path: 'AuthContext.tsx:113',
        status: 'deny',
        error: {
          code: 'account-deactivated-in-code',
          message: `profile.isActive=${profile.isActive} — would throw: "Your account has been deactivated"`
        }
      });
    } else if (profile) {
      addStep({
        id: 'active_check', label: 'isActive check', operation: 'code check',
        path: 'AuthContext.tsx:113',
        status: 'allow',
        result: `profile.isActive=${profile.isActive} — OK`
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 9: getSchool — only if profile.schoolId is set
    // ─────────────────────────────────────────────────────────────
    if (profile && profile.schoolId) {
      await runOperation(
        'get_school', 'getDoc(schools/{schoolId})', 'GET',
        `schools/${profile.schoolId}`,
        null,
        () => getDoc(doc(db, 'schools', profile.schoolId))
      );
    } else {
      addStep({
        id: 'get_school', label: 'getSchool — SKIPPED (super_admin has no schoolId)', 
        operation: 'GET', path: 'schools/—', status: 'skip',
        result: 'schoolId is null — skipped (super_admin)'
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 10: READ user_mappings/{uid} — verify role in mapping
    // ─────────────────────────────────────────────────────────────
    await runOperation(
      'read_mapping_final', 'getDoc(user_mappings/{uid}) — final state', 'GET',
      `user_mappings/${uid}`,
      null,
      () => getDoc(doc(db, 'user_mappings', uid))
    );

    setRunning(false);
  };

  const statusColor = (s: StepResult['status']) => ({
    pending: '#888',
    running: '#f59e0b',
    allow: '#10b981',
    deny: '#ef4444',
    skip: '#6366f1'
  })[s];

  const statusLabel = (s: StepResult['status']) => ({
    pending: '⏳ PENDING',
    running: '⏳ RUNNING',
    allow: '✅ ALLOW',
    deny: '❌ DENY',
    skip: '⏭️ SKIP'
  })[s];

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e2e8f0',
      fontFamily: 'monospace', padding: '24px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '8px' }}>
          🔍 Firestore Diagnostic — Production Login Trace
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '13px' }}>
          Runs every Firestore operation that occurs during login and shows exact ALLOW/DENY with error codes.
        </p>

        {/* Auth section */}
        <div style={{
          background: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>FIREBASE AUTH STATE</div>
          {authUser ? (
            <div>
              <div style={{ color: '#10b981', marginBottom: '4px' }}>✅ Signed in</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div><span style={{ color: '#64748b' }}>UID:   </span><span style={{ color: '#f1f5f9' }}>{authUser.uid}</span></div>
                <div><span style={{ color: '#64748b' }}>Email: </span><span style={{ color: '#f1f5f9' }}>{authUser.email}</span></div>
                <div><span style={{ color: '#64748b' }}>Name:  </span><span style={{ color: '#f1f5f9' }}>{authUser.displayName}</span></div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button onClick={runDiagnostics} disabled={running} style={{
                  background: running ? '#334155' : '#f59e0b', color: '#0a0a0a',
                  border: 'none', borderRadius: '6px', padding: '8px 16px',
                  cursor: running ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontFamily: 'monospace'
                }}>
                  {running ? '⏳ Running...' : '▶ Run Full Diagnostic'}
                </button>
                <button onClick={doLogout} style={{
                  background: '#334155', color: '#e2e8f0',
                  border: 'none', borderRadius: '6px', padding: '8px 16px',
                  cursor: 'pointer', fontFamily: 'monospace'
                }}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: '#ef4444', marginBottom: '12px' }}>❌ Not signed in</div>
              <button onClick={doLogin} disabled={loginRunning} style={{
                background: '#4285f4', color: '#fff',
                border: 'none', borderRadius: '6px', padding: '8px 20px',
                cursor: loginRunning ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontFamily: 'monospace'
              }}>
                {loginRunning ? '⏳ Signing in...' : '🔑 Sign In with Google'}
              </button>
            </div>
          )}
        </div>

        {/* Steps */}
        {steps.map((step, i) => (
          <div key={step.id} style={{
            background: '#1e293b', borderRadius: '8px', padding: '16px',
            marginBottom: '8px',
            borderLeft: `4px solid ${statusColor(step.status)}`,
            border: `1px solid ${statusColor(step.status)}33`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '2px' }}>
                  Step {i + 1} — {step.operation}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#e2e8f0', marginBottom: '4px' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  📁 {step.path}
                </div>
                {step.payload && (
                  <div style={{
                    fontSize: '11px', color: '#94a3b8', marginTop: '6px',
                    background: '#0f172a', borderRadius: '4px', padding: '6px 8px'
                  }}>
                    <div style={{ color: '#64748b', marginBottom: '2px' }}>PAYLOAD:</div>
                    {JSON.stringify(step.payload, null, 2)}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '12px', fontWeight: 'bold', color: statusColor(step.status),
                marginLeft: '12px', whiteSpace: 'nowrap'
              }}>
                {statusLabel(step.status)}
                {step.durationMs !== undefined && (
                  <span style={{ color: '#64748b', fontWeight: 'normal' }}> ({step.durationMs}ms)</span>
                )}
              </div>
            </div>

            {step.result && step.status !== 'deny' && (
              <div style={{
                marginTop: '8px', fontSize: '11px',
                background: '#0f172a', borderRadius: '4px', padding: '6px 8px',
                color: '#10b981', wordBreak: 'break-all'
              }}>
                <span style={{ color: '#64748b' }}>RESULT: </span>{step.result}
              </div>
            )}

            {step.error && (
              <div style={{
                marginTop: '8px', fontSize: '11px',
                background: '#1c0000', border: '1px solid #ef444433',
                borderRadius: '4px', padding: '8px'
              }}>
                <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '4px' }}>
                  ❌ ERROR CODE: {step.error.code}
                </div>
                <div style={{ color: '#fca5a5', marginBottom: '4px', wordBreak: 'break-all' }}>
                  MESSAGE: {step.error.message}
                </div>
                {step.error.stack && (
                  <details>
                    <summary style={{ color: '#64748b', cursor: 'pointer', fontSize: '11px' }}>
                      Stack trace
                    </summary>
                    <pre style={{
                      marginTop: '4px', color: '#94a3b8', fontSize: '10px',
                      overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap'
                    }}>
                      {step.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}

        {steps.length === 0 && authUser && !running && (
          <div style={{
            textAlign: 'center', padding: '48px', color: '#64748b',
            background: '#1e293b', borderRadius: '8px', border: '1px solid #334155'
          }}>
            Click "Run Full Diagnostic" to trace every Firestore operation
          </div>
        )}

        {/* Summary at end */}
        {!running && steps.length > 0 && (
          <div style={{
            background: '#1e293b', borderRadius: '8px', padding: '16px',
            marginTop: '16px', border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>SUMMARY</div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '20px' }}>
                  {steps.filter(s => s.status === 'allow').length}
                </span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>ALLOW</span>
              </div>
              <div>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '20px' }}>
                  {steps.filter(s => s.status === 'deny').length}
                </span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>DENY</span>
              </div>
              <div>
                <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '20px' }}>
                  {steps.filter(s => s.status === 'skip').length}
                </span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>SKIP</span>
              </div>
            </div>
            {steps.filter(s => s.status === 'deny').length > 0 && (
              <div style={{
                marginTop: '12px', padding: '8px',
                background: '#1c0000', border: '1px solid #ef4444',
                borderRadius: '4px', fontSize: '12px', color: '#fca5a5'
              }}>
                🔴 FIRST FAILURE: {steps.find(s => s.status === 'deny')?.label} — 
                Code: {steps.find(s => s.status === 'deny')?.error?.code} — 
                Path: {steps.find(s => s.status === 'deny')?.path}
              </div>
            )}
            {steps.filter(s => s.status === 'deny').length === 0 && (
              <div style={{
                marginTop: '12px', padding: '8px',
                background: '#001c08', border: '1px solid #10b981',
                borderRadius: '4px', fontSize: '12px', color: '#6ee7b7'
              }}>
                🟢 ALL OPERATIONS PASSED — If login still fails, the error is thrown by code logic, not Firestore.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticPage;
