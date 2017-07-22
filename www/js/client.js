'use strict';

const useRaspistill = false;

const raspicamMaxWidth = 3280;
const raspicamMaxHeight = 2464;

const snapWidth = 1920;
const snapHeight = 1080;
const previewTimeout = 3000;
const noop = () => {};
const triggerKeys = [
    'Enter'
];

window.ImageCapture = window.ImageCapture || imagecapture.ImageCapture;

class PhotoBooth {

    constructor () {
        this.useRaspistill = useRaspistill;
        this.ready = false;
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
    }

    start () {
        this.initDom().then(() => {
            this.getCameraAccess()
                .then(() => {
                    this.initVideoElement();

                    window.addEventListener('keydown', this.onKeydown.bind(this));
                }).catch((error) => {
                    this.handleError(error);
                });
        });
    }

    initDom () {
        return new Promise((resolve, reject) => {
            this.previewBox = document.getElementById('previewbox');
            this.canvas = document.getElementById('preview');
            this.video = document.getElementById('video');
            this.errorPixel = document.getElementById('error');
            resolve();
        });
    }

    initVideoElement () {
        const updatePreviewCanvasDimensions = this.updatePreviewCanvasDimensions.bind(this);

        this.video.addEventListener('loadeddata', function () {
            updatePreviewCanvasDimensions(this.videoWidth, this.videoHeight);
        });
    }

    onKeydown (keypress) {
        if (!this.ready) {
            return;
        }

        if (!keypress.key) {
            return;
        }

        if (this.triggerKeys.indexOf(keypress.key) === -1) {
            return;
        }

        this.ready = false;
        this.capturePreview()
            .then(this.showPreviewImage())
            .then(this.stopCamera())
            .then(this.capturePhoto())
            .catch((error) => {
                this.handleError(error);
            });
    }

    getCameraAccess () {
        return new Promise((resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                reject(new Error());
            }

            navigator.mediaDevices.getUserMedia(this.mediaConstraints)
                .then((localMediaStream) => {
                    this.mediaStream = localMediaStream;
                    this.video.src = window.URL.createObjectURL(this.mediaStream);
                    this.createImageCapture(this.mediaStream);
                    this.ready = true;
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
        });
    }

    restartCamera () {
        return new Promise((resolve, reject) => {
            this.getCameraAccess().then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    stopCamera () {
        return new Promise((resolve, reject) => {
            if (!this.useRaspistill) {
                resolve();
                return;
            }
            if (this.mediaStream.stop) {
                this.mediaStream.stop();
            }
            if (this.mediaStreamTrack.stop) {
                this.mediaStreamTrack.stop();
            }
            resolve();
        });
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

        console.info('images will be taken in ' + dimensions.join(' x '));
    }

    updatePreviewCanvasDimensions (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    capturePreview () {
        return new Promise((resolve, reject) => {
            this.imageCapture.grabFrame()
                .then((bitmap) => {
                    this.drawPreviewImage(bitmap);
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    capturePhoto () {
        if (this.useRaspistill) {
            return this.capturePhotoOnServer();
        }
        return this.capturePhotoWithImageCapture();
    }

    capturePhotoWithImageCapture () {
        return new Promise((resolve, reject) => {
            this.imageCapture.takePhoto()
                .then((photo) => {
                    this.sendImageToServer(photo);
                    resolve();
                })
                .catch((error) => {
                    this.handleError(error);
                });
        });
    }

    capturePhotoOnServer () {
        return new Promise((resolve, reject) => {
            fetch(new Request('/snap')).then((response) => {
                this.restartCamera().then(() => {
                    if (response.status !== 200) {
                        this.capturePhotoWithImageCapture();
                    }
                    resolve();
                });
            });
        });
    }

    sendImageToServer (image) {
        fetch(this.snapRequest, {
            body: image
        }).then(() => {
            this.ready = true;
        });
    }

    drawPreviewImage (image) {
        this.canvas.getContext('2d').drawImage(image, 0, 0);
    }

    showPreviewImage () {
        return new Promise((resolve, reject) => {
            this.addFlashLightEffectToPreviewAndShowIt();
            clearTimeout(this.previewTimeoutCounter);
            this.previewTimeoutCounter = setTimeout(
                this.removeFlashlightEffectFromPreviewAndHideIt.bind(this),
                this.previewTimeout
            );
            resolve();
        });
    }

    addFlashLightEffectToPreviewAndShowIt () {
        this.previewBox.classList.add('shutter', 'opaque', 'absolute');
        this.previewBox.classList.remove('transparent');
    }

    removeFlashlightEffectFromPreviewAndHideIt () {
        this.previewBox.classList.remove('shutter', 'opaque', 'absolute');
        this.previewBox.classList.add('transparent');
        this.ready = true;
    }

    handleError (error) {
        console.error(error.message);
    }

    showErrorOnPage () {
        this.errorPixel.classList.add('opaque').remove('transparent');
    }

    removeErrorFromPage () {
        this.errorPixel.classList.add('transparent').remove('opaque');
    }
}

window.photobooth = new PhotoBooth();
window.photobooth.start();
