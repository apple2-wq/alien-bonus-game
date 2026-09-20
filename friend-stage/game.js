/* =========================================================
   2人プレイ・シューティングゲーム
   マウス + Joy-Con 2台
========================================================= */
const practiceTargets = document.getElementById("practice-targets");
const practiceText = document.getElementById("practice-text");

// 最初は練習画面を完全に隠す
practiceTargets.style.display = "none";
practiceText.style.display = "none";

/* =========================================================
   ゲーム状態
========================================================= */

let timeLeft = 30;
let gameOver = false;
let gameStarted = false;
let practiceMode = false;
let gameTimer = null;


/* =========================================================
   HTML要素
========================================================= */

const gameArea = document.getElementById("game");

let scoreText = document.getElementById("score");
let timerText = document.getElementById("timer");


/* score / timer がHTMLに無くても自動作成 */
if (!scoreText) {
    scoreText = document.createElement("div");
    scoreText.id = "score";
    scoreText.textContent = "LEFT: 0     RIGHT: 0";
    document.body.insertBefore(scoreText, gameArea);
}

if (!timerText) {
    timerText = document.createElement("div");
    timerText.id = "timer";
    timerText.textContent = "Time: 30";
    document.body.insertBefore(timerText, gameArea);
}


/* =========================================================
   得点
========================================================= */

let leftScore = 0;
let rightScore = 0;

/* 本番中のヒット率用 */
let leftShots = 0;
let rightShots = 0;
let leftHits = 0;
let rightHits = 0;


function updateScores() {

    scoreText.textContent =
        "LEFT: " + leftScore +
        "     RIGHT: " + rightScore;

}


/* =========================================================
   Joy-Con照準
========================================================= */

const leftCursor = document.createElement("div");
const rightCursor = document.createElement("div");

leftCursor.className =
    "player-cursor left-cursor";

rightCursor.className =
    "player-cursor right-cursor";

leftCursor.textContent = "🩷";
rightCursor.textContent = "🩵";

gameArea.appendChild(leftCursor);
gameArea.appendChild(rightCursor);


/* =========================================================
   照準位置
========================================================= */

let leftX = 300;
let leftY = 300;

let rightX = 700;
let rightY = 300;

const cursorSpeed = 5;


/* =========================================================
   発射ボタン
========================================================= */

let leftFirePressed = false;
let rightFirePressed = false;


/* =========================================================
   的を作る共通関数
========================================================= */

function addTarget(
    containerId,
    imageFile,
    points,
    x,
    y,
    size = 120
) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        console.error(
            "的の入れ物がありません:",
            containerId
        );
        return null;
    }


    const target =
        document.createElement("img");


    target.src = imageFile;

    target.classList.add(
        "shooting-target"
    );

    target.style.position =
        "absolute";

    target.style.left =
        x + "px";

    target.style.top =
        y + "px";

    target.style.width =
        size + "px";

    target.style.height =
        "auto";

    target.style.cursor =
        "crosshair";


    /* =====================================================
       的を撃つ
    ===================================================== */

    function shootTarget(player) {

        if (
            target.style.display ===
            "none"
        ) {
            return;
        }


        /* -------------------------
           試し撃ち
        ------------------------- */

        if (practiceMode) {

            target.style.display =
                "none";

            setTimeout(function () {

                if (practiceMode) {
                    target.style.display =
                        "block";
                }

            }, 500);

            return;
        }


        /* -------------------------
           ゲーム開始前・終了後
        ------------------------- */

        if (
            !gameStarted ||
            gameOver
        ) {
            return;
        }


        /* -------------------------
           得点
        ------------------------- */

        if (player === "left") {
            leftScore += points;
            leftHits++;
        }

        if (player === "right") {
            rightScore += points;
            rightHits++;
        }

        updateScores();


        /* -------------------------
           的が倒れる
        ------------------------- */

        target.classList.add(
            "fall-back"
        );


        setTimeout(function () {

            target.style.display =
                "none";

            target.classList.remove(
                "fall-back"
            );

        }, 600);


        /* -------------------------
           5秒後に復活
        ------------------------- */

        setTimeout(function () {

            if (
                gameStarted &&
                !gameOver
            ) {

                target.style.display =
                    "block";

            }

        }, 5000);

        return true;

    }


    /* =====================================================
       マウスクリック
    ===================================================== */

    target.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            if (gameOver) {
                return;
            }


            const gameRect =
                gameArea.getBoundingClientRect();


            const clickX =
                event.clientX -
                gameRect.left;


            const clickY =
                event.clientY -
                gameRect.top;


            /* 透明部分ならハズレ */

            if (
                !isVisiblePixel(
                    target,
                    clickX,
                    clickY
                )
            ) {
                return;
            }


            if (gameStarted && !practiceMode) {
                leftShots++;
            }

            shootTarget("left");

        }
    );


    /* Joy-Conから使うため保存 */

    target.shootTarget =
        shootTarget;


    container.appendChild(
        target
    );


    return target;
}


