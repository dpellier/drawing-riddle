
const screenMinWidth = 1440;
const screenMinHeight = 766;

const blockPerLine = 18;
const blockPerColumn = 5;
const nbBlocks = blockPerLine * blockPerColumn;
const blockWidth = 40;
const blockHeight = 24;
const blockSpace = 30;

const blockAnimationInitialDelay = 1;

const canvasWidth = (blockWidth * blockPerLine) + (blockSpace * (blockPerLine - 1));
const canvasHeight = (blockHeight * blockPerColumn) + (blockHeight * (blockPerColumn - 1));

let drawingContainer = null;

let blockContainer = null;
let blocks = [];

let canvasContext = null;
let canvasOffset = null;
let drawCanvas = null;

let clueGiver = null;
let clueGiverBubble = null;
let clueBottomElements = null;
let clueTopElements = null;
let tauntGiver = null;
let tauntGiverBubble = null;

let logoElement = null;
let logoText = null;
let actionsElement = null;
let actionsButtons = null;

let isReadyToDraw = false;
let isDrawing = false;
let isInsideCanvas = false;
let drawingStart = null;
let lastMouseCoordinates = null;

let successPage = null;

function addBlock(id) {
    const block = document.createElement('div');
    block.className = 'block';
    block.style.borderWidth = `${blockHeight / 3}px`;
    block.style.width = `${blockWidth}px`;
    block.style.height = `${blockHeight}px`;
    block.style.animationDelay = `${blockAnimationInitialDelay +(id/50)}s`;
    block.dataset.block = id;
    block.onclick = function() {
        onBlockClick(id);
    };

    if (id % blockPerLine !== 0) {
        block.style.marginLeft = `${blockSpace}px`;
    }

    if (id >= blockPerLine) {
        block.style.marginTop = `${blockHeight}px`;
    }

    if (+id === nbBlocks - 1) {
        block.onanimationend = function() {
            dispatchCustomEvent('AllBlocksAnimated');
        }
    }

    blockContainer.appendChild(block);
}

function addLinkBetween(startBlock, endBlock) {
    const diffWidth = endBlock.x - startBlock.x;
    const diffHeight = endBlock.y - startBlock.y;
    const angle = getRotationAngle(diffWidth, diffHeight);

    const line = document.createElement('div');
    line.className = 'line';
    line.style.top = `${startBlock.centerY - canvasOffset.top}px`;
    line.style.left = `${startBlock.centerX - canvasOffset.left}px`;
    line.style.width = `${getDiagonalLength(Math.abs(diffWidth), Math.abs(diffHeight))}px`;
    line.style.transform = `rotate(${diffWidth >= 0 ? angle : angle + 180}deg)`;
    line.dataset.line = 'true';

    blockContainer.appendChild(line);

    startBlock.linkedTo.push(endBlock.id);
    endBlock.linkedTo.push(startBlock.id);
}

function cleanCanvas() {
    canvasContext.clearRect(0,0, drawCanvas.width, drawCanvas.height);
}

function dispatchCustomEvent(name) {
    requestAnimationFrame(() => {
        document.dispatchEvent(new Event(name));
    });
}

function displayErrorMessage() {
    const alertElement = document.createElement('div');
    alertElement.className = 'small-screen-alert';

    const message = document.createElement('p');
    message.innerText = `Nop this page is meant to be seen on a desktop screen with at least ${screenMinWidth}px width and ${screenMinHeight}px height.`;

    alertElement.appendChild(message);

    while (document.body.firstChild) {
        document.body.removeChild(document.body.lastChild);
    }

    document.body.appendChild(alertElement);
}

function getBlockId(element) {
    return element.dataset.block;
}

function getDiagonalLength(width, height) {
    return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
}

function getRotationAngle(width, height) {
    return Math.atan(height / width) * (180 / Math.PI);
}

function offset(element) {
    const rect = element.getBoundingClientRect();
    const bodyElement = document.body;

    return {
        top: rect.top + bodyElement .scrollTop,
        left: rect.left + bodyElement .scrollLeft
    };
}

