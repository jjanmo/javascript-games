const difficultySpans = document.querySelectorAll('.difficulty');
const startButton = document.getElementById('js-start-button');
const board = document.getElementById('js-board');

let blockObjs = {};     //block obj를 담는 객체 : 블럭 데이터정보 
let blocks;             //blocks array
let totalMine = 0;
let flagCount = 0;

let difficulty;                 //게임 난이도 
let isFirstClick = false;       //첫번째 좌클릭인지 확인
let isStartedTimer = false;     //우클릭을 하거나 좌클릭을 했을 때 타이머는 한 번만 시작해야함 
let timerFunc;                  //타이머 함수(이 함수를 호출해야 타이머 시작)
let timer;                      //타이머(timerFunc 함수를 호출하면 리턴:클로저)
let record;                     //기록

//게임 다시 시작 할 때마다 초기화해야 할 것들
//-> 다시 시작하는 경우 : 1)난이도 클릭시 2) start button 클릭시
function restartInit() {
    clearInterval(timer);       //기존 타이머 중지
    timerFunc = makeTimer();   //타이머 다시 설정
    timerInit();  //타이머 패널 초기화
    //button image 초기화
    startButton.className = 'button start';
    isFirstClick = false;
    isStartedTimer = false;
    blockObjs = {}; //blockObjs 초기화
    flagCount = 0;
}

function timerInit() {
    const timerPanel = document.getElementById('js-timer-panel');
    const numbers = timerPanel.querySelectorAll('.number');
    numbers.forEach(ele => ele.className = 'number zero');
}


function makeTimer() {
    let second = 0;
    return function () {
        isStartedTimer = true;
        timer = setInterval(function () {
            second++;
            renderTimerPanel(second);
            // console.log(second);
        }, 1000)
    };
}

function renderTimerPanel(second) {
    second = second < 100 ? (second < 10 ? '00' + second : '0' + second) : second.toString();
    if (second > 999) return; //최대치
    // console.log(second);
    const secondArr = second.split('');
    // console.log(secondArr);
    const timerPanel = document.getElementById('js-timer-panel');
    const numbers = timerPanel.querySelectorAll('.number');
    secondArr.forEach((digit, idx) => {
        let name = '';
        switch (digit) {
            case '1':
                name = 'one';
                break;
            case '2':
                name = 'two';
                break;
            case '3':
                name = 'three';
                break;
            case '4':
                name = 'four';
                break;
            case '5':
                name = 'five';
                break;
            case '6':
                name = 'six';
                break;
            case '7':
                name = 'seven';
                break;
            case '8':
                name = 'eight';
                break;
            case '9':
                name = 'nine';
                break;
            default:
                name = 'zero';
                break;
        }
        numbers[idx].className = `number ${name}`;
    });
}

//difficulty
function handleSelectDifficulty(e) {
    const difficultyEle = e.target;
    difficultySpans.forEach(ele => ele.classList.remove('selected'));
    difficultyEle.classList.add('selected');
    difficulty = difficultyEle.textContent
    paintBlocks();
}

//block
function paintBlocks() {
    restartInit();
    let fragment;
    switch (difficulty) {
        case 'basic': //10 * 10 지뢰 10개
            fragment = makeBlocks(10);
            totalMine = 10;
            break;
        case 'intermediate': // 15 * 15 지뢰 40개
            fragment = makeBlocks(15);
            totalMine = 45;
            break;
        case 'advanced': //24 * 24 지뢰 100개
            fragment = makeBlocks(24);
            totalMine = 100;
            break;
        default: //custom
            break;
    }
    renderMineCountPanel(totalMine);
    board.className = `board ${difficulty}`;
    board.innerHTML = '';
    board.append(fragment);

    blocks = document.querySelectorAll('.block');
    makeClickEvent(blocks);
    // console.log(blocks, blockObjs);
}

function makeBlocks(length) {
    let x = 0, y = 0;
    const fragment = new DocumentFragment();
    for (let i = 0; i < length * length; i++) {
        //순회하는 동안 x,y값 설정(행과열설정)
        if (i % length === 0 && i !== 0) {
            x = 0;
            y++;
        }
        const curObj = setBlockObj(x++, y);
        const div = document.createElement('div');
        div.classList.add('block', 'not-clicked');
        div.id = curObj.setId();        //screen - data interaction   
        // div.dataset.index = i;          //screen - element interaction 
        fragment.append(div);
    }
    // console.log(blockObjs);
    return fragment;
}


