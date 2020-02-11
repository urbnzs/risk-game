from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'vnkdjnfjknfl1232#'
socketio = SocketIO(app)


@app.route('/')
def sessions():
    row_num = 10
    col_num = 10
    return render_template('session.html', row_num=row_num, col_num=col_num)

@socketio.on('my event')
def handle_my_custom_event(json):
    socketio.emit('my response', json)



if __name__ == '__main__':
    socketio.run(app, debug=True)
