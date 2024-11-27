import { firebaseAuth, onAuthStateChanged } from "./firebase";
import { writable } from "svelte/store";

export const userCredential = writable(null);

onAuthStateChanged(firebaseAuth, (user) => {
  console.log(user);
  if (user) {
    // User is signed in
    userCredential.set(user);
  } else {
    // User is signed out
    userCredential.set(null);
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
