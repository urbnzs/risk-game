let socket = io.connect('http://' + document.domain + ':' + location.port);
let gameCells = document.querySelectorAll('.game-cell');
let gameBoard = document.getElementById('game-board');
let player = document.getElementById('game-board').getAttribute('data-player');
let color = document.getElementById('game-board').getAttribute('data-color');
let startRound = 0;
let diceModal = document.getElementById('dice-button');
let closeButton = document.querySelector('.btn-secondary');


function findGameCell(coordinateX, coordinateY) {
    for (let gameCell of gameCells) {
        if (gameCell.dataset.coordinateX === coordinateX && gameCell.dataset.coordinateY === coordinateY) {
            return gameCell;
        }
    }
}


function marker(coordinateX, coordinateY, activePlayer, activeColor, gameCell) {
    console.log('marker');
    gameCell.innerHTML = activePlayer;
    gameCell.setAttribute('data-owner', activePlayer);
    gameCell.setAttribute('color', activeColor);
}


function beforeMarker(coordinateX, coordinateY, activePlayer, activeColor) {
    console.log('BEFORE MARKER');
    let gameCell = findGameCell(coordinateX, coordinateY);
    console.log(player);
    console.log(activePlayer);
    if (gameCell.dataset.owner !== 'None' && gameCell.dataset.owner !== activePlayer) {
        console.log('beforeMarker initiated');
        socket.emit('roll dices', {
            num1: 10,
            num2: 5,
            coordinateX: coordinateX,
            coordinateY: coordinateY,
            activePlayer: activePlayer,
            activeColor: activeColor
        })
    } else {
        marker(coordinateX, coordinateY, activePlayer, activeColor, gameCell)
    }

}


function showDiceRolls() {
    let modalContent = document.querySelector('#modalLong');
    modalContent.classList.add('show');
    modalContent.setAttribute('style', 'display: block; padding-right: 15px;');
    let bodyContent = document.getElementsByTagName('BODY')[0];
    bodyContent.classList.add('modal-open');
    closeButton.addEventListener('click', hideDiceRolls);
}


function hideDiceRolls(){
    let modalContent = document.querySelector('#modalLong');
    modalContent.classList.remove('show');
    modalContent.removeAttribute('style');
}


function clickHandler(t) {
    console.log('clickHandler');
    if (t.target.className === 'game-cell') {
        let clickedTarget = t.target;
        let coordinateX = clickedTarget.getAttribute('data-coordinate-x');
        let coordinateY = clickedTarget.getAttribute('data-coordinate-y');
        let cellOwner = clickedTarget.getAttribute('data-owner');
        console.log(startingRound());
        console.log(nextCellChecker(coordinateX, coordinateY, cellOwner));
        console.log(surroundedChecker());
        if (startingRound() || nextCellChecker(coordinateX, coordinateY, cellOwner) || surroundedChecker()) {
            if (cellOwner === 'None' || fullTableChecker()) {
                socket.emit('attack', {
                    coordinateX: clickedTarget.getAttribute('data-coordinate-x'),
                    coordinateY: clickedTarget.getAttribute('data-coordinate-y'),
                    activePlayer: player,
                    activeColor: color
                });
                if (cellOwner !== player) {
                    gameBoard.removeEventListener('click', clickHandler);
                    socket.emit('next player', player);
                }
            }

        }
    }
}


socket.on('attacker win', function (dict) {
        let gameCell = findGameCell(dict.coordinateX, dict.coordinateY);
        gameCell.setAttribute('data-owner', 'None');
        beforeMarker(gameCell.getAttribute('data-coordinate-x'),
            gameCell.getAttribute('data-coordinate-y'), dict["active_player"], dict["active_color"])
    });


socket.on('connect', function () {
    console.log('connect');
    socket.emit('start')
});


socket.on('stream attack', function (data) {
    beforeMarker(data.coordinateX, data.coordinateY, data.activePlayer, data.activeColor)
});


socket.on('start game', function (activePlayer) {
    if (activePlayer === player) {
        gameBoard.addEventListener('click', clickHandler);
        diceModal.addEventListener('click', showDiceRolls);
    }
});


function startingRound() {
    if (startRound < 2) {
        startRound++
    }
    return startRound <= 1;

}


