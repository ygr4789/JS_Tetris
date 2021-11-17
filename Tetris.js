var y, x; // current block loaction
var currBlock;
var currShape;
var currDir;

var T_spinRule1; // last maneuval is rotation
var T_spinRule2; // last rotation kicked last offset

var level;
var score, plusedScore;
var spin;
var combo;
var totalClearedLines, clearedLines;
var BtB, readyForBtB;
var perfectClear;
var displayingThread;

const pointTable = [
  [0, 100, 300, 500, 800],
  [100, 200, 400],
  [400, 800, 1200, 1600]
  ];
const pointTable_PC = [0, 800, 1200, 1800, 2000, 3200];
const spinText = [
  'ㅤ',
  'mini  T - SPIN',
  'T - SPIN'
  ];
const lineClearText = [
  'ㅤ',
  'S I N G L E',
  'D O U B L E',
  'T R I P L E',
  'T E T R I S'
  ];

var time;
var timeCountingThread;

var GRV, // gravity
  SDF; // softdrop speed
var DAS = 133; // delayed auto shift
ARR = 10; //auto repeat rate
const delayPerLine = [
  800, 717, 633, 550, 467, 833, 300, 217, 133, 100,
  83, 83, 83, 67, 67, 67, 50, 50, 50, 33,
  33, 33, 17, 17, 17, 0, 0, 0, 0, 0 ];

const MY = 40, MX = 10; // field size
const VY = 22, VX = 10; // displayed size
const SY = 20, SX = 4; // starting point
const tmpShape = [[0,0],[0,0],[0,0],[0,0]];
const blockShape = [ 
  [[0, 0],[0, -1],[0, 1],[0, 2],],
  [[0, 0],[1, -1],[0, -1],[0, 1],],
  [[0, 0],[0, -1],[0, 1],[1, 1],],
  [[0, 0],[1, 0],[1, 1],[0, 1],],
  [[0, 0],[0, -1],[1, 0],[1, 1],],
  [[0, 0],[0, -1],[1, 0],[0, 1],],
  [[0, 0],[1, -1],[1, 0],[0, 1],],
  ]; //현재위치에 대한 상대적 좌표 ...  y, x
const offset = [[
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],],
    [[0, 0],[1, 0],[1, -1],[0, 2],[1, 2],],
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],],
    [[0, 0],[-1, 0],[-1, -1],[0, 2],[-1, 2],],
    ],[
    [[0, 0],[-1, 0],[2, 0],[-1, 0],[2, 0],],
    [[-1, 0],[0, 0],[0, 0],[0, 1],[0, -2],],
    [[-1, 1],[1, 1],[-2, 1],[1, 0],[-2, 0],],
    [[0, 1],[0, 1],[0, 1],[0, -1],[0, 2],],
    ],[
    [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],],
    [[0, -1],[0, -1],[0, -1],[0, -1],[0, -1],],
    [[-1, -1],[-1, -1],[-1, -1],[-1, -1],[-1, -1],],
    [[-1, 0],[-1, 0],[-1, 0],[-1, 0],[-1, 0],],
    ],
  ]; //wall kick 구현 ... 편의상 x, y 로 작성됨
const corners = [
    [1, -1],[1, 1],[-1, -1],[-1, 1]
  ]; //T-spin 구현을 위한 T미노 모서리 좌표
const blockColor = [
  '#0F9BD7', // 'cyan'
  '#2141C6', // 'blue'
  '#E35C02', // 'orange'
  '#E39F02', // 'yellow' 
  '#59B101', // 'green'
  '#AF2989', // 'purple' 
  '#D70F37'// 'red'
  ];// I, J, L, O, S, T, Z 색상
const tileColor = '#1B1D1F';

var fallingThread, softDropIsOn;
var delayCountingThread, waitedDelay, delayResetCount;
var lockDelay = 500;
var delayResetLimit = 15;

var movingThread;
var leftDASCharged, leftDASChargingThread;
var rightDASCharged, rightDASChargingThread;

