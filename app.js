let audio;
let analyser;

let rangeInput;
let volumeInput;

let musicList;
let currentMusic = 0;
let previousVolume;

let timeElapsedElem;

//icons
let unmutedIcon;
let mutedIcon;

function scrub() {
  let scrubVal = rangeInput.value / 100;
  updateProgressBar(scrubVal);
  audio.currentTime = audio.duration * scrubVal;
}
function previous() {
  currentMusic--;
  if (currentMusic <= 0) currentMusic = musicList.length - 1;
  play();
}
function play() {
  if (!audio.paused) {
    pause();
  }
  audio.src = musicList[currentMusic].url;
  audio.play();
}
function pause() {
  audio.pause();
}
function next() {
  currentMusic++;
  if (currentMusic >= musicList.length) currentMusic = 0;
  play();
}
function volume() {
  const currentVolume = volumeInput.value / 100;
  audio.volume = currentVolume;
  updateVolumeBar(currentVolume);
}

function updateProgressBar(val) {
  document.querySelector("#progress-bar").style.transform = `scaleX(${val})`;
}
function updateVolumeBar(val) {
  document.querySelector("#volume-bar").style.transform = `scaleX(${val})`;

  if (val === 0) {
    mutedIcon.style.display = "initial";
    unmutedIcon.style.display = "none";
  } else {
    mutedIcon.style.display = "none";
    unmutedIcon.style.display = "initial";
  }
}
function updateVisor() {
  analyser.update();
}

window.onload = async () => {
  //Load the data
  let request = await fetch("data.json");
  musicList = await request.json();

  //Dropzone
  document.querySelector("#dropzone").ondrop = function (e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const currentNumFiles = musicList.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(file.type);
      if (file && file.type !== "audio/mpeg" && file.type !== "audio/flac") continue;

      musicList.push({
        title: file.name,
        url: URL.createObjectURL(file),
      });
    }

    if (currentNumFiles !== musicList.length) {
      currentMusic = currentNumFiles;
      play();
    }
  };

  //Scrub input
  rangeInput = document.querySelector("#range-input");
  rangeInput.oninput = scrub;
  //time elapsed elem
  timeElapsedElem = document.querySelector("#scrub p");

  //Previous track button
  document.querySelector("#previous-button").onclick = previous;

  //Play / Pause button
  document.querySelector("#play-pause-button").onclick = function () {
    if (!audio.paused) {
      pause();
    } else {
      play();
    }
  };

  //Next track button
  document.querySelector("#next-button").onclick = next;

  //Volume input
  volumeInput = document.querySelector("#volume-input");
  volumeInput.oninput = volume;

  //Mute button
  document.querySelector("#mute-button").onclick = function () {
    if (audio.volume > 0) {
      previousVolume = audio.volume;
      audio.volume = 0;
      updateVolumeBar(0);
    } else {
      audio.volume = previousVolume;
      updateVolumeBar(previousVolume);
    }
  };

  //Icons
  let playIcon = document.querySelector("#play-icon");
  let pauseIcon = document.querySelector("#pause-icon");
  pauseIcon.style.display = "none";

  unmutedIcon = document.querySelector("#unmuted-icon");
  mutedIcon = document.querySelector("#muted-icon");
  mutedIcon.style.display = "none";

  //Audio element
  audio = document.querySelector("audio");
  audio.onplaying = function () {
    if (!analyser) {
      analyser = new AudioAnalyser(audio);

      function loop() {
        analyser.update();
        requestAnimationFrame(loop);
      }
      loop();
    }
    playIcon.style.display = "none";
    pauseIcon.style.display = "initial";
    document.querySelector("#visor").querySelector("h2").innerText =
      musicList[currentMusic].title;
  };
  audio.onpause = function () {
    playIcon.style.display = "initial";
    pauseIcon.style.display = "none";
  };
  audio.ontimeupdate = function () {
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    let val = currentTime / duration;
    rangeInput.value = val * 100;

    const minutes = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    timeElapsedElem.innerText = `${minutes}:${secs.toString().padStart(2, "0")}`;

    updateProgressBar(val);
  };
  audio.onended = function () {
    next();
  };
  audio.volume = 0.5;

  //Service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
};
window.ondrop = function (e) {
  e.preventDefault();
};
window.ondragover = function (e) {
  e.preventDefault();
};

class AudioAnalyser {
  #analyser;
  #canvas;
  #ctx;
  #dataArray;
  #WIDTH;
  #HEIGHT;
  #barWidth;
  #barHeight;
  #bufferLength;
  #contextStarted = false;
  #context;
  #x = 0;
  constructor(audio) {
    this.#canvas = document.querySelector("#analyser-canvas");
    this.#ctx = this.#canvas.getContext("2d");
    this.#ctx.imageSmoothingEnabled = false;

    this.#context = new AudioContext();
    let src = this.#context.createMediaElementSource(audio);

    this.#analyser = this.#context.createAnalyser();
    src.connect(this.#analyser);
    this.#analyser.connect(this.#context.destination);
    this.#analyser.fftSize = 64;
    this.#bufferLength = this.#analyser.frequencyBinCount;

    this.#dataArray = new Uint8Array(this.#bufferLength);

    const rect = this.#canvas.getBoundingClientRect(); // gets CSS size in pixels
    const dpi = window.devicePixelRatio || 1;

    // Set real canvas resolution (drawing buffer)
    this.#WIDTH = rect.width;
    this.#HEIGHT = rect.height;

    this.#barWidth = parseInt(this.#WIDTH / this.#bufferLength);
    this.#barHeight;
    this.#x = 0;
  }

  update() {
    if (!this.#contextStarted) {
      this.#context.resume(); // resumes suspended audio context
      this.#contextStarted = true;
    }
    this.#x = 0;

    this.#analyser.getByteFrequencyData(this.#dataArray);

    this.#ctx.fillStyle = "#FF3900";
    this.#ctx.fillRect(0, 0, this.#WIDTH, this.#HEIGHT);

    for (let i = 0; i < this.#bufferLength; i++) {
      this.#barHeight = this.#dataArray[i] * 1.2;

      this.#ctx.fillStyle = "#692513";
      this.#ctx.fillRect(
        this.#x,
        this.#HEIGHT - this.#barHeight,
        this.#barWidth,
        this.#barHeight
      );

      this.#x += this.#barWidth + 4;
    }
  }
}