function renderMineCountPanel(totalMine) {
    const mineCountPanel = document.getElementById('js-count-panel');
    const numbers = mineCountPanel.querySelectorAll('.number');
    numbers.forEach(ele => ele.className = 'number');
    switch (totalMine) {
        case 10:
            numbers[0].classList.add('zero');
            numbers[1].classList.add('one');
            numbers[2].classList.add('zero');
            break;
        case 45:
            numbers[0].classList.add('zero');
            numbers[1].classList.add('four');
            numbers[2].classList.add('five');
            break;
        case 100:
            numbers[0].classList.add('one');
            numbers[1].classList.add('zero');
            numbers[2].classList.add('zero');
            break;
        default:
            break;
    }
}

//게임 관련 object 생성
function setBlockObj(x, y) {
    const blockObj = {
        posX: x,
        posY: y,
        getMine: false,
        clicked: false,
        isFlagged: false,
        setId: function () {
            return `${this.posX}-${this.posY}`;
        }
    };
    blockObjs[`${blockObj.setId()}`] = blockObj;
    return blockObj;
}

function setMine(totalMine, blockId) {
    //mine을 몇개 만들것인가 결정 : mine숫자 -> 난이도에 따라 달라짐
    //첫번째 클릭이 끝난 후 배치 해야함 : 첫번째 클릭칸을 제외
    const blockWidth = Math.sqrt(blocks.length); //board의 한 변 칸수
    let mineCount = 0;
    const tmpSelArr = [];
    while (mineCount < totalMine) {
        const x = Math.floor(Math.random() * blockWidth);
        const y = Math.floor(Math.random() * blockWidth);
        const tmpId = `${x}-${y}`;
        if (tmpId === blockId) continue;  //첫번째 클릭 칸 제외
        if (!tmpSelArr.includes(tmpId)) {
            tmpSelArr.push(tmpId);
            mineCount++;
        }
    }
    tmpSelArr.forEach(ele => blockObjs[ele].getMine = true);
}


//block left click event
function handleClickBlock(e) {
    // console.log(blocks, blockObjs);
    const { target } = e;
    // console.log(target);
    if (target.className.includes('not-clicked') && !target.className.includes('flag')) {
        const blockId = target.id;
        if (!isFirstClick) { //첫번째 클릭한 후에 지뢰 셋팅
            if (!isStartedTimer) timerFunc();
            setMine(totalMine, blockId);
            isFirstClick = true;
        }
        checkMine(blockId);
        //console.log(blockObjs);
    }
}


function checkMine(blockId) {
    if (blockObjs[blockId].getMine) {// 지뢰가 있는 경우
        document.getElementById(blockId).classList.add('step-mine');
        document.getElementById(blockId).classList.remove('not-clicked');
        //game over       
        console.log(blockObjs);
        //모든 지뢰 위치 보여줌 : 현재 상태  + 지뢰 위치 + 잘못된 flag
        for (let blockObj in blockObjs) {
            if (blockObjs[blockObj].getMine) {
                if (!blockObjs[blockObj].isFlagged) {
                    document.getElementById(blockObjs[blockObj].setId()).classList.remove('not-clicked');
                    document.getElementById(blockObjs[blockObj].setId()).classList.add('mine');
                }
            }
            else {
                if (blockObjs[blockObj].isFlagged) {
                    document.getElementById(blockObjs[blockObj].setId()).classList.remove('not-clicked');
                    document.getElementById(blockObjs[blockObj].setId()).classList.add('wrong-mine');
                }
            }
        }
        //display변경(button image 변경)
        startButton.className = 'button failure';
        //모든 블록클릭이벤트 중지
        removeClickEvent();
        //timer 정지 => 그 때 시간 기록
        clearInterval(timer);
    }
    else {//지뢰가 아닌 경우
        checkAround(blockId);
    }
}

