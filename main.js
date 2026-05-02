
let boardSquaresArray = []
let isWhiteTurn = true
let isComputerOn = false
let isNewGame = false;
let whiteKingSquare = "e1";
let blackKingSquare = "e8";
let selectedLevelmyai = 3
let selectedLevelsf = 16
let stockfish = false;
let myai = false;
const boardSquares = document.getElementsByClassName("square")
const pieces = document.getElementsByClassName("piece")
const piecesImages = document.getElementsByTagName("img")
let highlightedSquares = []; // To keep track of highlighted squares
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookAMoved = false; // a1 rook
let whiteRookHMoved = false; // h1 rook
let blackRookAMoved = false; // a8 rook
let blackRookHMoved = false; // h8 rook
const getAimove = true

setupBoardSquares()
setupPieces()
fillBoardSquaresArray()

aihelp()
playerInTurn()
function showCapturePieces(piece, color) {
    const capturedPiece = document.createElement('div');
    capturedPiece.classList.add('cpiece');
    var img = document.createElement('img');
    color == 'white' ? img.src = `src/pieces/${piece}.png` : img.src = `src/pieces/B${piece}.png`;
    img.setAttribute('draggable', 'false');

    capturedPiece.appendChild(img);

    if (color === 'white') {
        document.getElementById('blackCaptured').appendChild(capturedPiece);
    } else {
        document.getElementById('whiteCaptured').appendChild(capturedPiece);
    }
}



function playerInTurn() {
    const playerW = document.getElementById('player-white')
    const playerB = document.getElementById("player-black")
    if (isWhiteTurn) {
        playerW.style.opacity = 1
        playerB.style.opacity = 0.2
    }
    else {
        playerB.style.opacity = 1
        playerW.style.opacity = 0.2

    }


}
function aihelp() {
    let getHelp = document.getElementById("btn")
    if (getAimove) {

        getHelp.disabled = false
    } else {

        getHelp.disabled = true
        getHelp.style.opacity = 0

    }

}
function getAiMove() {
    let fen = generateFEN(boardSquaresArray);
    let pieceColor
    if (!isWhiteTurn && !isComputerOn) {
        pieceColor = "black"
    } else {
        pieceColor = "white"
    }

    getBestMove(fen, selectedLevelsf, (bestMove) => {
        let compStartingSquareId = bestMove.slice(0, 2);
        let compDestinationSquareId = bestMove.slice(2, 4);
        let compLegalSquares = getPossibleMoves(compStartingSquareId, {
            pieceColor: pieceColor,
            pieceType: getPieceAtSquare(compStartingSquareId, boardSquaresArray).pieceType,
            pieceId: getPieceAtSquare(compStartingSquareId, boardSquaresArray).pieceId
        }, boardSquaresArray);


        console.log("computer move", bestMove);
        displayMove(compStartingSquareId, compDestinationSquareId, compLegalSquares);
    });



}

function updateCastlingRights(startingSquareId, pieceType, pieceColor) {
    if (pieceType === 'king') {
        if (pieceColor === 'white') whiteKingMoved = true;
        if (pieceColor === 'black') blackKingMoved = true;
    } else if (pieceType === 'rook') {
        if (pieceColor === 'white') {
            if (startingSquareId === 'a1') whiteRookAMoved = true;
            if (startingSquareId === 'h1') whiteRookHMoved = true;
        }
        if (pieceColor === 'black') {
            if (startingSquareId === 'a8') blackRookAMoved = true;
            if (startingSquareId === 'h8') blackRookHMoved = true;
        }
    }
}

function updateGameOptions() {
    const gameMode = document.getElementById("gameMode").value;

    switch (gameMode) {
        case "localMultiplayer":
            stockfish = false;
            myai = false;
            isComputerOn = false;
            break;
        case "stockfish":
            stockfish = true;
            myai = false;
            isComputerOn = true;
            if (!isWhiteTurn) handleBestMove();
            break;
        case "myai":
            stockfish = false;
            myai = true;
            isComputerOn = true;
            if (!isWhiteTurn) handleBestMove();
            break;
        case "online":
            stockfish = false;
            myai = false;
            isComputerOn = false;
            // online.js takes over via its patched updateGameOptions wrapper
            break;
    }
}


//   function updateGameDepth() {
//     const gameDepthSelect = document.getElementById("gameDepth");
//     // Ensure gameDepthSelect exists before accessing value
//     if (gameDepthSelect.value == 4) {
//       selectedLevel = gameDepthSelect.value;
//       console.log(gameDepthSelect);
//     }
// }

// function populateGameDepthOptions(numOptions) {
//     const gameDepthSelect = document.getElementById("gameDepth");
//     gameDepthSelect.innerHTML = ""; // Clear previous options

//     for (let i = 1; i <= numOptions; i++) {
//         const option = document.createElement("option");
//         option.value = i;
//         option.textContent = `Depth ${i}`;
//         gameDepthSelect.appendChild(option);
//     }
// }


// function populateGameDepthOptions(numOptions) {
//     const gameDepthSelect = document.getElementById("gameDepth");
//     gameDepthSelect.innerHTML = ""; // Clear previous options

//     for (let i = 1; i <= numOptions; i++) {
//         const option = document.createElement("option");
//         option.value = i;
//         option.textContent = `Depth ${i}`;
//         gameDepthSelect.appendChild(option);
//     }
//     // updateGameDepth()
// }

function fillBoardSquaresArray() {
    boardSquaresArray.length = 0
    const boardSquares = document.getElementsByClassName("square");
    for (let i = 0; i < boardSquares.length; i++) {
        let row = 8 - Math.floor(i / 8);
        let column = String.fromCharCode(97 + (i % 8));
        let square = boardSquares[i];
        square.id = column + row;
        let color = "";
        let pieceType = "";
        let pieceId = "";
        if (square.querySelector(".piece")) {
            color = square.querySelector(".piece").getAttribute("color");
            pieceType = square.querySelector(".piece").classList[1];
            pieceId = square.querySelector(".piece").id;
        } else {
            color = "blank";
            pieceType = "blank";
            pieceId = "blank";
        }
        let arrayElement = {
            squareId: square.id,
            pieceColor: color,
            pieceType: pieceType,
            pieceId: pieceId
        };
        boardSquaresArray.push(arrayElement);
    }


}


function generateFEN(boardSquaresArray) {
    let fen = '';
    let emptyCount = 0;

    const pieceTypeToFEN = {
        'pawn': 'p',
        'knight': 'n',
        'bishop': 'b',
        'rook': 'r',
        'queen': 'q',
        'king': 'k',
        'blank': '' // Add blank to handle empty squares
    };

    for (let rank = 8; rank >= 1; rank--) {
        for (let file = 1; file <= 8; file++) {
            let squareId = `${String.fromCharCode(96 + file)}${rank}`;
            let arrayElement = boardSquaresArray.find(element => element.squareId === squareId);

            if (arrayElement) {
                if (arrayElement.pieceType === 'blank') {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    let pieceChar = pieceTypeToFEN[arrayElement.pieceType];
                    if (!pieceChar) {
                        console.error(`Unrecognized piece type: ${arrayElement.pieceType}`);
                        continue; // Skip unrecognized pieces
                    }
                    fen += arrayElement.pieceColor === 'white' ? pieceChar.toUpperCase() : pieceChar.toLowerCase();
                }
            } else {
                emptyCount++;
            }
        }

        if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
        }

        if (rank > 1) {
            fen += '/';
        }
    }

    // Add turn to move
    fen += isWhiteTurn ? ' w' : ' b';

    // Add castling rights
    let castlingRights = '';
    if (!whiteKingMoved) {
        if (!whiteRookHMoved) castlingRights += 'K';
        if (!whiteRookAMoved) castlingRights += 'Q';
    }
    if (!blackKingMoved) {
        if (!blackRookHMoved) castlingRights += 'k';
        if (!blackRookAMoved) castlingRights += 'q';
    }
    fen += ` ${castlingRights || '-'}`;

    return fen;
}







