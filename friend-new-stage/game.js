
const hitSound = new Audio("pon.mp3");

const stage1Intro = document.getElementById("stage1-intro");
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

leftCursor.textContent = "+";
rightCursor.textContent = "+";

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

    hitSound.currentTime = 0;
    hitSound.play();

 /* -------------------------
   練習モード
------------------------- */

if (practiceMode) {

    // 撃った場所にインクを付ける
    createInk(
        target,
        window.currentShotX,
        window.currentShotY,
        player
    );

    // 的は消さない
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
        }

        if (player === "right") {
            rightScore += points;
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

            const scaleX =
    gameRect.width / 1024;

const scaleY =
    gameRect.height / 661;

const clickX =
    (event.clientX - gameRect.left) /
    scaleX;

const clickY =
    (event.clientY - gameRect.top) /
    scaleY;

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

            target.shootTarget("left");

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

    const scaleX =
        gameRect.width / 1024;

    const scaleY =
        gameRect.height / 661;

    /* ゲーム内座標 → 実際の画面座標 */

    const screenX =
        gameRect.left +
        gameX * scaleX;

    const screenY =
        gameRect.top +
        gameY * scaleY;

    const targetRect =
        target.getBoundingClientRect();

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
    (!gameStarted && !practiceMode) ||
    gameOver
) {
    return;
}

    const targets =
        document.querySelectorAll(
            ".shooting-target"
        );

    targets.forEach(
        function (target) {

            if (
                target.style.display ===
                "none"
            ) {
                return;
            }

if (
    !isVisiblePixel(
        target,
        x,
        y
    )
) {
    return;
}

/* 撃った場所を保存 */

window.currentShotX = x;
window.currentShotY = y;

if (
    typeof target.shootTarget ===
    "function"
) {

    target.shootTarget(
        player
    );

}

        
        }
    );

}

/* =========================================================
   練習モード・インクエフェクト
========================================================= */

function createInk(
    target,
    gameX,
    gameY,
    player
) {

    const container =
        document.getElementById(
            "practice-targets"
        );

    if (!container) {
        return;
    }

    /* 的の位置を取得 */

    const targetLeft =
        parseFloat(target.style.left);

    const targetTop =
        parseFloat(target.style.top);

    /* 的の中での位置 */

    const inkX =
        gameX - targetLeft;

    const inkY =
        gameY - targetTop;

    /* インク */

    const ink =
        document.createElement("div");

    ink.className =
        "practice-ink";

    /* 左＝ピンク */

    if (player === "left") {

        ink.style.background =
            "#ff69b4";

    }

    /* 右＝水色 */

    if (player === "right") {

        ink.style.background =
            "#55dfff";

    }

    /* インクの大きさ */

    const size =
        35 + Math.random() * 25;

    ink.style.width =
        size + "px";

    ink.style.height =
        size + "px";

    /* 撃った位置 */

    ink.style.left =
        (targetLeft + inkX - size / 2) +
        "px";

    ink.style.top =
        (targetTop + inkY - size / 2) +
        "px";

    /* 少しランダムに傾ける */

    ink.style.transform =
        `rotate(${Math.random() * 360}deg)`;

    container.appendChild(
        ink
    );

    /* 小さい飛び散りを追加 */

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const splat =
            document.createElement("div");

        splat.className =
            "practice-ink-splat";

        if (player === "left") {

            splat.style.background =
                "#ff69b4";

        }
        else {

            splat.style.background =
                "#55dfff";

        }

        const splatSize =
            6 + Math.random() * 12;

        const angle =
            Math.random() *
            Math.PI * 2;

        const distance =
            25 + Math.random() * 35;

        const sx =
            Math.cos(angle) *
            distance;

        const sy =
            Math.sin(angle) *
            distance;

        splat.style.width =
            splatSize + "px";

        splat.style.height =
            splatSize + "px";

        splat.style.left =
            (
                targetLeft +
                inkX +
                sx -
                splatSize / 2
            ) + "px";

        splat.style.top =
            (
                targetTop +
                inkY +
                sy -
                splatSize / 2
            ) + "px";

        container.appendChild(
            splat
        );

    }

}

