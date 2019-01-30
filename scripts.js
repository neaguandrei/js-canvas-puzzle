// Initialize variabile
let myCanvas;
let myContext;
let myCursorLocation;
let myLoadedImage;

let myUploadCanvas;
let myUploadContext;
let myUploadImage;

let isUploaded = false;
let difficultyLevel = 2;

let puzzlePieces;
let puzzleWidth;
let puzzleHeight;
let pieceWidth;
let pieceHeight;

let pieceBeingDragged;
let pieceBeingDropped;

let btnStart;
let btnRestart;

let audioPuzzleMove;
let audioStartPuzzle;
let audioFinishPuzzle;

// Initializare componente
function initializeComponents() {
  initializeImage();
  initializeButtons();
  initializeSounds();
  initializeUploadCanvas();
}

// Initializare default puzzle
function initializeImage() {
  if (isUploaded) {
    setPuzzleImage();
  } else {
    myLoadedImage = new Image();
    myLoadedImage.addEventListener("load", setImage, false);
    myLoadedImage.src = "https://i.ibb.co/qR0NzNk/corgi.jpg";
    //sau src local
    //myLoadedImage.src = "media/jpg/corgi.jpg";
  }
}
// Initializare butoane + evenimente
function initializeButtons() {
  btnStart = document.getElementById("btnStart");
  btnStart.addEventListener("click", mixPuzzle);

  btnRestart = document.getElementById("btnRestart");
  btnRestart.addEventListener("click", restartPuzzle);

}

// Functie de setare a imaginii canvasului din puzzle in cazul in care avem o imagine dragata in canvasul din dreapta
function setPuzzleImage() {
  myLoadedImage = myUploadImage;
  pieceWidth = Math.floor(myUploadImage.width / difficultyLevel);
  pieceHeight = Math.floor(myUploadImage.height / difficultyLevel);
  puzzleWidth = pieceWidth * difficultyLevel;
  puzzleHeight = pieceHeight * difficultyLevel;

  assignCanvas();
  initializePuzzle();
}

// Functie de setare a imaginii canvasului din puzzle fara sa am ceva uploadat prin drag and drop
function setImage() {
  pieceWidth = Math.floor(myLoadedImage.width / difficultyLevel);
  pieceHeight = Math.floor(myLoadedImage.height / difficultyLevel);
  puzzleWidth = pieceWidth * difficultyLevel;
  puzzleHeight = pieceHeight * difficultyLevel;

  assignCanvas();
  initializePuzzle();
}

// Asignez dimensiunile canvasului puzzle
function assignCanvas() {
  myCanvas = document.getElementById("puzzle");
  myContext = myCanvas.getContext("2d");
  myCanvas.width = puzzleWidth;
  myCanvas.height = puzzleHeight;
}

// Initializez puzzleul. Un array  de piese, o variabila cu coordonatele cursorului
function initializePuzzle() {
  puzzlePieces = [];
  myCursorLocation = {
    x: 0,
    y: 0
  };
  pieceBeingDragged = null;
  pieceBeingDropped = null;
  myContext.drawImage(myLoadedImage, 0, 0);
  generatePuzzlePieces();
}

// Generare piese puzzle + introducerea lor in variabila global puzzlePieces
function generatePuzzlePieces() {
  let x = 0;
  let y = 0;

  for (
    let piecesNr = 0;
    piecesNr < difficultyLevel * difficultyLevel;
    piecesNr++
  ) {
    let piece = {
      sourceX: x,
      sourceY: y
    };

    //Introducem piesele in array. In momentul in care x trece de widthul intregului puzzle (canvas), o luam de la capat cu piesele de pe urmatorul rand (crescand heightul)
    puzzlePieces.push(piece);
    x += pieceWidth;
    if (x >= puzzleWidth) {
      x = 0;
      y += pieceHeight;
    }
  }
}

