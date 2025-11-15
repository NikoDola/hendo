const video = document.getElementById('video')

async function getCameraPermision(status){
  const camera_audio = await navigator.mediaDevices.getUserMedia(status)

  video.srcObject = camera_audio
  return camera_audio
}

getCameraPermision({video: true, audio:false})