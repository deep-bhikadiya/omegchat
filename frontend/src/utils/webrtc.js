export function createPeerConnection({ onTrack, onIceCandidate, onDataChannel }){
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.ontrack = (ev) => {
    onTrack && onTrack(ev.streams[0]);
  };
  pc.onicecandidate = (ev) => {
    if(ev.candidate) onIceCandidate && onIceCandidate(ev.candidate);
  };
  pc.ondatachannel = (ev) => {
    onDataChannel && onDataChannel(ev.channel);
  };
  return pc;
}