function checkAround(blockId) {
    let count = 0;
    const posX = blockObjs[blockId].posX;
    const posY = blockObjs[blockId].posY;
    const recursionArr = [];
    for (let i = posX - 1; i <= posX + 1; i++) {
        for (let j = posY - 1; j <= posY + 1; j++) {
            if (i === posX && j === posY) continue;     //클릭한 자기자신 제거
            if (blockObjs[`${i}-${j}`]) {
                if (blockObjs[`${i}-${j}`].clicked) continue;
                //-> 클릭된 블록 제거 : 재귀적 구현을 위해서 코드위치 중요 - 재귀 탈출조건(recursionArr에 등록될 블록을 구분해줌)
                if (blockObjs[`${i}-${j}`].getMine) {
                    count++;
                }
                recursionArr.push(`${i}-${j}`);
            }
        }
    }
    // console.log(recursionArr);
    // console.log(count);
    //데이터 변경
    blockObjs[blockId].clicked = true;
    //화면 변경
    renderBlock(blockId, count);
    if (count === 0) { //recursion
        recursionArr.forEach(blockId => checkAround(blockId));
    }
}

function renderBlock(blockId, count) {
    const curBlock = document.getElementById(blockId);
    if (curBlock.className.includes('flag')) curBlock.classList.remove('flag');
    let value = null;
    //background image class 설정
    switch (count) {
        case 1:
            value = 'one';
            break;
        case 2:
            value = 'two';
            break;
        case 3:
            value = 'three';
            break;
        case 4:
            value = 'four';
            break;
        case 5:
            value = 'five';
            break;
        case 6:
            value = 'six';
            break;
        case 7:
            value = 'seven';
            break;
        case 8:
            value = 'eight';
            break;
        default:
            value = 'zero';
    }
    curBlock.classList.remove('not-clicked');
    curBlock.classList.add(`${value}-mine`);
}

//block right click 
function handleContextMenu(e) {
    e.preventDefault();
    if (!isStartedTimer) timerFunc();
    const block = e.target;
    console.log(flagCount);
    if (block.className.includes('not-clicked')) {
        //화면 변경
        if (block.className.includes('flag')) {//flag삭제할 때
            flagCount--;
            console.log(flagCount);
            if (flagCount < 0) {
                flagCount++;
                return;
            }
            block.classList.remove('flag');
        }
        else {//flag추가할 때
            flagCount++;
            console.log(flagCount);
            if (flagCount > totalMine) {
                flagCount--;
                return;
            }
            block.classList.add('flag');
        }
        //지뢰숫자패널 변경
        changeMineCountPanel();
        //데이터 변경
        blockObjs[block.id].isFlagged = block.className.includes('flag') ? true : false;
        // console.log(blockObjs[block.id]);
    }
}

function changeMineCountPanel() {
    const mineCountPanel = document.getElementById('js-count-panel');
    const numbers = mineCountPanel.querySelectorAll('.number');
    const restMine =
        (totalMine - flagCount) < 100 ?
            ((totalMine - flagCount) < 10 ? '00' + (totalMine - flagCount) : '0' + (totalMine - flagCount))
            : (totalMine - flagCount).toString();
    const restMineArr = restMine.split('');
    restMineArr.forEach((digit, idx) => {
        let name = '';
        switch (digit) {
            case '1':
                name = 'one';
                break;
            case '2':
                name = 'two';
                break;
            case '3':
                name = 'three';
                break;
            case '4':
                name = 'four';
                break;
            case '5':
                name = 'five';
                break;
            case '6':
                name = 'six';
                break;
            case '7':
                name = 'seven';
                break;
            case '8':
                name = 'eight';
                break;
            case '9':
                name = 'nine';
                break;
            default:
                name = 'zero';
                break;
        }
        numbers[idx].className = `number ${name}`;
    });
}


//make event listener in block
//-> whenever board repaint, make eventlistener
function makeClickEvent() {
    //block click event
    blocks.forEach(block => block.addEventListener('click', handleClickBlock));          //left click
    blocks.forEach(block => block.addEventListener('contextmenu', handleContextMenu));   //right click
}

function removeClickEvent() {
    blocks.forEach(block => block.removeEventListener('click', handleClickBlock));          //left click
    blocks.forEach(block => block.removeEventListener('contextmenu', handleContextMenu));   //right click
}

function init() {
    //difficulty event
    difficultySpans.forEach(ele => ele.addEventListener('click', handleSelectDifficulty));
    //initial
    document.querySelector('.selected').click();  //시작값 : 처음에 1번만 사용
    //restart button
    startButton.addEventListener('click', paintBlocks);
}

init();
