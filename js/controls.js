import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions, models } from './models.js';

export let controls;
let selectedObject = null;
let isMoving = false;
const initialTouchPosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

export function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.update();
}

export function setupEventListeners() {
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

    document.getElementById('reset-button').addEventListener('click', () => {
        resetPartPositions();
    });
}

function getPartFromMesh(mesh) {
    // Traverse up the parent hierarchy until we find the root part
    let current = mesh;
    while (current && !current.isGroup) {
        current = current.parent;
    }
    return current;
}

function findTouchedObject(event) {
    const touch = event.touches[0];
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Get all meshes in the scene
    const meshes = [];
    scene.traverse((object) => {
        if (object.isMesh) {
            meshes.push(object);
        }
    });

    const intersects = raycaster.intersectObjects(meshes, false);
    
    if (intersects.length > 0) {
        const part = getPartFromMesh(intersects[0].object);
        if (part && part.isGroup) {
            return part;
        }
    }
    return null;
}

function onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        isMoving = true;
        initialTouchPosition.set(touch.pageX, touch.pageY);
        
        selectedObject = findTouchedObject(event);
        if (selectedObject) {
            controls.enabled = false;
            console.log('Selected:', selectedObject.name); // Debug logging
        }
    }
}

function onTouchMove(event) {
    event.preventDefault();

    if (event.touches.length === 1) {
        const touch = event.touches[0];
        
        if (isMoving) {
            const deltaX = (touch.pageX - initialTouchPosition.x) * 0.002;
            const deltaZ = (touch.pageY - initialTouchPosition.y) * 0.002;

            if (selectedObject) {
                // Move only the selected part
                selectedObject.position.x += deltaX;
                selectedObject.position.z += deltaZ;
            }

            initialTouchPosition.set(touch.pageX, touch.pageY);
        }
    } else if (event.touches.length === 2) {
        // Handle rotation with two fingers
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        const angle = Math.atan2(
            touch2.pageY - touch1.pageY,
            touch2.pageX - touch1.pageX
        );
        
        if (selectedObject) {
            selectedObject.rotation.y = angle;
        }
    }
}

function onTouchEnd(event) {
    event.preventDefault();
    isMoving = false;
    if (selectedObject) {
        controls.enabled = true;
        selectedObject = null;
    }
}