function getBestMove(fen, selectedLevel, callback) {
    let engine = new Worker("./node_modules/stockfish/src/stockfish.js");
    engine.onmessage = function (event) {
        let message = event.data;
        if (message.startsWith("bestmove")) {
            let bestMove = message.split(" ")[1];
            callback(bestMove);
            engine.terminate();
        }
    };
    engine.postMessage("position fen " + fen);
    engine.postMessage(`go depth ${selectedLevel}`);
}



function updateBoardSquaresArray(currentSquareId, destinationSquareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
    );

    let destinationSquareElement = boardSquaresArray.find(
        (element) => element.squareId === destinationSquareId
    );

    let pieceColor = currentSquare.pieceColor;
    let pieceType = currentSquare.pieceType;
    let pieceId = currentSquare.pieceId;
    destinationSquareElement.pieceColor = pieceColor;
    destinationSquareElement.pieceType = pieceType;
    destinationSquareElement.pieceId = pieceId;
    currentSquare.pieceColor = "blank";
    currentSquare.pieceType = "blank";
    currentSquare.pieceId = "blank";
    let fen = generateFEN(boardSquaresArray);

}



function deepCopyArray(array) {
    let arrayCopy = array.map(element => {
        return { ...element };
    });
    return arrayCopy;
}


function playerInCheck(pieceColor) {
    if (pieceColor == "white") {
        // Set or change text based on condition
        message = "WHITE IS IN CHECK";
    }
    if (pieceColor == "black") {
        // Set or change text based on other condition
        message = "BLACK IS IN CHECK";
    }
    showAlert(message)

}

function setupBoardSquares() {
    for (let i = 0; i < boardSquares.length; i++) {
        boardSquares[i].addEventListener("dragover", allowDrop);
        boardSquares[i].addEventListener("drop", drop);

        // // Add touch event listeners for mobile drag-and-drop
        // boardSquares[i].addEventListener("touchstart", touchStart);
        // boardSquares[i].addEventListener("touchmove", touchMove);
        // boardSquares[i].addEventListener("touchend", touchEnd);

        // Add click event listener for tap-to-move
        boardSquares[i].addEventListener("click", handleSquareClick);
    }
}

function setupPieces() {
    for (let i = 0; i < pieces.length; i++) {
        pieces[i].addEventListener("dragstart", drag);
        pieces[i].setAttribute("draggable", true);

        pieces[i].id = pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;

        // Add touch event listeners for mobile drag-and-drop
        // pieces[i].addEventListener("touchstart", touchStart);
        // pieces[i].addEventListener("touchmove", touchMove);
        // pieces[i].addEventListener("touchend", touchEnd);

        // Add click event listener for tap-to-move
        pieces[i].addEventListener("click", handlePieceClick);
    }

    for (let i = 0; i < piecesImages.length; i++) {
        piecesImages[i].setAttribute("draggable", false);
    }
}

// // Touch event handlers
// function touchStart(ev) {
//     ev.preventDefault();
//     const touch = ev.touches[0];
//     const target = document.elementFromPoint(touch.clientX, touch.clientY);
//     if (target.classList.contains("piece")) {
//         drag({ target, dataTransfer: new DataTransfer() });
//     }
//     console.log(ev.currentTarget);
// }
// function touchMove(ev) {
//     ev.preventDefault();
//     const touch = ev.touches[0];
//     const target = document.elementFromPoint(touch.clientX, touch.clientY);
//     if (target.classList.contains("square")) {
//         allowDrop({ preventDefault: () => { } });
//     }
// }
// function touchEnd(ev) {
//     ev.preventDefault();
//     const touch = ev.changedTouches[0];
//     const target = document.elementFromPoint(touch.clientX, touch.clientY);
//     if (target.classList.contains("square")) {
//         drop({ currentTarget: target, dataTransfer: new DataTransfer() });
//     }
// }
let selectedPiece = null;
function allowDrop(ev) {
    ev.preventDefault()
}

function handlePieceClick(ev) {
    const piece = ev.currentTarget;

    // Check if the same piece is being clicked again
    if (selectedPiece === piece) {
        piece.classList.remove("selected");
        clearHighlights();
        selectedPiece = null;
        return;
    }


    if ((isWhiteTurn && piece.getAttribute("color") === "white") || (!isWhiteTurn && piece.getAttribute("color") === "black" && !isComputerOn)) {
        if (selectedPiece) {
            selectedPiece.classList.remove("selected");
        }
        selectedPiece = piece;
        piece.classList.add("selected");

        // Clear previous highlights
        clearHighlights();

        const pieceColor = piece.getAttribute("color");
        const pieceType = piece.classList[1];
        const pieceId = piece.id;
        const startingSquareId = piece.parentNode.id;
        const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId };




        let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
        let legalSquares;

        if (isKingInCheck(kingSquareId, pieceColor, boardSquaresArray)) {
            let validMoves = getValidMovesWhenInCheck(pieceColor, boardSquaresArray);
            legalSquares = validMoves.filter(move => move.from === startingSquareId).map(move => move.to);
        } else if (!isKingInCheck(kingSquareId, pieceColor, boardSquaresArray) && pieceType === "king") {
            let validMoves = getValidMovesWhenInCheck(pieceColor, boardSquaresArray);
            legalSquares = validMoves.filter(move => move.from === startingSquareId).map(move => move.to);
        } else {
            legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
        }
        highlightMove(legalSquares);
    }
    ;
}

function handleSquareClick(ev) {
    const clickedSquare = ev.currentTarget;
    const pieceInSquare = clickedSquare.querySelector(".piece");

    // Check if the clicked square contains a piece of the current player's color
    if (pieceInSquare && (
        (isWhiteTurn && pieceInSquare.getAttribute("color") === "white") ||
        (!isWhiteTurn && pieceInSquare.getAttribute("color") === "black")
    )) {
        return; // Exit if clicking on the current player's piece
    }

    if (selectedPiece) {
        const destinationSquareId = clickedSquare.id;
        const startingSquareId = selectedPiece.parentNode.id;
        const pieceColor = selectedPiece.getAttribute("color");
        const pieceType = selectedPiece.classList[1];
        const pieceId = selectedPiece.id;

        let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
        const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId };

        let legalSquares;

        if (isKingInCheck(kingSquareId, pieceColor, boardSquaresArray)) {
            let validMoves = getValidMovesWhenInCheck(pieceColor, boardSquaresArray);
            legalSquares = validMoves.filter(move => move.from === startingSquareId).map(move => move.to);
        } else {
            legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
        }

        if (legalSquares.includes(destinationSquareId)) {
            displayMove(startingSquareId, destinationSquareId, legalSquares);
        }

        selectedPiece.classList.remove("selected");
        selectedPiece = null;
        clearHighlights();
    }
}