// Schimbam dificultatea
function onChange() {
  let selection = document.getElementById("selectDifficulty").value;
  console.log(selection);
  switch (selection) {
    case "easy":
      difficultyLevel = 2;
      break;
    case "medium":
      difficultyLevel = 3;
      break;
    case "hard":
      difficultyLevel = 4;
      break;
    case "very-hard":
      difficultyLevel = 6;
      break;
    default:
      break;
  }
  console.log("New difficulty level: " + difficultyLevel);
  initializeImage();
  restartPuzzle();

  let totalPuzzlePieces = difficultyLevel * difficultyLevel;
  let puzzleP = document.getElementById("totalPuzzlePieces");
  puzzleP.textContent = "Total number of puzzle pieces: " + totalPuzzlePieces;
}

// Amestescare puzzle (amestec prin functia mixArray piesele din arrayul: puzzlePieces) + start puzzle + redare sunet
function mixPuzzle() {
  playStartPuzzleAudio();
  puzzlePieces = mixArray(puzzlePieces);
  myContext.clearRect(0, 0, puzzleWidth, puzzleHeight);
  let currentPiece;
  let x = 0,
    y = 0;
  // Aranjez piesele in ordinea din urma amestecarii arrayului. Salvez in fiecare piesa x, y.
  for (let i = 0; i < puzzlePieces.length; i++) {
    currentPiece = puzzlePieces[i];
    currentPiece.x = x;
    currentPiece.y = y;

    // param 1 - de unde extrag imaginea
    // param 2->5 - cordonatele sursei initiale plus lungimea zonei extrasa
    // param 6->9 - coordonate + lungime unde voi pune ceea ce am extras
    myContext.drawImage(
      myLoadedImage,
      currentPiece.sourceX,
      currentPiece.sourceY,
      pieceWidth,
      pieceHeight,
      x,
      y,
      pieceWidth,
      pieceHeight
    );

    //trasez conturul pieselor
    myContext.lineWidth = 3;
    myContext.strokeRect(x, y, pieceWidth, pieceHeight);
    x += pieceWidth;
    if (x >= puzzleWidth) {
      x = 0;
      y += pieceHeight;
    }
  }
  myCanvas.onmousedown = onPuzzleClick;
}

function onPuzzleClick(e) {
  // Folosim aceste proprietati pentru a asigna cursorului  x si y pozitia pozitia curenta
  if (e.layerX || e.layerX == 0) {
    console.log("e.layerX = " + e.layerX);
    myCursorLocation.x = e.layerX - myCanvas.offsetLeft;
    myCursorLocation.y = e.layerY - myCanvas.offsetTop;
  }
  pieceBeingDragged = findClickedPuzzlePiece();
  // Daca e null, userul nu a dat click pe nicio piesa
  if (pieceBeingDragged != null) {
    // Stergem ce era in locul piesei dragate
    myContext.clearRect(
      pieceBeingDragged.x,
      pieceBeingDragged.y,
      pieceWidth,
      pieceHeight
    );
    myContext.save();

    // La fel -> desenez din myLoadedImage, din coordonatele sourceX, sourceY, cu dim... in locatia
    myContext.drawImage(
      myLoadedImage,
      pieceBeingDragged.sourceX,
      pieceBeingDragged.sourceY,
      pieceWidth,
      pieceHeight,
      myCursorLocation.x - pieceWidth / 2,
      myCursorLocation.y - pieceHeight / 2,
      pieceWidth,
      pieceHeight
    );
    console.log(
      "Cursor coordinates: X = " +
        myCursorLocation.x +
        "; Y = " +
        myCursorLocation.y
    );
    myCanvas.onmousemove = updatePuzzle;
    myCanvas.onmouseup = pieceDropped;
  }
}

