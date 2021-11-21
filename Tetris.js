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


const MY = 40, MX = 10; // field size
const VY = 20, VX = 10; // displayed size
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
const finishColor = '#787276';

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
var gameFinished; // 게임 종료 여부

var GRV // gravity (delay per line)
const delayPerLine = [
  800, 717, 633, 550, 467, 383, 300, 217, 133, 100,
  83, 83, 83, 67, 67, 67, 50, 50, 50, 33,
  33, 33, 17, 17, 17, 0, 0, 0, 0, 0 ];
  
const speedPropId = [
  'DAS', // delayed auto shift
  'ARR', // auto repeat rate
  'SDF' // softdrop delay ratio
  ];
const DAS = 0;
const ARR = 1;
const SDF = 2;
const defaultSpeedProp = [ 133, 10, 10 ];
var customSpeedProp = defaultSpeedProp.slice();
var tmpSpeedProp;

var keyPressed = new Array(256).fill(false);

const settingWindow = document.getElementById('settingWindow');
const opKeyId = [
  'MOVE LEFT',
  'MOVE RIGHT',
  'SOFT DROP',
  'HARD DROP',
  'ROTATE CCW',
  'ROTATE CW',
  'HOLD'
  ];
const defaultKeyCode = [ 37, 39, 40, 32, 88, 90, 16 ]; 
// left, right, down, spacebar, z, x, shift
var customKeyCode = defaultKeyCode.slice();
var tmpKeyCode;

const gameModeWindow = document.getElementById('gameModeWindow');
const MARATHON = 0;
const ULTRA = 1;
const SPRINT = 2;
const gameModeText = ['마라톤', '울트라', '스프린트'];
var gameMode = -1;

//키 입력 처리
function keyDownEventHandler(e) {
  e.preventDefault();
  if(e.keyCode == 115 && !gameStarted) {
    gameStarted = true;
    startGame();
  }
  if(!keyPressed[e.keyCode]){
    keyPressed[e.keyCode] = true;
    if(!gameFinished){
      switch (e.keyCode) { 
        case customKeyCode[0]: // left
          clearTimeout(movingThread);
          setTimeout(moveLR, 0, -1);
          leftDASChargingThread = setTimeout(() => {
            leftDASCharged = true;
            movingThread = setTimeout(autoMoveLR, 0, -1);
          }, customSpeedProp[DAS]);
          break;
        case customKeyCode[1]:
          clearTimeout(movingThread);
          setTimeout(moveLR, 0, 1);
          rightDASChargingThread = setTimeout(() => {
            rightDASCharged = true;
            movingThread = setTimeout(autoMoveLR, 0, 1);
          }, customSpeedProp[DAS]);
          break;
      }
      if(inProcess) switch(e.keyCode) {
        case customKeyCode[2]:
          clearTimeout(fallingThread);
          softDropIsOn = true;
          fallingThread = setTimeout(moveDown, 0);
          break;
        case customKeyCode[3]:
          setTimeout(hardDrop, 0);
          break;
        case customKeyCode[4]:
          setTimeout(roatateClockwise, 0, 1);
          break;
        case customKeyCode[5]:
          setTimeout(roatateClockwise, 0, 3);
          break;
        case customKeyCode[6]:
          setTimeout(holdBlock, 0);
          break;
      }
    }
  }
}

//키 해제 처리
document.addEventListener('keyup', keyUpEventHandler);
function keyUpEventHandler(e) {
  keyPressed[e.keyCode] = false;
  if(!gameFinished) {
    switch (e.keyCode) {
      case customKeyCode[0]: // left
        leftDASCharged = false;
        clearTimeout(leftDASChargingThread);
        clearTimeout(movingThread);
        if(rightDASCharged) movingThread = setTimeout(autoMoveLR, customSpeedProp[DAS], 1);
        break;
      case customKeyCode[1]: // right
        rightDASCharged = false;
        clearTimeout(rightDASChargingThread);
        clearTimeout(movingThread);
        if(leftDASCharged) movingThread = setTimeout(autoMoveLR, customSpeedProp[DAS], -1);
        break;
      case customKeyCode[2]: // down
        softDropIsOn = false;
        break;
      case customKeyCode[3]: // spacebar
        break;
      case customKeyCode[4]: // z
        break;
      case customKeyCode[5]: // x
        break;
      case customKeyCode[6]: // shift
        break;
    }
  }
}

