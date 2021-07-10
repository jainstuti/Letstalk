const socket=io();

const message=document.getElementById('message');
const handle=document.getElementById('handle');
const output=document.getElementById('output');
const button=document.getElementById('button');
const typing=document.getElementById('typing');

function updateScroll(){
    const chatWindow=document.getElementById('chat-window') ;
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

button.addEventListener('click', (e)=>{
    e.preventDefault();
    socket.emit('userMessage', {
        handle: handle.value,
        message: message.value
    })
    message.value="";
    // typing.innerHTML="";
})

message.addEventListener('keypress', ()=>{
    socket.emit('userTyping', handle.value);
});

socket.on('userMessage', (data)=>{
    if(data.handle===handle.value){
    var right=document.createElement('p');
    right.setAttribute("id", "left");
    right.style.backgroundColor = 'hsl(120, 64%, 79%)';
    right.style.textAlign="right";
        right.innerHTML="<strong>You:</strong> "+data.message;
    output.appendChild(right);
    }
    else{
    output.innerHTML += '<p><strong>'+ data.handle+': </strong>'+data.message+'</p>';
    }
    updateScroll();
})

socket.on('userTyping', (data)=>{
    typing.innerHTML='<p><em>'+ data+' is typing </em></p>'
})



const endCallButton = document.getElementById('endCall');
const lVideo=document.getElementById('lVideo');
const rVideo=document.getElementById('rVideo');
const callButton=document.getElementById('call_button');
const connectButton=document.getElementById('conn_button');
const muteCameraButton=document.getElementById('muteCamera');
const muteAudioButton=document.getElementById('muteAudio')
const shareScreenButton=document.getElementById('shareScreen')
const recordButton = document.getElementById("recordScreen");
const blurBtn = document.getElementById('blur-btn');
const unblurBtn = document.getElementById('unblur-btn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const blurBg=document.getElementById('blurBg' )
const recordedVideo = document.querySelector('video#recorded');
const playButton = document.querySelector('button#play');
const downloadButton = document.querySelector('button#download');
const getScreenStream=document.getElementById('getScreenStream');
let mediaRecorder;
let recordedBlobs;
//--------------------video call feature----------------------

//get local media
const constraints={
    audio: true,
    video: true
}

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    lVideo.srcObject = stream;
    window.localstream=stream;
    window.peer_stream=stream;
    unblurBtn.disabled = false;
    blurBtn.disabled = false;
  })
  .catch((err)=>{
    alert("cannot access your camera");
    console.log(err);
});

var conn;
var peer_id;
var currentPeer;
//create peer connection with peer obj i.e. set up a server to connect the two peers on video call
var peer=new Peer();

//display local id on DOM
peer.on('open', function(){
    document.getElementById('displayId').innerHTML=peer.id;
    conn.on('data', function(data) {
        console.log('Received', data);
      });
})

peer.on('connection', function(connection){
    conn= connection;
    peer_id=connection.peer;
    document.getElementById('connId').value=peer_id;
})

peer.on('error', function(err){
    console.log("an error has occured "+err);
})
//connect with peer
connectButton.addEventListener('click', function(){
    peer_id=document.getElementById('connId').value;
    if(peer_id){
        conn=peer.connect(peer_id)
    }
    else{
        alert('enter an id');
        return false
    }
})

//accept call
peer.on('call', function(call){
    var acceptCall = true;

    if(acceptCall){
        console.log("inside ACCEPT CALL");
        call.answer(window.localstream);
        call.on('stream', function(stream){
            console.log("inside CALL");
            currentPeer=call.peerConnection;
            console.log("current peer is : ");
            console.log(currentPeer);
            window.peer_stream=stream;
            rVideo.srcObject=stream;
        });
    }
    else{
        console.log("call denied");
    }
})

peer.on('destroyed', ()=>{
    console.log("destroy");
})

//initiate call
callButton.addEventListener('click', function(){
    console.log("calling peer: "+peer_id);
    console.log(peer);
    var call=peer.call(peer_id, window.localstream);

    call.on('stream', function(stream){
        window.peer_stream=stream;
        rVideo.srcObject=stream;
        currentPeer=call.peerConnection;
    })
})

//end call
endCallButton.addEventListener('click', function (){
    conn.close();
    peer.destroy();
})

//mute camera
muteCameraButton.addEventListener('click', ()=>{
    var vidTrack = window.localstream.getVideoTracks();
    vidTrack.forEach(track => track.enabled = !track.enabled);
    muteCameraButton.innerHTML=muteCameraButton.innerHTML===('<i class="fas fa-video-slash" aria-hidden="true"></i>' 
    || '<i class="fas fa-video-slash"></i>')?
     '<i class="fas fa-video" aria-hidden="true"></i>' : '<i class="fas fa-video-slash" aria-hidden="true"></i>';

    unblurBtn.disabled = !unblurBtn.disabled;
    blurBtn.disabled = !blurBtn.disabled;

    unblurBtn.hidden = true;
    blurBtn.hidden = false;
    lVideo.hidden = false;
    canvas.hidden = true;
})

