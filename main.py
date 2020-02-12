from flask import Flask, render_template, request, session, redirect
from flask_socketio import SocketIO
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'vnkdjnfjknfl1232#'
# ENVIRONMENT VARIABLEKÉNT BEÁLLÍTANI MINDENKINÉL
socketio = SocketIO(app)


@app.route('/', methods=["GET", "POST"])
def sessions():
    if request.method == 'POST':
        player = request.form['player']
        session[f"Player {len(session) + 1}"] = player
        player_color = f'color{len(session)}'
    try:
        return render_template('session.html', row_num=4, col_num=4, player=player, color=player_color)
    except UnboundLocalError:
        return redirect('/login')


@socketio.on('start')
def start():
    global players
    try:
        players = [session['Player 1'], session['Player 2']]
        socketio.emit('start game', session['Player 1'])
    except KeyError:
        pass


@socketio.on('attack')
def handle_my_custom_event(json):
    socketio.emit('stream attack', json)


@socketio.on('next player')
def next_player(currentPlayer):
    if players[0] != currentPlayer:
        socketio.emit('start game', players[0])
    else:
        socketio.emit('start game', players[1])


@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html')


@socketio.on('roll dices')
def roll_dices(input_dict):
    att_num = input_dict['num1']
    def_num = input_dict['num2']
    print(input_dict)
    coordinateX = input_dict['coordinateX']
    coordinateY = input_dict['coordinateY']
    active_player = input_dict['activePlayer']
    active_color = input_dict['activeColor']
    att_dices = []
    def_dices = []
    for i in range(att_num):
        att_dices.append(random.randint(0, 7))
        if len(att_dices) == 3:
            att_dices.sort()
            break
    for i in range(def_num):
        def_dices.append(random.randint(0, 7))
        if len(def_dices) == 2:
            def_dices.sort()
            break
    for i in def_dices:
        if att_dices[0] <= i:
            att_num -= 1
        else:
            def_num -= 1
        att_dices.remove(att_dices[0])
        def_dices.remove(def_dices[0])

    if def_num == 0:
        socketio.emit('attacker win',
                      {'att_num': att_num, 'coordinateX': coordinateX, 'coordinateY': coordinateY,
                       'active_player': active_player,
                       'active_color': active_color})
    elif att_num == 0:
        print("DEFENDER WIN")


if __name__ == '__main__':
    session = {}
    socketio.run(app, debug=True)
