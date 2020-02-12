from flask import Flask, render_template, request, session, url_for, redirect
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
    row_num = 10
    col_num = 10
    if len(session) == 2:
        start()
    return render_template('session.html', row_num=row_num, col_num=col_num, player=player, color=player_color)


@socketio.on('start')
def start():
    print(session)
    global players
    players = [session['Player 1'], session['Player 2']]
    print(players)
    socketio.emit('start game', session['Player 1'])


@socketio.on('attack')
def handle_my_custom_event(json):
    print(f"main.py > json")
    socketio.emit('stream attack', json)


@socketio.on('next player')
def next_player(currentPlayer):
    print("main.py > next_player func")
    if players[0] != currentPlayer:
        socketio.emit('start game', players[0])
    else:
        socketio.emit('start game', players[1])


@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html')


@socketio.on('roll dices')
def roll_dices(dict):
    print(dict)
    # game_cell, active_player, active_color
    att_num = dict['num1']
    def_num = dict['num2']
    xcoord = dict['xcoord']
    ycoord = dict['ycoord']
    active_player = dict['activePlayer']
    active_color = dict['activeColor']
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
        print(def_dices)
        if att_dices[0] <= i:
            att_num -= 1
        else:
            def_num -= 1
        att_dices.remove(att_dices[0])
        def_dices.remove(def_dices[0])

    if att_num != 0 and def_num != 0:
        roll_dices(
            {'num1': att_num, 'num2': def_num, 'xcoord': xcoord, 'ycoord': ycoord, 'activePlayer': active_player,
             'activeColor': active_color})
    elif def_num == 0:
        socketio.emit('attacker win',
                      {'att_num': att_num, 'xcoord': xcoord, 'ycoord': ycoord, 'active_player': active_player,
                       'active_color': active_color})
    elif att_num == 0:
        print("DEFENDER WIN")


if __name__ == '__main__':
    session = {}
    socketio.run(app, debug=True)
