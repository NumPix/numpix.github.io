export const filterSettings = {
    useState: false,
    useDepth: false,

    c0: '*', c1: '*', c2: '*',
    c3: '*', c4: '*', c5: '*',
    c6: '*', c7: '*', c8: '*',

    minDepth: 0,
    maxDepth: 9,

    applyFilter: () => {} 
};

export var mouseOverUI = false;

document.querySelectorAll('#hud, .hud-panel, #helpPanel').forEach(el => {
    el.addEventListener('mouseenter', () => mouseOverUI = true);
    el.addEventListener('mouseleave', () => mouseOverUI = false);
});

export function initFilterGUI(applyCallback) {

    document.querySelectorAll(".folder-header").forEach(header => {
        header.addEventListener("click", () => {
            header.parentElement.classList.toggle("open");
        });
    });

    const stateFilterToggle = document.getElementById("stateFilterToggle");
    const depthFilterToggle = document.getElementById("depthFilterToggle");

    const stateFilterFolder = document.getElementById("stateFilterFolder");
    const depthFilterFolder = document.getElementById("depthFilterFolder");

    stateFilterToggle.addEventListener("change", () => {
        filterSettings.useState = stateFilterToggle.checked;
        if (filterSettings.useState) {
            stateFilterFolder.classList.add("open");
        } else {
            stateFilterFolder.classList.remove("open");
        }
    });

    depthFilterToggle.addEventListener("change", () => {
        filterSettings.useDepth = depthFilterToggle.checked;
        if (filterSettings.useDepth) {
            depthFilterFolder.classList.add("open");
        } else {
            depthFilterFolder.classList.remove("open");
        }
    });

    const minDepthValueLabel = document.getElementById("minDepthValue");
    const maxDepthValueLabel = document.getElementById("maxDepthValue");

    const minDepthInput = document.getElementById("minDepthInput");
    const maxDepthInput = document.getElementById("maxDepthInput");

    minDepthValueLabel.textContent = minDepthInput.value;
    maxDepthValueLabel.textContent = maxDepthInput.value;

    minDepthInput.addEventListener("input", () => {
        minDepthValueLabel.textContent = minDepthInput.value;
        filterSettings.minDepth = parseInt(minDepthInput.value);
    });

    maxDepthInput.addEventListener("input", () => {
        maxDepthValueLabel.textContent = maxDepthInput.value;
        filterSettings.maxDepth = parseInt(maxDepthInput.value);
    });

    function getFilterBoardString() {
        const tiles = document.querySelectorAll('#filter-board .tile div');
        let result = '';
        tiles.forEach(tile => {
            const stateIndex = parseInt(tile.dataset.stateIndex) || 0;
            result += tileStates[stateIndex];
        });
        return result;
    }

    function formatFilterBoard() {
        let board = getFilterBoardString();
        const tiles = document.querySelectorAll('#filter-board .tile div');
        board.split('').forEach((ch, i) => {
            const div = tiles[i];
            div.className = '';
            div.textContent = '';

            switch (ch) {
                case 'X':
                case 'O':
                    div.classList.add(ch);
                    div.textContent = ch;
                    break;
                case 'x':
                    div.classList.add('X', 'red');
                    div.textContent = 'X';
                    break;
                case 'o':
                    div.classList.add('O', 'red');
                    div.textContent = 'O';
                    break;
                case '-':
                    break;
                case '!':
                    div.classList.add('red-bg');
                    break;
                case '*':
                    div.classList.add('green-bg');
                    break;
            }
        });
    }

    function updateFilterSettingsFromBoard() {
        const board = getFilterBoardString();
        for (let i = 0; i < 9; i++) {
            filterSettings['c' + i] = board[i];
        }
    }

    const tileStates = [
        '*',        // anything
        'X',        // X
        'O',        // O
        '-',        // empty
        'x',        // not X
        'o',        // not O
        '!',        // not empty
    ];

    const filterTiles = document.querySelectorAll('#filter-board .tile div');
    filterTiles.forEach((tile, index) => {
        tile.dataset.stateIndex = 0;
        tile.addEventListener('click', () => {
            let currentIndex = parseInt(tile.dataset.stateIndex);
            let nextIndex = (currentIndex + 1) % tileStates.length;
            tile.dataset.stateIndex = nextIndex;

            formatFilterBoard();
            updateFilterSettingsFromBoard();
        });
    });

    formatFilterBoard();

    function updateTileFontSizes() {
        document.querySelectorAll('#board .tile').forEach(tile => {
            const height = tile.getBoundingClientRect().height;
            tile.style.fontSize = `${height * 0.8}px`;
        });

        document.querySelectorAll('#filter-board .tile').forEach(tile => {
            const div = tile.querySelector('div');
            const ro = new ResizeObserver(entries => {
                const height = tile.getBoundingClientRect().height;
                div.style.fontSize = `${height * 0.8}px`;
            });
            ro.observe(tile);
        });
    }

    window.addEventListener('resize', updateTileFontSizes);
    
    updateTileFontSizes();

    const helpPanel = document.getElementById('helpPanel');
    const helpToggle = document.getElementById('helpToggle');

    helpToggle.addEventListener('click', () => {
        helpPanel.classList.toggle('expanded');
        helpToggle.textContent = helpPanel.classList.contains('expanded') ? 'x' : '?';
    });


    const ApplyFiltersButton = document.getElementById("applyFiltersButton");
    ApplyFiltersButton.addEventListener('click', () => applyCallback(filterSettings));

}