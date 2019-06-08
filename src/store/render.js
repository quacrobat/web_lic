/* Web Lic - Copyright (C) 2018 Remi Gagne */

'use strict';

import store from '../store';
import LDRender from '../LDRender';
import uiState from '../uiState';

const canvasCache = (function() {
	let cache = {};
	const transientCanvas = document.createElement('canvas');
	return {
		create(domId) {
			cache[domId] = document.createElement('canvas');
			return cache[domId];
		},
		get(domId, bypass) {
			if (bypass) {
				return transientCanvas;
			}
			return cache[domId];
		},
		clear() {
			cache = {};
		}
	};
})();

function getRotation(item) {
	let rot = item.rotation;
	if (rot && rot.length) {
		return rot;
	}
	if (item.filename) {
		const transform = uiState.getPLITransform(item.filename);
		if (transform.rotation) {
			return transform.rotation;
		}
	}
	rot = store.get.templateForItem(item).rotation;
	return (rot && rot.length) ? rot : null;
}

function getScale(item) {
	let scale;
	if (item.scale != null) {
		scale = item.scale;
	} else if (item.autoScale != null) {
		scale = item.autoScale;
	} else if (item.filename) {
		const transform = uiState.getPLITransform(item.filename);
		if (transform.scale != null) {
			scale = transform.scale;
		}
	}
	if (scale == null) {
		scale = store.get.templateForItem(item).scale;
	}
	return (scale === 1) ? null : scale;
}

export default {

	csi(localModel, step, csi, selectedPartIDs, hiResScale = 1, bypassCache) {

		if (csi.domID == null) {
			csi.domID = `CSI_${step.csiID}`;
			csi.isDirty = true;
		}

		let container = canvasCache.get(csi.domID, bypassCache);
		if (csi.isDirty || container == null || bypassCache) {
			let config;
			const size = (getScale(csi) || 1) * hiResScale * 1000;
			if (step.parts == null) {
				// TODO: this only happens for title page; need better indicator for this non-step step
				config = {size, resizeContainer: true};
			} else {
				const partList = store.get.partList(step);
				if (!partList.length) {
					return null;
				}
				config = {
					size,
					partList,
					selectedPartIDs,
					resizeContainer: true,
					displacedParts: step.displacedParts,
					rotation: getRotation(csi),
					displacementArrowColor: store.state.template.step.csi.displacementArrow.fill.color
				};
			}
			container = container || canvasCache.create(csi.domID);
			LDRender.renderModel(localModel, container, config);
			delete csi.isDirty;
		}
		return {width: container.width, height: container.height, dx: 0, dy: 0, container};
	},
	csiWithSelection(localModel, step, csi, selectedPartIDs) {
		const config = {
			size: 1000 * (getScale(csi) || 1),
			partList: store.get.partList(step),
			selectedPartIDs,
			resizeContainer: true,
			displacedParts: step.displacedParts,
			rotation: getRotation(csi),
			displacementArrowColor: store.state.template.step.csi.displacementArrow.fill.color
		};
		const container = canvasCache.get(null, true);
		const offset = LDRender.renderAndDeltaSelectedPart(localModel, container, config);
		return {
			width: container.width,
			height: container.height,
			dx: offset.dx,
			dy: offset.dy,
			container
		};
	},
	pli(colorCode, filename, item, hiResScale = 1, bypassCache) {

		if (item.domID == null) {
			item.domID = `PLI_${filename}_${colorCode}`;
			item.isDirty = true;
		}

		let container = canvasCache.get(item.domID, bypassCache);
		if (item.isDirty || container == null || bypassCache) {
			const config = {
				size: (getScale(item) || 1) * hiResScale * 1000,
				resizeContainer: true,
				rotation: getRotation(item)
			};
			container = container || canvasCache.create(item.domID);
			LDRender.renderPart(colorCode, filename, container, config);
			delete item.isDirty;
		}
		return {width: container.width, height: container.height, container};
	},
	clearCanvasCache() {
		canvasCache.clear();
	},
	removeCanvas(item) {
		if (item.type === 'step') {
			const domID = `CSI_${item.csiID}`;
			const container = document.getElementById(domID);
			if (container) {
				container.remove();
			}
		}
	},
	adjustCameraZoom() {
		// Render the main model; if it's too big to fit in the default view, zoom out until it fits
		const size = 1000, paddedContainerSize = size - 300, zoomStep = 30;
		const container = canvasCache.get(null, true);
		container.width = container.height = size;

		let zoom = zoomStep;
		const config = {size, resizeContainer: true};
		while ((container.width > paddedContainerSize || container.height > paddedContainerSize)
			&& zoom > -1000
		) {
			zoom -= zoomStep;
			LDRender.setRenderState({zoom});
			LDRender.renderPart(0, store.model.filename, container, config);
		}
		store.state.template.sceneRendering.zoom = zoom;
	}
};
