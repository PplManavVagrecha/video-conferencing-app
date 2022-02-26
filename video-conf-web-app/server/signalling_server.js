const WebSocket = require('ws');

const SERVER_PORT = 8081;

const wss = new WebSocket.Server({port : SERVER_PORT}, ()=>{
    console.log('Signalling server is now listening to port : '+SERVER_PORT);
});

wss.broadcast = (ws, data)=>{
    wss.clients.forEach((client)=>{
        if(client !== ws && client.readyState === WebSocket.OPEN){
            client.send(data);
        }
    });
};

wss.on('connection', ws=>{
    console.log('Client Connected. Total Connected Clients : '+`${wss.clients.size}`);
    ws.on('message', message=>{
        console.log(message + "\n\n");
        wss.broadcast(ws, message);
    })

    ws.on('close', ws=> {
        console.log('Client Disconnected. Total Connected Clients : '+`${wss.clients.size}`)
    })

    ws.on('error', ws=> {
        console.log('Client error. Total Connected Clients : '+`${wss.clients.size}`)
    })
})