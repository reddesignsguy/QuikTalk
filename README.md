# QuikTalk

QuikTalk is where you can "quik talk", or video call with anyone in the world in just five seconds.


Features:
- Video/Audio calling between two people with near-instantaneous connection speeds
- No login/signup required
- Microphone/Webcam disabling option for privacy concerns
- NO 3RD PARTY COOKIES!

How-to-use:
1) Download and unzip project
2) In terminal, run..
    a) npm install 
    b) npm install vite
    b) npm run dev
3) In browser (eg. Chrome), open local host as specified by terminal
4) In a DIFFERENT browser (eg. Safari), open same local host
5) Follow the instructions on the local host to use QuikTalk


Contributors and Code links:
1) Albany Patriawan

- Page initialization (main.js 37-72)
- renderHome function (main.js 145)
- name cookie checking (main.js 68-72)
- renderLock webcam disconnection (main.js 119-129)
- Getting camera tracks, waiting for friend's camera, (main.js 145-156, 189-193)
- Creating offer, Waiting for answer, Waiting for ICE candidates, Handling callee disconnection, Retrieving names through DB, Creating room through DB) (main.js 222 - 307)
- Creating answer, joining room through DB, Caller disconnection handling (main.js 310-377) 


2) Shadi Abd El Majid

- Name checking + Cookies (main.js 82-92)
- Microphone/Camera Toggling (main.js 160, 188)
- Error functions (main.js 381-386)
- Cookie functions (main.js 402-429)

3) Joel Zapana
- Cookie functions (main.js 402-429)
- Microphone/Camera Toggling (main.js 160, 188)
- Page initialization (main.js 37-72)
- Start button function (main.js 80)
- Hangup button function (main.js 98)
- HTML layout (index.html)
- CSS (style.css)
- Wireframing (main.js 132-137, 197-218, 230-235... all code modifying HTML element state)
- Room ID creation (main.js 322-400)
