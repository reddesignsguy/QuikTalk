import "./style.css";
// import {initializeApp} from 'firebase/app';
// import {getAuth} from 'firebase/auth';
// import  {getFirestore, collection, doc} from 'firebase/firestore';

// import firebase from 'firebase/compat/app';
// import 'firebase/compat/auth';
// import 'firebase/compat/firestore';
import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMikUAIHBG-SBJQz7WHsmOzDv3YRNIguc",
  authDomain: "quiktalk-3a3e6.firebaseapp.com",
  projectId: "quiktalk-3a3e6",
  storageBucket: "quiktalk-3a3e6.appspot.com",
  messagingSenderId: "589746581332",
  appId: "1:589746581332:web:34e76005c639dedbdba2c1",
  measurementId: "G-LZSEVDRKQP",
};

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// STUN servers
const servers = {
  // Free STUN servers from Google
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Set up P2P connection and the global state of this user
let pc = null;
let callerCallDoc = null; // Set to the call doc of the current call; only possible to be set by the caller
let localStream = null;
let remoteStream = null;

// Webpage elements
const webcamButton = document.getElementById("webcamButton");
const webcamVideo = document.getElementById("webcamVideo");
const callButton = document.getElementById("callButton");
const callInput = document.getElementById("callInput");
const answerButton = document.getElementById("answerButton");
const remoteVideo = document.getElementById("remoteVideo");
const hangupButton = document.getElementById("hangupButton");
const changeNameButton = document.getElementById("changeNameButton");
const errorRoom = document.getElementById("errorRoom");
const errorName = document.getElementById("errorName");
const roomID = document.getElementById("roomID");
const displayName = document.getElementById("displayName");
const nameInput = document.getElementById("nameInput");
const callSelection = document.getElementById("callSelection");
const title = document.getElementById("title");
const videos = document.getElementById("videos");

const username = document.getElementById("username");
const remoteUsername = document.getElementById("remoteUsername");

const videosSection = document.getElementById("videos");
const section1 = document.getElementById("section1");
const section2 = document.getElementById("section2");

// Configure webpage elements
videosSection.style.display = "none";
section2.style.display = "none";

// State variables
var name = ""; // Set this equal to the input value

// If username already saved, go to home page (lock page if not)
if ((name = getCookie("name")) != "") {
  renderHome();
} else {
  renderLock();
}

// Function to get cookies
function getCookie(key) {
  key = key + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }

    if (c.indexOf(key) == 0) {
      return c.substring(key.length, c.length);
    }
  }

  return "";
}

// Function change cookies!
function changeCookie(key) {
  document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// 1. Setup media sources
async function renderHome() {
  pc = new RTCPeerConnection(servers);

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // Congfigure webpage elements
  title.style.fontSize = "medium";
  section1.style.display = "none"; // Make name selection section disappear
  videosSection.style.display = "block"; // Make videos section appear
  section2.style.display = "block"; // Make call selection section appear
  callSelection.style.display = "block";
  changeNameButton.style.display = "block";
  displayName.innerHTML = "Welcome " + name + "!";
  hangupButton.style.display = "none";
  username.innerHTML = name; // Show name
  roomID.innerHTML = "";
  videos.style.borderColor = "gray";
  remoteUsername.innerHTML = "";
  changeNameButton.style.display = "block";


  webcamVideo.srcObject = localStream; // Set local webcam up
  remoteVideo.srcObject = remoteStream; // Set remote webcam up

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
}

// Wireframing lock to home page
webcamButton.onclick = async () => {

  // Invalid name checking
  if (nameInput.value == "") 
    setErrorName("Name cannot be empty");
  else if (nameInput.value.length > 30) 
    setErrorName("Name must be less than 30 characters long");
  else {  // Name is valid
    // Save name cookie
    document.cookie = "name=" + nameInput.value;
    name = nameInput.value;
    renderHome();

    setErrorName("");
  }
};

// Render lock page
async function renderLock() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  // disconnect webcam
  if (localStream != null) {
    localStream.getTracks()[0].stop();

    webcamVideo.pause();
    webcamVideo.srcObject = null;

    localStream.getAudioTracks()[0].enabled =
      !localStream.getAudioTracks()[0].enabled;
    localStream = null;
    console.log("Changing name");
  }

  // rerender html
  callSelection.style.display = "none";
  section1.style.display = "block";
  section2.style.display = "none";
  videos.style.borderColor = "yellow";
  webcamButton.disabled = false;
  videos.style.display = "none";

  // reset cookie
  changeCookie("name");
}

