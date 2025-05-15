const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess} = require('chess.js');
const path = require('path');
const { title } = require('process');

const app = express();

const server = http.createServer(app);
const io = socket(server); //need to be inserted in both the front and backned 

const chess = new Chess();
let players = {};
let currentPlayer = 'w'; // 'w' for white, 'b' for black

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));


app.get("/", (req, res) => {
    res.render("index" , {title : "Chess Game"});
});

io.on("connection", function(uniquesocket){
    console.log("connected");
    
    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole" , "w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole" , "b");
    }
    else{
        uniquesocket.emit("spectatorRole")
    }

    uniquesocket.on("disconnect", function(){
        if (uniquesocket.id == players.white){
            delete players.white;
        }
        else if (uniquesocket.id == players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move", (move)=>{
        try{ 
            if (chess.turn() == 'w' && uniquesocket.id != players.white) return; // if we use to play the move again after our chance(w) our move will be returned that is not marked .. we can only move after the opp. move 
            if (chess.turn() == 'b' && uniquesocket.id != players.black) return; // if we use to play the move again after our chance(b) our move will be returned that is not marked .. we can only move after the opp. move

            const result = chess.move(move); // player moved
            if (result){
                currentPlayer = chess.turn(); 
                io.emit("move", move); // move done
                io.emit("boardState", chess.fen()) //updating in board
            }
            else{
                console.log("Invalid move :", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch(err){
            console.log(err);
            uniquesocket.emit("Invalid Play", move);
        }
        
    })
});

server.listen(3000,function(){
    console.log("started at 3000")
});