<script>
  import { firebaseAuth } from "../firebase.js";
  import { userCredential } from "../auth.js";
  import { signOut } from "firebase/auth";
  import { link } from "svelte-routing";

  function logout() {
    signOut(firebaseAuth);
    $userCredential = null;
  }
</script>

<nav
  class="fixed top-0 z-40 flex h-12 w-full flex-row items-center justify-between border-b border-gray-800 bg-red-700 p-3 shadow-sm"
>
  <div class="flex flex-row justify-start gap-2">
    <a href="/" use:link class="flex flex-row items-center gap-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        style="height: 32px; width: 32px;"
        ><g class="" transform="translate(0,0)" style=""
          ><path
            d="M136.1 37.15L105.4 328.8l26.3 26.3h248.6l26.3-26.3-30.7-291.65H361v44H151v-44zm32.9 0v26h174v-26zm-16.9 60h207.8l18.3 145.95H133.8zm15.8 17.95l-13.7 110h203.6l-13.7-110zm-7.9 158c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm192 0c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm-192 18c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm192 0c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm-204.5 82L91.6 486.8h46.8l13.5-28.7h208.2l13.5 28.7h46.8l-55.9-113.7h-42.4l6.3 14H183.6l6.3-14zm28 32h161l10.2 23H165.3z"
            fill="#fff"
            fill-opacity="1"
          ></path></g
        ></svg
      >
      <div class="flex flex-col items-center">
        <span class="text-xl text-white">OpenPrio</span>
        <div class="h-[2px] w-20 bg-blue-500"></div>
      </div>
      <div></div></a
    >
    {#if $userCredential}
      <a
        href="/intersections"
        use:link
        class="flex flex-row items-center gap-4"
      >
        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="height: 32px; width: 32px;"><g class="" transform="translate(0,0)" style=""><path d="M136.1 37.15L105.4 328.8l26.3 26.3h248.6l26.3-26.3-30.7-291.65H361v44H151v-44zm32.9 0v26h174v-26zm-16.9 60h207.8l18.3 145.95H133.8zm15.8 17.95l-13.7 110h203.6l-13.7-110zm-7.9 158c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm192 0c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm-192 18c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm192 0c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm-204.5 82L91.6 486.8h46.8l13.5-28.7h208.2l13.5 28.7h46.8l-55.9-113.7h-42.4l6.3 14H183.6l6.3-14zm28 32h161l10.2 23H165.3z" fill="#fff" fill-opacity="1"></path></g></svg> -->
        <div class="flex flex-col items-center">
          <span class="text-l text-white">Kruisingen</span>
        </div>
        <div></div></a
      >
      <a href="/journeys" use:link class="flex flex-row items-center gap-4">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="height: 32px; width: 32px;"><g class="" transform="translate(0,0)" style=""><path d="M136.1 37.15L105.4 328.8l26.3 26.3h248.6l26.3-26.3-30.7-291.65H361v44H151v-44zm32.9 0v26h174v-26zm-16.9 60h207.8l18.3 145.95H133.8zm15.8 17.95l-13.7 110h203.6l-13.7-110zm-7.9 158c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm192 0c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm-192 18c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm192 0c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm-204.5 82L91.6 486.8h46.8l13.5-28.7h208.2l13.5 28.7h46.8l-55.9-113.7h-42.4l6.3 14H183.6l6.3-14zm28 32h161l10.2 23H165.3z" fill="#fff" fill-opacity="1"></path></g></svg> -->
        <div class="flex flex-col items-center">
          <span class="text-l text-white">Ritten</span>
        </div>
        <div></div></a
      >
      <a href="/stats" use:link class="flex flex-row items-center gap-4">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="height: 32px; width: 32px;"><g class="" transform="translate(0,0)" style=""><path d="M136.1 37.15L105.4 328.8l26.3 26.3h248.6l26.3-26.3-30.7-291.65H361v44H151v-44zm32.9 0v26h174v-26zm-16.9 60h207.8l18.3 145.95H133.8zm15.8 17.95l-13.7 110h203.6l-13.7-110zm-7.9 158c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm192 0c18.1 0 33 14.9 33 33 0 18.2-14.9 33-33 33s-33-14.8-33-33c0-18.1 14.9-33 33-33zm-192 18c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm192 0c-8.4 0-15 6.7-15 15 0 8.4 6.6 15 15 15s15-6.6 15-15c0-8.3-6.6-15-15-15zm-204.5 82L91.6 486.8h46.8l13.5-28.7h208.2l13.5 28.7h46.8l-55.9-113.7h-42.4l6.3 14H183.6l6.3-14zm28 32h161l10.2 23H165.3z" fill="#fff" fill-opacity="1"></path></g></svg> -->
        <div class="flex flex-col items-center">
          <span class="text-l text-white">Statistieken</span>
        </div>
        <div></div></a
      >
      <a href="/raw_data" use:link class="flex flex-row items-center gap-4">
        <div class="flex flex-col items-center">
          <span class="text-l text-white">Ruwe data</span>
        </div>
        <div></div></a
      >
    {/if}
  </div>
  {#if !$userCredential}
    <a href="/login" use:link>
      <button class="flex flex-col items-center">
        <div class="flex flex-col items-center transition hover:scale-110">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 92 92"
          >
            <path
              d="M 79.635 73.696 C 86.104 65.901 90 55.898 90 45 C 90 20.187 69.813 0 45 0 C 20.187 0 0 20.187 0 45 c 0 10.898 3.896 20.901 10.365 28.696 c 0.105 0.161 0.227 0.315 0.383 0.445 c 0.002 0.002 0.005 0.003 0.007 0.005 C 19.015 83.837 31.298 90 45 90 c 13.702 0 25.985 -6.163 34.245 -15.854 c 0.003 -0.002 0.005 -0.003 0.008 -0.005 C 79.408 74.01 79.53 73.857 79.635 73.696 z M 45 4 c 22.607 0 41 18.393 41 41 c 0 9.169 -3.026 17.645 -8.132 24.482 c -6.081 -6.505 -13.876 -10.99 -22.402 -13.023 c 6.497 -3.669 10.901 -10.629 10.901 -18.609 c 0 -11.782 -9.585 -21.367 -21.367 -21.367 c -11.782 0 -21.367 9.585 -21.367 21.367 c 0 7.979 4.404 14.939 10.901 18.608 c -8.526 2.033 -16.321 6.518 -22.402 13.023 C 7.026 62.645 4 54.169 4 45 C 4 22.393 22.393 4 45 4 z M 45 55.217 c -9.576 0 -17.367 -7.791 -17.367 -17.367 S 35.424 20.482 45 20.482 s 17.367 7.791 17.367 17.367 S 54.576 55.217 45 55.217 z M 45 86 c -11.986 0 -22.787 -5.171 -30.29 -13.399 C 22.48 64.079 33.418 59.217 45 59.217 c 11.581 0 22.52 4.863 30.29 13.384 C 67.787 80.829 56.986 86 45 86 z"
              stroke="white"
              stroke-width="2"
              fill="white"
            />
          </svg>
          <span class="text-sm text-white">Login</span>
        </div>
      </button>
    </a>
  {:else}
    <button class="flex flex-col items-center" onclick={logout}>
      <div class="flex flex-col items-center transition hover:scale-110">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 92 92"
        >
          <path
            d="M 79.635 73.696 C 86.104 65.901 90 55.898 90 45 C 90 20.187 69.813 0 45 0 C 20.187 0 0 20.187 0 45 c 0 10.898 3.896 20.901 10.365 28.696 c 0.105 0.161 0.227 0.315 0.383 0.445 c 0.002 0.002 0.005 0.003 0.007 0.005 C 19.015 83.837 31.298 90 45 90 c 13.702 0 25.985 -6.163 34.245 -15.854 c 0.003 -0.002 0.005 -0.003 0.008 -0.005 C 79.408 74.01 79.53 73.857 79.635 73.696 z M 45 4 c 22.607 0 41 18.393 41 41 c 0 9.169 -3.026 17.645 -8.132 24.482 c -6.081 -6.505 -13.876 -10.99 -22.402 -13.023 c 6.497 -3.669 10.901 -10.629 10.901 -18.609 c 0 -11.782 -9.585 -21.367 -21.367 -21.367 c -11.782 0 -21.367 9.585 -21.367 21.367 c 0 7.979 4.404 14.939 10.901 18.608 c -8.526 2.033 -16.321 6.518 -22.402 13.023 C 7.026 62.645 4 54.169 4 45 C 4 22.393 22.393 4 45 4 z M 45 55.217 c -9.576 0 -17.367 -7.791 -17.367 -17.367 S 35.424 20.482 45 20.482 s 17.367 7.791 17.367 17.367 S 54.576 55.217 45 55.217 z M 45 86 c -11.986 0 -22.787 -5.171 -30.29 -13.399 C 22.48 64.079 33.418 59.217 45 59.217 c 11.581 0 22.52 4.863 30.29 13.384 C 67.787 80.829 56.986 86 45 86 z"
            stroke="white"
            stroke-width="2"
            fill="white"
          />
        </svg>
        <span class="select-none text-sm text-white">Logout</span>
      </div>
    </button>
  {/if}
</nav>
