from flask import Flask, render_template, request, session, url_for, redirect
from flask_socketio import SocketIO

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


if __name__ == '__main__':
    session = {}
    socketio.run(app, debug=True)