var nextBlockQueue = new Array();
var holdedBlock;
var holdUsed;

var gameField;
var inProcess; // 게임 진행 중 여부
var gameStarted; // 게임 시작 여부

var keyPressed = new Array(256).fill(false);

//키 입력 처리
document.onkeydown = keyDownEventHandler;
function keyDownEventHandler(e) {
  if(e.keyCode == 115 && !gameStarted) {
    gameStarted = true;
    startGame();
  }
  if(!keyPressed[e.keyCode]){
    keyPressed[e.keyCode] = true;
    switch (e.keyCode) { 
      case 37: // left
        clearTimeout(movingThread);
        setTimeout(moveLR, 0, -1);
        leftDASChargingThread = setTimeout(() => {
          leftDASCharged = true;
          movingThread = setTimeout(autoMoveLR, 0, -1);
        }, DAS);
        break;
      case 39: // right
        clearTimeout(movingThread);
        setTimeout(moveLR, 0, 1);
        rightDASChargingThread = setTimeout(() => {
          rightDASCharged = true;
          movingThread = setTimeout(autoMoveLR, 0, 1);
        }, DAS);
        break;
    }
    if(inProcess) switch(e.keyCode) {
      case 40: // down
        clearTimeout(fallingThread);
        softDropIsOn = true;
        fallingThread = setTimeout(moveDown(), 0);
        break;
      case 88: // z
        setTimeout(roatateClockwise, 0, 1);
        break;
      case 90: // x
        setTimeout(roatateClockwise, 0, 3);
        break;
      case 32: // spacebar
        setTimeout(hardDrop, 0);
        break;
      case 16: // shift
        setTimeout(holdBlock, 0);
        break;
    }
  }
}

//키 해제 처리
document.onkeyup = keyUpEventHandler;
function keyUpEventHandler(e) {
  keyPressed[e.keyCode] = false;
  switch (e.keyCode) {
    case 37: // left
      leftDASCharged = false;
      clearTimeout(leftDASChargingThread);
      clearTimeout(movingThread);
      if(rightDASCharged) movingThread = setTimeout(autoMoveLR, DAS, 1);
      break;
    case 39: // right
      rightDASCharged = false;
      clearTimeout(rightDASChargingThread);
      clearTimeout(movingThread);
      if(leftDASCharged) movingThread = setTimeout(autoMoveLR, DAS, -1);
      break;
    case 40: // down
      softDropIsOn = false;
      break;
    case 88: // z
      break;
    case 90: // x
      break;
    case 32: // spacebar
      break;
    case 16: // shift
      break;
  }
}

init();

//초기화
function init() {
  y = SY;
  x = SX;
  currShape = tmpShape;
  score = 0;
  combo = -1;
  totalClearedLines = 0;
  BtB = false;
  inProcess = false;
  gameStarted = false;
  readyForBtB = false;
  softDropIsOn = false;
  holdedBlock = -1;
  holdUsed = false;
  time = [0, 0, 0];
  changeContentOfId('fieldText', 'Press F4<br>to Start');
  initField();
  drawField();
  drawHoldBox();
  drawNextTable();
}

// 게임 시작
function startGame() {
  setNextBag();
  displayNextTable();
  for(var i=0; i<3; i++)
    setTimeout(changeContentOfId, 1000 * i, 'fieldText', 3 - i);
  setTimeout(() => {
    inProcess = true;
    changeContentOfId('fieldText', 'ㅤ');
    timeCountingThread = setInterval(timeCount, 10);
    setBlock();
  }, 3000);
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
      fieldTag += '<td id="gameTable' + String(i) + String(j) + '"></td>';
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
  document.getElementById('nextTable').innerHTML = tableTag;
}

//숫자 출력
function fillLeadingZeros(num, width) {
  var ret = String(num);
  return ret.length >= width ? ret : new Array(width - ret.length + 1).join('0') + ret;
}

