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

        this.videoDimensions = {
            height: null,
            width: null
        };

        this.imageCapture = null;

        this.initDom();
    }

    initDom () {
        this.previewBox = document.getElementById('previewbox');
        this.canvas = document.getElementById('preview');
        this.video = document.getElementById('video');
    }

    start () {

        this.getCameraAccess();

        const updateVideoDimensions = this.updateVideoDimensions.bind(this);

        this.video.addEventListener('loadeddata', function () {
            updateVideoDimensions(this.videoWidth, this.videoHeight);
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

        this.canvas.width = this.videoDimensions.width;
        this.canvas.height = this.videoDimensions.height;

        this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.videoDimensions.width, this.videoDimensions.height);
        const fullQuality = this.canvas.toDataURL('image/jpeg', 1.0);

        this.sendImageToServer(fullQuality);

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
        if (ImageCapture) {
            const mediaStreamTrack = mediaStream.getVideoTracks()[0];
            this.imageCapture = new ImageCapture(mediaStreamTrack);
        }
    }

    updateVideoDimensions (width, height) {
        this.videoDimensions = {
            width: width,
            height: height
        };
    }

    getPreviewImage () {

    }

    getFullQualityImage () {

    }

    capturePreview () {
        this.imageCapture.grabFrame()
            .then(imageBitmap => {
                this.canvas.width = imageBitmap.width;
                this.canvas.height = imageBitmap.height;
                this.canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
            })
            .catch(error => console.error('grabFrame() error:', error));
    }

    capturePhoto () {
        this.imageCapture.takePhoto()
            .then(blob => {
                this.sendImageToServer(blob);
            })
            .catch(error => console.error('takePhoto() error:', error));
    }

    sendImageToServer (image) {
        fetch(this.snapRequest, {
            body: image
        });
    }

    showPreviewImage () {
        this.previewBox.classList.add('shutter', 'opaque');
        this.previewBox.classList.remove('transparent');
        setTimeout(() => {
            this.previewBox.classList.remove('shutter', 'opaque');
            this.previewBox.classList.add('transparent');
        },
            this.previewTimeout
        );
    }

}

new PhotoBooth().start();
