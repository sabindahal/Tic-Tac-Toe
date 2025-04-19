from flask import Flask, request, jsonify
from ai_engine import best_move 
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    data       = request.get_json()
    board      = data['board']
    difficulty = data.get('difficulty', 'medium')
    move       = best_move(board, turn=2, difficulty=difficulty)  
    return jsonify({'move': move})

if __name__ == '__main__':
    app.run(debug=True)
