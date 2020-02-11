from flask import Flask, render_template, request, session, url_for, redirect
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'vnkdjnfjknfl1232#'
socketio = SocketIO(app)

players = {}


@app.route('/', methods=["GET", "POST"])
def sessions():
    if request.method == 'POST':
        player = request.form['player']
        session[f"Player {len(players) + 1}"] = player

    row_num = 10
    col_num = 10
    print(session)
    if len(session) == 2:
        start()

    return render_template('session.html', row_num=row_num, col_num=col_num, player=player)


@socketio.on('start')
def start():
    print(session[0].value())

    socketio.emit('startGame', session[0].value())


@socketio.on('my event')
def handle_my_custom_event(json):
    socketio.emit('my response', json)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        player = request.form['player']
        session[f"Player {len(session) + 1}"] = player
        return redirect('/')

    return render_template('login.html')


if __name__ == '__main__':
    socketio.run(app, debug=True)