//HTML 호출
function cell(name, y, x) {
  return document.getElementById(name + String(y) + String(x));
}
function changeContentOfId(id, content) {
  document.getElementById(id).innerHTML = content;
}

//Lock Delay
function lockDelayRecount() {
  clearTimeout(delayCountingThread);
  if(waitedDelay > 0) delayResetCount++;
  waitedDelay = 0;
  delayCountingThread = setTimeout(lockDelayCount, 10);
}
function lockDelayCount() {
  if (waitedDelay > lockDelay) stackBlock();
  else {
    if (!canMove(currShape, -1, 0)) waitedDelay+=10;
    delayCountingThread = setTimeout(lockDelayCount, 10);
  }
}

//시간 측정
function timeCount() {
  if(++time[2] == 100) {
    time[2] = 0;
    time[1]++;
  }
  if(time[1] == 60) {
    time[1] = 0;
    time[0]++;
  }
  changeContentOfId('time', timeText());
}
function timeText() {
  var ret = '';
  for(var i = 0; i < 3; i++) {
     if(i > 0) ret += ' : ';
     ret += fillLeadingZeros(time[i], 2);
  }
  return ret;
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
  for (var i = fullIdx; i < MY - 1; i++) gameField[i] = gameField[i + 1].slice();
}
function lineClear() {
  var ret = 0;
  var fullLineExist = false;
  for (var i = y - 2; i <= y + 2; i++) {
    if (isInBound(i, 0)) {
      while (isFull(i)) {
        ret++;
        singleLineClear(i);
        fullLineExist = true;
      }
    }
  }
  if (fullLineExist) updateField();
  return ret;
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
  clearTimeout(delayCountingThread);
  clearBlock();
  if (holdedBlock != -1) nextBlockQueue.unshift(holdedBlock);
  holdedBlock = currBlock;
  holdUsed = true;
  displayHoldBox();
  setBlock();
}

//하드드롭
function hardDrop() {
  var dy = 0;
  while (canMove(currShape, dy - 1, 0)) dy--;
  if(dy != 0) T_spinRule1 = false;
  clearBlock();
  y += dy;
  displayBlock();
  score -= 2*dy;
  scoreDisplay();
  stackBlock();
}

//소프트드롭
function fallingSpeed() {
  return softDropIsOn ? SDF : GRV;
}

//블록 스택
function stackBlock() {
  clearTimeout(fallingThread);
  clearTimeout(delayCountingThread);
  for (var i = 0; i < 4; i++) {
    var by = y + currShape[i][0];
    var bx = x + currShape[i][1];
    gameField[by][bx] = currBlock;
  }
  holdUsed = false;
  statCalculate();
  scoreCalculate();
  if(plusedScore > 0) {
    clearTimeout(displayingThread);
    statDisplay();
    scoreDisplay();
    displayingThread = setTimeout(stablizeDisplay, 2500);
  }
  setBlock();
}

//티스핀 판별 (none:0, mini:1, proper:2)
function detect(delta) {
  var cy = y + delta[0];
  var cx = x + delta[1];
  return !isInBound(cy, cx) || gameField[cy][cx] != -1;
}
function checkTspin() {
  if(currBlock != 5 || !T_spinRule1) return 0;
  var frontCorners = [corners[currDir], corners[(currDir + 1) % 4]];
  var cnt1 = 0// 전 방향 모서리 세기
  var cnt2 = 0// 앞쪽 모서리만 세기
  for(var i=0; i<4; i++)
    if(detect(corners[i])) cnt1++;
  for(var i=0; i<2; i++)
    if(detect(frontCorners[i])) cnt2++;
  if(cnt1 < 3) return 0;
  else if(cnt2 ==2 || T_spinRule2) return 2;
  else return 1;
}

//퍼펙트 클리어
function checkPercectClear() {
  for(var i=0; i<MY; i++)
    for(var j=0; j<MX; j++)
      if(gameField[i][j] != -1) return false;
  return true;
}

