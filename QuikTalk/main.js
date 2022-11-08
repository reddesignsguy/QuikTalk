import './style.css'
import javascriptLogo from './javascript.svg'
import { setupCounter } from './counter.js'
import firebase from 'firebase/app';
import 'firebase/firestore';


// Set up P2P connection and the global state
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;


// STUN servers
const servers = {

  // Free STUN servers from Google
  iceServers: [
    {
    urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    }
  ],
  iceCandidatePoolSize: 10,
}

// Webpage elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');


document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p> 
  </div>
`

setupCounter(document.querySelector('#counter'))