/* =========================================================
   画像の透明部分を判定
========================================================= */

function isVisiblePixel(
    target,
    gameX,
    gameY
) {

    const gameRect =
        gameArea.getBoundingClientRect();

    const targetRect =
        target.getBoundingClientRect();


    const screenX =
        gameRect.left + gameX;

    const screenY =
        gameRect.top + gameY;


    if (
        screenX < targetRect.left ||
        screenX > targetRect.right ||
        screenY < targetRect.top ||
        screenY > targetRect.bottom
    ) {

        return false;

    }


    if (
        !target.complete ||
        target.naturalWidth === 0 ||
        target.naturalHeight === 0
    ) {

        return false;

    }


    const imageX =
        Math.floor(
            (screenX - targetRect.left) *
            target.naturalWidth /
            targetRect.width
        );


    const imageY =
        Math.floor(
            (screenY - targetRect.top) *
            target.naturalHeight /
            targetRect.height
        );


    const canvas =
        document.createElement("canvas");


    canvas.width =
        target.naturalWidth;

    canvas.height =
        target.naturalHeight;


    const ctx =
        canvas.getContext("2d");


    try {

        ctx.drawImage(
            target,
            0,
            0
        );


        const pixel =
            ctx.getImageData(
                imageX,
                imageY,
                1,
                1
            ).data;


        return pixel[3] >= 50;

    } catch (error) {

        console.log(
            "透明部分判定エラー",
            error
        );

        return true;

    }

}


/* =========================================================
   Joy-Con / 照準が的に当たったか
========================================================= */

function shootAt(
    x,
    y,
    player
) {

    if (
        !gameStarted ||
        gameOver
    ) {
        return;
    }

    if (player === "left") {
        leftShots++;
    }

    if (player === "right") {
        rightShots++;
    }


    const targets =
        document.querySelectorAll(
            ".shooting-target"
        );


    for (const target of targets) {

            if (
                target.style.display ===
                "none"
            ) {
                continue;
            }


            if (
                !isVisiblePixel(
                    target,
                    x,
                    y
                )
            ) {
                continue;
            }


            if (
                typeof target.shootTarget ===
                "function"
            ) {

                target.shootTarget(
                    player
                );

                /* 1発で複数の的に得点が入らないようにする */
                return;

            }

    }

}

/* Macで背景をクリックした場合もP2の1発として数える */
gameArea.addEventListener("click", function () {
    if (gameStarted && !gameOver && !practiceMode) {
        leftShots++;
    }
});


/* =========================================================
   🔵 レックス 500点
========================================================= */

const rex1 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    150,
    210
);

const rex2 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    270,
    210
);

const rex3 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    390,
    210
);

const rex4 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    510,
    210
);


const rexTargets = [
    rex1,
    rex2,
    rex3,
    rex4
].filter(Boolean);


let rexDirection = 1;
let rexSteps = 0;


/* =========================================================
   レックス移動
========================================================= */

setInterval(
    function () {

        rexTargets.forEach(
            function (rex) {

                const currentX =
                    parseFloat(
                        rex.style.left
                    );


                rex.style.transition =
                    "left 2s ease-in-out";


                rex.style.left =
                    (
                        currentX +
                        10 *
                        rexDirection
                    ) + "px";


                rex.classList.remove(
                    "rex-jump"
                );


                void rex.offsetWidth;


                rex.classList.add(
                    "rex-jump"
                );

            }
        );


        rexSteps++;


        if (rexSteps >= 3) {

            rexDirection *= -1;
            rexSteps = 0;

        }

    },
    2000
);


