let mediaRecorder = null;
let audioChunks = [];

async function startVoiceRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (event) {
        audioChunks.push(event.data);
    };

    mediaRecorder.start();
}

function stopVoiceRecording(callback) {
    if (!mediaRecorder) return;

    mediaRecorder.onstop = function () {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        callback(audioBlob);
    };

    mediaRecorder.stop();
}