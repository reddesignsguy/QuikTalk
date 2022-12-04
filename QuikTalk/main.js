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

// Set up P2P connection and the global state
let pc = null;
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

if ((name = getCookie("name")) != "") {
  console.log("username found");
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

// Function change cookies

function changeCookie(key) {
  document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// 1. Setup media sources

async function renderHome() {
  pc = new RTCPeerConnection(servers);

  pc.addEventListener("iceconnectionstatechange", (event) => {
    if (pc.iceConnectionState === "failed") {
      console.log("CONNECTION FAILED!!!")
      pc.restartIce();
    }
  });
  
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
  roomID.innerHTML= "";
  videos.style.borderColor = "gray";
  remoteUsername.innerHTML = "";

  webcamVideo.srcObject = localStream; // Set local webcam up
  remoteVideo.srcObject = remoteStream; // Set remote webcam up

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
}

// Wireframing lock to home page
webcamButton.onclick = async () => {
  console.log(name);
  if (nameInput.value == "") {
    console.log("no valid name");
    window.alert("Enter a name");
  } else {
    console.log("storing username");
    document.cookie = "name=" + nameInput.value;
    name = nameInput.value;
    renderHome();
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

// 2. Create offer
callButton.onclick = async () => {
  // Reference firestore collections for signaling
  const callDoc = firestore.collection("calls").doc();
  const offerCandidates = callDoc.collection("offerCandidates");
  const answerCandidates = callDoc.collection("answerCandidates");

  roomID.innerHTML = "Room number: " + callDoc.id;
  hangupButton.style.display = "block";
  callSelection.style.display = "none";
  videos.style.borderColor = "yellow";

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
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
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


};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection("calls").doc(callId);
  const answerCandidates = callDoc.collection("answerCandidates");
  const offerCandidates = callDoc.collection("offerCandidates");

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
    name: name,
  };

  pc.addEventListener("iceconnectionstatechange", (event) => {
    if (pc.iceConnectionState === "failed") {
      console.log("CONNECTION FAILED!!!")
      pc.restartIce();
    }
  });

  await callDoc.update({ answer });
  remoteUsername.innerHTML = callData.offer.name;

  roomID.innerHTML = "Room number: " + callDoc.id;
  hangupButton.style.display = "block";
  callSelection.style.display = "none";
  videos.style.borderColor = "yellow";


  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === "added") {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });

  });

  // addEventListener('iceconnectionstatechange', (event) => { console.log("test")});
};

hangupButton.onclick = async () => {
  pc.close();
  renderHome();
};
