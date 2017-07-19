'use strict';

const raspicamMaxWidth = 3280;
const raspicamMaxHeight = 2464;

const snapWidth = raspicamMaxWidth;
const snapHeight = raspicamMaxHeight;
const previewTimeout = 3000;
const noop = () => {};
const triggerKeys = [
    'Enter'
];

window.ImageCapture = window.ImageCapture || imagecapture.ImageCapture;

class PhotoBooth {

    constructor () {
        this.snapWidth = snapWidth;
        this.snapHeight = snapHeight;
        this.previewTimeout = previewTimeout;
        this.triggerKeys = triggerKeys;
        this.mediaConstraints = {
            video: {
                width: this.snapWidth,
                height: this.snapHeight
            }
        };
        this.snapRequest = new Request('/snap', {
            method: 'POST'
        });

        this.mediaStream = null;
        this.mediaStreamTrack = null;

        this.imageCapture = null;

        this.getCameraAccess();

        this.initDom();
    }

    initDom () {
        this.previewBox = document.getElementById('previewbox');
        this.canvas = document.getElementById('preview');
        this.video = document.getElementById('video');
    }

    start () {
        const updatePreviewCanvasDimensions = this.updatePreviewCanvasDimensions.bind(this);

        this.video.addEventListener('loadeddata', function () {
            updatePreviewCanvasDimensions(this.videoWidth, this.videoHeight);
        });

        window.addEventListener('keydown', this.onKeydown.bind(this));
    }

    onKeydown (keypress) {
        if (!keypress.key) {
            return;
        }

        if (this.triggerKeys.indexOf(keypress.key) === -1) {
            return;
        }

        this.capturePreview();
        this.showPreviewImage();
        this.stopCamera();
        this.capturePhotoOnServer();
    }

    getCameraAccess () {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }

        navigator.mediaDevices.getUserMedia(this.mediaConstraints)
            .then((localMediaStream) => {
                this.mediaStream = localMediaStream;
                this.video.src = window.URL.createObjectURL(this.mediaStream);
                this.createImageCapture(this.mediaStream);
            }).catch((error) => {
                console.log(error.message);
            });
    }

    restartCamera () {
        if (this.mediaStream.start) {
            this.mediaStream.start();
        }
        if (this.mediaStreamTrack.start) {
            this.mediaStreamTrack.start();
        }
    }

    stopCamera () {
        if (this.mediaStream.stop) {
            this.mediaStream.stop();
        }
        if (this.mediaStreamTrack.stop) {
            this.mediaStreamTrack.stop();
        }
    }

    createImageCapture (mediaStream) {
        if (typeof ImageCapture === 'undefined') {
            return;
        }
        this.mediaStreamTrack = mediaStream.getVideoTracks()[0];
        this.imageCapture = new ImageCapture(this.mediaStreamTrack);
        this.imageCapture.getPhotoCapabilities().then((photoCapabilities) => {
            this.showHintForPhotoCapabilities(photoCapabilities);
        });
    }

    showHintForPhotoCapabilities (photoCapabilities) {
        const dimensions = [
            photoCapabilities.imageWidth.max,
            photoCapabilities.imageHeight.max
        ];

        console.log('images will be taken in ' + dimensions.join(' x '));
    }

    updatePreviewCanvasDimensions (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    capturePreview () {
        this.imageCapture.grabFrame()
            .then((bitmap) => {
                this.drawPreviewImage(bitmap);
            })
            .catch((error) => console.error('grabFrame() error:', error));
    }

    capturePhoto () {
        this.imageCapture.takePhoto()
            .then((photo) => {
                this.sendImageToServer(photo);
            })
            .catch((error) => console.error('takePhoto() error:', error));
    }

    capturePhotoOnServer () {
        fetch(new Request('/snap')).then((response) => {
            if (response.status === 200) {
                // this.getCameraAccess();
                this.restartCamera();
            } else {
                this.capturePhoto();
            }
        });
    }

    sendImageToServer (image) {
        fetch(this.snapRequest, {
            body: image
        });
    }

    drawPreviewImage (image) {
        this.canvas.getContext('2d').drawImage(image, 0, 0);
    }

    showPreviewImage () {
        this.addFlashLightEffectToPreviewAndShowIt();
        setTimeout(
            this.removeFlashlightEffectFromPreviewAndHideIt.bind(this),
            this.previewTimeout
        );
    }

    addFlashLightEffectToPreviewAndShowIt () {
        this.previewBox.classList.add('shutter', 'opaque', 'absolute');
        this.previewBox.classList.remove('transparent');
    }

    removeFlashlightEffectFromPreviewAndHideIt () {
        this.previewBox.classList.remove('shutter', 'opaque', 'absolute');
        this.previewBox.classList.add('transparent');
    }
}

new PhotoBooth().start();