//mute mic
muteAudioButton.addEventListener('click', function muteMic() {
    window.localstream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    muteAudioButton.innerHTML=muteAudioButton.innerHTML===('<i class="fas fa-microphone-slash" aria-hidden="true"></i>' ||
    '<i class="fas fa-microphone-slash"></i>')? 
    '<i class="fas fa-microphone" aria-hidden="true"></i>' : '<i class="fas fa-microphone-slash" aria-hidden="true"></i>';
  })

//share screen
document.getElementById("shareScreen").addEventListener('click', (e)=>{
    navigator.mediaDevices.getDisplayMedia({
        video:{
            cursor: "always",
            height: 580,
            width: 740


        },
        audio:{
            echoCancellation: true,
            noiseSuppression: true
        }
    }).then((stream)=>{
          let videoTrack=stream.getVideoTracks()[0];
          if(!currentPeer) {
              console.log("NO current peer found!");
          }
          // else {
          // }

          console.log("currentPeer.getSenders() is ");
          console.log(currentPeer.getSenders());
          var sender=currentPeer.getSenders().find(function(s){
              console.log(s);
              console.log(videoTrack);
              if(s.track.kind==videoTrack.kind)
                  console.log("match found");
              return s.track.kind==videoTrack.kind;
          })
          if(sender) {
              sender.replaceTrack(videoTrack);
              videoTrack.onended=function(){
                      sender.replaceTrack(window.localstream.getVideoTracks()[0]);
              }
          }
          else {
              console.log("sender is undefined or null or something unreasonable");
          }
    }).catch((err)=>{
        console.error("unable to get display " + err);
    })
})

//blur background
blurBtn.addEventListener('click', e => {
    console.log("blur button clicked..");
    blurBtn.hidden = true;
    unblurBtn.hidden = false;
  
    lVideo.hidden = true;
    canvas.hidden = false;
    
    console.log("Before loadbodypix()");
    loadBodyPix();
    try{
      var blurbgStream = canvas.captureStream();
      blurBg.srcObject=blurbgStream;
      console.log("blurBg " + blurBg.srcObject);
      let videoTrack=blurBg.captureStream().getVideoTracks()[0];

      if(!blurbgStream){
        console.log("stream null");
      }
      console.log("currentPeer "+currentPeer);
      console.log("canvas stream "+blurbgStream);

      var sender=currentPeer.getSenders().find(function(s){
        console.log(s);
        console.log(blurbgStream);
        if(s.track.kind==videoTrack.kind)
            console.log("match found");
        return s.track.kind==videoTrack.kind;
      })
      if(sender) {
          sender.replaceTrack(videoTrack)
      }
      console.log("After loadbodypix()");
    }
    catch(err){
      console.log("BODYPIX...");

      console.log(err.message);
    } 
});

unblurBtn.addEventListener('click', e => {
  blurBtn.hidden = false;
  unblurBtn.hidden = true;

  lVideo.hidden = false;
  canvas.hidden = true;
  let videoTrack=window.localstream.getVideoTracks()[0];
  var sender=currentPeer.getSenders().find(function(s){
    if(s.track.kind==videoTrack.kind)
      console.log("match found");
    return s.track.kind==videoTrack.kind;
  })
  if(sender) {
    sender.replaceTrack(videoTrack);
  }
});

function loadBodyPix() {
  var options = {
    multiplier: 0.75,
    stride: 32,
    quantBytes: 4
  }
  
  bodyPix.load(options)
    .then(net => perform(net))
    .catch(err => {
      console.log("inside bodypix.load");
      console.log(err);
    })
}
  
async function perform(net) {
  while (blurBtn.hidden) {
    const segmentation = await net.segmentPerson(lVideo);
    const backgroundBlurAmount = 6;
    const edgeBlurAmount = 2;
    const flipHorizontal = false;

    bodyPix.drawBokehEffect(
      canvas, lVideo, segmentation, backgroundBlurAmount,
      edgeBlurAmount, flipHorizontal);
  }
}

//record screen
async function init(constraints) {
  try {
    const recordStream = await navigator.mediaDevices.getDisplayMedia(constraints);
    handleSuccess(recordStream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
  }
}

async function getTheStream(){
  const constraints = {
    video: true,
    audio: true
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
}

getScreenStream.addEventListener('click', ()=>{
  getTheStream();
})
recordButton.addEventListener('click', () => {
    console.log("record btn clicked");
    startRecording();
});

playButton.addEventListener('click', () => {
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});


downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {type: 'video/mp4'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.mp4';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  recordedBlobs = [];
  let options = {mimeType: 'video/webm;codecs=vp9,opus'};
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.start();
  mediaRecorder.ondataavailable = handleDataAvailable;
  console.log('MediaRecorder started', mediaRecorder);
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);

    playButton.disabled = false;
    downloadButton.disabled = false;
  };
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream) {
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;
}