//초기화
init();
function init() {
  y = SY;
  x = SX;
  currShape = tmpShape;
  GRV = 500;
  level = 1;
  score = plusedScore = 0;
  combo = -1;
  spin = 0;
  totalClearedLines = clearedLines = 0;
  BtB = readyForBtB = false;
  perfectClear = false;
  inProcess = false;
  gameStarted = false;
  gameFinished = false;
  softDropIsOn = false;
  holdedBlock = -1;
  holdUsed = false;
  time = [ 0, 0, 0 ];
  initField();
  drawField();
  drawHoldTable();
  drawNextTable();
  drawKeySettingTable();
  statDisplay();
  scoreDisplay();
  changeContentOfId('time', timeText());
  changeContentOfId('fieldText', 'Press F4<br>to Start');
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
  changeContentOfId('gameField', fieldTag);
}
function blockTag(name) {
  var ret = '<table id="' + name + '" class="blockBox" border=0>';
  for (var i = 1; i >= 0; i--) {
    ret += '<tr>';
    for (var j = 0; j < 4; j++)
      ret += '<td id="' + name + String(i) + String(j) + '"></td>';
    ret += '</tr>';
  }
  ret += '</table>';
  return ret;
}
function drawHoldTable() {
  changeContentOfId('holdTable', blockTag('holdBox'));
}
function drawNextTable() {
  var tableTag = '';
  for (var i = 0; i < 5; i++) tableTag += blockTag('nextBox' + String(i));
  changeContentOfId('nextTable', tableTag);
}

// 설정 창 내부조작 및 표시
function initSetting() {
  customKeyCode = defaultKeyCode.slice();
  customSpeedProp = defaultSpeedProp.slice();
  displaySetting();
}
function displaySetting() {
  for (var i = 0; i < opKeyId.length; i++)
    changeContentOfId(opKeyId[i], customKeyCode[i]);
  for (var i = 0; i < speedPropId.length; i++)
    document.querySelectorAll('#' + speedPropId[i] + ' input').forEach((inp) => inp.value = customSpeedProp[i]);
}
function confirmSetting() {
  customKeyCode = tmpKeyCode.slice();
  for (var i = 0; i < speedPropId.length; i++)
    customSpeedProp[i] = document.querySelector('#' + speedPropId[i] + ' input').value;
  showSettingWindow(false);
}
function releaseCheck() {
  var sel = settingWindow.querySelector('input[type="ratio"]:checked');
  if(sel) sel.checked = false;
}
function showSettingWindow(visible) {
  if(!gameStarted && visible) {
    tmpKeyCode = customKeyCode.slice();
    displaySetting();
    settingWindow.classList.remove('hidden');
    document.removeEventListener('keydown', keyDownEventHandler);
    if(!document.getElementById('keySettingTable').classList.contains('hidden'))
      document.addEventListener('keydown', keySettingHandler);
  }
  else {
    releaseCheck();
    settingWindow.classList.add('hidden');
    document.addEventListener('keydown', keyDownEventHandler);
    document.removeEventListener('keydown', keySettingHandler);
  }
}

// 설정 세부창 이동
function moveToKeySetting() {
  document.getElementById('keySettingTable').classList.remove("hidden");
  document.getElementById('toSpeedSetting').classList.remove("hidden");
  document.getElementById('speedSettingTable').classList.add("hidden");
  document.getElementById('toKeySetting').classList.add("hidden");
  document.addEventListener('keydown', keySettingHandler);
}
function moveToSpeedSetting() {
  document.getElementById('keySettingTable').classList.add("hidden");
  document.getElementById('toSpeedSetting').classList.add("hidden");
  document.getElementById('speedSettingTable').classList.remove("hidden");
  document.getElementById('toKeySetting').classList.remove("hidden");
  document.removeEventListener('keydown', keySettingHandler);
  releaseCheck();
}

