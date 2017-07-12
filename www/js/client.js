'use strict';

const snapWidth = 3280;
const snapHeight = 2464;
const previewTimeout = 3000;
const noop = () => {};

class PhotoBooth {

    constructor () {
        this.snapWidth = snapWidth;
        this.snapHeight = snapHeight;
        this.previewTimeout = previewTimeout;
        this.mediaConstraints = {
            video: {
                width: this.snapWidth,
                height: this.snapHeight
            }
        };
        this.snapRequest = new Request('/snap', {
            method: 'POST'
        });

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

        if (keypress.key !== 'ArrowUp') {
            return;
        }

        this.capturePhoto();
        this.capturePreview();
        this.showPreviewImage();
    }

    getCameraAccess () {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }

        navigator.mediaDevices.getUserMedia(this.mediaConstraints)
            .then((localMediaStream) => {
                this.video.src = window.URL.createObjectURL(localMediaStream);
                this.createImageCapture(localMediaStream);
            }).catch(noop);
    }

    createImageCapture (mediaStream) {
        if (typeof ImageCapture === 'undefined') {
            return;
        }
        const mediaStreamTrack = mediaStream.getVideoTracks()[0];
        this.imageCapture = new ImageCapture(mediaStreamTrack);
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