function nextCellChecker(coordinateX, coordinateY, cellOwner) {
    let upperCell = 0;
    for (let gameCell of gameCells) {
        if (parseInt(coordinateY) - 1 === parseInt(gameCell.dataset.coordinateY) && coordinateX === gameCell.dataset.coordinateX) {
            upperCell = gameCell
        }
    }


    let underCell = 0;
    for (let gameCell of gameCells) {
        if (parseInt(coordinateY) + 1 === parseInt(gameCell.dataset.coordinateY) && coordinateX === gameCell.dataset.coordinateX) {
            underCell = gameCell
        }
    }

    let rightCell = 0;
    for (let gameCell of gameCells) {
        if (coordinateY === gameCell.dataset.coordinateY && parseInt(coordinateX) + 1 === parseInt(gameCell.dataset.coordinateX)) {
            rightCell = gameCell
        }
    }

    let leftCell = 0;
    for (let gameCell of gameCells) {
        if (coordinateY === gameCell.dataset.coordinateY && parseInt(coordinateX) - 1 === parseInt(gameCell.dataset.coordinateX)) {
            leftCell = gameCell
        }
    }

    let leftUpperCell = 0;
    for (let gameCell of gameCells) {
        if (parseInt(coordinateY) + 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(coordinateX) - 1 === parseInt(gameCell.dataset.coordinateX)) {
            leftUpperCell = gameCell
        }
    }

    let rightUpperCell = 0;
    for (let gameCell of gameCells) {
        if (parseInt(coordinateY) + 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(coordinateX) + 1 === parseInt(gameCell.dataset.coordinateX)) {
            rightUpperCell = gameCell
        }
    }

    let leftUnderCell = 0;
    for (let gameCell of gameCells) {
        if (parseInt(coordinateY) - 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(coordinateX) - 1 === parseInt(gameCell.dataset.coordinateX)) {
            leftUnderCell = gameCell
        }
    }

    let rightUnderCell = 0;
    for (let gameCell of gameCells) {
        if (parseInt(coordinateY) - 1 === parseInt(gameCell.dataset.coordinateY)
            && parseInt(coordinateX) + 1 === parseInt(gameCell.dataset.coordinateX)) {
            rightUnderCell = gameCell
        }
    }

    let result = false;

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && upperCell !== 0) {
            if (upperCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && upperCell !== 0) {
            if (upperCell.dataset.owner === player) {
                result = true
            }
        }

    }

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && underCell !== 0) {
            if (underCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && underCell !== 0) {
            if (underCell.dataset.owner === player) {
                result = true
            }
        }
    }

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && rightCell !== 0) {
            if (rightCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && rightCell !== 0) {
            if (rightCell.dataset.owner === player) {
                result = true
            }
        }
    }

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && leftCell !== 0) {
            if (leftCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && leftCell !== 0) {
            if (leftCell.dataset.owner === player) {
                result = true
            }
        }
    }

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && leftUpperCell !== 0) {
            if (leftUpperCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && leftUpperCell !== 0) {
            if (leftUpperCell.dataset.owner === player) {
                result = true
            }
        }
    }

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && rightUpperCell !== 0) {
            if (rightUpperCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && rightUpperCell !== 0) {
            if (rightUpperCell.dataset.owner === player) {
                result = true
            }
        }
    }


    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && leftUnderCell !== 0) {
            if (leftUnderCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && leftUnderCell !== 0) {
            if (leftUnderCell.dataset.owner === player) {
                result = true
            }
        }
    }

    if (fullTableChecker() === false) {
        if (cellOwner === 'None' && rightUnderCell !== 0) {
            if (rightUnderCell.dataset.owner === player) {
                result = true
            }
        }
    } else {
        if (cellOwner !== player && rightUnderCell !== 0) {
            if (rightUnderCell.dataset.owner === player) {
                result = true
            }
        }
    }

    return result

}


function surroundedChecker() {
    let emptyNextCells = 0;
    for (let gameCell of gameCells) {
        if (nextCellChecker(gameCell.dataset.coordinateX, gameCell.dataset.coordinateY, gameCell.dataset.owner)) {
            emptyNextCells++
        }
    }
    console.log(emptyNextCells);
    return emptyNextCells <= 0;
}


function fullTableChecker() {
    let emptyCells = 0;
    for (let gameCell of gameCells) {
        if (gameCell.dataset.owner === 'None') {
            emptyCells++;
        }
    }
    console.log(emptyCells)
    if (emptyCells > 0) {
        return false
    } else {
        return true
    }

}


socket.on('show dices', function showDices(diceDict) {
    function replaceNums(dices) {
        for (let roll = 0; roll < dices.length; roll++) {
            dices[roll] = dices[roll].replace(/1/g, '⚀');
            dices[roll] = dices[roll].replace(/2/g, '⚁');
            dices[roll] = dices[roll].replace(/3/g, '⚂');
            dices[roll] = dices[roll].replace(/4/g, '⚃');
            dices[roll] = dices[roll].replace(/5/g, '⚄');
            dices[roll] = dices[roll].replace(/6/g, '⚅');
            console.log(roll)
        }

        return dices;
    }

    function showDices(dices) {
        for (let roll = 1; roll < dices[0].length + 1; roll++) {
            document.getElementsByClassName('att_dices')[0].innerHTML += "<p>" +  roll  + ". round attack dices:</p>";
            document.getElementsByClassName('att_dices')[0].innerHTML += "<p>" + dices[0][roll - 1] + "</p>";
            document.getElementsByClassName('att_dices')[0].innerHTML += "<p>" +  roll  + ". round defend dices:</p>";
            document.getElementsByClassName('att_dices')[0].innerHTML += "<p>" + dices[1][roll - 1] + "</p>";
        }
    }
    document.getElementsByClassName('att_dices')[0].innerHTML = "";
    diceDict['att_dices'] = replaceNums(diceDict['att_dices']);
    diceDict['def_dices'] = replaceNums(diceDict['def_dices']);
    showDices([diceDict['att_dices'], diceDict['def_dices']])

});