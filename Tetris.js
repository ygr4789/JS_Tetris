var y, x; // current block loaction
var currBlock;
var currShape;
var currDir;

var GRV = 500, // gravity
  SDF = 100; // softdrop speed
var DAS = 133; // delayed auto shift
ARR = 10; //auto repeat rate

var MY = 50,
  MX = 10; // field size
var VY = 22,
  VX = 10; // displayed size
var SY = 20,
  SX = 4; // starting point
var blockShape = [
  [
    [0, 0],
    [0, -1],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [1, -1],
    [0, -1],
    [0, 1],
  ],
  [
    [0, 0],
    [0, -1],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  [
    [0, 0],
    [0, -1],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, -1],
    [1, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, -1],
    [1, 0],
    [0, 1],
  ],
]; //현재위치에 대한 상대적 좌표 ...  y, x
var offset = [
  [
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [1, -1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 2],
      [-1, 2],
    ],
  ],
  [
    [
      [0, 0],
      [-1, 0],
      [2, 0],
      [-1, 0],
      [2, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [0, 0],
      [0, 1],
      [0, -2],
    ],
    [
      [-1, 1],
      [1, 1],
      [-2, 1],
      [1, 0],
      [-2, 0],
    ],
    [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, -1],
      [0, 2],
    ],
  ],
  [
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, -1],
      [0, -1],
      [0, -1],
      [0, -1],
      [0, -1],
    ],
    [
      [-1, -1],
      [-1, -1],
      [-1, -1],
      [-1, -1],
      [-1, -1],
    ],
    [
      [-1, 0],
      [-1, 0],
      [-1, 0],
      [-1, 0],
      [-1, 0],
    ],
  ],
]; //wall kick 처리 ... 편의상 x, y 로 작성됨
var blockColor = ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];
var tileColor = 'whitesmoke';

var fallingThread, fallingSpeed;
var movingThread;
var countThread, lockDelay;
var gameField;

var nextBlockQueue = new Array();
var holdedBlock;
var holdUsed;

//키 입력 처리
document.onkeydown = keyDownEventHandler;
function keyDownEventHandler(e) {
  switch (e.keyCode) {
    case 83: // s
      setTimeout('moveDown()', fallingSpeed);
      break;
    case 37: // left
      setTimeout('moveLR(-1)', 0);
      break;
    case 39: // right
      setTimeout('moveLR(1)', 0);
      break;
    case 40: // down
      softDrop(true);
      break;
    case 88: // z
      setTimeout('roatateClockwise(1)', 0);
      break;
    case 90: // x
      setTimeout('roatateClockwise(3)', 0);
      break;
    case 32: // spacebar
      setTimeout('hardDrop()', 0);
      break;
    case 16: // shift
      setTimeout('holdBlock()', 0);
      break;
  }
}

//키 해제 처리
document.onkeyup = keyUpEventHandler;
function keyUpEventHandler(e) {
  switch (e.keyCode) {
    case 40:
      softDrop(false);
      break;
  }
}

init();

//table 호출
function cell(name, y, x) {
  return document.getElementById(name + String(y) + String(x));
}

function lockDelayCount() {
  if (lockDelay > 100) {
    clearTimeout(fallingThread);
    clearTimeout(lockDelayCount);
    stackBlock();
  } else {
    if (!canMove(currShape, -1, 0)) lockDelay++;
    countThread = setTimeout('lockDelayCount()', 10);
  }
}

