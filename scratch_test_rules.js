/**
 * EXACT PRODUCTION LOGIN FLOW TEST
 * Tests every Firestore operation that happens during login
 * with the REAL scenario: user doc exists with real Google UID, no mapping yet
 */
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, getDoc, getDocs, updateDoc, setDoc, writeBatch, query, collection, where } from 'firebase/firestore';

const REAL_UID   = "google-superadmin-real-uid-12345";
const REAL_EMAIL = "rbashir491@gmail.com";
const DOC_ID     = "auto_generated_user_doc_id";

async function runTest() {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-no-project",
    firestore: { host: "127.0.0.1", port: 8080, rules }
  });

  // --- SETUP: Create user doc with REAL Google UID already bound ---
  console.log("=".repeat(60));
  console.log("SETUP: Creating production-like user doc with real UID...");
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', DOC_ID), {
      email:    REAL_EMAIL,
      role:     "super_admin",
      isActive: true,
      uid:      REAL_UID,  // <-- real UID already bound
      name:     "Super Admin"
      // NO schoolId field -- super admin doesn't have one
    });
  });
  console.log(`Created users/${DOC_ID} with uid=${REAL_UID}, email=${REAL_EMAIL}`);
  console.log("NOTE: No user_mappings document exists yet (simulates first login after UID bind)");
  console.log("=".repeat(60));

  // Create authenticated context
  const userCtx = testEnv.authenticatedContext(REAL_UID, { email: REAL_EMAIL });
  const db = userCtx.firestore();

  // ===================================================
  // TEST 1: getUser() — LIST query by uid field
  // This is the FIRST call in AuthContext.checkUserStatus
  // ===================================================
  console.log("\nTEST 1: getUser() — query(users, where('uid', '==', uid))");
  console.log(`  REQUEST: GET /users where uid == "${REAL_UID}"`);
  try {
    const q = query(collection(db, 'users'), where('uid', '==', REAL_UID));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      console.log(`  RESULT:  ALLOW ✅`);
      console.log(`  docId:   ${snap.docs[0].id}`);
      console.log(`  uid:     ${data.uid}`);
      console.log(`  email:   ${data.email}`);
      console.log(`  role:    ${data.role}`);
      console.log(`  isActive:${data.isActive}`);
    } else {
      console.log("  RESULT:  ALLOW ✅ (query succeeded but empty — doc not found)");
    }
  } catch (err) {
    console.error(`  RESULT:  DENY ❌`);
    console.error(`  ERROR:   ${err.message}`);
    console.error(`  REASON:  This is the root cause of the login failure!`);
  }

  // ===================================================
  // TEST 2: getUserByEmail() — LIST query by email field
  // This is the SECOND call if getUser() returns null
  // ===================================================
  console.log("\nTEST 2: getUserByEmail() — query(users, where('email', '==', email))");
  console.log(`  REQUEST: GET /users where email == "${REAL_EMAIL}"`);
  try {
    const q = query(collection(db, 'users'), where('email', '==', REAL_EMAIL));
    const snap = await getDocs(q);
    if (!snap.empty) {
      console.log(`  RESULT:  ALLOW ✅`);
      console.log(`  docId:   ${snap.docs[0].id}`);
    } else {
      console.log("  RESULT:  ALLOW ✅ (query succeeded but empty)");
    }
  } catch (err) {
    console.error(`  RESULT:  DENY ❌`);
    console.error(`  ERROR:   ${err.message}`);
    console.error(`  REASON:  getUserByEmail() is being blocked by rules!`);
  }

  // ===================================================
  // TEST 3: syncUserMapping() — setDoc to user_mappings/{uid}
  // This runs on EVERY login (else branch in AuthContext)
  // user_mappings does NOT exist yet → circular dependency test
  // ===================================================
  console.log("\nTEST 3: syncUserMapping() — setDoc user_mappings/{uid} (no mapping exists yet)");
  console.log(`  REQUEST: SET /user_mappings/${REAL_UID}`);
  console.log(`  PAYLOAD: { docId: "${DOC_ID}", role: "super_admin", schoolId: null, isActive: true }`);
  try {
    await setDoc(doc(db, 'user_mappings', REAL_UID), {
      docId:    DOC_ID,
      role:     "super_admin",
      schoolId: null,
      isActive: true
    }, { merge: true });
    console.log(`  RESULT:  ALLOW ✅ — No circular dependency!`);
  } catch (err) {
    console.error(`  RESULT:  DENY ❌ — CIRCULAR DEPENDENCY CONFIRMED!`);
    console.error(`  ERROR:   ${err.message}`);
    console.error(`  REASON:  isSuperAdmin() requires user_mappings to exist.`);
    console.error(`           syncUserMapping() tries to CREATE user_mappings.`);
    console.error(`           → This is the root cause.`);
  }

  // ===================================================
  // TEST 4: getDoc directly on user document (not query)
  // ===================================================
  console.log("\nTEST 4: getDoc(users/DOC_ID) — direct document read");
  console.log(`  REQUEST: GET /users/${DOC_ID}`);
  try {
    const snap = await getDoc(doc(db, 'users', DOC_ID));
    console.log(`  RESULT:  ALLOW ✅ — doc exists: ${snap.exists()}`);
  } catch (err) {
    console.error(`  RESULT:  DENY ❌`);
    console.error(`  ERROR:   ${err.message}`);
  }

  // ===================================================
  // TEST 5: updateDoc users/{DOC_ID} — UID binding Case 2
  // ===================================================
  console.log("\nTEST 5: updateUserByDocId — updateDoc(users/DOC_ID, {uid, name, photoUrl})");
  console.log(`  REQUEST: UPDATE /users/${DOC_ID}`);
  console.log(`  PAYLOAD: { uid: "${REAL_UID}", name: "Super Admin", photoUrl: "" }`);
  try {
    await updateDoc(doc(db, 'users', DOC_ID), {
      uid: REAL_UID,
      name: "Super Admin",
      photoUrl: ""
    });
    console.log(`  RESULT:  ALLOW ✅`);
  } catch (err) {
    console.error(`  RESULT:  DENY ❌`);
    console.error(`  ERROR:   ${err.message}`);
  }

  // ===================================================
  // TEST 6: After mapping exists, createSchoolWithPrincipal
  // ===================================================
  console.log("\nTEST 6: createSchoolWithPrincipal — batch write (after mapping exists)");
  console.log(`  REQUEST: BATCH SET /schools/school123 + /users/principal123`);
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'schools', 'school123'), {
      id: 'school123', name: 'Test School', principalId: 'temp-uid',
      planName: 'Basic', planExpiry: new Date().toISOString(), isActive: true
    });
    batch.set(doc(db, 'users', 'principal123'), {
      uid: 'temp-principal-uid', email: 'principal@test.com',
      name: 'Principal', role: 'principal', schoolId: 'school123', isActive: true
    });
    await batch.commit();
    console.log(`  RESULT:  ALLOW ✅`);
  } catch (err) {
    console.error(`  RESULT:  DENY ❌`);
    console.error(`  ERROR:   ${err.message}`);
  }

  // ===================================================
  // TEST 7: getSchool() — after mapping exists
  // ===================================================
  console.log("\nTEST 7: getSchool() — getDoc(schools/school123) (after mapping exists)");
  try {
    const snap = await getDoc(doc(db, 'schools', 'school123'));
    console.log(`  RESULT:  ALLOW ✅ — doc exists: ${snap.exists()}`);
  } catch (err) {
    console.error(`  RESULT:  DENY ❌`);
    console.error(`  ERROR:   ${err.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST RUN COMPLETE");
  console.log("=".repeat(60));

  await testEnv.cleanup();
}

runTest().catch(console.error);
