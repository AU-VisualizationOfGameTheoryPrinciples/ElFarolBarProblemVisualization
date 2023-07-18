const happySound = new Audio("../sound/648212__nxrt__ui-sounds-shimmering-success.wav");
const closeSound = new Audio("../sound/689134__moulaythami__cheers-a.wav");
const overcrowdedSound = new Audio("../sound/483598__raclure__wrong.mp3");

function playSuitableSound(rating, isClose) {
    if(rating == "bad") {
        playOvercrowdedSound();
    } else if (rating == "good") {
        playHappySound(isClose);
    }
}

function playHappySound(isClose) {
    playSound(happySound);
    if(isClose) {
        playSound(closeSound);
    }
}

function playOvercrowdedSound() {
    playSound(overcrowdedSound);
}

function playSound(soundAudio) {
    soundAudio.load();
    soundAudio.play();
}

export { playHappySound, playOvercrowdedSound, playSuitableSound };