function drag(ev) {
    const piece = ev.target;
    const pieceColor = piece.getAttribute("color");
    const pieceType = piece.classList[1];
    const pieceId = piece.id;
    // console.log(ev);

    if ((isWhiteTurn && pieceColor == "white") || (!isWhiteTurn && pieceColor == "black" && !isComputerOn)) {
        const startingSquareId = piece.parentNode.id;
        ev.dataTransfer.setData("text", piece.id + "|" + startingSquareId);

        // Clear previous highlights
        clearHighlights();

        const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId };
        let legalSquares;

        let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
        console.log(`King Square ID: ${kingSquareId}`);

        if (isKingInCheck(kingSquareId, pieceColor, boardSquaresArray)) {
            console.log(`King is in check: ${pieceColor}`);
            if (!isCheckmate(pieceColor, boardSquaresArray)) {
                playerInCheck(pieceColor);
            }


            // Get only moves that resolve the check
            let validMoves = getValidMovesWhenInCheck(pieceColor, boardSquaresArray);
            legalSquares = validMoves.filter(move => move.from === startingSquareId).map(move => move.to);
        } else if (!isKingInCheck(kingSquareId, pieceColor, boardSquaresArray) && pieceType == "king") {

            let validMoves = getValidMovesWhenInCheck(pieceColor, boardSquaresArray);
            legalSquares = validMoves.filter(move => move.from === startingSquareId).map(move => move.to);
        } else {
            console.log(`King is not in check: ${pieceColor}`);
            // Get all possible moves
            legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
        }

        console.log(`Legal Squares for ${pieceId}:`, legalSquares);


        let legalSquaresJson = JSON.stringify(legalSquares);
        ev.dataTransfer.setData("application/json", legalSquaresJson);
        highlightMove(legalSquares);
    }
}
// Function to move the rook during castling
function moveRookForCastling(startingSquareId, destinationSquareId, boardSquaresArray) {
    let rookPieceObject = getPieceAtSquare(startingSquareId, boardSquaresArray);
    let rookPiece = document.getElementById(rookPieceObject.pieceId);
    let destinationSquare = document.getElementById(destinationSquareId);
    destinationSquare.appendChild(rookPiece);
    updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
}



function displayMove(startingSquareId, destinationSquareId, legalSquares) {
    if (isNewGame) return;
    const pieceObject = getPieceAtSquare(startingSquareId, boardSquaresArray);
    const piece = document.getElementById(pieceObject.pieceId);
    const pieceId = pieceObject.pieceId;
    const pieceColor = pieceObject.pieceColor;
    const pieceType = pieceObject.pieceType;
    const destinationSquare = document.getElementById(destinationSquareId);

    clearHighlights();

    let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);


    if (legalSquares.includes(destinationSquareId) && startingSquareId !== destinationSquareId) {
        let originalSquareContent = { ...squareContent };

        if (pieceType === 'king' && Math.abs(destinationSquareId.charCodeAt(0) - startingSquareId.charCodeAt(0)) === 2) {
            // Handle castling move
            if (destinationSquareId === 'g1' || destinationSquareId === 'g8') {
                // Kingside castling
                let rookStartSquare = pieceColor === 'white' ? 'h1' : 'h8';
                let rookEndSquare = pieceColor === 'white' ? 'f1' : 'f8';
                moveRookForCastling(rookStartSquare, rookEndSquare, boardSquaresArray);
                playSound(castleSound)
            } else if (destinationSquareId === 'c1' || destinationSquareId === 'c8') {
                // Queenside castling
                let rookStartSquare = pieceColor === 'white' ? 'a1' : 'a8';
                let rookEndSquare = pieceColor === 'white' ? 'd1' : 'd8';
                moveRookForCastling(rookStartSquare, rookEndSquare, boardSquaresArray);
                playSound(castleSound)
            }
        }

        // Get the current position of the piece and the destination square
        const startingRect = document.getElementById(startingSquareId).getBoundingClientRect();
        const destinationRect = destinationSquare.getBoundingClientRect();

        // Calculate the offsets
        const offsetX = destinationRect.left - startingRect.left;
        const offsetY = destinationRect.top - startingRect.top;

        // Apply the transformation for animation
        piece.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        // Wait for the transition to complete before actually moving the piece in the DOM
        setTimeout(() => {
            // Clear the transformation
            piece.style.transform = '';

            playSound(moveSound);
            destinationSquare.appendChild(piece);
            updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
            updateCastlingRights(startingSquareId, pieceType, pieceColor);
            lastpiececol = pieceColor === "white" ? "black" : "white";
            let kingSqid = findKingSquare(lastpiececol, boardSquaresArray);
            if (isKingInCheck(kingSqid, lastpiececol, boardSquaresArray)) {
                playSound(checkSound)
                // showAlert(pieceColor === "white" ? "Black is check!" : "White is check!");
                if (!isCheckmate(lastpiececol, boardSquaresArray)) {
                    playerInCheck(lastpiececol);
                }
            }
            let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
            if (isKingInCheck(kingSquareId, pieceColor, boardSquaresArray)) {
                console.log("Move puts king in check, reverting");
                destinationSquare.removeChild(piece);
                document.getElementById(startingSquareId).appendChild(piece);
                updateBoardSquaresArray(destinationSquareId, startingSquareId, boardSquaresArray, originalSquareContent);

                alert("Move puts your king in check. Try a different move. Revert it");
            } else {
                while (destinationSquare.firstChild && destinationSquare.firstChild !== piece) {
                    const capturedPieceElement = destinationSquare.removeChild(destinationSquare.firstChild);
                    const capturedPiece = capturedPieceElement.classList[1]
                    const capturedPieceColor = capturedPieceElement.getAttribute("color")
                    playSound(captureSound);
                    showCapturePieces(capturedPiece, capturedPieceColor)
                }

                isWhiteTurn = !isWhiteTurn;
                playerInTurn()
                // ── Auto-save game after every move ───────────────────────
                if (typeof autoSaveGame === 'function') setTimeout(autoSaveGame, 0);
                if ((pieceType === "pawn" && pieceColor === "white" && destinationSquareId[1] === "8") ||
                    (pieceType === "pawn" && pieceColor === "black" && destinationSquareId[1] === "1")) {
                    if (isComputerOn && isWhiteTurn) {
                        promotePawn(piece, destinationSquare, 'queen', pieceColor); // AI promotes to queen by default
                    } else {
                        showPromotionChoices(piece, destinationSquare, pieceColor);
                    }
                } else {
                    if (isCheckmate(pieceColor === "white" ? "black" : "white", boardSquaresArray)) {
                        // showGlowingText();
                        showGameOver(pieceColor === "white" ? "Black is checkmated!" : "White is checkmated!");

                    }
                    if (isStalemate(pieceColor === "white" ? "black" : "white", boardSquaresArray)) {
                        showAlert("Stalemate!");
                    }
                }
            }

            if (!isWhiteTurn && isComputerOn) {
                setTimeout(() => {
                    handleBestMove();
                }, 0);
            }
        }, 500); // Match this duration with the CSS transition duration
    } else {
        // alert("Invalid move. Please try again.");
        // handleBestMove()
    }
}

function drop(ev) {
    ev.preventDefault();
    const destinationSquareId = ev.currentTarget.id;


    let data = ev.dataTransfer.getData("text");
    let [pieceId, startingSquareId] = data.split("|");
    let legalSquaresJson = ev.dataTransfer.getData("application/json");
    if (legalSquaresJson.length == 0) return;
    let legalSquares = JSON.parse(legalSquaresJson);

    displayMove(startingSquareId, destinationSquareId, legalSquares);
}





