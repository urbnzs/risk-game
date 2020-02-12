let socket = io.connect('http://' + document.domain + ':' + location.port);
let gameCells = document.querySelectorAll('.game-cell');
let gameBoard = document.getElementById('game-board');
let player = document.getElementById('game-board').getAttribute('data-player');
let color = document.getElementById('game-board').getAttribute('data-color');
let startRound = 0;


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
        let xcoord = clickedTarget.getAttribute('data-coordinate-x');
        let ycoord = clickedTarget.getAttribute('data-coordinate-y');
        let cellOwner = clickedTarget.getAttribute('data-owner')
        if (startingRound() || nextCellChecker(xcoord, ycoord, cellOwner) || surroundedChecker()) {
            socket.emit('attack', {
            coordinateX: clickedTarget.getAttribute('data-coordinate-x'),
            coordinateY: clickedTarget.getAttribute('data-coordinate-y'),
                activePlayer: player,
                activeColor: color
            })
            gameBoard.removeEventListener('click', clickHandler);
            socket.emit('next player', player);
        }
        }
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

function startingRound() {
    if (startRound < 2) {
        startRound ++
    }
    if (startRound <= 1) {
        return true
    } else {
        return false
    }

}

function nextCellChecker(xCoord, yCoord, cellOwner) {
    let upperCell = 0
    for (let gameCell of gameCells) {
        if (parseInt(yCoord) - 1 === parseInt(gameCell.dataset.coordinateY) && xCoord === gameCell.dataset.coordinateX) {
            upperCell = gameCell
        }
    }


    let underCell = 0
    for (let gameCell of gameCells) {
        if (parseInt(yCoord) + 1 === parseInt(gameCell.dataset.coordinateY) && xCoord === gameCell.dataset.coordinateX) {
            underCell = gameCell
        }
    }

    let rightCell = 0
    for (let gameCell of gameCells) {
        if (yCoord === gameCell.dataset.coordinateY && parseInt(xCoord) + 1  === parseInt(gameCell.dataset.coordinateX)) {
            rightCell = gameCell
        }
    }

    let leftCell = 0
    for (let gameCell of gameCells) {
        if (yCoord === gameCell.dataset.coordinateY && parseInt(xCoord) - 1  === parseInt(gameCell.dataset.coordinateX)) {
            leftCell = gameCell
        }
    }

    let leftUpperCell = 0
    for (let gameCell of gameCells) {
        if (parseInt(yCoord) + 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(xCoord) - 1  === parseInt(gameCell.dataset.coordinateX)) {
            leftUpperCell = gameCell
        }
    }

    let rightUpperCell = 0
    for (let gameCell of gameCells) {
        if (parseInt(yCoord) + 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(xCoord) + 1  === parseInt(gameCell.dataset.coordinateX)) {
            rightUpperCell = gameCell
        }
    }

    let leftUnderCell = 0
    for (let gameCell of gameCells) {
        if (parseInt(yCoord) - 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(xCoord) - 1  === parseInt(gameCell.dataset.coordinateX)) {
            leftUnderCell = gameCell
        }
    }

    let rightUnderCell = 0
    for (let gameCell of gameCells) {
        if (parseInt(yCoord) - 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(xCoord) + 1  === parseInt(gameCell.dataset.coordinateX)) {
            rightUnderCell = gameCell
        }
    }

    let result = false

    if (cellOwner === 'None' && upperCell !== 0) {
        console.log('upper cell nem üres')
        if (upperCell.dataset.owner === player) {
            result = true
        }
    }

    if (cellOwner === 'None' && underCell !== 0) {
        if (underCell.dataset.owner === player) {
            result = true
        }
    }
    if (cellOwner === 'None' && rightCell !== 0) {
        if (rightCell.dataset.owner === player) {
            result = true
        }
    }
    if (cellOwner === 'None' && leftCell !== 0) {
        if (leftCell.dataset.owner === player) {
            result = true
        }
    }
    if (cellOwner === 'None' && leftUpperCell !== 0) {
        if (leftUpperCell.dataset.owner === player) {
            result = true
        }
    }

    if (cellOwner === 'None' && rightUpperCell !== 0) {
        if (rightUpperCell.dataset.owner === player) {
            result = true
        }
    }

    if (cellOwner === 'None' && leftUnderCell !== 0) {
        if (leftUnderCell.dataset.owner === player) {
            result = true
        }
    }

    if (cellOwner === 'None' && rightUnderCell !== 0) {
        if (rightUnderCell.dataset.owner === player) {
            result = true
        }
    }

    return result

}


function surroundedChecker() {
    let emptyNextCells = 0
    for (let gameCell of gameCells) {
        if (nextCellChecker(gameCell.dataset.coordinateX, gameCell.dataset.coordinateY, gameCell.dataset.owner)) {
            emptyNextCells ++
        }
    }
    console.log(emptyNextCells)
    if (emptyNextCells > 0) {
        return false
    } else {
        return true
    }
}

