// Returneaza null in cazul in care userul nu a dat click pe o piesa de puzzle. Daca a dat click pe o piesa, o va returna pe aceasta.
function findClickedPuzzlePiece() {
  // Loop prin toate piesele din puzzle, si sa aflam in ce coordonate a fost dat clickul. In final returnam piesa pe care a fost dat click.
  for (let i = 0; i < puzzlePieces.length; i++) {
    // Verific daca cursorul in momentul clickului se incadreaza in dimensiunile piesei. Daca nu este in afara, returnez piesa.
    if (
      !(
        myCursorLocation.x < puzzlePieces[i].x ||
        myCursorLocation.x > puzzlePieces[i].x + pieceWidth ||
        myCursorLocation.y < puzzlePieces[i].y ||
        myCursorLocation.y > puzzlePieces[i].y + pieceHeight
      )
    ) {
      return puzzlePieces[i];
    }
  }
  return null;
}

function updatePuzzle(e) {
  pieceBeingDropped = null;
  if (e.layerX || e.layerX == 0) {
    console.log("Cursor coordinates: X -> " + e.layerX + myCanvas.offsetLeft);
    myCursorLocation.x = e.layerX - myCanvas.offsetLeft;
    myCursorLocation.y = e.layerY - myCanvas.offsetTop;
  }
  myContext.clearRect(0, 0, puzzleWidth, puzzleHeight);

  for (let i = 0; i < puzzlePieces.length; i++) {
    let currentPiece = puzzlePieces[i];
    // Verificam daca piesa curenta este cea dragata. Daca e asa, continuam loopul ca sa ramana locul de unde am luat piesa gol.
    if (currentPiece === pieceBeingDragged) {
      continue;
    }
    myContext.drawImage(
      myLoadedImage,
      currentPiece.sourceX,
      currentPiece.sourceY,
      pieceWidth,
      pieceHeight,
      currentPiece.x,
      currentPiece.y,
      pieceWidth,
      pieceHeight
    );
    myContext.strokeRect(
      currentPiece.x,
      currentPiece.y,
      pieceWidth,
      pieceHeight
    );

    //Verific daca deja am dropat ceva in acest loop
    if (pieceBeingDropped == null) {
      if (
        myCursorLocation.x < currentPiece.x ||
        myCursorLocation.x > currentPiece.x + pieceWidth ||
        myCursorLocation.y < currentPiece.y ||
        myCursorLocation.y > currentPiece.y + pieceHeight
      ) {
      } else {
        // Schimb culoare piesei asupra careia este posibil sa dau drop.
        pieceBeingDropped = currentPiece;
        myContext.save();
        myContext.globalAlpha = 0.2;
        myContext.fillStyle = "#FFD700";
        myContext.fillRect(
          pieceBeingDropped.x,
          pieceBeingDropped.y,
          pieceWidth,
          pieceHeight
        );
        myContext.restore();
      }
    }
  }
  // Desenam piesa care este dragata, oarecum transparenta ca sa putem vedea restul pieselor
  myContext.save();
  myContext.globalAlpha = 0.75;
  myContext.drawImage(
    myLoadedImage,
    pieceBeingDragged.sourceX,
    pieceBeingDragged.sourceY,
    pieceWidth,
    pieceHeight,
    myCursorLocation.x - pieceWidth / 2,
    myCursorLocation.y - pieceHeight / 2,
    pieceWidth,
    pieceHeight
  );
  myContext.restore();
  myContext.strokeRect(
    myCursorLocation.x - pieceWidth / 2,
    myCursorLocation.y - pieceHeight / 2,
    pieceWidth,
    pieceHeight
  );
}

function pieceDropped(e) {
  myCanvas.onmousemove = null;
  myCanvas.onmouseup = null;

  // Daca piece dropata este nula, inseamna ca a fost dusa de unde a fost dragata. Altfel, mergem mai departe sa interschimbam piesele.
  if (pieceBeingDropped) {
    var tempPiece = {
      x: pieceBeingDragged.x,
      y: pieceBeingDragged.y
    };
    // Interschimb coordonatele pieselor (cea asupra carei o dropez pe cea dragata)
    pieceBeingDragged.x = pieceBeingDropped.x;
    pieceBeingDragged.y = pieceBeingDropped.y;
    pieceBeingDropped.x = tempPiece.x;
    pieceBeingDropped.y = tempPiece.y;

    playPuzzleMoveAudio();
  }
  isPuzzleComplete();
}