function highlightMove(validMoves) {
    for (let item of validMoves) {
        let square = document.getElementById(item);
        if (square) {
            // Create a new div for the highlight
            let highlightDiv = document.createElement('div');
            highlightDiv.classList.add('highlight');
            // Append the highlight div to the square
            square.appendChild(highlightDiv);
            // Store the highlight div for clearing later
            highlightedSquares.push(highlightDiv);
        }
    }
}

function clearHighlights() {
    for (let div of highlightedSquares) {
        // Check if the parent node exists before removing the highlight div
        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }
    }
    highlightedSquares = []; // Clear the array after removing highlights
}




function getPossibleMoves(startingSquareId, piece, boardSquaresArray) {
    const pieceColor = piece.pieceColor
    const pieceType = piece.pieceType
    let legalSquares = []
    if (pieceType == "pawn") {
        legalSquares = getPawnMoves(startingSquareId, pieceColor, boardSquaresArray)
        // console.log(legalSquares);
        return legalSquares;

    }
    if (pieceType == "knight") {
        legalSquares = getKnightMoves(startingSquareId, pieceColor, boardSquaresArray)
        // console.log(legalSquares);
        return legalSquares;

    }
    if (pieceType == "rook") {
        legalSquares = getRookMoves(startingSquareId, pieceColor, boardSquaresArray)
        // console.log(legalSquares);
        return legalSquares;

    }
    if (pieceType == "bishop") {
        legalSquares = getBishopMoves(startingSquareId, pieceColor, boardSquaresArray)
        // console.log(legalSquares);
        return legalSquares;

    }
    if (pieceType == "queen") {
        legalSquares = getQueenMoves(startingSquareId, pieceColor, boardSquaresArray)
        // console.log(legalSquares);
        return legalSquares;

    }
    if (pieceType == "king") {

        legalSquares = getKingMoves(startingSquareId, pieceColor, boardSquaresArray)

        // console.log(legalSquares);
        return legalSquares;

    }

}


function getPieceAtSquare(squareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === squareId
    );
    const color = currentSquare.pieceColor;
    const pieceType = currentSquare.pieceType;
    const pieceId = currentSquare.pieceId;
    return { pieceColor: color, pieceType: pieceType, pieceId: pieceId };
}


function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let file = startingSquareId.charAt(0);
    let rank = parseInt(startingSquareId.charAt(1));
    let direction = pieceColor == "white" ? 1 : -1;
    let startingRank = pieceColor == "white" ? 2 : 7;
    let legalSquares = []
    // Define potential move offsets: forward one square, forward two squares, capture left, capture right
    let moveOffsets = [direction, 2 * direction];
    let captureOffsets = [-1, 1];

    // Check forward moves
    for (let offset of moveOffsets) {
        // Only check the double move if the pawn is on its starting rank
        if (offset === 2 * direction && rank !== startingRank) continue;

        let newRank = rank + offset;
        let currentSquareId = file + newRank;
        // let squareContent = isSquareOccupied(document.getElementById(currentSquareId));
        let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
        // console.log(pieceColor);
        let squareContent = currentSquare.pieceColor;

        if (squareContent === "blank") {
            legalSquares.push(currentSquareId);
        } else {
            break; // If there's a piece directly in front, stop further forward checking
        }
    }

    // Check diagonal captures
    for (let i of captureOffsets) {
        let currentFile = String.fromCharCode(file.charCodeAt(0) + i);
        if (currentFile >= "a" && currentFile <= "h") {
            let currentSquareId = currentFile + (rank + direction);
            let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
            let squareContent = currentSquare.pieceColor;
            // let squareContent = isSquareOccupied(document.getElementById(currentSquareId));

            if (squareContent !== "blank" && squareContent !== pieceColor) {
                legalSquares.push(currentSquareId);
            }
        }
    }
    return legalSquares
}


function getKnightMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const knightMoves = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];
    let legalSquares = []
    let file = startingSquareId.charCodeAt(0) - 97;
    let rank = parseInt(startingSquareId.charAt(1));

    knightMoves.forEach((move) => {
        let currentFile = file + move[0]
        currrentRank = rank + move[1]

        if ((currentFile >= 0 && currentFile <= 7) && (currrentRank >= 1 && currrentRank <= 8)) {
            let currentSquareId = String.fromCharCode(currentFile + 97) + currrentRank;
            let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
            let squareContent = currentSquare.pieceColor;
            if (squareContent !== "blank" && squareContent == pieceColor)
                return
            legalSquares.push(currentSquareId)


        }
    })
    return legalSquares;

}



function getRookMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let legalSquares = []
    let currentFile = startingSquareId.charCodeAt(0);
    let currentRank = parseInt(startingSquareId.charAt(1));

    // Function to add moves in one direction
    function addMoves(deltaFile, deltaRank) {
        let file = currentFile;
        let rank = currentRank;

        while (true) {
            file += deltaFile;
            rank += deltaRank;
            let currentSquareId = String.fromCharCode(file) + rank;

            let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
            if (!currentSquare) break; // Stop if the square is outside the board
            let squareContent = currentSquare.pieceColor;

            if (squareContent === pieceColor) break; // Stop if it's a piece of the same color
            legalSquares.push(currentSquareId); // Add move to legal squares

            if (squareContent !== "blank") break; // Stop if it's an opponent's piece (we can capture it)

        }
    }

    // Check all four directions
    addMoves(1, 0); // Right
    addMoves(-1, 0); // Left
    addMoves(0, 1); // Up
    addMoves(0, -1); // Down

    return legalSquares;


}


function getBishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let currentFile = startingSquareId.charCodeAt(0);
    let currentRank = parseInt(startingSquareId.charAt(1));
    let legalSquares = []
    // Function to add moves in one diagonal direction
    function addDiagonalMoves(deltaFile, deltaRank) {
        let file = currentFile;
        let rank = currentRank;

        while (true) {
            file += deltaFile;
            rank += deltaRank;
            let currentSquareId = String.fromCharCode(file) + rank;

            let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
            if (!currentSquare) break; // Stop if the square is outside the board
            let squareContent = currentSquare.pieceColor;

            if (squareContent === pieceColor) break; // Stop if it's a piece of the same color
            legalSquares.push(currentSquareId); // Add move to legal squares

            if (squareContent !== "blank") break; // Stop if it's an opponent's piece (we can capture it)
        }
        // return legalSquares;
    }

    // Check all four diagonal directions
    addDiagonalMoves(1, 1); // Up-Right
    addDiagonalMoves(-1, 1); // Up-Left
    addDiagonalMoves(1, -1); // Down-Right
    addDiagonalMoves(-1, -1); // Down-Left
    return legalSquares;

}



function getQueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let legalSquares = []

    let currentFile = startingSquareId.charCodeAt(0);
    let currentRank = parseInt(startingSquareId.charAt(1));

    // Function to add moves in one direction
    function addMoves(deltaFile, deltaRank) {
        let file = currentFile;
        let rank = currentRank;

        while (true) {
            file += deltaFile;
            rank += deltaRank;
            let currentSquareId = String.fromCharCode(file) + rank;

            let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
            if (!currentSquare) break; // Stop if the square is outside the board
            let squareContent = currentSquare.pieceColor;

            if (squareContent === pieceColor) break; // Stop if it's a piece of the same color
            legalSquares.push(currentSquareId); // Add move to legal squares
            if (squareContent !== "blank") break; // Stop if it's an opponent's piece (we can capture it)



        }
    }

    // Check all eight directions (rook and bishop directions combined)
    addMoves(1, 0); // Right
    addMoves(-1, 0); // Left
    addMoves(0, 1); // Up
    addMoves(0, -1); // Down
    addMoves(1, 1); // Up-Right (diagonal)
    addMoves(-1, 1); // Up-Left (diagonal)
    addMoves(1, -1); // Down-Right (diagonal)
    addMoves(-1, -1); // Down-Left (diagonal)
    return legalSquares;

}
function isPathClear(path, boardSquaresArray) {
    for (let squareId of path) {
        let square = boardSquaresArray.find(element => element.squareId === squareId);
        if (square.pieceType !== 'blank') {
            return false;
        }
    }
    return true;
}
function getKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const currentFile = startingSquareId.charCodeAt(0);
    const currentRank = parseInt(startingSquareId.charAt(1));
    const legalSquares = [];

    const potentialMoves = [
        { df: -1, dr: -1 }, { df: -1, dr: 0 }, { df: -1, dr: 1 },
        { df: 0, dr: -1 }, { df: 0, dr: 1 },
        { df: 1, dr: -1 }, { df: 1, dr: 0 }, { df: 1, dr: 1 },
    ];

    const boardSquaresMap = new Map(boardSquaresArray.map(square => [square.squareId, square]));

    potentialMoves.forEach(move => {
        const newFile = currentFile + move.df;
        const newRank = currentRank + move.dr;
        const newSquareId = String.fromCharCode(newFile) + newRank;

        if (newFile >= 97 && newFile <= 104 && newRank >= 1 && newRank <= 8) {
            const currentSquare = boardSquaresMap.get(newSquareId);
            if (currentSquare && currentSquare.pieceColor !== pieceColor) {
                legalSquares.push(newSquareId);
            }
        }
    });
    if (pieceColor === 'white' && !whiteKingMoved) {
        if (!whiteRookAMoved && isPathClear(['b1', 'c1', 'd1'], boardSquaresArray)) {
            legalSquares.push('c1'); // Queenside castling
        }
        if (!whiteRookHMoved && isPathClear(['f1', 'g1'], boardSquaresArray)) {
            legalSquares.push('g1'); // Kingside castling
        }
    }

    if (pieceColor === 'black' && !blackKingMoved) {
        if (!blackRookAMoved && isPathClear(['b8', 'c8', 'd8'], boardSquaresArray)) {
            legalSquares.push('c8'); // Queenside castling
        }
        if (!blackRookHMoved && isPathClear(['f8', 'g8'], boardSquaresArray)) {
            legalSquares.push('g8'); // Kingside castling
        }
    }

    return legalSquares;

    // return legalSquares;
}




function isKingInCheck(SquareId, pieceColor, boardSquaresArray) {
    let legalSquares = getRookMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            (pieceProperties.pieceType == "rook" ||
                pieceProperties.pieceType == "queen") &&
            pieceColor != pieceProperties.color
        ) {
            // showAlert("check")
            return true;
        }
    }

    legalSquares = getBishopMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            (pieceProperties.pieceType == "bishop" ||
                pieceProperties.pieceType == "queen") &&
            pieceColor != pieceProperties.color
        ) {
            // showAlert("check")
            return true;
        }
    }

    legalSquares = getKnightMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        // console.log(squareId);
        if (
            pieceProperties.pieceType == "knight" &&
            pieceColor != pieceProperties.color
        ) {
            // showAlert("check")
            return true;
        }
    }

    legalSquares = getPawnMoves(SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            pieceProperties.pieceType == "pawn" &&
            pieceColor != pieceProperties.color
        ) {
            // showAlert("check")
            return true;
        }
    }

    legalSquares = getKingMoves(SquareId, pieceColor, boardSquaresArray);
    // console.log(getKingMoves(SquareId, pieceColor, boardSquaresArray),SquareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
        let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
        if (
            pieceProperties.pieceType == "king" &&
            pieceColor != pieceProperties.color
        ) {
            // showAlert("check")
            return true;
        }
    }
    return false;
}


// showAlert("check")

// Helper function to find the king's square
function findKingSquare(pieceColor, boardSquaresArray) {
    for (let square of boardSquaresArray) {
        if (square.pieceType === "king" && square.pieceColor === pieceColor) {
            return square.squareId;
        }
    }
    return null;
}

// Function to get all legal moves for the given color
function getAllLegalMoves(pieceColor, boardSquaresArray) {
    let allLegalMoves = [];
    for (let square of boardSquaresArray) {
        if (square.pieceColor === pieceColor) {
            let pieceObject = { pieceColor: square.pieceColor, pieceType: square.pieceType, pieceId: square.pieceId };
            let legalMoves = getPossibleMoves(square.squareId, pieceObject, boardSquaresArray);
            allLegalMoves.push({ from: square.squareId, moves: legalMoves });
        }
    }
    return allLegalMoves;
}

// Function to simulate a move and check if it resolves the check condition
// function simulateMoveAndCheck(fromSquareId, toSquareId, pieceColor, boardSquaresArray) {
//     // Save the original state
//     let originalFromSquare = { ...boardSquaresArray.find((element) => element.squareId === fromSquareId) };
//     let originalToSquare = { ...boardSquaresArray.find((element) => element.squareId === toSquareId) };

//     // Simulate the move
//     updateBoardSquaresArray(fromSquareId, toSquareId, boardSquaresArray);

//     // Find the king's square after the move
//     let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);

//     // Check if the king is still in check
//     let isInCheck = isKingInCheck(kingSquareId, pieceColor, boardSquaresArray);

//     // Revert the move
//     boardSquaresArray.find((element) => element.squareId === fromSquareId).pieceColor = originalFromSquare.pieceColor;
//     boardSquaresArray.find((element) => element.squareId === fromSquareId).pieceType = originalFromSquare.pieceType;
//     boardSquaresArray.find((element) => element.squareId === fromSquareId).pieceId = originalFromSquare.pieceId;

//     boardSquaresArray.find((element) => element.squareId === toSquareId).pieceColor = originalToSquare.pieceColor;
//     boardSquaresArray.find((element) => element.squareId === toSquareId).pieceType = originalToSquare.pieceType;
//     boardSquaresArray.find((element) => element.squareId === toSquareId).pieceId = originalToSquare.pieceId;

//     return !isInCheck;
// }

function simulateMoveAndCheck(fromSquareId, toSquareId, pieceColor, boardSquaresArray) {
    let fromSquare = boardSquaresArray.find((element) => element.squareId === fromSquareId);
    let toSquare = boardSquaresArray.find((element) => element.squareId === toSquareId);

    let originalFrom = { pieceColor: fromSquare.pieceColor, pieceType: fromSquare.pieceType, pieceId: fromSquare.pieceId };
    let originalTo = { pieceColor: toSquare.pieceColor, pieceType: toSquare.pieceType, pieceId: toSquare.pieceId };

    // Simulate move
    toSquare.pieceColor = fromSquare.pieceColor;
    toSquare.pieceType = fromSquare.pieceType;
    toSquare.pieceId = fromSquare.pieceId;
    fromSquare.pieceColor = 'blank';
    fromSquare.pieceType = null;
    fromSquare.pieceId = null;

    // Check if the move puts the king in check
    let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
    let isInCheck = isKingInCheck(kingSquareId, pieceColor, boardSquaresArray);

    // Revert move
    fromSquare.pieceColor = originalFrom.pieceColor;
    fromSquare.pieceType = originalFrom.pieceType;
    fromSquare.pieceId = originalFrom.pieceId;

    toSquare.pieceColor = originalTo.pieceColor;
    toSquare.pieceType = originalTo.pieceType;
    toSquare.pieceId = originalTo.pieceId;

    return !isInCheck;
}






