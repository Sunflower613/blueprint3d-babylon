import { createBuildingFile, parseBuildingFile, stringifyBuildingFile } from '../core/buildingFile.js';
import { stringifyDXF, create3MFPackage } from '../core/exporters.js';

export class ExportService {
  constructor(document) {
    this.document = document;
  }

  exportJSON() {
    return JSON.parse(JSON.stringify(this.document.floorplan));
  }

  exportBuildingFile(options = {}) {
    return createBuildingFile(this.document.floorplan, options);
  }

  stringifyBuildingFile(options = {}) {
    return stringifyBuildingFile(this.document.floorplan, options);
  }

  stringifyDXF() {
    return stringifyDXF(this.document.floorplan);
  }

  create3MFPackage(options = {}) {
    return create3MFPackage(this.document.floorplan, options);
  }

  loadBuildingFile(fileData) {
    this.loadJSON(parseBuildingFile(fileData));
  }

  loadJSON(floorplan) {
    this.document.floorplan = this.document.normalizeFloorplan(floorplan);
  }
}
