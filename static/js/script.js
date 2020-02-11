var socket = io.connect('http://' + document.domain + ':' + location.port);

let gameCells = document.querySelectorAll('.game-cell');

function marker(coordinateX, coordinateY){
    for (let gameCell of gameCells) {
        if (gameCell.dataset.coordinateX === coordinateX && gameCell.dataset.coordinateY === coordinateY) {
            gameCell.innerHTML = 'X';
        }
    }

}
socket.on('connect', function () {
    $.each(gameCells, function() {
        $('.game-cell').on('click', function () {
            marker(this.dataset.coordinateX, this.dataset.coordinateY)
            let xcoord = this.dataset.coordinateX;
            let ycoord = this.dataset.coordinateY;
            socket.emit('my event', {
                xcoord: xcoord,
                ycoord: ycoord
            })
        })

    })
})

socket.on('my response', function (msg) {
    marker(msg.xcoord, msg.ycoord)
    })