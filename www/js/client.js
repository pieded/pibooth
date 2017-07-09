'use strict';

const noop = () => {
};

const snapWidth = 1920;
const snapHeight = 1080;
const previewTimeout = 3000;

const mediaConstraints = {
    video: {
        width: snapWidth,
        height: snapHeight
    }
};

const snapRequest = new Request('/snap', {
    method: 'POST'
});

const canvas = document.getElementById('preview');
canvas.width = snapWidth;
canvas.height = snapHeight;

const previewBox = document.getElementById('previewbox');
const video = document.getElementById('video');
let videoDimensions = {
    height: null,
    width: null
};

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(function (localMediaStream) {
            video.src = window.URL.createObjectURL(localMediaStream);
        }).catch(noop);
}

video.addEventListener('loadeddata', function (event) {
    videoDimensions.height = this.videoHeight;
    videoDimensions.width = this.videoWidth;
});

window.addEventListener('keydown', function (event) {
    if (!event.key) {
        return;
    }

    if (event.key !== 'ArrowUp') {
        return;
    }

    canvas.getContext('2d').drawImage(video, 0, 0, snapWidth, snapHeight);
    const fullQuality = canvas.toDataURL('image/jpeg', 1.0);

    fetch(snapRequest, {
        body: fullQuality
    });

    canvas.style.width = videoDimensions.width;
    canvas.style.height = videoDimensions.height;

    previewBox.classList.add('shutter', 'opaque');
    previewBox.classList.remove('transparent');
    setTimeout(() => {
        previewBox.classList.remove('shutter', 'opaque');
        previewBox.classList.add('transparent');
    },
    previewTimeout);
});
