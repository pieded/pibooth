'use strict';
//import campi from 'campi';
//import piCam from 'pi-camera';
//import Raspistill from 'node-raspistill';

//campi.getImageAsStream();
//piCam.snap();
//Raspistill.takePhoto();

const noop = () => {};

const snapWidth = 1920;
const snapHeight = 1080;

const mediaConstraints = {
    video: {
        width: snapWidth,
        height: snapHeight
    }
};

const canvas = document.getElementById('preview');
canvas.width = snapWidth;
canvas.height = snapHeight;
const preview = canvas.getContext('2d');
const video = document.getElementById('video');

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(function(localMediaStream) {
            video.src = window.URL.createObjectURL(localMediaStream);
        }).catch(noop);
}

// Trigger photo take
document.getElementById('snap').addEventListener('click', function() {
    preview.drawImage(video, 0, 0, snapWidth, snapHeight);
    canvas.style.opacity = 1;
    setTimeout(() => {
        canvas.style.opacity = 0;
    },
    1000);
});