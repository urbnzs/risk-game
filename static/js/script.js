var socket = io.connect('http://' + document.domain + ':' + location.port);
let gameCells = document.querySelectorAll('.game-cell');
let gameBoard = document.getElementById('game-board');
let player = document.getElementById('game-board').getAttribute('data-player');
let color = document.getElementById('game-board').getAttribute('data-color');

function marker(coordinateX, coordinateY, activePlayer, activeColor, gameCell) {
    for (let gameCell of gameCells) {
        if (gameCell.dataset.coordinateX === coordinateX && gameCell.dataset.coordinateY === coordinateY) {

            gameCell.innerHTML = 'X';
            gameCell.setAttribute('data-owner', activePlayer);
            gameCell.setAttribute('color', activeColor);
        }
    }
}


function beforeMarker(coordinateX, coordinateY, activePlayer, activeColor) {
    for (let gameCell of gameCells) {
        if (gameCell.dataset.coordinateX === coordinateX && gameCell.dataset.coordinateY === coordinateY) {

            if (gameCell.hasAttribute('data-owner')) {
                socket.emit('roll dices', {
                    num1: 10,
                    num2: 5,
                    xcoord: coordinateX,
                    ycoord: coordinateY,
                    activePlayer: activePlayer,
                    activeColor: activeColor
                })
            } else {
                marker(coordinateX, coordinateY, activePlayer, activeColor)

            }
        }
    }
}

socket.on('attacker win', function (dict) {
        let xcoord = dict.xcoord;
        let ycoord = dict.ycoord;
        let activePlayer = dict.active_player;
        let activeColor = dict.active_color;
        for (let gameCell of gameCells) {
            if (gameCell.dataset.coordinateX === xcoord && gameCell.dataset.coordinateY === ycoord) {

                gameCell.removeAttribute('data-owner')
                beforeMarker(gameCell.getAttribute('data-coordinate-x'), gameCell.getAttribute('data-coordinate-y'), activePlayer, activeColor, gameCell)
            }
        }
    }
)


socket.on('connect', function () {
    socket.emit('start')
});


function clickHandler(t) {
    if (t.target.className === 'game-cell') {
        let clickedTarget = t.target;
        let xcoord = clickedTarget.getAttribute('data-coordinate-x');
        let ycoord = clickedTarget.getAttribute('data-coordinate-y');
        socket.emit('attack', {
            xcoord: xcoord,
            ycoord: ycoord,
            activePlayer: player,
            activeColor: color

        })
    }
    gameBoard.removeEventListener('click', clickHandler);
    socket.emit('next player', player);

}


socket.on('stream attack', function (data) {
    beforeMarker(data.xcoord, data.ycoord, data.activePlayer, data.activeColor)
});

socket.on('start game', function (activePlayer) {
    console.log("activePlayer: " + activePlayer);
    console.log("player: " + player);
    if (activePlayer === player) {
        gameBoard.addEventListener('click', clickHandler);
    }
});