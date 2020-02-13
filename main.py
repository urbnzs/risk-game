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
        print(f"players: {players}")
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
    all_att_dices = []
    all_def_dices = []

    def inner_roll(input_dict):
        att_num = input_dict['num1']
        def_num = input_dict['num2']
        coordinateX = input_dict['coordinateX']
        coordinateY = input_dict['coordinateY']
        active_player = input_dict['activePlayer']
        active_color = input_dict['activeColor']
        att_dices = []
        def_dices = []
        for i in range(att_num):
            att_dices.append(random.randint(1, 6))
            if att_num >= 3 and len(att_dices) == 3:
                att_dices.sort(reverse=True)
                break
            elif att_num == 2 and len(att_dices) == 2:
                att_dices.sort(reverse=True)
                break
        for i in range(def_num):
            def_dices.append(random.randint(1, 6))
            if def_num >= 2 and len(def_dices) == 2:
                def_dices.sort(reverse=True)
                break
        str_att_dices = ''
        str_def_dices = ''
        for element in att_dices:
            str_att_dices += f'{element} '
        for element in def_dices:
            str_def_dices += f'{element} '
        all_att_dices.append(str_att_dices)
        all_def_dices.append(str_def_dices)

        while len(att_dices) > 0 and len(def_dices) > 0:
            if att_dices[0] <= def_dices[0]:
                att_num -= 1
            else:
                def_num -= 1
            att_dices.remove(att_dices[0])
            def_dices.remove(def_dices[0])

        if att_num != 0 and def_num != 0:
            input_dict['num1'] = att_num
            input_dict['num2'] = def_num
            return inner_roll(input_dict)
        else:
            return {'att_num': att_num, 'def_num': def_num, 'coordinateX': coordinateX, 'coordinateY': coordinateY,
                'active_player': active_player,
                'active_color': active_color}

    output_dict = inner_roll(input_dict)
    output_dict['attackerX'] = input_dict['attackerX']
    output_dict['attackerY'] = input_dict['attackerY']
    output_dict['remainingUnits'] = str(input_dict['remainingUnits'])
    socketio.emit('show dices', {'att_dices': all_att_dices, 'def_dices': all_def_dices})
    if output_dict['def_num'] == 0:
        print("ATTACKER WIN")
        socketio.emit('attacker win', output_dict)
    elif output_dict['att_num'] == 0:
        print("DEFENDER WIN")
        socketio.emit('defender win',
                      {'def_num': output_dict['def_num'], 'coordinateX': input_dict['coordinateX'],
                       'coordinateY': input_dict['coordinateY'],
                       'attackerX': input_dict['attackerX'],
                       'attackerY': input_dict['attackerY'],
                       'remainingUnits': str(input_dict['remainingUnits'])
                       })


if __name__ == '__main__':
    session = {}
    socketio.run(app, host="10.44.9.91", port=5000, debug=True)
