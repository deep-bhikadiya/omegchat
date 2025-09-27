import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import ChatBox from "../components/ChatBox";

const SIGNALING_SERVER = process.env.REACT_APP_SIGNALING || "http://localhost:3001";

export default function Talk() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [searching, setSearching] = useState(false);
  const peerIdRef = useRef(null);
  const remoteDescSetRef = useRef(false);

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);

    // get camera/mic
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(err => console.error(err));

    socketRef.current.on("partner-found", handlePartnerFound);
    socketRef.current.on("signal", handleSignal);
    socketRef.current.on("partner-left", handlePartnerLeft);
    socketRef.current.on("chat-message", ({ message }) => pushMsg({ from: "peer", text: message }));
    socketRef.current.on("no-user-online", () => pushEvent("Finding..."));

    return () => stopEverything();
  }, []);

  const pushEvent = text => setMessages(prev => [...prev, { event: true, text }]);
  const pushMsg = msg => setMessages(prev => [...prev, msg]);

  function createPeer(partnerId, initiator = false) {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

    // Remote track
    pc.ontrack = e => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.loop = false;
      }
      remoteDescSetRef.current = true;
      setSearching(false);
    };

    // ICE candidates
    pc.onicecandidate = e => {
      if (e.candidate) socketRef.current.emit("signal", { to: partnerId, data: { candidate: e.candidate } });
    };

    // Data channel
    if (initiator) {
      const dc = pc.createDataChannel("chat");
      dataChannelRef.current = dc;
      dc.onmessage = e => pushMsg({ from: "peer", text: e.data });
    } else {
      pc.ondatachannel = e => {
        dataChannelRef.current = e.channel;
        dataChannelRef.current.onmessage = ev => pushMsg({ from: "peer", text: ev.data });
      };
    }

    return pc;
  }

  async function handlePartnerFound({ partnerId, initiator }) {
    peerIdRef.current = partnerId;
    const pc = createPeer(partnerId, initiator);

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("signal", { to: partnerId, data: offer });
    }
    pushEvent("Paired with stranger");
  }

  async function handleSignal({ from, data }) {
    if (!pcRef.current) createPeer(from, false);

    if (data.type === "offer") {
      await pcRef.current.setRemoteDescription({ type: "offer", sdp: data.sdp });
      remoteDescSetRef.current = true;
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socketRef.current.emit("signal", { to: from, data: answer });
    } else if (data.type === "answer") {
      await pcRef.current.setRemoteDescription({ type: "answer", sdp: data.sdp });
      remoteDescSetRef.current = true;
    } else if (data.candidate && remoteDescSetRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  function handlePartnerLeft() {
    pushEvent("Partner disconnected");
    stopSearch();
  }

  function startSearch() {
    stopSearch();
    setMessages([]);
    setSearching(true);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.src = process.env.PUBLIC_URL + "/assets/loader.mp4";
      remoteVideoRef.current.loop = true;
      remoteVideoRef.current.play();
    }
    socketRef.current.emit("find");
    pushEvent("Searching for a stranger...");
  }

  function stopSearch() {
    setSearching(false);
    socketRef.current.emit("stop-find");
    stopConnection();
    setMessages([]);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.src = "";
      remoteVideoRef.current.loop = true;
    }
  }
  

  function stopConnection() {
    peerIdRef.current = null;
    remoteDescSetRef.current = false;

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.ondatachannel = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    dataChannelRef.current = null;

    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      remoteVideoRef.current.srcObject = null;
    }
  }

  function stopEverything() {
    stopConnection();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    socketRef.current.disconnect();
  }

  function sendMessage(text) {
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(text);
      pushMsg({ from: "me", text });
    } else pushEvent("Not connected — message not sent");
  }

  return (
    <div className="talk-page">
    <div className="video-row">
      <div className="video-wrap">
        <video
          ref={localVideoRef}
          className="video local"
          autoPlay
          muted
          playsInline
        />
        <div className="label">You</div>
      </div>
      <div className="video-wrap">
        <video
          ref={remoteVideoRef}
          className="video remote"
          autoPlay
          playsInline
          loop
          src=""
        />
        <div className="label">Stranger</div>
      </div>
    </div>
  
    <div className="controls-chat">
      <div className="controls">
        {/* <button
          className={`btn ${searching ? "danger" : "primary"}`}
          onClick={searching ? stopSearch : startSearch}
        >
          {searching ? "Stop & Find Another" : "Find"}
        </button> */}
        <button
          className="btn primary"
          onClick={startSearch}
        >
          Find
        </button>
        <button
          className="btn danger"
          disabled={searching}
          onClick={stopSearch}
        >
          Stop
        </button>
      </div>
  
      <div className="chatbox">
        <ChatBox messages={messages} onSend={sendMessage} />
      </div>
    </div>
  </div>
  
  );
}
