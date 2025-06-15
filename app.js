let audio;
let analyser;

let tumoLogo;
let musicLabel;

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

function addFiles(files) {
  const currentNumFiles = musicList.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
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
}

window.onload = async () => {
  //Load the data
  let request = await fetch("data.json");
  musicList = await request.json();

  //music label and tumo logo
  tumoLogo = document.querySelector("#tumo-logo");
  musicLabel = document.querySelector("header h2");

  //File input
  let fileInput = document.querySelector("#file-input");
  fileInput.onchange = function () {
    const files = Array.from(fileInput.files);
    addFiles(files);
  };
  // Open file button
  document.querySelector("#open-file-button").onclick = function () {
    fileInput.click();
  };

  //Dropzone
  document.querySelector("#dropzone").ondrop = function (e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
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
    musicLabel.innerText = musicList[currentMusic].title;
    tumoLogo.style.display = "none";
  };
  audio.onpause = function () {
    playIcon.style.display = "initial";
    pauseIcon.style.display = "none";
    tumoLogo.style.display = "initial";
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
  // if ("serviceWorker" in navigator) {
  //   navigator.serviceWorker.register("service-worker.js");
  // }

  document.querySelector("#container").style.opacity = 1;
  document.querySelector("#container").style.scale = 1;
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
    this.#analyser.fftSize = 32;
    this.#bufferLength = this.#analyser.frequencyBinCount;

    this.#dataArray = new Uint8Array(this.#bufferLength);

    const rect = this.#canvas.getBoundingClientRect(); // gets CSS size in pixels

    this.#WIDTH = this.#canvas.width = rect.width;
    this.#HEIGHT = this.#canvas.height = rect.height;

    this.#barWidth = parseInt(this.#WIDTH / this.#bufferLength);
    this.#barHeight;
    this.#x = 30;
  }

  update() {
    if (!this.#contextStarted) {
      this.#context.resume(); // resumes suspended audio context
      this.#contextStarted = true;
    }
    this.#x = 0;

    this.#analyser.getByteFrequencyData(this.#dataArray);
    this.#ctx.clearRect(0, 0, this.#WIDTH, this.#HEIGHT);

    this.#ctx.fillStyle = "#ffd1d2";
    for (let i = 0; i < this.#bufferLength; i++) {
      this.#barHeight = this.#dataArray[i] * 0.7;

      this.#ctx.fillRect(
        this.#x,
        this.#HEIGHT - this.#barHeight,
        this.#barWidth,
        this.#barHeight
      );

      this.#x += this.#barWidth + 6;
    }
  }
}