// Function to get valid moves when the king is in check
function getValidMovesWhenInCheck(pieceColor, boardSquaresArray) {
    let allLegalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);
    let validMoves = [];

    for (let moveSet of allLegalMoves) {
        let fromSquareId = moveSet.from;
        for (let toSquareId of moveSet.moves) {
            if (simulateMoveAndCheck(fromSquareId, toSquareId, pieceColor, boardSquaresArray)) {
                validMoves.push({ from: fromSquareId, to: toSquareId });
            }
        }
    }
    return validMoves;
}

function isCheckmate(pieceColor, boardSquaresArray) {
    // Check if the player is in check
    let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
    if (!isKingInCheck(kingSquareId, pieceColor, boardSquaresArray)) {
        return false; // Not in check, so not checkmate
    }

    // Get all legal moves for the player
    let allLegalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);
    // console.log(allLegalMoves);

    // Check if there is any move that resolves the check
    for (let moveSet of allLegalMoves) {
        let fromSquareId = moveSet.from;
        for (let toSquareId of moveSet.moves) {
            if (simulateMoveAndCheck(fromSquareId, toSquareId, pieceColor, boardSquaresArray)) {
                console.log("checkmate=", false);
                return false; // Found a move that resolves the check, so not checkmate

            }
        }
    }

    console.log("checkmate=", true);
    return true; // No moves resolve the check, so it is checkmate
}
function isStalemate(pieceColor, boardSquaresArray) {
    // Check if the player is in check
    let kingSquareId = findKingSquare(pieceColor, boardSquaresArray);
    if (isKingInCheck(kingSquareId, pieceColor, boardSquaresArray)) {
        return false; // Not in check, so not checkmate
    }

    // Get all legal moves for the player
    let allLegalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);

    // Check if there is any move that resolves the check
    if (allLegalMoves == []) {
        console.log("stalemate=", true);
        return true; // No moves resolve the check, so it is checkmate
    }
}

function showAlert(message) {
    const alert = document.getElementById("alert");
    alert.innerHTML = message;
    alert.style.display = "block";

    setTimeout(function () {
        alert.style.display = "none";
    }, 3000);
}



function showPromotionChoices(pawn, square, color) {
    // Create a full-screen semi-transparent backdrop
    const backdrop = document.createElement("div");
    backdrop.id = "promotion-backdrop";
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    backdrop.style.zIndex = "10000";
    backdrop.style.display = "flex";
    backdrop.style.flexDirection = "column";
    backdrop.style.justifyContent = "center";
    backdrop.style.alignItems = "center";

    // Title
    const title = document.createElement("div");
    title.innerText = "CHOOSE PROMOTION";
    title.style.fontFamily = "'Cinzel', serif";
    title.style.color = "#f0c870";
    title.style.fontSize = "1.5rem";
    title.style.marginBottom = "20px";
    title.style.letterSpacing = "2px";
    backdrop.appendChild(title);

    // Create the modal container
    const modal = document.createElement("div");
    modal.style.background = "linear-gradient(145deg, #7d4220, #3a1a08)";
    modal.style.border = "2px solid #9b6b25";
    modal.style.borderRadius = "10px";
    modal.style.padding = "20px";
    modal.style.display = "flex";
    modal.style.gap = "15px";
    modal.style.boxShadow = "0 10px 40px rgba(0,0,0,0.8)";

    // Promotion pieces
    const pieces = ["queen", "rook", "bishop", "knight"];
    pieces.forEach(piece => {
        const pieceDiv = document.createElement("div");
        pieceDiv.style.width = "70px";
        pieceDiv.style.height = "70px";
        pieceDiv.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        pieceDiv.style.border = "2px solid #d4a84a";
        pieceDiv.style.borderRadius = "8px";
        pieceDiv.style.cursor = "pointer";
        pieceDiv.style.display = "flex";
        pieceDiv.style.justifyContent = "center";
        pieceDiv.style.alignItems = "center";
        pieceDiv.style.transition = "transform 0.2s, background 0.2s";

        pieceDiv.onmouseenter = () => {
            pieceDiv.style.transform = "scale(1.1)";
            pieceDiv.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        };
        pieceDiv.onmouseleave = () => {
            pieceDiv.style.transform = "scale(1)";
            pieceDiv.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        };

        const img = document.createElement("img");
        // Use the exact original piece images
        img.src = color === "white" ? `src/pieces/${piece}.png` : `src/pieces/B${piece}.png`;
        img.style.width = "85%";
        img.style.height = "auto";
        img.style.pointerEvents = "none";
        
        pieceDiv.appendChild(img);

        pieceDiv.onclick = () => {
            promotePawn(pawn, square, piece, color);
            document.body.removeChild(backdrop);
        };
        modal.appendChild(pieceDiv);
    });

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
}
function promotePawn(pawn, square, pieceType, color) {
    // Remove the pawn
    square.removeChild(pawn);

    // Create the new piece
    const newPiece = document.createElement("div");
    newPiece.classList.add("piece", pieceType);
    newPiece.setAttribute("color", color);
    newPiece.setAttribute("draggable", "true");
    newPiece.addEventListener("dragstart", drag);
    newPiece.addEventListener("click", handlePieceClick)
    newPiece.id = `${pieceType}` + square.id

    var img = document.createElement("img");


    color == "white" ? img.src = `src/pieces/${pieceType}.png` : img.src = `src/pieces/B${pieceType}.png`;
    img.setAttribute("draggable", "false");
    // Append the image to the div
    newPiece.appendChild(img);


    square.appendChild(newPiece);


    // Update the board array
    updateBoardSquaresArrayForPromotion(square.id, pieceType, color, boardSquaresArray);


    lastpiececol = color === "white" ? "black" : "white";
    let kingSqid = findKingSquare(lastpiececol, boardSquaresArray);
    if (isKingInCheck(kingSqid, lastpiececol, boardSquaresArray)) {
        playSound(checkSound)
        if (!isCheckmate(lastpiececol, boardSquaresArray)) {
            playerInCheck(lastpiececol);
        }
    }


    // Check for checkmate
    if (isCheckmate(color === "white" ? "black" : "white", boardSquaresArray)) {
        // showAlert();
        showGameOver(color === "white" ? "Black is checkmated!" : "White is checkmated!");
    }
}

// Function to update the board squares array for promotion
function updateBoardSquaresArrayForPromotion(squareId, pieceType, color, boardSquaresArray) {
    let square = boardSquaresArray.find(
        (element) => element.squareId === squareId
    );
    square.pieceColor = color;
    square.pieceType = pieceType;
    square.pieceId = pieceType + squareId

}


const BLACK_PAWN_PREFERRED_COORDINATES = [
    0, 0, 0, 0, 0, 0, 0, 0,
    78, 83, 86, 73, 102, 82, 85, 90,
    7, 29, 21, 44, 40, 31, 44, 7,
    -17, 16, -2, 15, 14, 0, 15, -13,
    -26, 3, 10, 9, 6, 1, 0, -23,
    -22, 9, 5, -11, -10, -2, 3, -19,
    -31, 8, -7, -37, -36, -14, 3, -31,
    0, 0, 0, 0, 0, 0, 0, 0
];

