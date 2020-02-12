let socket = io.connect('http://' + document.domain + ':' + location.port);
let gameCells = document.querySelectorAll('.game-cell');
let gameBoard = document.getElementById('game-board');
let player = document.getElementById('game-board').getAttribute('data-player');
let color = document.getElementById('game-board').getAttribute('data-color');


function findGameCell(coordinateX, coordinateY) {
    for (let gameCell of gameCells) {
        if (gameCell.dataset.coordinateX === coordinateX && gameCell.dataset.coordinateY === coordinateY) {
            return gameCell;
        }
    }
}


function marker(coordinateX, coordinateY, activePlayer, activeColor) {
    let gameCell = findGameCell(coordinateX, coordinateY);
    gameCell.innerHTML = 'X';
    gameCell.setAttribute('data-owner', activePlayer);
    gameCell.setAttribute('color', activeColor);
}


function beforeMarker(coordinateX, coordinateY, activePlayer, activeColor) {
    let gameCell = findGameCell(coordinateX, coordinateY);
    if (gameCell.hasAttribute('data-owner')) {
        socket.emit('roll dices', {
            num1: 10,
            num2: 5,
            coordinateX: coordinateX,
            coordinateY: coordinateY,
            activePlayer: activePlayer,
            activeColor: activeColor
        })
    } else {
        marker(coordinateX, coordinateY, activePlayer, activeColor)
    }
}


function clickHandler(t) {
    if (t.target.className === 'game-cell') {
        let clickedTarget = t.target;
        socket.emit('attack', {
            coordinateX: clickedTarget.getAttribute('data-coordinate-x'),
            coordinateY: clickedTarget.getAttribute('data-coordinate-y'),
            activePlayer: player,
            activeColor: color
        })
    }
    gameBoard.removeEventListener('click', clickHandler);
    socket.emit('next player', player);

}


socket.on('attacker win', function (dict) {
        let gameCell = findGameCell(dict.coordinateX, dict.coordinateY);
        gameCell.removeAttribute('data-owner');
        beforeMarker(gameCell.getAttribute('data-coordinate-x'),
            gameCell.getAttribute('data-coordinate-y'), dict["active_player"], dict["active_color"], gameCell)
    }
);


socket.on('connect', function () {
    socket.emit('start')
});


socket.on('stream attack', function (data) {
    beforeMarker(data.coordinateX, data.coordinateY, data.activePlayer, data.activeColor)
});


socket.on('start game', function (activePlayer) {
    console.log("activePlayer: " + activePlayer);
    console.log("player: " + player);
    if (activePlayer === player) {
        gameBoard.addEventListener('click', clickHandler);
    }
});