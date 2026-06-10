import { firebaseAuth, onAuthStateChanged } from "./firebase";
import { writable } from "svelte/store";
import { getCurrentUser } from "./api.js";

export const userCredential = writable(null);
export const currentUser = writable(null);

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
  } else {
    // User is signed out
    userCredential.set(null);
    currentUser.set(null);
  }
});

export const getIdToken = async () => {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (user) {
    return await user.getIdToken();
  } else {
    throw new Error("No user is signed in.");
  }
};