/* =========================================================
   🟣 ブルズアイ 400点
========================================================= */

const purple =
    addTarget(
        "purple-targets",
        "bullseye.png",
        400,
        550,
        200
    );


if (purple) {

    purple.style.display =
        "none";


    purple.shootTarget =
        function (player) {

            if (
                purple.style.display ===
                "none"
            ) {
                return;
            }


            if (practiceMode) {

                purple.style.display =
                    "none";


                setTimeout(
                    function () {

                        if (practiceMode) {

                            purple.style.display =
                                "block";

                        }

                    },
                    500
                );

                return;
            }


            if (
                !gameStarted ||
                gameOver
            ) {
                return;
            }


            if (player === "left") {
                leftScore += 400;
                leftHits++;
            }


            if (player === "right") {
                rightScore += 400;
                rightHits++;
            }


            updateScores();


            purple.style.display =
                "none";


            setTimeout(
                function () {

                    if (
                        gameStarted &&
                        !gameOver
                    ) {

                        purple.style.display =
                            "block";

                    }

                },
                5000
            );

            return true;

        };


    /* 5秒後に登場 */

    setTimeout(
        function () {

            if (
                gameStarted &&
                !gameOver
            ) {

                purple.style.display =
                    "block";

            }

        },
        5000
    );

}


/* =========================================================
   🔴 ハム 100点
========================================================= */

addTarget(
    "red-targets",
    "ハム100.png",
    100,
    420,
    280
);

addTarget(
    "red-targets",
    "ハム100.png",
    100,
    590,
    280
);

addTarget(
    "red-targets",
    "ハム100.png",
    100,
    720,
    280
);

addTarget(
    "red-targets",
    "ハム100.png",
    100,
    850,
    280
);


/* =========================================================
   🟡 黄色のアヒル
========================================================= */

const yellowTargets = [

    addTarget(
        "yellow-targets",
        "アヒル100.png",
        100,
        380,
        370
    ),

    addTarget(
        "yellow-targets",
        "アヒル100.png",
        100,
        490,
        370
    ),

    addTarget(
        "yellow-targets",
        "アヒル100.png",
        100,
        600,
        370
    ),

    addTarget(
        "yellow-targets",
        "アヒル100.png",
        100,
        710,
        370
    ),

    addTarget(
        "yellow-targets",
        "アヒル100.png",
        100,
        820,
        370
    )

].filter(Boolean);


let yellowDirection = 1;

const yellowSpeed = 0.4;

const waterLeft = 290;
const waterRight = 990;


function moveYellowTargets() {

    yellowTargets.forEach(
        function (target) {

            let currentX =
                parseFloat(
                    target.style.left
                );


            currentX +=
                yellowSpeed *
                yellowDirection;


            target.style.left =
                currentX + "px";

        }
    );


    if (
        yellowTargets.length === 0
    ) {
        return;
    }


    const leftEdge =
        parseFloat(
            yellowTargets[0].style.left
        );


    const lastTarget =
        yellowTargets[
            yellowTargets.length - 1
        ];


    const rightEdge =
        parseFloat(
            lastTarget.style.left
        ) +
        lastTarget.offsetWidth;


    if (
        leftEdge <= waterLeft ||
        rightEdge >= waterRight
    ) {

        yellowDirection *= -1;

    }


    requestAnimationFrame(
        moveYellowTargets
    );

}


moveYellowTargets();


/* =========================================================
   🟢 緑のアヒル
========================================================= */

const greenTargets = [

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        380,
        420
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        490,
        420
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        600,
        420
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        710,
        420
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        820,
        420
    )

].filter(Boolean);


let greenDirection = 1;

const greenSpeed = 0.6;