// Wireframing home to lock page
changeNameButton.onclick = renderLock;

// 2. Create offer (For the caller)
callButton.onclick = async () => {
  // Reference firestore collections for signaling
  const newRoomID = createID(4);                                  // Create room ID of 4 characters
  const callDoc = firestore.collection("calls").doc(newRoomID);
  const offerCandidates = callDoc.collection("offerCandidates");
  const answerCandidates = callDoc.collection("answerCandidates");

  // Configure state variables and webpage elements
  callerCallDoc = callDoc;
  roomID.innerHTML = "Room number: " + newRoomID;
  hangupButton.style.display = "block";
  callSelection.style.display = "none";
  videos.style.borderColor = "yellow";
  changeNameButton.style.display = "none";

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
    name: name,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();

    // If caller is waiting for answer (i.e: signalling state is stable), get answer
    if (!(pc.signalingState == "stable") && data?.answer) {
      // Set answer description
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);

      // Get answerer's name
      remoteUsername.innerHTML = data.answer.name;
    }
  });

  // Listen for remote ICE candidates
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  // Wait for a new peer if current callee disconnected
  pc.oniceconnectionstatechange = function () {
    if (pc.iceConnectionState == "disconnected") {

      // Set new local offer; Must be done to reset signallingState to have-local-offer and allow new remote answer
      pc.setLocalDescription(offer);

      // Delete answer field in DB
      callDoc.update({
        ["answer"]: firebase.firestore.FieldValue.delete(),
      });

      // Configure web elements from the answerer
      remoteUsername.innerHTML = "";

      // Create new video stream for remote peer
      remoteStream = new MediaStream();

      // Pull new tracks from remote stream to remote video
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      // Set remote video's src object to video stream
      remoteVideo.srcObject = remoteStream;
    }
  };
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection("calls").doc(callId);
  const answerCandidates = callDoc.collection("answerCandidates");
  const offerCandidates = callDoc.collection("offerCandidates");

  const callData = (await callDoc.get()).data();

  // Error if room doesn't exist
  if (callData == null) {
    setErrorRoom("Room doesn't exist");
    return;
  }

  // Error if room is full
  if (callData["answer"] != null) {
    setErrorRoom("Room is full");
    return;
  }

  setErrorRoom("");

  

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
    name: name,
  };

  await callDoc.update({ answer });
  remoteUsername.innerHTML = callData.offer.name;

  // Configure web elements
  roomID.innerHTML = "Room number: " + callDoc.id;
  hangupButton.style.display = "block";
  callSelection.style.display = "none";
  videos.style.borderColor = "yellow";
  changeNameButton.style.display = "none";

  // Get new ICE candidates from caller
  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === "added") {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  // Wait for a new peer if current caller disconnected
  pc.oniceconnectionstatechange = function () {
    if (pc.iceConnectionState == "disconnected") {
      console.log("caller disconnected");
      pc.close();
      renderHome();
    }
  };
};


// Set the error message for a failed room join
function setErrorRoom(message) {
  errorRoom.innerHTML = message;
}

// Set the error message for a failed name change
function setErrorName(message) {
  errorName.innerHTML = message;
}

// Hang up button
hangupButton.onclick = async () => {
  // callerCallDoc can only be != null if the one pressing button is the caller
  // This delete the room ID from the database
  if (callerCallDoc != null){
    callerCallDoc.delete();
    callerCallDoc = null;
  }

  pc.close();
  renderHome();
};

// Create's a randomly generated ID of a given length
function createID(length) {
  var result           = '';
  var possibleChars       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charsLength = possibleChars.length;
  for ( var i = 0; i < length; i++ ) {
      result += possibleChars.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
}