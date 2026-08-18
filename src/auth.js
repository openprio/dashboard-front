import { firebaseAuth, onAuthStateChanged } from "./firebase";
import { writable } from "svelte/store";
import { getCurrentUser, getReportPreferences } from "./api.js";

export const userCredential = writable(null);
export const currentUser = writable(null);
export const reportPreferences = writable([]);

onAuthStateChanged(firebaseAuth, async (user) => {
  console.log(user);
  if (user) {
    // User is signed in
    userCredential.set(user);
    try {
      const profile = await getCurrentUser();
      currentUser.set(profile);
    } catch (e) {
      console.error("Failed to load user profile", e);
      currentUser.set(null);
    }
    try {
      const prefs = await getReportPreferences();
      reportPreferences.set(prefs);
    } catch (e) {
      console.error("Failed to load report preferences", e);
      reportPreferences.set([]);
    }
  } else {
    // User is signed out
    userCredential.set(null);
    currentUser.set(null);
    reportPreferences.set([]);
  }
});

/**
 * Whether the user may manage (generate/reset/delete) vehicle credentials
 * for the given data owner. Admins implicitly have this permission for all
 * data owners.
 */
export function canManageVehicleCredentials(user, preferences, dataOwnerCode) {
  if (user?.admin) return true;
  return (preferences ?? []).some(
    (p) =>
      p.data_owner_code === dataOwnerCode && p.can_manage_vehicle_credentials,
  );
}

export const getIdToken = async () => {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (user) {
    return await user.getIdToken();
  } else {
    throw new Error("No user is signed in.");
  }
};