// 조작 설정 세부창
function drawKeySettingTable() {
  changeContentOfId('keySettingTable', keySettingTableTag());
}
function keySettingTableTag() {
  var ret = '';
  for (var i = 0; i < opKeyId.length; i++) {
    ret += '<tr><td>';
    ret += '<span>' + opKeyId[i] + '</span>';
    ret += '</td><td>';
    ret += '<input id="keySettingRadio' + String(i) + '" name="keySettingRadio" type="radio" value="' + String(i) + '"/>';
    ret += '<label id="' + opKeyId[i] + '" for="keySettingRadio' + String(i) + '"></label>';
    ret += '</td></tr>';
  }
  return ret;
}
function keySettingHandler(e) {
  e.preventDefault();
  var sel = settingWindow.querySelector('input[type="radio"]:checked');
  if (sel) {
    var index = parseInt(sel.value);
    changeContentOfId(opKeyId[index], e.keyCode);
    tmpKeyCode[index] = e.keyCode;
    sel.checked = false;
  }
}

// 속도 설정 세부창
const slideContainers = settingWindow.querySelectorAll('.slideContainer');
slideContainers.forEach((div, idx1) => {
  const inputs = div.querySelectorAll('input');
  inputs.forEach((inp,idx2) => inp.addEventListener('input', () => 
    inputs[1-idx2].value = inputs[idx2].value));
  inputs[1].addEventListener('change', (e) => {
    var correction = null;
    if(e.target.value == '')
      correction = defaultSpeedProp[idx1];
    else if(parseInt(e.target.value) < parseInt(e.target.min))
      correction = e.target.min;
    else if(parseInt(e.target.value) > parseInt(e.target.max))
      correction = e.target.max;
    if(correction != null) inputs[0].value = inputs[1].value = correction;
  })
});

// 게임 모드 변경 및 창 표시
function showGameModeWindow(visible) {
  if (!gameStarted && visible) {
    gameModeWindow.classList.remove('hidden');
    document.removeEventListener('keydown', keyDownEventHandler);
  }
  else {
    gameModeWindow.classList.add('hidden');
    document.addEventListener('keydown', keyDownEventHandler);
  }
}
function confirmGameMode() { 
  showGameModeWindow(false);
  gameMode = gameModeWindow.querySelector('input[type="radio"]:checked').value;
  changeContentOfId('gameMode', gameModeText[gameMode]);
  if(gameMode != MARATHON)
    document.getElementById('levelDisplay').classList.add('hidden');
  else
    document.getElementById('levelDisplay').classList.remove('hidden');
  if(gameMode == SPRINT)
    document.getElementById('scoreBoard').classList.add('hidden');
  else
    document.getElementById('scoreBoard').classList.remove('hidden');
}

// 도움말
function showHelpWindow(visible) {
  if (!gameStarted && visible) {
    document.getElementById('helpWindow').classList.remove('hidden');
    document.removeEventListener('keydown', keyDownEventHandler);
  }
  else {
    document.getElementById('helpWindow').classList.add('hidden');
    document.addEventListener('keydown', keyDownEventHandler);
  }
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

//숫자 출력
function fillLeadingZeros(num, width) {
  var ret = String(num);
  return ret.length >= width ? ret : new Array(width - ret.length + 1).join('0') + ret;
}

// HTML 호출
function cell(name, y, x) {
  return document.getElementById(name + String(y) + String(x));
}
function changeContentOfId(id, content) {
  document.getElementById(id).innerHTML = content;
}

// Lock Delay
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
  if(time[0] == 2 && gameMode == ULTRA) gameClear();
}
function timeText() {
  var ret = '';
  for(var i = 0; i < 3; i++) {
     ret += fillLeadingZeros(time[i], 2);
     if(i == 0) ret += ' : ';
     else if(i == 1) ret += ' . ';
  }
  return ret;
}

