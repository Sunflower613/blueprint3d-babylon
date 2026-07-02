export let testMap;
export let viewer3d;
export let entityManager;
export let INCHES_PER_UNIT;
export let updateSelectedRoom;
export let updateSelectedFloor;
export let updateSelectedStructure;
export let updateSelectedRotation;
export let updateSelectedScale;
export let updateSelectedPose;
export let updateSelectedWallLength;
export let updateSelectedWallRotation;
export let previewSelectedWallRotation;
export let commitSelectedStructureRotation;
export let previewSelectedStructureRotation;
export let deleteSelectedStructure;
export let updateSelectedSize;
export let updateSelectedOpening;
export let updateSelectedFenceGate;
export let deleteSelectedFenceGate;
export let updateSelectedFenceSubtype;
export let updateSelectedFenceLength;
export let updateSelectedFenceHeight;
export let updateSelectedFenceColor;
export let updateSelectedFenceYOffset;
export let applyMaterialToItemComponent;
export let updateComponentMaterial;
export let isTargetLocked;
export let showToast;
export let pushHistory;
export let refreshShadows;
export let renderPlan;
export let refresh3DGrid;
export let findNearestSeat;
export let isSymmetricShape;
export let syncRotationInputs;
export let setTargetLocked;
export let clearSelection;
export let revealRightPanelIfNeeded;
export let getSnapEnabled;
export let setSnapEnabled;
export let getSnapSize;
export let setSnapSize;
export let showCustomConfirm;
export let currentRooms;
export let canPlaceOnTable;
export let findTableBelow;
export let findBookshelfNearby;
export let snapToBookshelf;
export let getShelfLayerHeights;
export let getItemsCountOnBookshelf;
export let getSelectedStructure;

export function initEditorUiContext(context) {
  ({
    testMap,
    viewer3d,
    entityManager,
    INCHES_PER_UNIT,
    updateSelectedRoom,
    updateSelectedFloor,
    updateSelectedStructure,
    updateSelectedRotation,
    updateSelectedScale,
    updateSelectedPose,
    updateSelectedWallLength,
    updateSelectedWallRotation,
    previewSelectedWallRotation,
    commitSelectedStructureRotation,
    previewSelectedStructureRotation,
    deleteSelectedStructure,
    updateSelectedSize,
    updateSelectedOpening,
    updateSelectedFenceGate,
    deleteSelectedFenceGate,
    updateSelectedFenceSubtype,
    updateSelectedFenceLength,
    updateSelectedFenceHeight,
    updateSelectedFenceColor,
    updateSelectedFenceYOffset,
    applyMaterialToItemComponent,
    updateComponentMaterial,
    isTargetLocked,
    showToast,
    pushHistory,
    refreshShadows,
    renderPlan,
    refresh3DGrid,
    findNearestSeat,
    isSymmetricShape,
    syncRotationInputs,
    setTargetLocked,
    clearSelection,
    revealRightPanelIfNeeded,
    getSnapEnabled,
    setSnapEnabled,
    getSnapSize,
    setSnapSize,
    showCustomConfirm,
    currentRooms,
    canPlaceOnTable,
    findTableBelow,
    findBookshelfNearby,
    snapToBookshelf,
    getShelfLayerHeights,
    getItemsCountOnBookshelf,
    getSelectedStructure,
  } = context);
}
