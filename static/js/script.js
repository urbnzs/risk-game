var socket = io.connect('http://' + document.domain + ':' + location.port);

let gameCells = document.querySelectorAll('.game-cell');

let gameBoard = document.getElementById('game-board');

let player = document.getElementById('game-board').getAttribute('data-player');

function marker(coordinateX, coordinateY, activePlayer) {
    for (let gameCell of gameCells) {
        if (gameCell.dataset.coordinateX === coordinateX && gameCell.dataset.coordinateY === coordinateY) {
            gameCell.innerHTML = 'X';
            gameCell.setAttribute('data-owner', player);

        }
    }

}

socket.on('connect', function () {
    socket.emit('start')
});


function clickHandler(t) {
    if (t.target.className === 'game-cell') {
        let clickedTarget = t.target;
        let xcoord = clickedTarget.getAttribute('data-coordinate-x');
        let ycoord = clickedTarget.getAttribute('data-coordinate-y');
        socket.emit('my event', {
            xcoord: xcoord,
            ycoord: ycoord,
            activePlayer: player
        })
    }
    gameBoard.removeEventListener('click', clickHandler);
    socket.emit('next player', player);

}


socket.on('my response', function (msg) {
    marker(msg.xcoord, msg.ycoord, msg.activePlayer)
});

socket.on('start game', function (activePlayer) {
    console.log("activePlayer: " + activePlayer);
    console.log("player: " + player);
    if (activePlayer === player) {
        gameBoard.addEventListener('click', clickHandler);
    }
});