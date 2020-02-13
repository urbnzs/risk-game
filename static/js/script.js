let socket = io.connect('http://' + document.domain + ':' + location.port);
let gameCells = document.querySelectorAll('.game-cell');
let gameBoard = document.getElementById('game-board');
let player = document.getElementById('game-board').getAttribute('data-player');
let color = document.getElementById('game-board').getAttribute('data-color');
let startRound = 0;

function findGameCell(coordinateX, coordinateY) {
    let result = 'None'
    for (let gameCell of gameCells) {
        if (parseInt(gameCell.dataset.coordinateX) === parseInt(coordinateX)
            && parseInt(gameCell.dataset.coordinateY) === parseInt(coordinateY)) {
            result = gameCell;
        }
    }
    return result
}


function marker(coordinateX, coordinateY, activePlayer, activeColor, gameCell) {
    console.log('marker');
    gameCell.innerHTML = gameCell.getAttribute('data-unit-deploy');
    gameCell.setAttribute('data-owner', activePlayer);
    gameCell.setAttribute('color', activeColor);
}


function beforeMarker(coordinateX, coordinateY, activePlayer, activeColor) {
    let gameCell = findGameCell(coordinateX, coordinateY);
    console.log(player);
    console.log(activePlayer);
    if (gameCell.dataset.owner !== 'None' && gameCell.dataset.owner !== player && activePlayer === player) {
        let attackerCell = chooseAttacker(coordinateX, coordinateY)
        let chosenAttackerUnits = attackerUnitChoose(attackerCell[0] - 1)
        console.log('chosen attacker units: ' + chosenAttackerUnits);
        socket.emit('roll dices', {
            num1: parseInt(chosenAttackerUnits),
            num2: parseInt(gameCell.dataset.unitDeploy),
            remainingUnits: attackerCell[0] - parseInt(chosenAttackerUnits),
            coordinateX: coordinateX,
            coordinateY: coordinateY,
            attackerX: attackerCell[1],
            attackerY: attackerCell[2],
            activePlayer: activePlayer,
            activeColor: activeColor
        })
    } else if (fullTableChecker() === false) {
        marker(coordinateX, coordinateY, activePlayer, activeColor, gameCell)
    }

}
// num1: attacker, num2: defender


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
        console.log('attacker win dict: ' + dict)
        let gameCell = findGameCell(dict.coordinateX, dict.coordinateY);
        gameCell.setAttribute('data-owner', 'None');
        gameCell.setAttribute('data-unit-deploy', dict["att_num"]);
        findGameCell(dict['attackerX'], dict['attackerY']).dataset.unitDeploy = dict['remainingUnits'];
        findGameCell(dict['attackerX'], dict['attackerY']).innerHTML = dict['remainingUnits'];
        setTimeout(produceUnits, 1000)
        beforeMarker(gameCell.getAttribute('data-coordinate-x'),
            gameCell.getAttribute('data-coordinate-y'), dict["active_player"], dict["active_color"])
    }
);

socket.on('defender win', function (dict) {
    let gameCell = findGameCell(dict.coordinateX, dict.coordinateY);
    console.log(dict['def_num'])
    gameCell.setAttribute('data-unit-deploy', dict['def_num']);
    gameCell.innerHTML = gameCell.getAttribute('data-unit-deploy');
    findGameCell(dict['attackerX'], dict['attackerY']).dataset.unitDeploy = dict['remainingUnits'];
    findGameCell(dict['attackerX'], dict['attackerY']).innerHTML = dict['remainingUnits'];
    setTimeout(produceUnits, 1000)
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
    }
});


function chooseAttacker(coordinateX, coordinateY) {
    let potentialAttackers = []

    let gameCell = 0

    let loopList = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]]

    for (let cellCoord of loopList) {
        if (findGameCell(parseInt(coordinateX) + cellCoord[0],
            parseInt(coordinateY) + cellCoord[1]) !== 'None') {
            if (findGameCell(parseInt(coordinateX) + cellCoord[0],
                parseInt(coordinateY) + cellCoord[1]).dataset.owner === player) {
                gameCell = findGameCell(parseInt(coordinateX) + cellCoord[0],
                    parseInt(coordinateY) + cellCoord[1])
                let appendList = [parseInt(gameCell.dataset.unitDeploy), gameCell.dataset.coordinateX, gameCell.dataset.coordinateY]
                console.log(appendList)
                potentialAttackers.push(appendList)
            }
        }
    }

    return potentialAttackers.sort(function(x,y){return y[0] - x[0];})[0]
}

function produceUnits(){
    for (let gameCell of gameCells) {
        gameCell.dataset.unitDeploy = (parseInt(gameCell.dataset.unitDeploy) + 1).toString();
        gameCell.innerHTML = gameCell.dataset.unitDeploy
    }
}

function attackerUnitChoose(maxUnits){
    let units = prompt(`Choose up to ${maxUnits} units to attack with.`, maxUnits)
    let result = 0
    if (Number.isInteger(parseInt(units)) === false) {
        result = attackerUnitChoose(maxUnits)
    } else if (parseInt(units) > maxUnits) {
        result = attackerUnitChoose(maxUnits)
    } else {
        result = parseInt(units)
    }

    return result
}


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
    return emptyNextCells <= 0;
}


function fullTableChecker() {
    let emptyCells = 0;
    for (let gameCell of gameCells) {
        if (gameCell.dataset.owner === 'None') {
            emptyCells++;
        }
    }
    if (emptyCells > 0) {
        return false
    } else {
        return true
    }

}