const BLACK_KNIGHT_PREFERRED_COORDINATES = [
    -66, -53, -75, -75, -10, -55, -58, -70,
    -3, -6, 100, -36, 4, 62, -4, -14,
    10, 67, 1, 74, 73, 27, 62, -2,
    24, 24, 45, 37, 33, 41, 25, 17,
    -1, 5, 31, 21, 22, 35, 2, 0,
    -18, 10, 13, 22, 18, 15, 11, -14,
    -23, -15, 2, 0, 2, 0, -23, -20,
    -74, -23, -26, -24, -19, -35, -22, -69
];

const BLACK_BISHOP_PREFERRED_COORDINATES = [
    -59, -78, -82, -76, -23, -107, -37, -50,
    -11, 20, 35, -42, -39, 31, 2, -22,
    -9, 39, -32, 41, 52, -10, 28, -14,
    25, 17, 20, 34, 26, 25, 15, 10,
    13, 10, 17, 23, 17, 16, 0, 7,
    14, 25, 24, 15, 8, 25, 20, 15,
    19, 20, 11, 6, 7, 6, 20, 16,
    -7, 2, -15, -12, -14, -15, -10, -10
];

const BLACK_ROOK_PREFERRED_COORDINATES = [
    35, 29, 33, 4, 37, 33, 56, 50,
    55, 29, 56, 67, 55, 62, 34, 60,
    19, 35, 28, 33, 45, 27, 25, 15,
    0, 5, 16, 13, 18, -4, -9, -6,
    -28, -35, -16, -21, -13, -29, -46, -30,
    -42, -28, -42, -25, -25, -35, -26, -46,
    -53, -38, -31, -26, -29, -43, -44, -53,
    -30, -24, -18, 5, -2, -18, -31, -32
];

const BLACK_QUEEN_PREFERRED_COORDINATES = [
    6, 1, -8, -104, 69, 24, 88, 26,
    14, 32, 60, -10, 20, 76, 57, 24,
    -2, 43, 32, 60, 72, 63, 43, 2,
    1, -16, 22, 17, 25, 20, -13, -6,
    -14, -15, -2, -5, -1, -10, -20, -22,
    -30, -6, -13, -11, -16, -11, -16, -27,
    -36, -18, 0, -19, -15, -15, -21, -38,
    -39, -30, -31, -13, -31, -36, -34, -42
];

const BLACK_KING_PREFERRED_COORDINATES = [
    4, 54, 47, -99, -99, 60, 83, -62,
    -32, 10, 55, 56, 56, 55, 10, 3,
    -62, 12, -57, 44, -67, 28, 37, -31,
    -55, 50, 11, -4, -19, 13, 0, -49,
    -55, -43, -52, -28, -51, -47, -8, -50,
    -47, -42, -43, -79, -64, -32, -29, -32,
    -4, 3, -14, -50, -57, -18, 13, 4,
    17, 30, -3, -14, 6, -1, 40, 18
];







function evaluateBoard(boardSquaresArray) {
    const pieceValues = {
        'pawn': 100,
        'knight': 280,
        'bishop': 320,
        'rook': 379,
        'queen': 929,
        'king': 60000
    };

    const pieceSquareTables = {
        'black': {
            'pawn': BLACK_PAWN_PREFERRED_COORDINATES,
            'knight': BLACK_KNIGHT_PREFERRED_COORDINATES,
            'bishop': BLACK_BISHOP_PREFERRED_COORDINATES,
            'rook': BLACK_ROOK_PREFERRED_COORDINATES,
            'queen': BLACK_QUEEN_PREFERRED_COORDINATES,
            'king': BLACK_KING_PREFERRED_COORDINATES
        },
        'white': {
            // Optional: Add white piece-square tables if needed.
        }
    };

    let evaluation = 0;

    for (let i = 0; i < boardSquaresArray.length; i++) {
        const square = boardSquaresArray[i];
        if (square.pieceColor === 'white') {
            evaluation -= pieceValues[square.pieceType] || 0;
        } else if (square.pieceColor === 'black') {
            evaluation += pieceValues[square.pieceType] || 0;
            evaluation += pieceSquareTables['black'][square.pieceType][i] || 0;
        }
    }

    return evaluation;
}

// function minimax(boardSquaresArray, depth, alpha, beta, maximizingPlayer) {
//     if (depth === 0) {
//         return evaluateBoard(boardSquaresArray);
//     }

//     const pieceColor = maximizingPlayer ? 'black' : 'white';
//     const legalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);

//     if (maximizingPlayer) {
//         let maxEval = -Infinity;
//         for (let moveSet of legalMoves) {
//             for (let toSquareId of moveSet.moves) {
//                 let boardCopy = JSON.parse(JSON.stringify(boardSquaresArray));
//                 if (simulateMoveAndCheck(moveSet.from, toSquareId, 'black', boardCopy)) {
//                     updateBoardSquaresArray(moveSet.from, toSquareId, boardCopy);
//                     let eval = minimax(boardCopy, depth - 1, alpha, beta, false);
//                     maxEval = Math.max(maxEval, eval);
//                     alpha = Math.max(alpha, eval);
//                     if (beta <= alpha) {
//                         break;
//                     }
//                 }
//             }
//         }
//         return maxEval;
//     } else {
//         let minEval = Infinity;
//         for (let moveSet of legalMoves) {
//             for (let toSquareId of moveSet.moves) {
//                 let boardCopy = JSON.parse(JSON.stringify(boardSquaresArray));
//                 if (simulateMoveAndCheck(moveSet.from, toSquareId, 'white', boardCopy)) {
//                     updateBoardSquaresArray(moveSet.from, toSquareId, boardCopy);
//                     let eval = minimax(boardCopy, depth - 1, alpha, beta, true);
//                     minEval = Math.min(minEval, eval);
//                     beta = Math.min(beta, eval);
//                     if (beta <= alpha) {
//                         break;
//                     }
//                 }
//             }
//         }
//         return minEval;
//     }
// }
function gameOver(boardSquaresArray, pieceColor) {
    const legalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);

    if (legalMoves.length === 0) {
        if (isCheckmate(pieceColor, boardSquaresArray)) {
            return showAlert(pieceColor === 'white' ? 'black' : 'white'); // The opponent wins
        } else {
            return 'draw'; // Stalemate
        }
    }
    return false; // Game is not over
}
function showGameOver(text) {
    const gameOverEl = document.getElementById("gameOver");
    const playerW = document.getElementById('player-white');
    const playerB = document.getElementById("player-black");
    gameOverEl.innerText = text;
    gameOverEl.style.display = "block";
    playerW.style.opacity = 0.2;
    playerB.style.opacity = 0.2;

    // ── Determine result ──────────────────────────────────────────────────────
    const lower = text.toLowerCase();
    let result = 'draw';
    if (lower.includes('black') && lower.includes('checkmat')) result = 'win';
    else if (lower.includes('white') && lower.includes('checkmat')) result = 'loss';
    else if (lower.includes('stalemate') || lower.includes('draw')) result = 'draw';

    // ── Confetti on WIN ───────────────────────────────────────────────────────
    if (result === 'win' && typeof launchConfetti === 'function') {
        setTimeout(() => launchConfetti(5000), 200);
    }

    // ── Save & trigger reward animations ─────────────────────────────────────
    if (typeof saveGameResult === 'function') {
        saveGameResult(result).then(data => {
            if (!data) return;

            // Coins popup (win/draw only)
            if (data.coinsEarned > 0 && typeof showCoinReward === 'function') {
                setTimeout(() => showCoinReward(data.coinsEarned), 600);
            }

            // Level-up banner
            if (data.leveledUp && typeof showLevelUp === 'function') {
                const bonus = data.levelBonus || 5;
                setTimeout(() => showLevelUp(data.newLevel, bonus), 1400);
            }

            // Win streak toast
            if (result === 'win' && data.user && data.user.winStreak >= 2) {
                setTimeout(() => showStreakToast(data.user.winStreak), 2200);
            }
        });
    }
}


