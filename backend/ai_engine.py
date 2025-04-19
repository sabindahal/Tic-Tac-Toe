
import math
EMPTY, X, O = 0, 1, 2 
import random         

WIN_LINES = [
    (0,1,2), (3,4,5), (6,7,8),
    (0,3,6), (1,4,7), (2,5,8),
    (0,4,8), (2,4,6)
]

def winner(board):
    for a,b,c in WIN_LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None if EMPTY in board else 0  # 0 = draw

def minimax(board, player, depth, alpha, beta):
    w = winner(board)
    if w is not None:                 # terminal
        return {X: 1, O: -1, 0: 0}[w] * (10 - depth), None

    best_score = -math.inf if player == X else math.inf
    best_move  = None

    for i, cell in enumerate(board):
        if cell == EMPTY:
            board[i] = player
            score, _ = minimax(board, 3-player, depth+1, alpha, beta)
            board[i] = EMPTY

            if player == X:           # maximising
                if score > best_score:
                    best_score, best_move = score, i
                alpha = max(alpha, best_score)
            else:                     # minimising
                if score < best_score:
                    best_score, best_move = score, i
                beta = min(beta, best_score)

            if beta <= alpha: break   # prune

    return best_score, best_move

def best_move(board, turn, difficulty="hard"):
    empty = [i for i,x in enumerate(board) if x == EMPTY]
    if difficulty == "easy":
        return random.choice(empty)
    if difficulty == "medium":
        # 30 % random, 70 % optimal
        if random.random() < 0.3:
            return random.choice(empty)

    # ensure AI acts as X (1) internally – flip if needed
    board_norm = [X if x==turn else O if x and x!=turn else EMPTY for x in board]
    _, move = minimax(board_norm, X, 0, -math.inf, math.inf)
    # move is calculated on normalised board; indices are identical
    return move