function moveGreenTargets() {

    greenTargets.forEach(
        function (target) {

            let currentX =
                parseFloat(
                    target.style.left
                );


            currentX +=
                greenSpeed *
                greenDirection;


            target.style.left =
                currentX + "px";

        }
    );


    if (
        greenTargets.length === 0
    ) {
        return;
    }


    const leftEdge =
        parseFloat(
            greenTargets[0].style.left
        );


    const lastTarget =
        greenTargets[
            greenTargets.length - 1
        ];


    const rightEdge =
        parseFloat(
            lastTarget.style.left
        ) +
        lastTarget.offsetWidth;


    if (
        leftEdge <= 290 ||
        rightEdge >= 990
    ) {

        greenDirection *= -1;

    }


    requestAnimationFrame(
        moveGreenTargets
    );

}


moveGreenTargets();


/* =========================================================
   🟠 アライグマ 300点
========================================================= */

addTarget(
    "orange-targets",
    "reccoon.png",
    300,
    390,
    550,
    170
);

addTarget(
    "orange-targets",
    "reccoon.png",
    300,
    560,
    550,
    170
);

addTarget(
    "orange-targets",
    "reccoon.png",
    300,
    730,
    550,
    170
);


/* =========================================================
   🐦 ことり 1000点
========================================================= */

addTarget(
    "bird-targets",
    "ことり.png",
    1000,
    240,
    160,
    80
);

addTarget(
    "bird-targets",
    "ことり.png",
    1000,
    290,
    130,
    80
);

addTarget(
    "bird-targets",
    "ことり.png",
    1000,
    320,
    160,
    80
);


/* =========================================================
   🐔 ニワトリ 500点
========================================================= */

const chicken =
    addTarget(
        "chicken-targets",
        "ニワトリ.png",
        500,
        -150,
        560,
        160
    );


function moveChicken() {

    if (!chicken) {
        return;
    }


    chicken.style.transition =
        "none";

    chicken.style.left =
        "-150px";


    setTimeout(
        function () {

            if (!gameOver) {

                chicken.style.transition =
                    "left 7s linear";

                chicken.style.left =
                    "991px";

            }

        },
        50
    );

}


moveChicken();


setInterval(
    function () {

        if (!gameOver) {
            moveChicken();
        }

    },
    7000
);


/* =========================================================
   Joy-Con接続
========================================================= */

window.addEventListener(
    "gamepadconnected",
    function (event) {

        console.log(
            "Joy-Con接続:",
            event.gamepad.index,
            event.gamepad.id
        );

    }
);


window.addEventListener(
    "gamepaddisconnected",
    function (event) {

        console.log(
            "Joy-Con切断:",
            event.gamepad.index
        );

    }
);


/* =========================================================
   Joy-Con操作
========================================================= */

function updateGamepads() {

    const pads =
        navigator.getGamepads();


    let leftPad = null;
    let rightPad = null;


    for (const pad of pads) {

        if (!pad) {
            continue;
        }


        if (!leftPad) {

            leftPad = pad;

        }

        else if (!rightPad) {

            rightPad = pad;

        }

    }


    /* =====================================================
       左Joy-Con
       スティック axes 0,1
       発射 button 13
    ===================================================== */

    if (leftPad) {

        const axisX =
            leftPad.axes[0] || 0;

        const axisY =
            leftPad.axes[1] || 0;


        leftX +=
            axisX *
            cursorSpeed;


        leftY +=
            axisY *
            cursorSpeed;


        leftX =
            Math.max(
                0,
                Math.min(
                    991,
                    leftX
                )
            );


        leftY =
            Math.max(
                0,
                Math.min(
                    711,
                    leftY
                )
            );


        leftCursor.style.left =
            leftX + "px";

        leftCursor.style.top =
            leftY + "px";


        /* 発射ボタン */

        const fireButton =
            leftPad.buttons[6];


        if (
            fireButton &&
            fireButton.pressed &&
            !leftFirePressed
        ) {

            shootAt(
                leftX,
                leftY,
                "left"
            );

        }


        leftFirePressed =
            fireButton ?
            fireButton.pressed :
            false;

    }


    /* =====================================================
       右Joy-Con
       スティック axes 2,3
       発射 button 3
    ===================================================== */

    if (rightPad) {

        const axisX =
            rightPad.axes[2] || 0;

        const axisY =
            rightPad.axes[3] || 0;


        rightX +=
            axisX *
            cursorSpeed;


        rightY +=
            axisY *
            cursorSpeed;


        rightX =
            Math.max(
                0,
                Math.min(
                    991,
                    rightX
                )
            );


        rightY =
            Math.max(
                0,
                Math.min(
                    711,
                    rightY
                )
            );


        rightCursor.style.left =
            rightX + "px";

        rightCursor.style.top =
            rightY + "px";


        /* 発射ボタン */

        const fireButton =
            rightPad.buttons[7];


        if (
            fireButton &&
            fireButton.pressed &&
            !rightFirePressed
        ) {

            shootAt(
                rightX,
                rightY,
                "right"
            );

        }


        rightFirePressed =
            fireButton ?
            fireButton.pressed :
            false;

    }


    requestAnimationFrame(
        updateGamepads
    );

}


