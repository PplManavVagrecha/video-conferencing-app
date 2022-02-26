import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { DataService } from './service/data.service';
import { Message } from './types/message';

const mediaConstraints={
  audio:true,
  video: {
    width: 720,
    height: 540
  }
};

const offerOptions = {
  offerToReceiveAudio : true,
  offerToReceiveVideo : true
}

@Component({
  selector: 'app-video-stream',
  templateUrl: './video-stream.component.html',
  styleUrls: ['./video-stream.component.css']
})
export class VideoStreamComponent implements AfterViewInit {

  private localStream : MediaStream;
  private peerConnection : RTCPeerConnection;
  @ViewChild('localVideo', {static:false}) private localVideo : ElementRef;
  @ViewChild('recievedVideo', {static:false}) private receivedVideo : ElementRef;

  constructor(private dataService: DataService) { }

  ngAfterViewInit(): void {
    this.addIncomingMessageHandler();
    this.requestMediaDevices();
  }

  private async requestMediaDevices(): Promise<void>{
    this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    this.pauseLocalVideo();
  }

  private fetchLocalStream(start : boolean){
    this.localStream.getTracks().forEach(track =>{
      track.enabled = start;
    });
    if(!start){
      this.localVideo.nativeElement.srcObject = undefined 
    }else{
      this.localVideo.nativeElement.srcObject = this.localStream 
    }
  }

  private fetchTracks(){
    this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
  }
  
  private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent)=>{
    console.log(event);
    this.dataService.sendMessage({
        type: 'ice-candidate',
        data: event.candidate
      }
    )
  }

  private handleIceConnectionStateChangeEvent = (event: Event)=>{
    console.log(event);
    switch(this.peerConnection?.iceConnectionState){
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }

  private handleSignalingStateEvent = (event: Event)=>{
    console.log(event);
    switch(this.peerConnection?.iceConnectionState){
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  private handleTrackEvent = (event: RTCTrackEvent)=>{
    console.log(event);
    this.receivedVideo.nativeElement.srcObject = event.streams[0];
  }

  private createPeerConnection(): void{
    this.peerConnection = new RTCPeerConnection({
      iceServers:[
        {
          urls: ['stun:stun.services.mozilla.org'],
        },
      ]
    })

    this.peerConnection.onicecandidate = this.handleIceCandidateEvent;
    this.peerConnection.onicegatheringstatechange = this.handleIceConnectionStateChangeEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }
  
  private handleGetUserMediaError(err: Error){
    switch(err.name){
      case 'NotFoundError':
        alert('unable to open your call because no camera or microphone were found!');
        break;
      case 'Security Error':
      case 'PermissionDeniedError':
        break;
      default:
        console.log("Error : "+err);
        break
    }
    this.closeVideoCall();
  }

  private handleOfferMessage(data: any): void{
    if(!this.peerConnection){
      this.createPeerConnection();
    }

    if(!this.localStream){
      this.startLocalVideo();
    }

    this.peerConnection.setRemoteDescription(new RTCSessionDescription(data))
    .then(()=>{
      this.localVideo.nativeElement.srcObject = this.localStream;
      this.fetchTracks();
    }).then(()=>{
      return this.peerConnection.createAnswer();
    }).then((ans)=>{
      return this.peerConnection.setLocalDescription(ans);
    }).then(()=>{
      this.dataService.sendMessage({
        type: 'answer', 
        data: this.peerConnection.localDescription
      })
    }).catch(this.handleGetUserMediaError);
  }

  private handleAnswerMessage(data: any): void{
    this.peerConnection.setRemoteDescription(data);
  }

  private handleHangupMessage(msg: Message): void{
    this.closeVideoCall();
  }

  private handleIceCandidatesMessage(data: any): void{
    this.peerConnection.addIceCandidate(data)
    .catch(err => console.log('Error : '+ err));
  }



  private closeVideoCall(): void{
    if(this.peerConnection){
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onicegatheringstatechange = null;
      this.peerConnection.onsignalingstatechange = null;
      this.peerConnection.ontrack = null;

      this.peerConnection.getTransceivers().forEach(transceiver =>{
        transceiver.stop();
      });

      this.peerConnection.close();
      this.peerConnection= null!;
    }
  }

  private addIncomingMessageHandler(): void{
    this.dataService.connect();

    this.dataService.messages$.subscribe(msg=>{
      switch(msg.type){
        case 'offer':
          this.handleOfferMessage(msg.data);
          break;
        case 'answer':
          this.handleAnswerMessage(msg.data);
          break;
        case 'hangup':
          this.handleHangupMessage(msg);
          break;
        case 'ice-candidate':
          this.handleIceCandidatesMessage(msg.data);
          break;
        default:
          console.log('unknown msg type');
      }
    },err => console.log(err))
  }

  pauseLocalVideo(): void{
    this.fetchLocalStream(false);
  }

  startLocalVideo(): void{
    this.fetchLocalStream(true);
  }

  async call(): Promise<void>{
    this.createPeerConnection();

    if(this.peerConnection){
      this.fetchTracks();

      try{
        const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer(offerOptions);
        await this.peerConnection.setLocalDescription(offer);

        this.dataService.sendMessage({type: 'offer', data: offer})
      }catch(err: any){
        this.handleGetUserMediaError(err);
      }
    }
  }

  hangUp(): void{
    this.dataService.sendMessage({
      type: 'hangup',
      data: ''
    })

    this.closeVideoCall();
  }
}