/* =========================================================
   🔵 レックス 500点
========================================================= */

const rex1 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    230,
    200
);

const rex2 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    370,
    200
);

const rex3 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    510,
    200
);

const rex4 = addTarget(
    "blue-targets",
    "レックス500.png",
    500,
    650,
    200
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
        650,
        250,
        150
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
            }

            if (player === "right") {
                rightScore += 400;
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
   🟡 黄色のアヒル
   1回目に当てる → 300点
   ↓
   消える
   ↓
   300点のアヒルとして復活
========================================================= */

const duck1 = addTarget(
    "yellow-targets",
    "アヒル100.png",
    300,
    520,
    350
);

const duck2 = addTarget(
    "yellow-targets",
    "アヒル100.png",
    300,
    610,
    350
);

const duck3 = addTarget(
    "yellow-targets",
    "アヒル100.png",
    300,
    700,
    350
);

const duck4 = addTarget(
    "yellow-targets",
    "アヒル100.png",
    300,
    790,
    350
);

const duck5 = addTarget(
    "yellow-targets",
    "アヒル100.png",
    300,
    880,
    350
);

const yellowTargets = [
    duck1,
    duck2,
    duck3,
    duck4,
    duck5
].filter(Boolean);

/* =========================================================
   アヒル専用処理
========================================================= */

yellowTargets.forEach(function (duck) {

    duck.dataset.duckStage = "first";

    duck.shootTarget = function (player) {

        if (duck.style.display === "none") {
            return;
        }

        /* 練習モード */
        if (practiceMode) {

            createInk(
                duck,
                window.currentShotX,
                window.currentShotY,
                player
            );

            return;
        }

        /* 本番前・ゲーム終了後 */
        if (!gameStarted || gameOver) {
            return;
        }

        /* =====================================
           1回目
           → 300点
           → 消える
        ===================================== */

        if (duck.dataset.duckStage === "first") {

            if (player === "left") {
                leftScore += 300;
            }

            if (player === "right") {
                rightScore += 300;
            }

            updateScores();

            /* 300点状態にする */
            duck.dataset.duckStage = "second";

            /* 300点用の画像に変更 */
            duck.src = "アヒル300.png";

            /* 一旦消す */
            duck.style.display = "none";

            /* 1秒後に復活 */
            setTimeout(function () {

                if (gameStarted && !gameOver) {

                    duck.style.display = "block";

                }

            }, 1000);

            return;
        }

        /* =====================================
           2回目以降
           → 300点
           → 消える
           → 5秒後復活
        ===================================== */

        if (duck.dataset.duckStage === "second") {

            if (player === "left") {
                leftScore += 300;
            }

            if (player === "right") {
                rightScore += 300;
            }

            updateScores();

            /* 倒れる */
            duck.classList.add("fall-back");

            setTimeout(function () {

                duck.style.display = "none";

                duck.classList.remove("fall-back");

            }, 600);

            /* 5秒後に300点のまま復活 */
            setTimeout(function () {

                if (gameStarted && !gameOver) {

                    duck.style.display = "block";

                }

            }, 5000);

        }

    };

});

/* =========================================================
   アヒル移動
========================================================= */

let yellowDirection = 1;

const yellowSpeed = 0.4;

const waterLeft = 500;
const waterRight = 1050;

function moveYellowTargets() {

    yellowTargets.forEach(function (target) {

        if (
            !target ||
            target.style.display === "none"
        ) {
            return;
        }

        let currentX =
            parseFloat(target.style.left);

        currentX +=
            yellowSpeed *
            yellowDirection;

        target.style.left =
            currentX + "px";

    });

    if (yellowTargets.length === 0) {
        return;
    }

    const visibleTargets =
        yellowTargets.filter(function (target) {

            return (
                target &&
                target.style.display !== "none"
            );

        });

    if (visibleTargets.length > 0) {

        const leftEdge =
            parseFloat(
                visibleTargets[0].style.left
            );

        const lastTarget =
            visibleTargets[
                visibleTargets.length - 1
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

    }

    requestAnimationFrame(
        moveYellowTargets
    );

}

moveYellowTargets(); 

/* =========================================================
   🟢 緑のアヒル
   1回目 → 100点
   ↓
   300点のアヒルに変化
   ↓
   2回目以降 → 300点
========================================================= */

const greenTargets = [

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        520,
        400
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        610,
        400
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        700,
        400
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        790,
        400
    ),

    addTarget(
        "green-targets",
        "アヒル100.png",
        100,
        880,
        400
    )

].filter(Boolean);

/* =========================================================
   緑のアヒル専用処理
========================================================= */

greenTargets.forEach(function (duck) {

    duck.dataset.duckStage = "first";

    duck.shootTarget = function (player) {

        if (duck.style.display === "none") {
            return;
        }

        /* -------------------------
           練習モード
        ------------------------- */

        if (practiceMode) {

            createInk(
                duck,
                window.currentShotX,
                window.currentShotY,
                player
            );

            return;
        }

        /* -------------------------
           本番前・ゲーム終了後
        ------------------------- */

        if (!gameStarted || gameOver) {
            return;
        }

        /* =========================
           1回目
           → 100点
           → 300点アヒルに変化
        ========================= */

        if (duck.dataset.duckStage === "first") {

            if (player === "left") {
                leftScore += 100;
            }

            if (player === "right") {
                rightScore += 100;
            }

            updateScores();

            /* 300点状態に変更 */
            duck.dataset.duckStage = "second";

            duck.src = "アヒル300.png";

            /* 一度消す */
            duck.style.display = "none";

            /* 1秒後に復活 */
            setTimeout(function () {

                if (gameStarted && !gameOver) {
                    duck.style.display = "block";
                }

            }, 1000);

            return;
        }

        /* =========================
           2回目以降
           → 300点
           → 倒れる
           → 5秒後復活
        ========================= */

        if (duck.dataset.duckStage === "second") {

            if (player === "left") {
                leftScore += 300;
            }

            if (player === "right") {
                rightScore += 300;
            }

            updateScores();

            duck.classList.add("fall-back");

            setTimeout(function () {

                duck.style.display = "none";

                duck.classList.remove("fall-back");

            }, 600);

            /* 5秒後に復活 */

            setTimeout(function () {

                if (gameStarted && !gameOver) {
                    duck.style.display = "block";
                }

            }, 5000);

        }

    };

});

/* =========================================================
   緑のアヒル移動
========================================================= */

let greenDirection = 1;

const greenSpeed = 0.6;

function moveGreenTargets() {

    greenTargets.forEach(function (target) {

        if (
            !target ||
            target.style.display === "none"
        ) {
            return;
        }

        let currentX =
            parseFloat(target.style.left);

        currentX +=
            greenSpeed *
            greenDirection;

        target.style.left =
            currentX + "px";

    });

    if (greenTargets.length === 0) {
        return;
    }

    const visibleTargets =
        greenTargets.filter(function (target) {

            return (
                target &&
                target.style.display !== "none"
            );

        });

    if (visibleTargets.length > 0) {

        const leftEdge =
            parseFloat(
                visibleTargets[0].style.left
            );

        const lastTarget =
            visibleTargets[
                visibleTargets.length - 1
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

            greenDirection *= -1;

        }

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
    250,
    460,
    250
);

addTarget(
    "orange-targets",
    "reccoon.png",
    300,
    450,
    460,
    250
);

addTarget(
    "orange-targets",
    "reccoon.png",
    300,
    650,
    460,
    250
);

/* =========================================================
   🐦 ことり 1000点
========================================================= */

addTarget(
    "bird-targets",
    "ことり.png",
    1000,
    240,
    120,
    100
);

addTarget(
    "bird-targets",
    "ことり.png",
    1000,
    300,
    90,
    100
);

addTarget(
    "bird-targets",
    "ことり.png",
    1000,
    360,
    120,
    100
);

/* =========================================================
   🐔 ニワトリ 500点
========================================================= */

const chicken =
    addTarget(
        "chicken-targets",
        "ニワトリ.png",
        500,
        100,
        480,
        190
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
/* =========================
   うさぎ ×2
========================= */

const rabbit1 = addTarget(
    "rabbit-targets",
    "ハム100.png",
    300,
    180,
    380,
    140
);

const rabbit2 = addTarget(
    "rabbit-targets",
    "ハム100.png",
    300,
    300,
    380,
    140
);

/* =========================================================
   🐱 猫 400点
========================================================= */

addTarget(
    "cat-targets",
    "ねこ.png",
    400,
    790,
    150,
    100
);

/* =========================================================
   🐐 やぎ 600点
   山を登るように移動
========================================================= */

const goat =
    addTarget(
        "goat-targets",
        "goat.png",
        600,
        100,
        600,
        100
    );

/* =========================
   レクサー ×3
========================= */

const rexer1 = addTarget(
    "rexer-targets",
    "レクサー.png",
    500,
    200,
    250,
    130
);

const rexer2 = addTarget(
    "rexer-targets",
    "レクサー.png",
    500,
    350,
    250,
    130
);

const rexer3 = addTarget(
    "rexer-targets",
    "レクサー.png",
    500,
    500,
    250,
    130
);
    
/* =========================
   🐦 スズメ ×2
   右 → 左へゆっくり飛ぶ
========================= */

const sparrow1 = addTarget(
    "sparrow-targets",
    "sparrow.png",
    500,
    200,
    70,
    120
);

const sparrow2 = addTarget(
    "sparrow-targets",
    "sparrow.png",
    500,
    130,
    100,
    120
);

const sparrowTargets = [
    sparrow1,
    sparrow2
].filter(Boolean);

/* =========================
   スズメの移動
========================= */

function moveSparrow(sparrow, delay) {

    if (!sparrow) return;

    // 右側の画面外からスタート
    sparrow.style.transition = "none";
    sparrow.style.left = "1024px";

    setTimeout(function () {

        if (!gameOver) {

            // 12秒かけて右 → 左
            sparrow.style.transition =
                "left 12s linear";

            sparrow.style.left =
                "-150px";
        }

    }, delay);
}

/* =========================
   最初の飛行
========================= */

// 1匹目
moveSparrow(sparrow1, 0);

// 3秒後に2匹目
moveSparrow(sparrow2, 3000);

/* =========================
   繰り返し
========================= */

setInterval(function () {

    if (!gameOver) {

        // 1匹目
        moveSparrow(sparrow1, 0);

        // 3秒後に2匹目
        moveSparrow(sparrow2, 3000);

    }

}, 13000);

/* =========================
   5000点「がっき」
   1ゲームにつき2回出現
========================= */

let gakkiTimers = [];

function showGakki() {

    if (!gameStarted || gameOver) {
        return;
    }

    const gakki = addTarget(
        "gakki-targets",
        "gakki.png",
        5000,
        650,
        160,
        100
    );

    if (!gakki) {
        console.log("がっき.pngを作れませんでした");
        return;
    }

    console.log("5000点のがっきが出現！");

    /* 2秒後に消す */
    setTimeout(function () {

        gakki.style.display = "none";

    }, 2000);
}


function startGakkiTarget() {

    /* 前回のタイマーを消す */
    gakkiTimers.forEach(function (timer) {
        clearTimeout(timer);
    });

    gakkiTimers = [];


    /* =========================
       1回目
       5～10秒後
    ========================= */

    const firstTime =
        5000 + Math.random() * 5000;


    const timer1 = setTimeout(function () {

        showGakki();

    }, firstTime);


    gakkiTimers.push(timer1);


    /* =========================
       2回目
       17～22秒後
    ========================= */

    const secondTime =
        17000 + Math.random() * 5000;


    const timer2 = setTimeout(function () {

        showGakki();

    }, secondTime);


    gakkiTimers.push(timer2);
}

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

        console.log(
            "ボタン数:",
            event.gamepad.buttons.length
        );

        event.gamepad.buttons.forEach(
            function(button, index) {

                console.log(
                    "button",
                    index,
                    "pressed:",
                    button.pressed
                );

            }
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

function updateGamepads() {
    const pads = navigator.getGamepads();

    // =========================
    // Joy-Conを取得
    // =========================

    let joyCon0 = pads[0];
    let joyCon1 = pads[1];

    // =========================
    // 🩷 PLAYER 1
    // index 0
    // =========================

    if (joyCon0 && joyCon0.connected) {

        const x = Math.abs(joyCon0.axes[0]) > 0.15
            ? joyCon0.axes[0]
            : 0;

        const y = Math.abs(joyCon0.axes[1]) > 0.15
            ? joyCon0.axes[1]
            : 0;

        leftX += x * cursorSpeed;
        leftY += y * cursorSpeed;

        leftX = Math.max(0, Math.min(1024, leftX));
        leftY = Math.max(0, Math.min(661, leftY));

        leftCursor.style.left = leftX + "px";
        leftCursor.style.top = leftY + "px";

        const pressed = !!joyCon0.buttons[6]?.pressed;

        if (pressed && !leftFirePressed) {
            shootAt(leftX, leftY, "left");
        }

        leftFirePressed = pressed;
    }

    // =========================
    // 🩵 PLAYER 2
    // index 1
    // =========================

    if (joyCon1 && joyCon1.connected) {

        /*
         * Joy-Con L+Rの場合
         * 左スティック = axes 0,1
         * 右スティック = axes 2,3
         */

        const x = Math.abs(joyCon1.axes[2]) > 0.15
            ? joyCon1.axes[2]
            : 0;

        const y = Math.abs(joyCon1.axes[3]) > 0.15
            ? joyCon1.axes[3]
            : 0;

        rightX += x * cursorSpeed;
        rightY += y * cursorSpeed;

        rightX = Math.max(0, Math.min(1024, rightX));
        rightY = Math.max(0, Math.min(661, rightY));

        rightCursor.style.left = rightX + "px";
        rightCursor.style.top = rightY + "px";

        const pressed = !!joyCon1.buttons[7]?.pressed;

        if (pressed && !rightFirePressed) {
            shootAt(rightX, rightY, "right");
        }

        rightFirePressed = pressed;
    }

    requestAnimationFrame(updateGamepads);
}

updateGamepads();

function startGameTimer() {

    if (gameTimer) {

        clearInterval(
            gameTimer
        );

    }

    timeLeft = 30
    ;

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

    /* 統合画面へ結果を渡す */
const scoreText =
  document.getElementById("score").textContent;

const leftScore =
  Number(
    scoreText
      .match(/LEFT:\s*([\d,]+)/)?.[1]
      ?.replace(/,/g, "")
  ) || 0;

const rightScore =
  Number(
    scoreText
      .match(/RIGHT:\s*([\d,]+)/)?.[1]
      ?.replace(/,/g, "")
  ) || 0;

window.stageResult = {
  finished: true,
  stage: "friend",

  score1: leftScore,
  score2: rightScore,

  shots1: 0,
  shots2: 0,
  hits1: 0,
  hits2: 0
};

hideGameCountdown();

/* =========================
   上下の幕を閉める
   ========================= */

gameArea.classList.remove(
    "curtain-open"
);

gameArea.classList.add(
    "curtain-close"
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
        -80,
        130,
        700
    );

const practiceTarget2 =
    addTarget(
        "practice-targets",
        "練習的.png",
        0,
        380,
        130,
        700
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

/* 練習画面全体を表示 */

practiceTargets.style.display = "block";

/* 練習用の的を表示 */

if (practiceTarget1) {

    practiceTarget1.style.display =
        "block";

}

if (practiceTarget2) {

    practiceTarget2.style.display =
        "block";

}

/* 「的をねらって！」を表示 */

practiceText.style.display = "block";

/* =========================
   10秒後に練習終了
========================= */

setTimeout(function () {

    /* 練習終了 */
    practiceMode = false;

    /* 練習の的を消す */
    if (practiceTarget1) {
        practiceTarget1.style.display = "none";
    }

    if (practiceTarget2) {
        practiceTarget2.style.display = "none";
    }

    /* 練習画面を消す */
    practiceTargets.style.display = "none";

    /* 練習文字を消す */
    practiceText.style.display = "none";

    /* START画面を消す */
    if (startScreen) {
        startScreen.style.display = "none";
    }

    /* =========================
       STAGE 1 説明画面
    ========================= */

    stage1Intro.style.display = "flex";

    /* 3秒間表示 */

    setTimeout(function () {

        stage1Intro.style.display = "none";

        /* =========================
           3・2・1
        ========================= */

        startCountdown();

    }, 5000);

}, 10000);                           
                                                                                            

                                                                                                                             

        }
    );

}
else {

    console.error(
        "STARTボタンが見つかりません"
    );

}

    

/* =========================================================
   画面いっぱいに表示
========================================================= */

function resizeGame() {
    const game = document.getElementById("game");
    if (!game) return;

    const GAME_WIDTH = 1024;
    const GAME_HEIGHT = 661;

    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;

    game.style.width = GAME_WIDTH + "px";
    game.style.height = GAME_HEIGHT + "px";

    // 横・縦をそれぞれ画面いっぱいまで拡大
    game.style.transform =
        "scaleX(" + scaleX + ") scaleY(" + scaleY + ")";

    game.style.left = "0px";
    game.style.top = "0px";

    // 変形の基準点
    game.style.transformOrigin = "top left";
}

window.addEventListener("resize", resizeGame);
resizeGame();

    
/* =========================================================
   初期化
========================================================= */

updateScores();

console.log(
    "ゲームプログラム読み込み完了"
);

function startCountdown() {

    const countdown = document.getElementById("countdown");

    countdown.style.display = "flex";

    let count = 3;

    countdown.textContent = count;

    const countdownTimer = setInterval(() => {

        count--;

        if (count > 0) {

            countdown.textContent = count;

        } else {

            clearInterval(countdownTimer);

            countdown.style.display = "none";

            // 本番開始
            startMainGame();

        }

    }, 1000);
}

function startMainGame() {

    /* =========================
       本番開始
    ========================= */

    gameStarted = true;
    gameOver = false;
    practiceMode = false;

    /* 得点リセット */

    leftScore = 0;
    rightScore = 0;

    updateScores();

    /* =========================
       幕を開ける
    ========================= */

    gameArea.classList.remove(
        "curtain-close"
    );

    gameArea.classList.add(
        "curtain-open"
    );

    /* =========================
       ガッキー5000点開始
    ========================= */

    startGakkiTarget();

    /* =========================
       本番用の的を表示
    ========================= */

    document
        .querySelectorAll(
            "#game img.shooting-target"
        )
        .forEach(
            function (target) {

                if (
                    target !== practiceTarget1 &&
                    target !== practiceTarget2
                ) {

                    target.style.display =
                        "block";

                }

            }
        );

    /* =========================
       30秒タイマー開始
    ========================= */

    startGameTimer();

}
