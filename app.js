let audio;
let rangeInput;
let volumeInput;

let musicList;
let currentMusic = 0;

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
  let volumeVal = volumeInput.value / 100;
  document.querySelector("#volume-bar").style.transform = `scaleX(${volumeVal})`;
  audio.volume = volumeVal;
}

function updateProgressBar(val) {
  document.querySelector("#progress-bar").style.transform = `scaleX(${val})`;
}
function updateVisor() {
  document.querySelector("#visor").querySelector("h2").innerText =
    musicList[currentMusic].title;
}

window.onload = async () => {
  //Load the data
  let request = await fetch("data.json");
  musicList = await request.json();

  //Dropzone
  document.querySelector("#dropzone").ondrop = function (e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    currentMusic = musicList.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type !== "audio/mpeg") continue;
      musicList.push({
        title: file.name,
        url: URL.createObjectURL(file),
      });
    }

    if (currentMusic < musicList.length) play();
  };

  //Scrub input
  rangeInput = document.querySelector("#range-input");
  rangeInput.oninput = scrub;

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

  //Icons
  let playIcon = document.querySelector("#play-icon");
  let pauseIcon = document.querySelector("#pause-icon");
  pauseIcon.style.display = "none";

  //Audio element
  audio = document.querySelector("audio");
  audio.onplaying = function () {
    playIcon.style.display = "none";
    pauseIcon.style.display = "initial";
    updateVisor();
  };
  audio.onpause = function () {
    playIcon.style.display = "initial";
    pauseIcon.style.display = "none";
  };
  audio.ontimeupdate = function () {
    let val = audio.currentTime / audio.duration;
    rangeInput.value = val * 100;
    updateProgressBar(val);
  };
  audio.onended = function () {
    next();
  };
};
window.ondrop = function (e) {
  e.preventDefault();
};
window.ondragover = function (e) {
  e.preventDefault();
};