// Sunete
function initializeSounds() {
  audioPuzzleMove = document.getElementById("puzzleMoveAudio");
  audioStartPuzzle = document.getElementById("startPuzzleAudio");
  audioFinishPuzzle = document.getElementById("finishPuzzleAudio");
}

function playPuzzleMoveAudio() {
  audioPuzzleMove.play();
}

function playStartPuzzleAudio() {
  audioStartPuzzle.play();
}

function playFinishPuzzleAudio() {
  audioFinishPuzzle.play();
}

// Verificam daca puzzle-ul este complet
function isPuzzleComplete() {
  myContext.clearRect(0, 0, puzzleWidth, puzzleHeight);
  let isPuzzleFinished = true;
  let piece;
  for (let i = 0; i < puzzlePieces.length; i++) {
    piece = puzzlePieces[i];
    myContext.drawImage(
      myLoadedImage,
      piece.sourceX,
      piece.sourceY,
      pieceWidth,
      pieceHeight,
      piece.x,
      piece.y,
      pieceWidth,
      pieceHeight
    );
    myContext.strokeRect(piece.x, piece.y, pieceWidth, pieceHeight);
    if (piece.x != piece.sourceX || piece.y != piece.sourceY) {
      isPuzzleFinished = false;
    }
  }
  if (isPuzzleFinished) {
    console.log("Successfully finished the puzzle!");
    playFinishPuzzleAudio();
    displayFinishMessage();
    restartPuzzle();
  }
}

function displayFinishMessage() {
  let message = document.getElementById("headerFinish");
  message.textContent =
    "Congratulations, you finished the puzzle! Press try again and upload a new photo if you want!";
  setTimeout(function() {
    message.textContent = "";
  }, 4000);
}

// Restart puzzle
function restartPuzzle() {
  myCanvas.onmousedown = null;
  myCanvas.onmousemove = null;
  myCanvas.onmouseup = null;
  initializePuzzle();
}

// Drag and drop from desktop upload
function initializeUploadCanvas() {
  myUploadCanvas = document.getElementById("uploadCanvas");
  myUploadContext = myUploadCanvas.getContext("2d");
  writeTextUploadCanvas();

  myUploadCanvas.addEventListener("dragenter", dragEnter, false);
  myUploadCanvas.addEventListener("dragover", dragOver, false);
  myUploadCanvas.addEventListener("drop", drop, false);
}

function dragEnter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragOver(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();
  let dt = e.dataTransfer;
  let files = dt.files;
  receiveFiles(files);
}

function receiveFiles(files) {
  let myPromise = new Promise((resolve, reject) => {
    if (files.length > 0) {
      let file = files[0];
      let reader = new FileReader();
      reader.onload = function(e) {
        myUploadImage = new Image();
        myUploadImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    setTimeout(function() {
      resolve("Uploaded the image file successfully!");
    }, 250);
  });

  myPromise.then(successMessage => {
    isUploaded = true;
    console.log(successMessage);
    setImageUploadCanvas();
  });
}

// Functie de amestecare a elementelor dintr-un array
function mixArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let x = arr[i];
    arr[i] = arr[j];
    arr[j] = x;
  }
  return arr;
}

function setImageUploadCanvas() {
  myContext.clearRect(0, 0, myCanvas.width, myCanvas.height);
  setPuzzleImage();
  myUploadCanvas.width = puzzleWidth;
  myUploadCanvas.height = puzzleHeight;
  console.log(
    "Upload canvas size:" + myUploadCanvas.height + " " + myUploadCanvas.width
  );
  myUploadContext.drawImage(myUploadImage, 0, 0);
}

function writeTextUploadCanvas() {
  myUploadContext.font = "20px Georgia";
  myUploadContext.fillStyle = "#F38630";
  myUploadContext.textAlign = "center";
  myUploadContext.fillText(
    "PUZZLE PHOTO UPLOAD HERE",
    myUploadCanvas.width / 2,
    myUploadCanvas.height / 2
  );
}


