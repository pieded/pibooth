'use strict';
//import campi from 'campi';
//import piCam from 'pi-camera';
//import Raspistill from 'node-raspistill';

//campi.getImageAsStream();
//piCam.snap();
//Raspistill.takePhoto();

const noop = () => {};

const mediaConstraints = {
    video: {
        width: 1920,
        height: 1080
    }
};

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(function(localMediaStream) {
            const video = document.querySelector('video');
            video.src = window.URL.createObjectURL(localMediaStream);
        }).catch(noop);
}