//상태 계산 및 표시
function statCalculate() {
  spin = checkTspin();
  clearedLines = lineClear();
  perfectClear = checkPercectClear();
  var difficult = spin != 0 || clearedLines == 4
  if(clearedLines == 0){
    combo = -1;
    BtB = false;
  }
  else{
    combo++;
    BtB = readyForBtB && difficult;
    readyForBtB = difficult;
  }
  totalClearedLines += clearedLines;
  T_spinRule1 = T_spinRule2 = false;
}
function statDisplay() {
  changeContentOfId('spin', spinText[spin]);
  changeContentOfId('lineClear', lineClearText[clearedLines]);
  changeContentOfId('backToBack', BtB ? 'Back-To-Back' : 'ㅤ');
  changeContentOfId('comboValue', combo > 0 ? combo : 'ㅤ');
  changeContentOfId('comboText', combo > 0 ? 'COMBO' : 'ㅤ')
  changeContentOfId('lines', totalClearedLines);
  changeContentOfId('fieldText', perfectClear ? 'PERFECT<br>C L E A R' : 'ㅤ');
}

//점수 계산 및 표시
function scoreCalculate() {
  plusedScore = baseScore() * level;
  score += plusedScore;
}
function scoreDisplay() {
  changeContentOfId('score', score);
  changeContentOfId('plus', plusedScore > 0 ? '+' + plusedScore : 'ㅤ');
}
function baseScore() {
  if(perfectClear) {
    if(clearedLines == 4 && BtB) return pointTable_PC[5];
    else return pointTable_PC[clearedLines];
  }
  var ret = pointTable[spin][clearedLines];
  if(BtB) ret = ret + (ret / 2);
  if(combo > 0) ret += 50 * combo;
  return ret;
}

//레벨 갱신
function levelUpdate() {
  level = Math.min(30, 1 + parseInt(totalClearedLines / 10));
  GRV = delayPerLine[level-1]
  SDF = GRV/10;
  changeContentOfId('level', level);
}

//표시창 초기화 
function stablizeDisplay() {
  changeContentOfId('spin', 'ㅤ');
  changeContentOfId('lineClear', 'ㅤ');
  changeContentOfId('backToBack', 'ㅤ');
  changeContentOfId('comboValue', 'ㅤ');
  changeContentOfId('comboText', 'ㅤ');
  changeContentOfId('plus', 'ㅤ');
  changeContentOfId('fieldText', 'ㅤ');
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
      T_spinRule1 = true;
      T_spinRule2 = i == 4;
      clearBlock();
      y += dy;
      x += dx;
      currShape = nextShape;
      currDir = nextDir;
      if (delayResetCount < delayResetLimit) lockDelayRecount();
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

//다음 블록 출현
function setBlock() {
  levelUpdate();
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
  fallingThread = setTimeout(moveDown, fallingSpeed());
  waitedDelay = 0;
  delayResetCount = 0;
  delayCountingThread = setTimeout(lockDelayCount, 10);
}

//블록 낙하
function moveDown() {
  if (canMove(currShape, -1, 0)) {
    T_spinRule1 = false;
    clearBlock();
    y--;
    displayBlock();
    if(softDropIsOn){
      score++;
      scoreDisplay();
    }
  }
  fallingThread = setTimeout(moveDown, fallingSpeed());
}

//블록 좌우이동
function moveLR(dir) {
  if (canMove(currShape, 0, dir)) {
    T_spinRule1 = false;
    if(delayResetCount > delayResetLimit) lockDelayRecount();
    clearBlock();
    x += dir;
    displayBlock();
  }
}
function autoMoveLR(dir) {
  moveLR(dir);
  movingThread = setTimeout(autoMoveLR, ARR, dir);
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
  clearTimeout(timeCountingThread);
  alert(`[Game Over]\n\nPlayTime < ${timeText()} >\nScore < ${score} >`);
  init();
  location.reload();
}