function onBlockClick(id) {
    const block = blocks.find((block) => block.id === id);

    if (block) {
        drawingStart = block;
    } else {
        drawingStart = null;
    }
}

function onClueClick() {
    requestAnimationFrame(() => {
        clueGiverBubble.style.opacity = '0';
        clueGiver.style.right = '-300px';

        clueBottomElements.forEach((element, idx) => {
            element.style.left = `${170 + (210 * idx)}px`;
            element.style.opacity = '1';
        });

        clueTopElements.forEach((element, idx) => {
            element.style.left = `${170 + (210 * idx)}px`;
            element.style.opacity = '1';
        });
    });
}

function onClueGiverDisappeared() {
    setTimeout(() => {
        requestAnimationFrame(() => {
            tauntGiver.style.right = '20px';
        });
    }, 10000);
}

function onMouseEnterCanvas() {
    isInsideCanvas = true;
}

function onMouseLeaveCanvas() {
    isInsideCanvas = false
}

function onTauntGiverAppeared() {
    requestAnimationFrame(() => {
        tauntGiverBubble.style.opacity = '1';
    });
}

function reset() {
    cleanCanvas();

    blocks = blocks.map((block) => {
        block.linkedTo = [];
        return block;
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-line]'), (element) => {
        element.parentNode.removeChild(element);
    });
}

function areArrayEquals(arr1, arr2) {
    const arr2Sorted = arr2.slice().sort();
    return arr1.length === arr2.length && arr1.slice().sort().every((value, index) => {
        return value === arr2Sorted[index];
    });
}

function submit() {
    dispatchCustomEvent('CheckingAnswer');

    let isProblemSolved = true;

    const promises = [
        fetch('/api/answers/1').then(response => response.json()),
        fetch('/api/answers/2').then(response => response.json()),
        fetch('/api/answers/3').then(response => response.json()),
        fetch('/api/answers/4').then(response => response.json()),
        fetch('/api/answers/5').then(response => response.json()),
        fetch('/api/answers/6').then(response => response.json())
    ];

    Promise.all(promises).then((answers) => {
        for (let i = 0; i < promises.length; i++) {
            const isSolved = answers[i].some((answer) => {
                let startIdx = i * 3;
                let blockIdx = startIdx

                for (let j = 0; j < 15; j++) {
                    blockIdx = j % 3 === 0 ? startIdx + (j * 6) : blockIdx + 1;

                    if (!areArrayEquals(blocks[blockIdx].linkedTo, answer[j])) {
                        return false
                    }
                }

                return true;
            });

            if (!isSolved) {
                isProblemSolved = false;
                break;
            }
        }

        if (isProblemSolved) {
            setTimeout(() => {
                dispatchCustomEvent('AnswerTrue');
            }, 2000);
        } else {
            setTimeout(() => {
                dispatchCustomEvent('AnswerWrong');
            }, 2000);
        }
    });
}

document.addEventListener('mousemove', function(event) {
    if (isReadyToDraw && isInsideCanvas && isDrawing && canvasContext) {
        lastMouseCoordinates = {
            x: event.clientX,
            y: event.clientY
        };

        cleanCanvas();
        canvasContext.beginPath();
        canvasContext.moveTo(drawingStart.centerX - canvasOffset.left, drawingStart.centerY - canvasOffset.top);
        canvasContext.lineTo(lastMouseCoordinates.x - canvasOffset.left, lastMouseCoordinates.y - canvasOffset.top);
        canvasContext.stroke();
    }
});