updateGamepads();


/* =========================================================
   30秒タイマー
========================================================= */

function startGameTimer() {

    if (gameTimer) {

        clearInterval(
            gameTimer
        );

    }


    timeLeft = 30;

    gameOver = false;


    timerText.textContent =
        "Time: 30";


    gameTimer =
        setInterval(
            function () {

                timeLeft--;


                timerText.textContent =
                    "Time: " +
                    timeLeft;


                /* 残り5秒 */

                if (
                    timeLeft <= 5 &&
                    timeLeft > 0
                ) {

                    showGameCountdown(
                        timeLeft
                    );

                }


                /* 0秒 */

                if (
                    timeLeft <= 0
                ) {

                    clearInterval(
                        gameTimer
                    );

                    gameTimer = null;


                    gameOver = true;
                    gameStarted = false;


                    timerText.textContent =
                        "Time: 0";


                    hideGameCountdown();


                    /* 上下の幕を閉める */

                    gameArea.classList.remove(
                        "curtain-open"
                    );

                    gameArea.classList.add(
                        "curtain-close"
                    );


                    /* 0.8秒後に結果 */

                    setTimeout(
                        function () {

                            showFinalScore();

                        },
                        800
                    );

                }

            },
            1000
        );

}


/* =========================================================
   残り5秒カウントダウン
========================================================= */

function showGameCountdown(number) {

    let element =
        document.getElementById(
            "game-countdown"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.id =
            "game-countdown";

        gameArea.appendChild(
            element
        );

    }


    element.textContent =
        number;

    element.style.display =
        "flex";

}


function hideGameCountdown() {

    const element =
        document.getElementById(
            "game-countdown"
        );


    if (element) {

        element.style.display =
            "none";

    }

}


/* =========================================================
   スタート画面
========================================================= */

const startButton =
    document.getElementById(
        "start-button"
    );

const startScreen =
    document.getElementById(
        "start-screen"
    );

const countdown =
    document.getElementById(
        "countdown"
    );


/* =========================================================
   練習用の的
========================================================= */

const practiceTarget1 =
    addTarget(
        "practice-targets",
        "練習的.png",
        0,
        -100,
        170,
        720
    );


const practiceTarget2 =
    addTarget(
        "practice-targets",
        "練習的.png",
        0,
        400,
        170,
        720
    );


if (practiceTarget1) {

    practiceTarget1.style.display =
        "none";

}


if (practiceTarget2) {

    practiceTarget2.style.display =
        "none";

}


/* =========================================================
   STARTボタン
========================================================= */