// Function to hide the glowing text
function hideGameOver() {
    const gameOver = document.getElementById("gameOver");

    gameOver.style.display = "none"; // Hide the text
}

function minimax(boardSquaresArray, depth, alpha, beta, maximizingPlayer) {
    const pieceColor = maximizingPlayer ? 'black' : 'white';
    const gameOverStatus = gameOver(boardSquaresArray, pieceColor);

    if (depth === 0 || gameOverStatus) {
        if (gameOverStatus === 'draw') {
            return 0;
        } else if (gameOverStatus) {
            return gameOverStatus === 'white' ? Infinity : -Infinity;
        } else {
            return evaluateBoard(boardSquaresArray);
        }
    }

    const legalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let moveSet of legalMoves) {
            for (let toSquareId of moveSet.moves) {
                let boardCopy = JSON.parse(JSON.stringify(boardSquaresArray));
                if (simulateMoveAndCheck(moveSet.from, toSquareId, 'black', boardCopy)) {
                    updateBoardSquaresArray(moveSet.from, toSquareId, boardCopy);
                    let eval = minimax(boardCopy, depth - 1, alpha, beta, false);
                    if (eval === Infinity) continue; // Skip branches leading to forced loss
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    if (beta <= alpha) {
                        break; // Beta cutoff
                    }
                }
            }
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let moveSet of legalMoves) {
            for (let toSquareId of moveSet.moves) {
                let boardCopy = JSON.parse(JSON.stringify(boardSquaresArray));
                if (simulateMoveAndCheck(moveSet.from, toSquareId, 'white', boardCopy)) {
                    updateBoardSquaresArray(moveSet.from, toSquareId, boardCopy);
                    let eval = minimax(boardCopy, depth - 1, alpha, beta, true);
                    if (eval === -Infinity) continue; // Skip branches leading to forced win
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) {
                        break; // Alpha cutoff
                    }
                }
            }
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return minEval;
    }
}


function getBestMoveAI(boardSquaresArray, depth, callback) {
    let bestMove = null;
    let bestValue = -Infinity;
    let validMoves = getValidMovesWhenInCheck("black", boardSquaresArray);
    let legalMoves = Object.values(validMoves.reduce((acc, move) => {
        acc[move.from] = acc[move.from] || { from: move.from, moves: [] };
        acc[move.from].moves.push(move.to);
        return acc;
    }, {}));
    // console.log(legalMoves);



    for (let moveSet of legalMoves) {
        for (let toSquareId of moveSet.moves) {
            let boardCopy = JSON.parse(JSON.stringify(boardSquaresArray));
            if (simulateMoveAndCheck(moveSet.from, toSquareId, 'black', boardCopy)) {
                updateBoardSquaresArray(moveSet.from, toSquareId, boardCopy);
                let moveValue = minimax(boardCopy, depth - 1, -Infinity, Infinity, false);
                if (moveValue > bestValue) {
                    bestValue = moveValue;
                    // console.log(bestValue);
                    bestMove = { from: moveSet.from, to: toSquareId };
                    // console.log(moveSet);
                }
                // console.log(moveValue);
            } else {
                // console.log("no");
                // console.log(moveSet);
            }
        }
    }

    if (legalMoves.length !== 0) {
        const result = bestMove.from + bestMove.to;
        if (callback && typeof callback === 'function') {
            callback(result);
        }
        return result;

    }

    return
}
function handleBestMove() {
    if (isNewGame) return;
    let fen = generateFEN(boardSquaresArray);  // Keep the FEN generation for debugging purposes
    console.log("comp fen", fen);
    if (myai) {
        // console.log(selectedLevelmyai);
        getBestMoveAI(boardSquaresArray, selectedLevelmyai, (bestMove) => {
            if (isNewGame) return;

            let compStartingSquareId = bestMove.slice(0, 2);
            let compDestinationSquareId = bestMove.slice(2, 4);
            let compLegalSquares = getPossibleMoves(compStartingSquareId, {
                pieceColor: 'black',
                pieceType: getPieceAtSquare(compStartingSquareId, boardSquaresArray).pieceType,
                pieceId: getPieceAtSquare(compStartingSquareId, boardSquaresArray).pieceId
            }, boardSquaresArray);

            console.log("computer's move", bestMove);

            displayMove(compStartingSquareId, compDestinationSquareId, compLegalSquares);

        });  // Using the custom AI
    } else if (stockfish) {
        if (isNewGame) return;
        // console.log(selectedLevelsf);
        getBestMove(fen, selectedLevelsf, (bestMove) => {

            if (isNewGame) return;
            let compStartingSquareId = bestMove.slice(0, 2);
            let compDestinationSquareId = bestMove.slice(2, 4);
            let compLegalSquares = getPossibleMoves(compStartingSquareId, {
                pieceColor: 'black',
                pieceType: getPieceAtSquare(compStartingSquareId, boardSquaresArray).pieceType,
                pieceId: getPieceAtSquare(compStartingSquareId, boardSquaresArray).pieceId
            }, boardSquaresArray);


            console.log("computer move", bestMove);
            // console.log(compLegalSquares);
            displayMove(compStartingSquareId, compDestinationSquareId, compLegalSquares);
        });

    }

}



// function getBestMoveAI(boardSquaresArray, depth, maximizingPlayer) {
//     const pieceColor = maximizingPlayer ? 'black' : 'white';
//     const gameOverStatus = gameOver(boardSquaresArray, pieceColor);

//     if (gameOverStatus) {
//         if (gameOverStatus === 'draw') {
//             return { bestMove: null, evaluation: 0, message: "Stalemate: Game is a draw" };
//         } else {
//             return { bestMove: null, evaluation: gameOverStatus === 'white' ? Infinity : -Infinity, message: `${gameOverStatus} wins by checkmate` };
//         }
//     }

//     let bestMove = null;
//     let bestEvaluation = maximizingPlayer ? -Infinity : Infinity;

//     const legalMoves = getAllLegalMoves(pieceColor, boardSquaresArray);

//     for (let moveSet of legalMoves) {
//         for (let toSquareId of moveSet.moves) {
//             let boardCopy = JSON.parse(JSON.stringify(boardSquaresArray));
//             if (simulateMoveAndCheck(moveSet.from, toSquareId, pieceColor, boardCopy)) {
//                 updateBoardSquaresArray(moveSet.from, toSquareId, boardCopy);
//                 let evaluation = minimax(boardCopy, depth - 1, -Infinity, Infinity, !maximizingPlayer);
//                 if (maximizingPlayer ? evaluation > bestEvaluation : evaluation < bestEvaluation) {
//                     bestEvaluation = evaluation;
//                     bestMove = { from: moveSet.from, to: toSquareId };
//                 }
//             }
//         }
//     }
// }





