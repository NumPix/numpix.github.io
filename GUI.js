import * as dat from 'dat.gui'

export const filterSettings = {
    usePattern: false,
    useDepth: false,

    c0: '*', c1: '*', c2: '*',
    c3: '*', c4: '*', c5: '*',
    c6: '*', c7: '*', c8: '*',

    minDepth: 0,
    maxDepth: 9,

    applyFilter: () => {} 
};


export function initFilterGUI(applyCallback) {
    const gui = new dat.GUI();


    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '145px';
    gui.domElement.style.right = 'auto';
    gui.domElement.style.left = '10px';

    gui.add(filterSettings, 'usePattern').name('Filter by state');
    gui.add(filterSettings, 'useDepth').name('Filter by depth');


    const patternFolder = gui.addFolder('State pattern');
    patternFolder.open();

    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 60px)';
    gridContainer.style.gap = '5px';
    patternFolder.domElement.appendChild(gridContainer);

    for (let i = 0; i < 9; i++) {
        const select = document.createElement('select');
        ['*','X','O','-','!','x','o'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        });
        select.value = filterSettings[`c${i}`];
        select.onchange = () => filterSettings[`c${i}`] = select.value;
        gridContainer.appendChild(select);
    }


    const depthFolder = gui.addFolder('Depth filter');
    depthFolder.add(filterSettings, 'minDepth', 0, 9, 1).name('Min depth');
    depthFolder.add(filterSettings, 'maxDepth', 0, 9, 1).name('Max depth');

    function updateFolders() {
        patternFolder.domElement.style.display = filterSettings.usePattern ? '': "none";
        depthFolder.domElement.style.display = filterSettings.useDepth ? '': "none";
    }


    gui.__controllers.forEach(c => c.onChange(updateFolders));
    updateFolders();

    filterSettings.applyFilter = function() {
        if (typeof applyCallback === 'function') {
            applyCallback(filterSettings);
        }
    };

    gui.add(filterSettings, 'applyFilter').name('Apply Filter');
}