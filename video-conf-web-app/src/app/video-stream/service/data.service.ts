import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Message } from '../types/message'
export const WS_ENDPOINT = "ws://localhost:8081";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private socket$?: WebSocketSubject<any>;
  public messageSubject = new Subject<Message>();
  public messages$ = this.messageSubject.asObservable();

  constructor() { }

  public connect(): void{
    this.socket$ = this.getNewWebSocket();

    this.socket$.subscribe(msg=>{
      console.log("Message Received! \n type: "+msg.type);
      this.messageSubject.next(msg);
    })
  }

  sendMessage(msg: Message): void{
    console.log('sending Message : '+ msg.type);
    this.socket$?.next(msg);
  }

  private getNewWebSocket(){
    return webSocket({
      url : WS_ENDPOINT,
      openObserver: {
        next: ()=>{
          console.log('Data Service : connection OK');
        }
      },
      closeObserver: {
        next: () =>{
          console.log('Data Service : connection Closed');
          this.socket$ = undefined;
          this.connect();
        }
      }
    });
  }
}
