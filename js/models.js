import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';

// Define model parts
export let models = {
    blade: null,
    frame: null,
    handguard: null,
    handle: null
};
export let modelContainer;
export let originalPositions = new Map();

export async function loadModels() {
    const loader = new GLTFLoader();
    modelContainer = new THREE.Group();
    
    const loadPart = (url) => {
        return new Promise((resolve, reject) => {
            loader.load(url,
                (gltf) => resolve(gltf.scene),
                (xhr) => {
                    const percent = xhr.loaded / xhr.total * 100;
                    document.getElementById('loading-text').textContent = 
                        `Loading model... ${Math.round(percent)}%`;
                },
                (error) => reject(error)
            );
        });
    };

    try {
        const [blade, frame, handguard, handle] = await Promise.all([
            loadPart('./kool-mandoline-blade.glb'),
            loadPart('./kool-mandoline-frame.glb'),
            loadPart('./kool-mandoline-handguard.glb'),
            loadPart('./kool-mandoline-handletpe.glb')
        ]);

        setupModelParts(blade, frame, handguard, handle);
        scaleAndPositionModel();
        storeOriginalPositions();

        const previewModel = modelContainer.clone();
        previewModel.position.set(0, 0, 0);
        scene.add(previewModel);

        document.getElementById('loading-text').style.display = 'none';
        console.log('All models loaded successfully');

    } catch (error) {
        console.error('Error loading models:', error);
        document.getElementById('loading-text').textContent = 'Error loading models';
    }
}

function setupModelParts(blade, frame, handguard, handle) {
    blade.name = 'blade';
    frame.name = 'frame';
    handguard.name = 'handguard';
    handle.name = 'handle';

    models.blade = blade;
    models.frame = frame;
    models.handguard = handguard;
    models.handle = handle;

    modelContainer.add(blade);
    modelContainer.add(frame);
    modelContainer.add(handguard);
    modelContainer.add(handle);
}

function scaleAndPositionModel() {
    const bbox = new THREE.Box3().setFromObject(modelContainer);
    const modelSize = bbox.getSize(new THREE.Vector3());
    const scaleFactor = 0.3 / modelSize.z; // Adjusted size for mandoline
    modelContainer.scale.set(scaleFactor, scaleFactor, scaleFactor);

    bbox.setFromObject(modelContainer);
    const center = bbox.getCenter(new THREE.Vector3());
    modelContainer.position.sub(center);
}

function storeOriginalPositions() {
    for (const part of [models.blade, models.frame, models.handguard, models.handle]) {
        originalPositions.set(part.name, {
            position: part.position.clone(),
            rotation: part.rotation.clone()
        });
    }
}

export function resetPartPositions(container) {
    container.children.forEach(part => {
        const originalPos = originalPositions.get(part.name);
        if (originalPos) {
            part.position.copy(originalPos.position);
            part.rotation.copy(originalPos.rotation);
        }
    });
}