//초기화
function init() {
  initField();
  drawField();
  drawHoldBox();
  drawNextTable();
  setNextBag();
  setBlock();
  holdedBlock = -1;
  holdUsed = false;
  fallingSpeed = GRV;
}
function initField() {
  gameField = new Array(MY);
  for (var i = 0; i < MY; i++) {
    gameField[i] = new Array(MX);
    for (var j = 0; j < MX; j++) gameField[i][j] = -1;
  }
}
function drawField() {
  var fieldTag = '<table id="gameTable" border=0>';
  for (var i = VY - 1; i >= 0; i--) {
    fieldTag += '<tr>';
    for (var j = 0; j < VX; j++)
      fieldTag += '<td id="' + 'gameTable' + String(i) + String(j) + '"></td>';
    fieldTag += '</tr>';
  }
  fieldTag += '</table>';
  document.getElementById('gameField').innerHTML = fieldTag;
}
function blockTag(name) {
  var ret = '<table id="' + name + '" border=0>';
  for (var i = 1; i >= 0; i--) {
    ret += '<tr>';
    for (var j = 0; j < 4; j++)
      ret += '<td id="' + name + String(i) + String(j) + '"></td>';
    ret += '</tr>';
  }
  ret += '</table>';
  return ret;
}
function drawHoldBox() {
  document.getElementById('holdBox').innerHTML = blockTag('holdTable');
}
function drawNextTable() {
  var tableTag = '';
  for (var i = 0; i < 5; i++) tableTag += blockTag('nextTable' + String(i));
  console.log(tableTag);
  document.getElementById('nextTable').innerHTML = tableTag;
}

//홀드 및 넥스트 표시
function displayBlockInTable(name, blockNo) {
  for (var i = 0; i < 2; i++)
    for (var j = 0; j < 4; j++) cell(name, i, j).style.background = tileColor;
  for (var i = 0; i < 4; i++) {
    var by = blockShape[blockNo][i][0];
    var bx = blockShape[blockNo][i][1] + 1;
    cell(name, by, bx).style.background = blockColor[blockNo];
  }
}
function displayHoldBox() {
  displayBlockInTable('holdTable', holdedBlock);
}
function displayNextTable() {
  for (var i = 0; i < 5; i++)
    displayBlockInTable('nextTable' + String(i), nextBlockQueue[i]);
}

//줄 지우기
function isFull(i) {
  for (var j = 0; j < MX; j++) if (gameField[i][j] == -1) return false;
  return true;
}
function singleLineClear(fullIdx) {
  for (var i = fullIdx; i < MY - 1; i++) gameField[i] = gameField[i + 1];
}
function lineClear() {
  var fullLineExist = false;
  for (var i = y - 2; i <= y + 2; i++) {
    if (isInBound(i, 0)) {
      while (isFull(i)) {
        singleLineClear(i);
        fullLineExist = true;
      }
    }
  }
  if (fullLineExist) updateField();
}
function updateField() {
  for (var i = 0; i < VY; i++)
    for (var j = 0; j < VX; j++) {
      var cellValue = gameField[i][j];
      var cellColor = cellValue == -1 ? tileColor : blockColor[cellValue];
      cell('gameTable', i, j).style.background = cellColor;
    }
}

//홀드
function holdBlock() {
  clearTimeout(fallingThread);
  clearTimeout(lockDelayCount);
  clearBlock();
  if (holdedBlock != -1) nextBlockQueue.unshift(holdedBlock);
  holdedBlock = currBlock;
  holdUsed = true;
  displayHoldBox();
  setBlock();
}

//하드드롭
function hardDrop() {
  clearTimeout(fallingThread);
  clearTimeout(countThread);
  var dy = 0;
  while (canMove(currShape, dy - 1, 0)) dy--;
  clearBlock();
  y += dy;
  displayBlock();
  stackBlock();
}

//소프트드롭
function softDrop(isOn) {
  if (isOn) fallingSpeed = SDF;
  else fallingSpeed = GRV;
}

//블록 스택
function stackBlock() {
  for (var i = 0; i < 4; i++) {
    var by = y + currShape[i][0];
    var bx = x + currShape[i][1];
    gameField[by][bx] = currBlock;
  }
  holdUsed = false;
  lineClear();
  setBlock();
}