document.addEventListener('mouseup', function(event) {
    if (isReadyToDraw && isInsideCanvas) {
        if (isDrawing && lastMouseCoordinates && drawingStart) {
            const endBlock = blocks.find((block) => {
                return block.id !== drawingStart.id
                    && drawingStart.linkedTo.indexOf(block.id) < 0
                    && lastMouseCoordinates.x >= block.x && lastMouseCoordinates.x <= (block.x + blockWidth)
                    && lastMouseCoordinates.y >= block.y && lastMouseCoordinates.y <= (block.y + blockHeight)
            });

            if (endBlock) {
                addLinkBetween(drawingStart, endBlock);
            }
            cleanCanvas();
        }

        isDrawing = !isDrawing;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth < screenMinWidth || window.innerHeight < screenMinHeight) {
        displayErrorMessage();
        return;
    }

    logoElement = document.querySelector('[data-logo]');
    logoText = logoElement.querySelector('p');
    actionsElement = document.querySelector('[data-actions]');
    actionsButtons = actionsElement.querySelectorAll('button');

    clueGiver = document.querySelector('[data-clue-giver]');
    clueGiverBubble = document.querySelector('[data-clue-giver-bubble]');
    clueBottomElements = document.querySelectorAll('[data-clue-bottom');
    clueTopElements = document.querySelectorAll('[data-clue-top');

    tauntGiver = document.querySelector('[data-taunt-giver]');
    tauntGiverBubble = document.querySelector('[data-taunt-giver-bubble]');

    drawingContainer = document.querySelector('[data-drawing-container]');
    drawingContainer.style.width = `${canvasWidth}px`;
    drawingContainer.style.height = `${canvasHeight}px`;

    drawCanvas = document.getElementById('drawing');
    drawCanvas.width = canvasWidth;
    drawCanvas.height = canvasHeight;

    canvasContext = drawCanvas.getContext('2d');
    canvasContext.strokeStyle = '#1e90ff';
    canvasContext.lineWidth = 6;

    blockContainer = document.querySelector('[data-blocks]');
    blockContainer.style.width = `${canvasWidth}px`;
    blockContainer.style.height = `${canvasHeight}px`;

    successPage = document.querySelector('[data-success-page]');

    for (let i = 0; i < nbBlocks; i++) {
        addBlock(i.toString());
    }

    setTimeout(() => {
        dispatchCustomEvent('ElementsReady');
    }, 1000);
});

// When all elements are actually rendered with their width and height computed
document.addEventListener('ElementsReady', function() {
    canvasOffset = offset(drawCanvas);

    blockContainer.addEventListener('mouseenter', onMouseEnterCanvas);
    blockContainer.addEventListener('mouseleave', onMouseLeaveCanvas);

    blocks = Array.prototype.map.call(document.querySelectorAll('[data-block]'), ((blockElement) => {
        const rect = blockElement.getBoundingClientRect();

        return {
            centerX: rect.x + (rect.width / 2),
            centerY: rect.y + (rect.height / 2),
            element: blockElement,
            id: getBlockId(blockElement),
            linkedTo: [],
            x: rect.x,
            y: rect.y
        };
    }));

    clueGiver.addEventListener('transitionend', onClueGiverDisappeared);
    tauntGiver.addEventListener('transitionend', onTauntGiverAppeared);
});

document.addEventListener('AllBlocksAnimated', function() {
    isReadyToDraw = true;

    requestAnimationFrame(() => {
        logoElement.style.opacity = '1';
        actionsElement.style.opacity = '1';
    });
});

document.addEventListener('CheckingAnswer', function() {
    isReadyToDraw = false;

    actionsButtons.forEach((button) => {
        button.disabled = true;
    });

    logoText.innerText = 'Processing...';
    logoText.style.animationName = 'blink';
});

document.addEventListener('AnswerWrong', function() {
    document.body.style.backgroundColor = '#ff0000';

    isReadyToDraw = true;

    actionsButtons.forEach((button) => {
        button.disabled = false;
    });

    logoText.innerText = '';
    logoText.style.animationName = '';

    setTimeout(() => {
        requestAnimationFrame(() => {
            document.body.style.backgroundColor = '#000';
        });
    }, 1000);
});

document.addEventListener('AnswerTrue', function() {
    document.body.style.backgroundColor = '#54a900';

    logoText.innerText = '';
    logoText.style.animationName = '';

    successPage.style.display = 'block';

    setTimeout(() => {
        requestAnimationFrame(() => {
            successPage.style.opacity = '1';
        });
    }, 2000);
});

window.onresize = function() {
    location.reload();
};
