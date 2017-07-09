'use strict';

const noop = () => {
};

const snapWidth = 3280;
const snapHeight = 2464;
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

    canvas.width = videoDimensions.width;
    canvas.height = videoDimensions.height;

    canvas.getContext('2d').drawImage(video, 0, 0, videoDimensions.width, videoDimensions.height);
    const fullQuality = canvas.toDataURL('image/jpeg', 1.0);

    fetch(snapRequest, {
        body: fullQuality
    });

    previewBox.classList.add('shutter', 'opaque');
    previewBox.classList.remove('transparent');
    setTimeout(() => {
        previewBox.classList.remove('shutter', 'opaque');
        previewBox.classList.add('transparent');
    },
    previewTimeout);
});
