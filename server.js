const express=require("express");
const app=express();
const http=require('http').Server(app);
const io=require('socket.io')(http);
const PORT=process.env.PORT || 4000;

http.listen(PORT, ()=>{
    console.log("listening on port "+PORT);
});

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});

app.use(express.static('public'));

io.on('connection', (socket)=>{
    console.log("client connected "+socket.id);
    socket.on('userMessage', (data)=>{
        io.sockets.emit('userMessage', data)
    });
    socket.on('userTyping', (data)=>{
        socket.broadcast.emit('userTying', data);
    });
});