//홀드 및 넥스트 목록 표시
function displayBlockInTable(name, blockNo) {
  for (var i = 0; i < 2; i++)
    for (var j = 0; j < 4; j++) cell(name, i, j).style.background = tileColor;
  for (var i = 0; i < 4; i++) {
    var by = blockShape[blockNo][i][0];
    var bx = blockShape[blockNo][i][1] + 1;
    cell(name, by, bx).style.background = blockColor[blockNo];
  }
}
function displayHoldTable() {
  displayBlockInTable('holdBox', holdedBlock);
}
function displayNextTable() {
  for (var i = 0; i < 5; i++)
    displayBlockInTable('nextBox' + String(i), nextBlockQueue[i]);
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

//소프트드롭
function fallingSpeed() {
  return softDropIsOn ? GRV / customSpeedProp[SDF] : GRV;
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
  plusedScore = 0;
  scoreDisplay();
  stackBlock();
}

//홀드
function holdBlock() {
  clearTimeout(fallingThread);
  clearTimeout(delayCountingThread);
  clearBlock();
  if (holdedBlock != -1) nextBlockQueue.unshift(holdedBlock);
  holdedBlock = currBlock;
  holdUsed = true;
  displayHoldTable();
  setBlock();
}

//블록 스택
function stackBlock() {
  clearTimeout(fallingThread);
  clearTimeout(delayCountingThread);
  if(gameoverCheck2()) { gameover(); return; };
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
  if(gameMode == SPRINT && totalClearedLines >= 40) gameClear();
  else if(gameMode == ULTRA && time[0] == 2) gameClear();
  else setBlock();
}

//다음 블록 출현
function setBlock() {
  if(gameMode == MARATHON) levelUpdate();
  y = SY;
  x = SX;
  currDir = 0;
  currBlock = nextBlockQueue[0];
  currShape = blockShape[currBlock];
  displayBlock();
  if (gameoverCheck1()) { gameover(); return; }
  nextBlockQueue.shift();
  displayNextTable();
  if (nextBlockQueue.length < 7) setNextBag();
  fallingThread = setTimeout(moveDown, 0);
  waitedDelay = 0;
  delayResetCount = 0;
  delayCountingThread = setTimeout(lockDelayCount, 10);
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

//블록 낙하
function moveDown() {
  if (canMove(currShape, -1, 0)) {
    T_spinRule1 = false;
    clearBlock();
    y--;
    displayBlock();
    if(softDropIsOn){
      score++;
      plusedScore = 0;
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
  movingThread = setTimeout(autoMoveLR, customSpeedProp[ARR], dir);
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
function finishField() {
  for (var i = 0; i < VY; i++)
    for (var j = 0; j < VX; j++) {
      var cellValue = gameField[i][j];
      var cellColor = cellValue == -1 ? tileColor : finishColor;
      cell('gameTable', i, j).style.background = cellColor;
    }
  console.log('finishField Complete');
}
function gameoverCheck1() {
  if (canMove(currShape, 0, 0)) return false;
  else return true;
}
function gameoverCheck2() {
  for(var i = 0; i < 4; i++) {
    if(isInField(currShape[i][0], currShape[i][1])) return false;
  }
  return true;
}
function gameFinish() {
  gameFinished = true;
  finishField();
  clearTimeout(fallingThread);
  clearTimeout(displayingThread);
  clearTimeout(timeCountingThread);
  clearTimeout(movingThread);
  clearTimeout(delayCountingThread);
  clearTimeout(leftDASChargingThread);
  clearTimeout(rightDASChargingThread);
}
function gameClear() {
  gameFinish();
  changeContentOfId('fieldText', 'FINISH !!');
  setTimeout(() => {
    if(gameMode == ULTRA)
      alert(`[ 울트라 모드 종료 ]\n\n기록     ${score}`);
    else if(gameMode == SPRINT)
      alert(`[ 스프린트 모드 종료 ]\n\n기록     ${timeText()}`);
    init();
    // location.reload();
  }, 1500)
}
function gameover() {
  gameFinish();
  changeContentOfId('fieldText', 'G A M E<br>O V E R');
  setTimeout(() => {
    if(gameMode == MARATHON)
      alert(`
      [ 게임 오버 ]\n
      레벨     ${level}
      시간     ${timeText()}
      점수     ${score}`);
    else
      alert(`[ 게임 오버 ]`);
    init();
    // location.reload();
  }, 1500)
}