//블록 회전
function roatateClockwise(cnt) {
  var nextDir = (currDir + cnt) % 4;
  var index = currBlock == 0 ? 1 : currBlock == 3 ? 2 : 0;
  var nextShape = rotateShape_N(currShape, cnt);
  for (var i = 0; i < 5; i++) {
    var dy = offset[index][currDir][i][1] - offset[index][nextDir][i][1];
    var dx = offset[index][currDir][i][0] - offset[index][nextDir][i][0];
    if (canMove(nextShape, dy, dx)) {
      clearBlock();
      y += dy;
      x += dx;
      currShape = nextShape;
      currDir = nextDir;
      displayBlock();
      break;
    }
  }
}
function rotateShape_N(shape, cnt) {
  for (var i = 0; i < cnt; i++) shape = rotateShape(shape);
  return shape;
}
function rotateShape(shape) {
  var ret = new Array(4);
  for (var i = 0; i < 4; i++) {
    var tmp = new Array(2);
    tmp[0] = -shape[i][1];
    tmp[1] = shape[i][0];
    ret[i] = tmp;
  }
  return ret;
}

function setBlock() {
  y = SY;
  x = SX;
  currDir = 0;
  currBlock = nextBlockQueue[0];
  currShape = blockShape[currBlock];
  displayBlock();
  if (gameoverCheck()) gameover();
  nextBlockQueue.shift();
  displayNextTable();
  if (nextBlockQueue.length < 7) setNextBag();
  fallingThread = setTimeout('moveDown()', fallingSpeed);
  lockDelay = 0;
  countThread = setTimeout('lockDelayCount()', 10);
}

//블록 낙하
function moveDown() {
  if (canMove(currShape, -1, 0)) {
    clearBlock();
    y--;
    displayBlock();
  }
  fallingThread = setTimeout('moveDown()', fallingSpeed);
}

//블록 좌우이동
function moveLR(dir) {
  if (canMove(currShape, 0, dir)) {
    clearBlock();
    x += dir;
    displayBlock();
  }
}

//이동 가능 여부 확인
function isInBound(y, x) {
  return y < MY && y >= 0 && x < MX && x >= 0;
}
function isValid(y, x) {
  return isInBound(y, x) && gameField[y][x] == -1;
}
function canMove(shape, dy, dx) {
  for (var i = 0; i < 4; i++) {
    var by = y + dy + shape[i][0];
    var bx = x + dx + shape[i][1];
    if (!isValid(by, bx)) return false;
  }
  return true;
}

//현재 위치 블록 미표시 및 표시
function isInField(y, x) {
  return y < VY && y >= 0 && x < VX && x >= 0;
}
function clearBlock() {
  for (var i = 0; i < 4; i++) {
    var by = y + currShape[i][0];
    var bx = x + currShape[i][1];
    if (isInField(by, bx))
      cell('gameTable', by, bx).style.background = tileColor;
  }
}
function displayBlock() {
  for (var i = 0; i < 4; i++) {
    var by = y + currShape[i][0];
    var bx = x + currShape[i][1];
    if (isInField(by, bx))
      cell('gameTable', by, bx).style.background = blockColor[currBlock];
  }
}

//랜덤 가방 생성 및 다음 가방 설정
function generateBag() {
  var randPerm = new Array(7);
  var used = new Array(7).fill(false);
  for (var i = 7; i >= 1; i--) {
    var cnt = Math.floor(Math.random() * i);
    for (var sel = 0; sel < 7; sel++) {
      if (used[sel]) continue;
      else if (cnt-- == 0) {
        randPerm[7 - i] = sel;
        used[sel] = true;
        break;
      }
    }
  }
  return randPerm;
}
function setNextBag() {
  var nextBag = generateBag();
  for (var i = 0; i < 7; i++) {
    nextBlockQueue.push(nextBag[i]);
  }
}

// 게임오버
function gameoverCheck() {
  if (canMove(currShape, 0, 0)) return false;
  else return true;
}
function gameover() {
  alert('[Game Over]');
  init();
  location.reload();
}
