<div class="m-0 flex h-[100vh] items-center justify-center bg-gray-700">
  <div class="loader">
    <div class="train"></div>
    <div class="track">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</div>

<style>
  .loader {
    width: 8em;
    height: 10em;
    font-size: 20px;
  }

  .train {
    width: 6em;
    height: 6em;
    background: radial-gradient(
        circle at 20% 80%,
        lightgoldenrodyellow 0.6em,
        transparent 0.6em
      ),
      radial-gradient(
        circle at 80% 80%,
        lightgoldenrodyellow 0.6em,
        transparent 0.6em
      ),
      #bbb;
    border-radius: 1em;
    position: relative;
    left: 1em;
    color: #444;
    animation: train-animate 1.5s infinite ease-in-out;
  }

  @keyframes train-animate {
    0%,
    100% {
      transform: rotate(0deg);
    }

    25%,
    75% {
      transform: rotate(0.5deg);
    }

    50% {
      transform: rotate(-0.5deg);
    }
  }

  .train::before {
    content: "";
    position: absolute;
    width: 80%;
    height: 2.3em;
    background-color: #ddd;
    border-radius: 0.4em;
    top: 1.2em;
    left: 10%;
  }

  .train::after {
    content: "Den Haag";
    position: absolute;
    text-align: center;
    font-size: 0.5em;
    color: yellow;
    width: 50%;
    height: 1.5em;
    background-color: #777;
    border-radius: 0.3em;
    top: 0.4em;
    left: calc((100% - 50%) / 2);
  }

  .track {
    width: 8em;
    position: relative;
  }

  .track::before,
  .track::after {
    content: "";
    position: absolute;
    width: 0.3em;
    height: 4em;
    background-color: #bbb;
    border-radius: 0.4em;
    transform-origin: bottom;
  }

  .track::before {
    left: 0;
    transform: skewX(-27deg);
  }

  .track::after {
    right: 0;
    transform: skewX(27deg);
  }

  .track span {
    width: inherit;
    height: 0.3em;
    background-color: #bbb;
    position: absolute;
    top: 4em;
    animation: track-animate 1s linear infinite;
  }

  .track span:nth-child(2) {
    animation-delay: -0.33s;
  }

  .track span:nth-child(3) {
    animation-delay: -0.66s;
  }

  @keyframes track-animate {
    0% {
      transform: translateY(-0.5em) scaleX(0.9);
      filter: opacity(0);
    }

    10%,
    90% {
      filter: opacity(1);
    }

    100% {
      transform: translateY(-4em) scaleX(0.5);
      filter: opacity(0);
    }
  }
</style>