if (startButton) {

    startButton.addEventListener(
        "click",
        function () {

            console.log(
                "STARTボタンが押されました"
            );


            /* 二重スタート防止 */

            if (
                practiceMode ||
                gameStarted
            ) {
                return;
            }


            /* STARTボタンを消す */

            startButton.style.display =
                "none";


            /* 状態 */

            practiceMode = true;
            gameStarted = false;
            gameOver = false;


            /* 練習用の的を表示 */

            if (practiceTarget1) {

                practiceTarget1.style.display =
                    "block";

            }


            if (practiceTarget2) {

                practiceTarget2.style.display =
                    "block";

            }


            /* 「的をねらって！」 */

            const practiceText =
                document.getElementById(
                    "practice-text"
                );


            if (practiceText) {

                practiceText.style.display =
                    "block";

            }


            /* 10秒後 */

            setTimeout(
                function () {

                    /* 練習終了 */

                    practiceMode =
                        false;


                    /* 練習の的を消す */

                    if (practiceTarget1) {

                        practiceTarget1.style.display =
                            "none";

                    }


                    if (practiceTarget2) {

                        practiceTarget2.style.display =
                            "none";

                    }


                    const practiceContainer =
                        document.getElementById(
                            "practice-targets"
                        );


                    if (practiceContainer) {

                        practiceContainer.style.display =
                            "none";

                    }


                    /* 練習文字も消す */

                    const practiceText =
                        document.getElementById(
                            "practice-text"
                        );


                    if (practiceText) {

                        practiceText.style.display =
                            "none";

                    }


                    /* スタート背景を消す */

                    if (startScreen) {

                        startScreen.style.display =
                            "none";

                    }


                    /* 3・2・1 */

                    if (countdown) {

                        countdown.style.display =
                            "flex";

                        let count = 3;

                        countdown.textContent =
                            count;


                        const countdownTimer =
                            setInterval(
                                function () {

                                    count--;


                                    if (
                                        count > 0
                                    ) {

                                        countdown.textContent =
                                            count;

                                    }

                                    else {

                                        clearInterval(
                                            countdownTimer
                                        );


                                        countdown.style.display =
                                            "none";


                                        /* 幕を開ける */

                                        gameArea.classList.remove(
                                            "curtain-close"
                                        );

                                        gameArea.classList.add(
                                            "curtain-open"
                                        );


                                        /* 本番開始 */

                                        gameStarted =
                                            true;

                                        gameOver =
                                            false;


                                        /* 得点リセット */

                                        leftScore =
                                            0;

                                        rightScore =
                                            0;

                                        leftShots = 0;
                                        rightShots = 0;
                                        leftHits = 0;
                                        rightHits = 0;

                                        updateScores();


                                        /* タイマー開始 */

                                        startGameTimer();


                                        /* 本番用の的を表示 */

                                        document
                                            .querySelectorAll(
                                                "#game img.shooting-target"
                                            )
                                            .forEach(
                                                function (target) {

                                                    if (
                                                        target !==
                                                        practiceTarget1 &&
                                                        target !==
                                                        practiceTarget2
                                                    ) {

                                                        target.style.display =
                                                            "block";

                                                    }

                                                }
                                            );

                                    }

                                },
                                1000
                            );

                    }

                },
                10000
            );

        }
    );

}
else {

    console.error(
        "STARTボタンが見つかりません"
    );

}


/* =========================================================
   最終得点
========================================================= */

function showFinalScore() {

    /*
      このステージは左Joy-ConがP2、右Joy-ConがP1。
      親ページが3ステージ合計に使える形で渡す。
    */
    window.stageResult = {
        finished: true,
        stage: "friend",
        score1: rightScore,
        score2: leftScore,
        shots1: rightShots,
        shots2: leftShots,
        hits1: rightHits,
        hits2: leftHits
    };

    const finalCurtain =
        document.getElementById(
            "final-curtain"
        );


    if (finalCurtain) {

        finalCurtain.classList.add(
            "open"
        );

    }


    setTimeout(
        function () {

            if (
                document.getElementById(
                    "final-score"
                )
            ) {
                return;
            }


            const finalScore =
                document.createElement(
                    "div"
                );


            finalScore.id =
                "final-score";


            finalScore.innerHTML = `
                <div class="final-left">
                    ${leftScore}
                </div>

                <div class="final-right">
                    ${rightScore}
                </div>
            `;


            gameArea.appendChild(
                finalScore
            );

        },
        900
    );

}


/* =========================================================
   画面いっぱいに表示
========================================================= */

function resizeGame() {

    const game =
        document.getElementById(
            "game"
        );


    if (!game) {
        return;
    }


    const scaleX =
        window.innerWidth /
        991;


    const scaleY =
        window.innerHeight /
        711;


    game.style.transform =
        `scaleX(${scaleX}) scaleY(${scaleY})`;

}


window.addEventListener(
    "resize",
    resizeGame
);

resizeGame();


/* =========================================================
   初期化
========================================================= */

updateScores();

console.log(
    "ゲームプログラム読み込み完了"
);
