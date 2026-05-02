// const gameBoard = document.querySelector("#gameboard")
const playerdisplay = document.querySelector("#player")
// Assuming pices.js is loaded before this script

const gameBoard = document.querySelector("#gameboard");
const width = 8;

function createBoard() {
    for (let i = 0; i < width * width; i++) {
        const square = document.createElement('div');
        square.classList.add('square');

        const row1 = 8 - Math.floor(i / 8);
        const column = String.fromCharCode(97 + (i % 8));
        square.id = column + row1;

        const row = Math.floor((63 - i) / 8) + 1;
        if (row % 2 === 0) {
            square.classList.add(i % 2 === 0 ? 'white' : 'black');
        } else {
            square.classList.add(i % 2 === 0 ? 'black' : 'white');
        }
        gameBoard.append(square);
    }
}

function getPieceHTML(piece) {
    const pieces = {
        'p': Bpawn, 'r': Brook, 'n': Bknight, 'b': Bbishop, 'q': Bqueen, 'k': Bking,
        'P': pawn, 'R': rook, 'N': knight, 'B': bishop, 'Q': queen, 'K': king
    };
    return pieces[piece] || '';
}

function boardState(fen) {
    const [position] = fen.split(' '); // Split the FEN string, we only need the first part for position
    const rows = position.split('/');

    // Clear previous pieces from the board
    document.querySelectorAll('.square').forEach(square => {
        square.innerHTML = '';
    });

    rows.forEach((row, rowIndex) => {
        let colIndex = 0;

        for (const char of row) {
            if (isNaN(char)) {
                const piece = getPieceHTML(char);
                const squareId = String.fromCharCode(97 + colIndex) + (8 - rowIndex);
                const square = document.getElementById(squareId);
                if (square) {
                    square.innerHTML = piece;
                }
                colIndex++;
            } else {
                colIndex += parseInt(char);
            }
        }
    });
    // console.log(boardSquaresArray);
}
// const fen = '8/7P/8/k7/8/8/6p1/K61';
// const fen = '7k/7p/8/8/8/8/P7/7K';
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

createBoard();
boardState(fen)

function getinit() {
    isNewGame = true;
    document.getElementById("loader").style.display = "inline-flex"; // Show loader
    hideGameOver();

    setTimeout(() => {
        boardState(fen);
        setupBoardSquares();
        setupPieces();
        fillBoardSquaresArray();
        isWhiteTurn = true;
        playerInTurn()
        whiteKingMoved = false;
        blackKingMoved = false;
        whiteRookAMoved = false; // a1 rook
        whiteRookHMoved = false; // h1 rook
        blackRookAMoved = false; // a8 rook
        blackRookHMoved = false; // h8 rook
        document.getElementById("whiteCaptured").innerHTML = "";
        document.getElementById("blackCaptured").innerHTML = "";
        isNewGame = false;  // Reset flag after initialization
        // clearHighlights()

        document.getElementById("loader").style.display = "none"; // Hide loader
    }, 1000);
}

